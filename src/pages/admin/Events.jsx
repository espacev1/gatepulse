import { useState, useEffect } from 'react'
import {
    CalendarDays, MapPin, Users, Plus, Search, Filter,
    MoreVertical, Edit2, Trash2, X, Check, Activity, Clock, CreditCard, DollarSign
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function AdminEvents() {
    const { user } = useAuth()
    const [events, setEvents] = useState([])
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingEvent, setEditingEvent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [synopsisEvent, setSynopsisEvent] = useState(null)
    const [synopsisData, setSynopsisData] = useState(null)

    const [form, setForm] = useState({
        name: '', location: '', start_time: '', end_time: '',
        event_date: '',
        max_capacity: 100, description: '', status: 'upcoming',
        is_free: true, price: 0,
        participation_type: 'solo',
        allowed_departments: [],
        registration_start: '',
        registration_end: '',
        is_live: false,
        genre: 'Culturals',
        marking_criteria: ['Technical Execution', 'Innovation & Impact', 'Presentation Quality', 'Practical Usability']
    })

    const DEPARTMENTS = ['AIML', 'AIDS', 'IT', 'CSE', 'ECE', 'EEE', 'ME', 'CE', 'CSBS']

    useEffect(() => {
        fetchEvents()
        const subscription = supabase
            .channel('admin-events-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
                fetchEvents()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [])

    const fetchEvents = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) setEvents(data)
        setLoading(false)
    }

    const handleOpenModal = (event = null) => {
        if (event) {
            setEditingEvent(event)
            setForm({
                ...event,
                is_free: event.is_free ?? true,
                price: event.price ?? 0,
                participation_type: event.participation_type || 'solo',
                allowed_departments: event.allowed_departments || [],
                event_date: event.event_date || '',
                registration_start: event.registration_start || '',
                registration_end: event.registration_end || '',
                is_live: event.is_live ?? false,
                genre: event.genre || 'Culturals',
                marking_criteria: event.marking_criteria || ['Technical Execution', 'Innovation & Impact', 'Presentation Quality', 'Practical Usability']
            })
        } else {
            setEditingEvent(null)
            setForm({
                name: '', location: '', start_time: '', end_time: '',
                event_date: '',
                max_capacity: 100, description: '', status: 'upcoming',
                is_free: true, price: 0,
                participation_type: 'solo',
                allowed_departments: [],
                registration_start: '',
                registration_end: '',
                is_live: false,
                genre: 'Culturals',
                marking_criteria: ['Technical Execution', 'Innovation & Impact', 'Presentation Quality', 'Practical Usability']
            })
        }
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.start_time || !form.end_time) {
            return alert('Start time and End time are required.')
        }
        if (!form.name) {
            return alert('Event name is required.')
        }
        const payload = {
            ...form,
            start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
            end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
            event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
            registration_start: form.registration_start ? new Date(form.registration_start).toISOString() : null,
            registration_end: form.registration_end ? new Date(form.registration_end).toISOString() : null,
            is_live: form.is_live,
            created_by: user.id,
            updated_at: new Date().toISOString()
        }

        let error
        if (editingEvent) {
            const { error: err } = await supabase
                .from('events')
                .update(payload)
                .eq('id', editingEvent.id)
            error = err
        } else {
            const { error: err } = await supabase
                .from('events')
                .insert([payload])
            error = err
        }

        if (!error) {
            setShowModal(false)
            fetchEvents()
        } else {
            alert('Error saving event: ' + error.message)
        }
    }

    const toggleDept = (dept) => {
        setForm(prev => {
            const current = [...(prev.allowed_departments || [])]
            if (current.includes(dept)) {
                return { ...prev, allowed_departments: current.filter(d => d !== dept) }
            } else {
                return { ...prev, allowed_departments: [...current, dept] }
            }
        })
    }

    const fetchEventSynopsis = async (event) => {
        setSynopsisEvent(event)
        setSynopsisData(null)

        const { data: checkins } = await supabase
            .from('attendance_logs')
            .select(`
                id, timestamp, staff_id,
                ticket_id (
                    participant_id (
                        user_id (full_name, reg_no, dept)
                    )
                )
            `)
            .eq('event_id', event.id)
            .eq('verification_status', 'success')
            .order('timestamp', { ascending: false })

        const staffIds = [...new Set(checkins?.map(c => c.staff_id) || [])]
        const { data: staffDetails } = await supabase
            .from('profiles').select('id, full_name, role').in('id', staffIds)

        setSynopsisData({
            checkins: checkins?.map(c => ({
                id: c.id, time: c.timestamp,
                name: c.ticket_id?.participant_id?.user_id?.full_name,
                regNo: c.ticket_id?.participant_id?.user_id?.reg_no,
                dept: c.ticket_id?.participant_id?.user_id?.dept
            })) || [],
            operationalStaff: staffDetails || []
        })
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to decommission this node?')) return
        const { data, error } = await supabase.from('events').delete().eq('id', id).select()

        if (error) {
            alert('Error deleting event: ' + error.message)
        } else if (data.length === 0) {
            alert('PERMISSION DENIED: Your account does not have sufficient clearance to decommission this node. Please contact the high-level administrator.')
        } else {
            fetchEvents()
        }
    }

    const filtered = events.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Operational Node Management</h1>
                    <p className="page-subtitle">Configure and monitor event deployments and availability.</p>
                </div>
                {user?.role === 'admin' && (
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus size={16} /> Deploy New Node
                    </button>
                )}
            </div>

            {/* Filters HUD */}
            <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <div className="search-bar">
                        <Search />
                        <input placeholder="Search Active Nodes..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid-3">
                {loading && <div className="col-span-3 text-center py-12">Synchronizing with secure database...</div>}
                {!loading && filtered.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-dim">No active nodes detected. Deploy a new node to begin.</div>
                )}
                {filtered.map((event, i) => (
                    <div key={event.id} className="card" style={{ animation: `fadeInUp 0.4s ease ${i * 0.05}s both` }}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <div className="live-dot" style={{ background: event.status === 'active' ? 'var(--status-ok)' : 'var(--status-warn)' }} />
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>NODE_{event.id.slice(-4)}</span>
                                </div>
                                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>{event.name}</h3>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`badge ${event.participation_type === 'team' ? 'badge-primary' : 'badge-info'}`} style={{ fontSize: '9px' }}>
                                    {event.participation_type?.toUpperCase()}
                                </span>
                                <span className={`badge ${event.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{event.status}</span>
                            </div>
                        </div>

                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }} className="truncate-2">
                            {event.description}
                        </p>

                        <div className="flex flex-col gap-2 mb-4" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                            <div className="flex items-center gap-2"><MapPin size={12} color="var(--accent)" /> {event.location}</div>
                            <div className="flex items-center gap-2"><Clock size={12} color="var(--accent)" /> {new Date(event.start_time).toLocaleString()}</div>
                            <div className="flex items-center gap-2">
                                <Users size={12} color="var(--accent)" />
                                {event.allowed_departments && event.allowed_departments.length > 0 ?
                                    `RESTRICTED: ${event.allowed_departments.join(', ')}` :
                                    'OPEN TO ALL BRANCHES'}
                            </div>
                        </div>

                        {/* Load Capacity */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-1">
                                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)' }}>LOAD FACTOR</span>
                                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>{event.registered_count || 0} / {event.max_capacity}</span>
                            </div>
                            <div className="progress-bar-track">
                                <div className="progress-bar-fill" style={{ width: `${((event.registered_count || 0) / event.max_capacity) * 100}%` }} />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => handleOpenModal(event)} className="btn btn-secondary btn-sm flex-1"><Edit2 size={12} /> CONFIGURE</button>
                            <button onClick={() => fetchEventSynopsis(event)} className="btn btn-primary btn-sm flex-1"><Activity size={12} /> SYNOPSIS</button>
                            {user?.role === 'admin' && (
                                <button onClick={() => handleDelete(event.id)} className="btn btn-ghost btn-icon" style={{ color: 'var(--status-critical)' }}><Trash2 size={14} /></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Config Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ border: '2px solid var(--border-accent)', maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingEvent ? 'RECONFIGURE_NODE' : 'PROVISION_NODE'}</h2>
                            <button onClick={() => setShowModal(false)} className="btn-icon"><X size={20} /></button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Sector Designation (Name)</label>
                                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Event Service A" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Participation Category</label>
                                    <div className="flex gap-2 p-1 bg-transparent rounded-lg border border-border-color">
                                        <button
                                            onClick={() => setForm({ ...form, participation_type: 'solo' })}
                                            className={`btn btn-sm flex-1 ${form.participation_type === 'solo' ? 'btn-primary' : 'btn-outline'}`}
                                        >
                                            {form.participation_type === 'solo' && <Check size={12} className="mr-1" />}
                                            SOLO
                                        </button>
                                        <button
                                            onClick={() => setForm({ ...form, participation_type: 'team' })}
                                            className={`btn btn-sm flex-1 ${form.participation_type === 'team' ? 'btn-primary' : 'btn-outline'}`}
                                        >
                                            {form.participation_type === 'team' && <Check size={12} className="mr-1" />}
                                            TEAM
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max Capacity (Entities)</label>
                                    <input type="number" className="form-input" value={form.max_capacity} onChange={e => setForm({ ...form, max_capacity: parseInt(e.target.value) })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Sector Branch Locking (Departments)</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-transparent rounded-lg border border-border-color">
                                    {DEPARTMENTS.map(dept => (
                                        <button
                                            key={dept}
                                            onClick={() => toggleDept(dept)}
                                            className={`btn btn-xs ${form.allowed_departments?.includes(dept) ? 'btn-primary' : 'btn-outline'}`}
                                            style={{ fontSize: '10px' }}
                                        >
                                            {form.allowed_departments?.includes(dept) && <Check size={10} className="mr-1" />}
                                            {dept}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setForm({ ...form, allowed_departments: [] })}
                                        className="btn btn-xs btn-ghost"
                                        style={{ fontSize: '10px', marginLeft: 'auto' }}
                                    >RESET (OPEN ALL)</button>
                                </div>
                                <p style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                                    * Selection restricts registration to specific branches. Leave unselected for Global Access.
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Deployment Local (Location)</label>
                                    <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        <option value="upcoming">UPCOMING</option>
                                        <option value="active">ACTIVE</option>
                                        <option value="completed">COMPLETED</option>
                                        <option value="cancelled">CANCELLED</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Event Genre</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-transparent rounded-lg border border-border-color">
                                    {['Culturals', 'Innovation', 'Knowledge Transfer', 'Idea Based'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setForm({ ...form, genre: g })}
                                            className={`btn btn-xs ${form.genre === g ? 'btn-primary' : 'btn-outline'}`}
                                            style={{ fontSize: '10px' }}
                                        >
                                            {form.genre === g && <Check size={10} className="mr-1" />}
                                            {g.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Registration Start</label>
                                    <input type="datetime-local" className="form-input" value={form.registration_start ? form.registration_start.slice(0, 16) : ''} onChange={e => setForm({ ...form, registration_start: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Registration End</label>
                                    <input type="datetime-local" className="form-input" value={form.registration_end ? form.registration_end.slice(0, 16) : ''} onChange={e => setForm({ ...form, registration_end: e.target.value })} />
                                </div>
                             </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Event Start (Timing)</label>
                                    <input type="datetime-local" className="form-input" value={form.start_time ? form.start_time.slice(0, 16) : ''} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Event End (Timing)</label>
                                    <input type="datetime-local" className="form-input" value={form.end_time ? form.end_time.slice(0, 16) : ''} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Event Date</label>
                                    <input type="date" className="form-input" value={form.event_date ? form.event_date.slice(0, 10) : ''} onChange={e => setForm({ ...form, event_date: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label flex items-center gap-2">
                                    <input type="checkbox" checked={form.is_live} onChange={e => setForm({ ...form, is_live: e.target.checked })} />
                                    MARK AS LIVE EVENT (Visible to Students in 'Live' filter)
                                </label>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Access Protocol</label>
                                    <div className="flex gap-2 p-1 bg-deepest rounded-lg border border-border-color">
                                        <button
                                            onClick={() => setForm({ ...form, is_free: true })}
                                            className={`btn btn-sm flex-1 ${form.is_free ? 'btn-primary' : 'btn-outline'}`}
                                        >
                                            {form.is_free && <Check size={12} className="mr-1" />}
                                            FREE
                                        </button>
                                        <button
                                            onClick={() => setForm({ ...form, is_free: false })}
                                            className={`btn btn-sm flex-1 ${!form.is_free ? 'btn-primary' : 'btn-outline'}`}
                                        >
                                            {!form.is_free && <Check size={12} className="mr-1" />}
                                            PAID
                                        </button>
                                    </div>
                                </div>
                                {!form.is_free && (
                                    <div className="form-group">
                                        <label className="form-label">Unit Credit (Price $)</label>
                                        <div style={{ position: 'relative' }}>
                                            <DollarSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ paddingLeft: 32 }}
                                                value={form.price}
                                                onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Evaluation/Marking Criteria</label>
                                <div className="flex flex-col gap-2">
                                    {(form.marking_criteria || []).map((criteria, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input 
                                                className="form-input" 
                                                value={criteria} 
                                                onChange={e => {
                                                    const newCriteria = [...form.marking_criteria]
                                                    newCriteria[idx] = e.target.value
                                                    setForm({ ...form, marking_criteria: newCriteria })
                                                }}
                                            />
                                            <button 
                                                onClick={() => setForm({ ...form, marking_criteria: form.marking_criteria.filter((_, i) => i !== idx) })}
                                                className="btn btn-ghost"
                                                style={{ color: 'var(--status-critical)' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => setForm({ ...form, marking_criteria: [...(form.marking_criteria || []), 'New Criteria'] })}
                                        className="btn btn-secondary btn-xs w-full mt-2"
                                    >
                                        <Plus size={12} className="mr-1" /> Add Criteria Category
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Protocol Metadata (Description)</label>
                                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">ABORT</button>
                            <button onClick={handleSave} className="btn btn-primary">COMMIT CHANGES</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Synopsis Modal */}
            {synopsisEvent && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', border: '1px solid var(--accent)' }}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">SECTOR_SYNOPSIS: {synopsisEvent.name}</h2>
                                <p className="text-[10px] text-dim font-mono">NODE_0x{synopsisEvent.id.slice(-6).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setSynopsisEvent(null)} className="btn-icon"><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="grid-3 mb-6">
                                <div className="p-4 bg-deepest border border-color rounded-xl">
                                    <div className="text-[10px] text-dim mb-1 font-bold">REGISTERED</div>
                                    <div className="text-2xl font-bold font-mono text-primary">{synopsisEvent.registered_count || 0}</div>
                                </div>
                                <div className="p-4 bg-deepest border border-color rounded-xl">
                                    <div className="text-[10px] text-dim mb-1 font-bold">VERIFIED</div>
                                    <div className="text-2xl font-bold font-mono text-secondary">{synopsisEvent.checked_in_count || 0}</div>
                                </div>
                                <div className="p-4 bg-deepest border border-color rounded-xl">
                                    <div className="text-[10px] text-dim mb-1 font-bold">DELTA</div>
                                    <div className="text-2xl font-bold font-mono text-accent">{(synopsisEvent.registered_count || 0) - (synopsisEvent.checked_in_count || 0)}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)' }}>
                                <div>
                                    <h4 className="text-xs font-bold mb-3 uppercase tracking-widest text-secondary">Verified Entities</h4>
                                    <div className="table-container" style={{ maxHeight: '300px' }}>
                                        <table>
                                            <thead>
                                                <tr><th>Name</th><th>Reg No</th><th>Timestamp</th></tr>
                                            </thead>
                                            <tbody>
                                                {!synopsisData ? <tr><td colSpan="3" className="text-center py-8 text-dim">DECRYPTING...</td></tr> :
                                                 synopsisData.checkins.length === 0 ? <tr><td colSpan="3" className="text-center py-8 text-dim">ZERO ENTITIES DETECTED</td></tr> :
                                                 synopsisData.checkins.map((c, i) => (
                                                    <tr key={i}>
                                                        <td className="font-bold text-xs">{c.name}</td>
                                                        <td className="font-mono text-[10px]">{c.regNo}</td>
                                                        <td className="text-[10px] text-dim">{new Date(c.time).toLocaleTimeString()}</td>
                                                    </tr>
                                                 ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold mb-3 uppercase tracking-widest text-accent">Deployment Staff</h4>
                                    <div className="flex flex-col gap-2">
                                        {!synopsisData ? <div className="text-dim text-xs">SCANNING...</div> :
                                         synopsisData.operationalStaff.length === 0 ? <div className="text-dim text-xs">NO STAFF ASSIGNED</div> :
                                         synopsisData.operationalStaff.map((s, i) => (
                                            <div key={i} className="p-2 bg-deepest border border-color rounded-lg flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-accent-glow border border-accent flex items-center justify-center">
                                                    <Users size={12} color="var(--accent)" />
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-bold">{s.full_name}</div>
                                                    <div className="text-[9px] text-dim uppercase">{s.role}</div>
                                                </div>
                                            </div>
                                         ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
