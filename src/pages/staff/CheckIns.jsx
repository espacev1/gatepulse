import { useState } from 'react'
import { CheckCircle2, Clock, Users, Activity, BarChart3, Filter, ClipboardList } from 'lucide-react'
import { mockAttendanceLogs, mockTickets, mockEvents, mockParticipants } from '../../data/mockData'

export default function StaffCheckIns() {
    const [filterEvent, setFilterEvent] = useState('all')

    const logs = mockAttendanceLogs.map(log => {
        const ticket = mockTickets.find(t => t.id === log.ticket_id)
        const event = mockEvents.find(e => e.id === log.event_id)
        const participant = mockParticipants.find(p => p.ticket_id === log.ticket_id)
        return { ...log, ticket, event, participant }
    })

    const filtered = filterEvent === 'all' ? logs : logs.filter(l => l.event_id === filterEvent)

    const successCount = filtered.filter(l => l.verification_status === 'success').length
    const duplicateCount = filtered.filter(l => l.verification_status === 'duplicate').length

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
                        <Activity size={20} color="var(--status-warn)" />
                    </div>
                    <div>
                        <div className="stat-card-value font-mono">{duplicateCount}</div>
                        <div className="stat-card-label">Auth Repetitions</div>
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
                    {mockEvents.map(e => <option key={e.id} value={e.id}>{e.name.toUpperCase()}</option>)}
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
                                                {log.participant?.user?.full_name?.charAt(0) || '?'}
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {log.participant?.user?.full_name || 'IDENTITY_UNKNOWN'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 700 }}>
                                        {log.event?.name?.toUpperCase() || 'N/A'}
                                    </td>
                                    <td className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)', opacity: 0.7 }}>{log.ticket_id}</td>
                                    <td style={{ color: 'var(--text-dim)', fontSize: 'var(--font-xs)' }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className={`badge ${log.verification_status === 'success' ? 'badge-success' : 'badge-warning'}`}>
                                            {log.verification_status === 'success' ? 'VERIFIED' : 'DUPLICATE'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
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
