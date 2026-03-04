import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, Users, Activity, BarChart3, Filter, ClipboardList } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function StaffCheckIns() {
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
        await Promise.all([fetchLogs(), fetchEvents()])
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
                timestamp,
                verification_status,
                tickets (
                    event_id,
                    ticket_type,
                    events (name),
                    participants (
                        profiles (*)
                    )
                )
            `)
            .order('timestamp', { ascending: false })
            .limit(50)

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
                const safeName = Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name;

                return {
                    id: log.id,
                    ticket_id: log.ticket_id,
                    timestamp: log.timestamp,
                    event_name: log.tickets?.events?.name || 'Unknown Event',
                    event_id: log.tickets?.event_id,
                    full_name: safeName || 'Anonymous Entity',
                    verification_status: log.verification_status || 'success'
                }
            }))
        }
    }

    const filtered = filterEvent === 'all' ? logs : logs.filter(l => l.event_id === filterEvent)

    const successCount = filtered.length // Assuming all logs in attendance_logs are successful validations
    const duplicateCount = 0 // In a real scenario, we might have a separate table or flag for failed attempts

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Check-in Registry</h1>
                    <p className="page-subtitle">Real-time audit log of all credential validation attempts.</p>
                </div>
            </div>

            {/* Stats HUD */}
            <div className="grid-3 mb-6">
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
                        <CheckCircle2 size={20} color="var(--status-warn)" />
                    </div>
                    <div>
                        <div className="stat-card-value font-mono">{duplicateCount}</div>
                        <div className="stat-card-label">System Flagged</div>
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
