import { useState } from 'react'
import { Search, Filter, CheckCircle2, Shield, Users, Clock, Mail, Globe } from 'lucide-react'
import { mockParticipants, mockTickets, mockEvents } from '../../data/mockData'

export default function AdminParticipants() {
    const [search, setSearch] = useState('')
    const [filterEvent, setFilterEvent] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')

    const participants = mockParticipants.map(p => {
        const ticket = mockTickets.find(t => t.id === p.ticket_id)
        const event = mockEvents.find(e => e.id === p.event_id)
        return { ...p, ticket, event }
    })

    const filtered = participants.filter(p => {
        const matchesSearch = p.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
            p.user.email.toLowerCase().includes(search.toLowerCase())
        const matchesEvent = filterEvent === 'all' || p.event_id === filterEvent
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'checked-in' && p.ticket?.is_validated) ||
            (filterStatus === 'pending' && !p.ticket?.is_validated)
        return matchesSearch && matchesEvent && matchesStatus
    })

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Entity Registry</h1>
                    <p className="page-subtitle">Historical and active participant credentials mapping.</p>
                </div>
                <div className="badge badge-primary" style={{ padding: 'var(--space-2) var(--space-4)' }}>
                    {filtered.length} NODES LOGGED
                </div>
            </div>

            {/* Filters HUD */}
            <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <div className="search-bar">
                        <Search />
                        <input placeholder="Filter by Identity/UID..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-select" value={filterEvent} onChange={e => setFilterEvent(e.target.value)} style={{ width: 'auto', minWidth: 200 }}>
                        <option value="all">SECTOR: ALL</option>
                        {mockEvents.map(e => <option key={e.id} value={e.id}>{e.name.toUpperCase()}</option>)}
                    </select>
                    <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
                        <option value="all">AUTH_STATUS: ALL</option>
                        <option value="checked-in">IDENTITY_VERIFIED</option>
                        <option value="pending">PENDING_AUTH</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Identity Name</th>
                                <th>Entity Class</th>
                                <th>Target Sector</th>
                                <th>Credential Key</th>
                                <th>Status</th>
                                <th>Access Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p, i) => (
                                <tr key={p.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.03}s both` }}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 'var(--radius-lg)',
                                                background: 'var(--accent-gradient)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--bg-deepest)', fontSize: 'var(--font-xs)', fontWeight: 800,
                                            }}>
                                                {p.user.full_name.charAt(0)}
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.user.full_name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                                        <div className="flex items-center gap-1"><Mail size={10} /> {p.user.email}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.02em' }}>
                                            {p.event?.name?.toUpperCase() || 'N/A'}
                                        </span>
                                    </td>
                                    <td><code className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)', opacity: 0.7 }}>{p.ticket_id}</code></td>
                                    <td>
                                        {p.ticket?.is_validated ? (
                                            <span className="badge badge-success"><CheckCircle2 size={10} /> VERIFIED</span>
                                        ) : (
                                            <span className="badge badge-warning"><Clock size={10} /> PENDING</span>
                                        )}
                                    </td>
                                    <td style={{ color: 'var(--text-dim)', fontSize: 'var(--font-xs)' }}>
                                        {new Date(p.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="empty-state">
                        <Users size={48} style={{ opacity: 0.1, margin: '0 auto var(--space-4)' }} />
                        <div className="empty-state-title">NO ENTITIES REGISTERED</div>
                        <p>Adjust data filters to view alternate registry domains.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
