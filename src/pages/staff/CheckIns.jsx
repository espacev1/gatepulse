import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, Users, Activity, BarChart3, Filter, ClipboardList, ShieldAlert, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function StaffCheckIns() {
    const { user: staffUser } = useAuth()
    const [filterEvent, setFilterEvent] = useState('all')
    const [logs, setLogs] = useState([])
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInitialData()

        const subscription = supabase
            .channel('staff-checkins-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, (payload) => {
                console.log('REALTIME_EVENT_DETECTED:', payload)
                fetchLogs()
            })
            .subscribe((status) => {
                console.log('REALTIME_SUBSCRIPTION_STATUS:', status)
            })

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        await fetchEvents()
        await fetchLogs()
        setLoading(false)
    }

    const fetchEvents = async () => {
        const { data, error } = await supabase.from('events').select('id, name')
        if (error) console.error('Events fetch error:', error)
        if (data) setEvents(data)
    }

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from('attendance_logs')
            .select(`
                id,
                ticket_id,
                event_id,
                timestamp,
                verification_status,
                tickets (
                    participants (
                        profiles (*)
                    )
                )
            `)
            .order('timestamp', { ascending: false })
            .limit(100)

        if (error) {
            console.error('CRITICAL_LOGS_FETCH_ERROR:', error)
            return
        }

        console.log('RAW_LOGS_DATA_RECEIVED:', data?.length || 0, 'items')
        if (data && data.length > 0) {
            console.log('SAMPLE_LOG_ITEM:', data[0])
        }

        if (data) {
            setLogs(data.map(log => {
                const profile = log.tickets?.participants?.profiles;
                // Handle both single profile and array of profiles from joins
                const actualProfile = Array.isArray(profile) ? profile[0] : profile;
                const eventObj = events.find(e => e.id === log.event_id);

                return {
                    id: log.id,
                    ticket_id: log.ticket_id || 'EXTERNAL_KEY',
                    timestamp: log.timestamp,
                    event_name: eventObj?.name || 'Unknown Sector',
                    event_id: log.event_id,
                    full_name: actualProfile?.full_name || (log.verification_status === 'invalid' ? 'IDENT_FAILED' : 'ANON_ENTITY'),
                    verification_status: log.verification_status || 'invalid'
                }
            }))
        }
    }

    const filtered = filterEvent === 'all' ? logs : logs.filter(l => l.event_id === filterEvent)

    const successCount = filtered.filter(l => l.verification_status === 'success').length
    const duplicateCount = filtered.filter(l => l.verification_status === 'duplicate').length
    const invalidCount = filtered.filter(l => l.verification_status === 'invalid').length

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Check-in Registry</h1>
                    <p className="page-subtitle">Real-time audit log of all credential validation attempts.</p>
                </div>
                {/* Security Diagnostics Banner */}
                <div className="card-glass" style={{ padding: '8px 16px', border: '1px solid var(--border-accent)', background: 'rgba(231,170,81,0.05)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>{events.find(e => e.id === filterEvent)?.name.substring(0, 20) || 'ALL_SECTORS'}...</div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Activity size={14} color="var(--accent)" />
                            <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>RLS_STATUS:</span>
                            <span className="badge badge-primary">{staffUser?.role?.toUpperCase() || 'UNKNOWN'}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                            <ClipboardList size={14} color="var(--text-dim)" />
                            <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>RAW_PACKETS:</span>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)' }}>{logs.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats HUD */}
            <div className="grid-4 mb-6">
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--status-ok-bg)' }}>
                        <CheckCircle2 size={20} color="var(--status-ok)" />
                    </div>
                    <div>
                        <div className="stat-card-value font-mono">{successCount}</div>
                        <div className="stat-card-label">Verified Entrants</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--status-warn-bg)' }}>
                        <ShieldAlert size={20} color="var(--status-warn)" />
                    </div>
                    <div>
                        <div className="stat-card-value font-mono">{duplicateCount}</div>
                        <div className="stat-card-label">Duplicates</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--status-critical-bg)' }}>
                        <XCircle size={20} color="var(--status-critical)" />
                    </div>
                    <div>
                        <div className="stat-card-value font-mono">{invalidCount}</div>
                        <div className="stat-card-label">Invalid Keys</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--accent-glow)' }}>
                        <ClipboardList size={20} color="var(--accent)" />
                    </div>
                    <div>
                        <div className="stat-card-value font-mono">{filtered.length}</div>
                        <div className="stat-card-label">Total Audit Logs</div>
                    </div>
                </div>
            </div>

            {/* Filter HUD */}
            <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
                <select className="form-select" value={filterEvent} onChange={e => setFilterEvent(e.target.value)} style={{ width: 'auto', minWidth: 280 }}>
                    <option value="all">LOG_DOMAIN: ALL_SECTORS</option>
                    {events.map(e => <option key={e.id} value={e.id}>{e.name.toUpperCase()}</option>)}
                </select>
            </div>

            {/* Logs Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Identity</th>
                                <th>Operational Sector</th>
                                <th>Credential ID</th>
                                <th>Timestamp (UTC)</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((log, i) => (
                                <tr key={log.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 'var(--radius-lg)',
                                                background: 'var(--bg-elevated)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--accent)', fontSize: 'var(--font-xs)', fontWeight: 800,
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                {log.full_name?.charAt(0) || '?'}
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {log.full_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 700 }}>
                                        {log.event_name.toUpperCase()}
                                    </td>
                                    <td className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)', opacity: 0.7 }}>{log.ticket_id}</td>
                                    <td style={{ color: 'var(--text-dim)', fontSize: 'var(--font-xs)' }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className={`badge ${log.verification_status === 'success' ? 'badge-success' : 'badge-warning'}`}>
                                            {log.verification_status === 'success' ? 'VERIFIED' : 'FLAGGED'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && filtered.length === 0 && (
                    <div className="empty-state">
                        <ClipboardList size={48} style={{ opacity: 0.1 }} />
                        <div className="empty-state-title">AUDIT LOG EMPTY</div>
                        <p>Operational check-ins will be logged here in real-time.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
