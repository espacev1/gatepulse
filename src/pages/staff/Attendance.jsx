import { useState, useEffect } from 'react'
import {
    Activity, Play, Square, ClipboardCheck,
    Calendar, Users, Shield, Clock, BarChart3, Info, X, MapPin, CheckCircle2, AlertCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function StaffAttendance() {
    const { user: staffUser } = useAuth()
    const [availableSessions, setAvailableSessions] = useState([])
    const [historicalSessions, setHistoricalSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedSession, setSelectedSession] = useState(null)
    const [attendanceRecords, setAttendanceRecords] = useState([])
    const [loadingIntel, setLoadingIntel] = useState(false)

    useEffect(() => {
        if (staffUser) {
            fetchStaffData()

            const channel = supabase
                .channel('staff-attendance-sync')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'attendance_sessions'
                }, () => fetchStaffData())
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        }
    }, [staffUser])

    const fetchStaffData = async () => {
        setLoading(true)

        // 1. Fetch Assigned Events
        const { data: assignments } = await supabase
            .from('staff_assignments')
            .select('event_id')
            .eq('staff_id', staffUser?.id)

        const eventIds = assignments?.map(a => a.event_id) || []

        if (eventIds.length > 0) {
            // 2. Fetch Sessions for these events that are NOT ended
            const { data: current } = await supabase
                .from('attendance_sessions')
                .select('*, event:events(*)')
                .in('event_id', eventIds)
                .neq('status', 'ended')

            setAvailableSessions(current || [])

            // 3. Fetch Historical Reports
            const { data: history } = await supabase
                .from('attendance_sessions')
                .select('*, event:events(*)')
                .in('event_id', eventIds)
                .eq('status', 'ended')
                .order('ended_at', { ascending: false })
                .limit(10)

            setHistoricalSessions(history || [])
        }

        setLoading(false)
    }

    const activateProtocol = async (sessionId) => {
        const { error } = await supabase
            .from('attendance_sessions')
            .update({ status: 'active' })
            .eq('id', sessionId)

        if (error) alert('Critical: Protocol activation failure. ' + error.message)
        else fetchStaffData()
    }

    const endSession = async (sessionId) => {
        const { error } = await supabase
            .from('attendance_sessions')
            .update({
                status: 'ended',
                ended_at: new Date().toISOString()
            })
            .eq('id', sessionId)

        if (error) alert('Critical: Session termination failure. ' + error.message)
        else fetchStaffData()
    }

    const fetchIntel = async (session) => {
        setSelectedSession(session)
        setLoadingIntel(true)

        const { data, error } = await supabase
            .from('attendance_records')
            .select(`
                *,
                profile:profiles!participant_id (*)
            `)
            .eq('session_id', session.id)

        if (data) setAttendanceRecords(data)
        setLoadingIntel(false)
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Operational Attendance</h1>
                    <p className="page-subtitle">Activate protocols deployed by Admin and manage live verification.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-8)' }}>
                <div>
                    <div className="panel-header" style={{ marginBottom: 'var(--space-4)' }}>Assigned Operational Sectors</div>
                    <div className="flex flex-col gap-4">
                        {availableSessions.length === 0 && !loading && (
                            <div className="card text-center py-12">
                                <Shield size={48} className="mx-auto mb-4 opacity-10" />
                                <p className="text-dim">No deployed attendance protocols detected for your sectors.</p>
                                <p className="text-xs text-dim mt-2">Wait for Administrator to "Open Attendance" for your deployment.</p>
                            </div>
                        )}
                        {availableSessions.map(session => {
                            const isActive = session.status === 'active'
                            const isOpened = session.status === 'opened'
                            return (
                                <div key={session.id} className="card flex justify-between items-center" style={{ borderLeft: isActive ? '4px solid var(--status-ok)' : '4px solid var(--status-warn)' }}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {isActive && <div className="live-dot" />}
                                            <h3 style={{ fontWeight: 800, fontSize: 'var(--font-lg)' }}>{session.event?.name.toUpperCase()}</h3>
                                        </div>
                                        <p className="text-xs text-dim"><Info size={12} className="inline mr-1" />{session.event?.location} | PROTOCOL: {session.status.toUpperCase()}</p>
                                    </div>
                                    <div>
                                        {isActive ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => fetchIntel(session)} className="btn btn-secondary btn-sm">
                                                    <BarChart3 size={14} /> INTEL
                                                </button>
                                                <button onClick={() => endSession(session.id)} className="btn btn-danger btn-sm">
                                                    <Square size={14} /> END SESSION
                                                </button>
                                            </div>
                                        ) : isOpened ? (
                                            <button onClick={() => activateProtocol(session.id)} className="btn btn-primary btn-sm">
                                                <Play size={14} /> ACTIVATE PROTOCOL
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div>
                    <div className="panel-header" style={{ marginBottom: 'var(--space-4)' }}>Sector Reports (History)</div>
                    <div className="card p-0 overflow-hidden">
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Sector</th>
                                        <th>Duration</th>
                                        <th style={{ textAlign: 'right' }}>Intel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historicalSessions.map(s => {
                                        const duration = Math.round((new Date(s.ended_at) - new Date(s.activated_at)) / 60000)
                                        return (
                                            <tr key={s.id}>
                                                <td>
                                                    <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>{s.event?.name}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{new Date(s.ended_at).toLocaleDateString()}</div>
                                                </td>
                                                <td className="font-mono text-xs">{duration} MIN</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button onClick={() => fetchIntel(s)} className="btn-icon">
                                                        <BarChart3 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {historicalSessions.length === 0 && (
                                        <tr><td colSpan="3" className="text-center py-8 text-dim">No historical reports generated.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            {/* Attendance Intel Modal */}
            {selectedSession && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '900px', border: '1px solid var(--accent)' }}>
                        <div className="modal-header">
                            <div className="flex items-center gap-2">
                                <Activity size={18} color="var(--accent)" />
                                <h2 className="modal-title">SECTOR_INTEL: {selectedSession.event?.name}</h2>
                            </div>
                            <button onClick={() => setSelectedSession(null)} className="btn-icon"><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="stat-card">
                                    <div className="stat-card-label">PROTOCOL_STATUS</div>
                                    <div className="stat-card-value">{selectedSession.status.toUpperCase()}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-label">VERIFIED_ENTITIES</div>
                                    <div className="stat-card-value">{attendanceRecords.length}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-label">SECTOR_LOCATION</div>
                                    <div className="stat-card-value text-xs">{selectedSession.event?.location}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-label">ACTIVATION_TIMESTAMP</div>
                                    <div className="stat-card-value text-xs font-mono">{new Date(selectedSession.activated_at).toLocaleTimeString()}</div>
                                </div>
                            </div>

                            {loadingIntel ? (
                                <div className="flex justify-center py-12"><Activity className="animate-spin" /></div>
                            ) : attendanceRecords.length === 0 ? (
                                <div className="text-center py-12 text-dim font-mono text-xs">NO_VERIFICATION_SIGNALS_DETECTED</div>
                            ) : (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Entity Profile</th>
                                                <th>Biometric Uplink (ID/Face)</th>
                                                <th>Verification Time</th>
                                                <th style={{ textAlign: 'right' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceRecords.map(record => (
                                                <tr key={record.id}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-accent-glow flex items-center justify-center font-bold text-accent">
                                                                {record.profile?.full_name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold">{record.profile?.full_name}</div>
                                                                <div className="text-xs text-dim font-mono">{record.profile?.reg_no}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ minWidth: '180px' }}>
                                                        <div className="flex gap-2">
                                                            {record.id_capture_url && (
                                                                <a href={record.id_capture_url} target="_blank" rel="noreferrer" className="relative group">
                                                                    <img src={record.id_capture_url} alt="ID" className="w-12 h-8 object-cover rounded border border-white/10 hover:border-accent transition-colors" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded"><Users size={12} /></div>
                                                                </a>
                                                            )}
                                                            {record.face_capture_url && (
                                                                <a href={record.face_capture_url} target="_blank" rel="noreferrer" className="relative group">
                                                                    <img src={record.face_capture_url} alt="Face" className="w-12 h-8 object-cover rounded border border-white/10 hover:border-accent transition-colors" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded"><Shield size={12} /></div>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="font-mono text-xs">
                                                        {new Date(record.verified_at).toLocaleTimeString()}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <span className="badge badge-success text-xs">VERIFIED</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setSelectedSession(null)} className="btn btn-secondary">CLOSE_INTEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
