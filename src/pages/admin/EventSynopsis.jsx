import { useState, useEffect } from 'react'
import { 
    CalendarDays, Users, Search, Activity, 
    ArrowUpRight, Clock, MapPin, Shield, CheckCircle2,
    Users2, Info, X, Filter, Globe, Download
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const DEPARTMENTS = ['AIML', 'AIDS', 'IT', 'CSE', 'ECE', 'EEE', 'ME', 'CE', 'CSBS']

export default function AdminEventSynopsis() {
    const [events, setEvents] = useState([])
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [synopsis, setSynopsis] = useState(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedDept, setSelectedDept] = useState('ALL')
    const [selectedGenre, setSelectedGenre] = useState('ALL')

    const fetchEvents = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('events')
            .select('*')

        if (data) {
            // Sort: active > upcoming > completed > cancelled
            const statusPriority = { active: 0, upcoming: 1, completed: 2, cancelled: 3 }
            const sortedData = [...data].sort((a, b) => {
                const pA = statusPriority[a.status] ?? 4
                const pB = statusPriority[b.status] ?? 4
                if (pA !== pB) return pA - pB
                return new Date(b.created_at) - new Date(a.created_at)
            })
            setEvents(sortedData)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchEvents()

        const subscription = supabase
            .channel('admin-events-synopsis-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
            .subscribe()

        return () => supabase.removeChannel(subscription)
    }, [fetchEvents])

    const fetchEventSynopsis = async (event) => {
        setSelectedEvent(event)
        setSynopsis(null)

        const { data: checkins } = await supabase
            .from('attendance_logs')
            .select(`
                id,
                timestamp,
                staff_id,
                ticket_id (
                    participant_id (
                        user_id (
                            full_name,
                            reg_no,
                            dept
                        )
                    )
                )
            `)
            .eq('event_id', event.id)
            .eq('verification_status', 'success')
            .order('timestamp', { ascending: false })

        const staffIds = [...new Set(checkins?.map(c => c.staff_id) || [])]
        const { data: staffDetails } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .in('id', staffIds)

        setSynopsis({
            checkins: checkins?.map(c => ({
                id: c.id,
                time: c.timestamp,
                name: c.ticket_id?.participant_id?.user_id?.full_name,
                regNo: c.ticket_id?.participant_id?.user_id?.reg_no,
                dept: c.ticket_id?.participant_id?.user_id?.dept
            })) || [],
            operationalStaff: staffDetails || []
        })
    }

    const exportParticipantsCSV = async (event) => {
        const { data } = await supabase
            .from('participants')
            .select(`
                user:profiles(full_name, email, dept),
                registration_status,
                created_at
            `)
            .eq('event_id', event.id)
        
        if (!data || data.length === 0) return alert('No participants found for this sector.')

        const csvRows = [
            ['Name', 'Email', 'Department', 'Status', 'Registration Date'],
            ...data.map(p => [
                p.user.full_name,
                p.user.email,
                p.user.dept,
                p.registration_status,
                new Date(p.created_at).toLocaleString()
            ])
        ]

        const csvContent = csvRows.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `participants_${event.name.replace(/\s+/g, '_')}.csv`
        a.click()
    }

    const exportJuryMarksCSV = async (event) => {
        const { data } = await supabase
            .from('jury_marks')
            .select(`
                marks,
                total_marks,
                participant:participants(
                    user:profiles(full_name),
                    team:teams(name)
                )
            `)
            .eq('event_id', event.id)
        
        if (!data || data.length === 0) return alert('No jury marks found for this sector.')

        const csvRows = [
            ['Entity (Team/Solo)', 'Technical', 'Innovation', 'Presentation', 'Usability', 'Total Marks'],
            ...data.map(m => [
                m.participant?.team?.name || m.participant?.user?.full_name || 'Unknown',
                m.marks?.technical || 0,
                m.marks?.innovation || 0,
                m.marks?.presentation || 0,
                m.marks?.usability || 0,
                m.total_marks || 0
            ])
        ]

        const csvContent = csvRows.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `jury_marks_${event.name.replace(/\s+/g, '_')}.csv`
        a.click()
    }

    const exportCheckinsCSV = () => {
        if (!synopsis?.checkins || synopsis.checkins.length === 0) return alert('No check-ins to export.')
        
        const headers = ['Identity', 'Registry ID', 'Department', 'Timestamp']
        const rows = synopsis.checkins.map(c => [
            c.name,
            c.regNo,
            c.dept || 'N/A',
            new Date(c.time).toLocaleString()
        ])

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `verification_log_${selectedEvent.name.replace(/\s+/g, '_')}.csv`)
        link.click()
    }

    const exportStaffCSV = () => {
        if (!synopsis?.operationalStaff || synopsis.operationalStaff.length === 0) return alert('No staff list to export.')
        
        const headers = ['Name', 'Role']
        const rows = synopsis.operationalStaff.map(s => [s.full_name, s.role])

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `staff_list_${selectedEvent.name.replace(/\s+/g, '_')}.csv`)
        link.click()
    }

    const isGlobalEvent = (event) => !event.allowed_departments || event.allowed_departments.length === 0

    const filtered = events.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase())
        if (!matchesSearch) return false

        // Sector Lock Check
        let matchesDept = true
        if (selectedDept !== 'ALL' && !isGlobalEvent(e)) {
            matchesDept = e.allowed_departments?.includes(selectedDept)
        }
        if (!matchesDept) return false

        // Genre mixed validation
        if (selectedGenre === 'ALL') return true
        return e.genre === selectedGenre
    })

    const statusBadge = (status) => {
        switch (status) {
            case 'active': return 'badge-success'
            case 'upcoming': return 'badge-info'
            case 'completed': return 'badge-warning'
            case 'cancelled': return 'badge-danger'
            default: return 'badge-warning'
        }
    }

    return (
        <div className="page-container">
            {/* Top Stats Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', background: 'var(--bg-mid)', padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)' }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0 }}>Event Overview</h1>
                    <p className="page-subtitle">Detailed attendance and verification for all campus events.</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <div className="badge badge-info" style={{ height: 'fit-content' }}>
                        <Filter size={12} style={{ marginRight: '4px' }} /> {filtered.length} EVENTS FOUND
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', border: '1px border-color dotted' }}>
                        SYSTEM_DATA: TOTAL_{events.length} | SHOWN_{filtered.length}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-6)', minHeight: 'calc(100vh - 250px)' }}>
                {/* Left Sidebar: Controls & List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflow: 'hidden' }}>
                    
                    {/* Compact Filter Stack */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: 'var(--bg-card)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-secondary" />
                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>DEPARTMENT LOCK</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <button
                                onClick={() => setSelectedDept('ALL')}
                                className={`btn btn-xs ${selectedDept === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                                style={{ fontSize: '9px', padding: '2px 6px' }}
                            >
                                {selectedDept === 'ALL' ? <CheckCircle2 size={10} /> : <Globe size={10} />} ALL
                            </button>
                            {DEPARTMENTS.map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => setSelectedDept(dept)}
                                    className={`btn btn-xs ${selectedDept === dept ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ fontSize: '9px', padding: '2px 6px' }}
                                >
                                    {selectedDept === dept && <CheckCircle2 size={10} className="mr-1" />}
                                    {dept}
                                </button>
                            ))}
                        </div>
                        <div className="search-bar" style={{ maxWidth: '100%', marginTop: '4px' }}>
                            <Search size={14} />
                            <input 
                                placeholder="Search events..." 
                                value={search} 
                                onChange={e => setSearch(e.target.value)}
                                style={{ borderRadius: 'var(--radius-md)', padding: '6px 10px 6px 32px', fontSize: '12px' }}
                            />
                        </div>
                    </div>

                    {/* Genre Filter Stack */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: 'var(--bg-card)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-accent" />
                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>CATEGORY FILTER</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {['ALL', 'Culturals', 'Innovation', 'Knowledge Transfer', 'Idea Based'].map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => setSelectedGenre(genre)}
                                    className={`btn btn-xs ${selectedGenre === genre ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ fontSize: '9px', padding: '2px 6px' }}
                                >
                                    {selectedGenre === genre && <CheckCircle2 size={10} className="mr-1" />}
                                    {genre.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Event List */}
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingRight: '8px', maxHeight: '600px' }}>
                        {loading && <div className="text-center py-8 text-dim">Loading...</div>}
                        {!loading && filtered.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 'var(--space-10)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)', color: 'var(--text-dim)', fontSize: '12px' }}>
                                NO EVENTS FOUND
                            </div>
                        )}
                        {filtered.map(event => (
                            <div 
                                key={event.id} 
                                onClick={() => fetchEventSynopsis(event)}
                                className={`card cursor-pointer transition-all ${selectedEvent?.id === event.id ? 'active-node' : ''}`}
                                style={{ 
                                    padding: 'var(--space-4)', 
                                    background: selectedEvent?.id === event.id ? 'var(--bg-elevated)' : 'var(--bg-card)',
                                    borderColor: selectedEvent?.id === event.id ? 'var(--accent)' : 'var(--border-color)',
                                    borderWidth: '1px',
                                    borderStyle: 'solid'
                                }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{event.name}</h3>
                                    <span className={`badge ${statusBadge(event.status)}`} style={{ fontSize: '8px', padding: '1px 6px' }}>
                                        {event.status?.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                    {isGlobalEvent(event) ? (
                                        <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--status-ok)', display: 'flex', alignItems: 'center', gap: '3px', opacity: 0.8 }}>
                                            <Globe size={10} /> OPEN_TO_ALL
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Shield size={10} /> {event.allowed_departments?.join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                    <span>REG: {event.registered_count || 0}</span>
                                    <span>{Math.round(((event.registered_count || 0) / (event.max_capacity || 1)) * 100)}% LOAD</span>
                                </div>
                                <div className="progress-bar-track" style={{ height: '2px', marginTop: '6px' }}>
                                    <div className="progress-bar-fill" style={{ width: `${((event.registered_count || 0) / (event.max_capacity || 1)) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Detail View */}
                <div 
                    className="card" 
                    style={{ 
                        minHeight: '600px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: 'var(--space-6)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    {!selectedEvent ? (
                        <div className="flex flex-col items-center justify-center h-full text-dim">
                            <Activity size={48} className="mb-4 opacity-10" />
                            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em' }}>SELECT AN EVENT TO VIEW DETAILS</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-fadeIn">
                            <div className="panel-header flex justify-between items-start" style={{ marginBottom: 'var(--space-8)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-4)' }}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>EVENT_ID: {selectedEvent.id.slice(-8).toUpperCase()}</span>
                                        <span className={`badge ${statusBadge(selectedEvent.status)}`} style={{ fontSize: '9px' }}>{selectedEvent.status}</span>
                                    </div>
                                    <h2 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, margin: 0 }}>{selectedEvent.name}</h2>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)', marginTop: '4px' }}>{selectedEvent.location}</p>
                                </div>
                                <button onClick={() => setSelectedEvent(null)} className="btn-icon">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid-3 mb-8">
                                <div style={{ padding: 'var(--space-5)', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '4px' }}>TOTAL_REGISTRATIONS</div>
                                    <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{selectedEvent.registered_count || 0}</div>
                                </div>
                                <div style={{ padding: 'var(--space-5)', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '4px' }}>CHECKED_IN</div>
                                    <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--status-ok)' }}>{selectedEvent.checked_in_count || 0}</div>
                                </div>
                                <div style={{ padding: 'var(--space-5)', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '4px' }}>NOT_YET_ENTERED</div>
                                    <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>{(selectedEvent.registered_count || 0) - (selectedEvent.checked_in_count || 0)}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-8)', flex: 1, overflow: 'hidden' }}>
                                {/* Verification Feed */}
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <Activity size={16} className="text-secondary" />
                                            <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance Feed</h3>
                                        </div>
                                        <div className="flex gap-2">
                                        <button onClick={() => exportParticipantsCSV(selectedEvent)} className="btn btn-secondary btn-sm flex items-center gap-2">
                                            <Download size={12} /> PARTICIPANTS
                                        </button>
                                        <button onClick={() => exportJuryMarksCSV(selectedEvent)} className="btn btn-secondary btn-sm flex items-center gap-2">
                                            <Download size={12} /> JURY MARKS
                                        </button>
                                        <button onClick={() => exportCheckinsCSV()} className="btn btn-secondary btn-sm flex items-center gap-2">
                                            <Download size={12} /> VERIFICATION LOG
                                        </button>
                                    </div>
                                    </div>
                                    <div className="table-container" style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)' }}>
                                        <table style={{ background: 'transparent' }}>
                                            <thead style={{ background: 'var(--bg-elevated)', position: 'sticky', top: 0, zIndex: 1 }}>
                                                <tr>
                                                    <th style={{ padding: '12px', fontSize: '10px' }}>NAME</th>
                                                    <th style={{ padding: '12px', fontSize: '10px' }}>REG_NO</th>
                                                    <th style={{ padding: '12px', fontSize: '10px' }}>TIMESTAMP</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {synopsis?.checkins.length === 0 && (
                                                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontSize: '12px' }}>NO ATTENDEES CHECKED IN YET</td></tr>
                                                )}
                                                {synopsis?.checkins.map((c, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '12px', fontWeight: 700 }}>{c.name}</td>
                                                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--secondary)', fontSize: '11px' }}>{c.regNo}</td>
                                                        <td style={{ padding: '12px', color: 'var(--text-dim)', fontSize: '11px' }}>{new Date(c.time).toLocaleTimeString()}</td>
                                                    </tr>
                                                ))}
                                                {!synopsis && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>LOADING DATA...</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Personnel Dashboard */}
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <Users2 size={16} className="text-secondary" />
                                            <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Personnel</h3>
                                        </div>
                                        <button onClick={exportStaffCSV} className="btn btn-xs btn-outline" style={{ fontSize: '9px', gap: '4px' }}>
                                            <Download size={10} /> EXPORT CSV
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                                        {synopsis?.operationalStaff.length === 0 && (
                                            <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', color: 'var(--text-dim)', fontSize: '11px' }}>
                                                NO STAFF ASSIGNED
                                            </div>
                                        )}
                                        {synopsis?.operationalStaff.map((staff, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--accent)', color: 'var(--bg-deepest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Shield size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{staff.full_name}</div>
                                                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>{staff.role}</div>
                                                </div>
                                                <CheckCircle2 size={14} style={{ marginLeft: 'auto', color: 'var(--status-ok)', opacity: 0.6 }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
