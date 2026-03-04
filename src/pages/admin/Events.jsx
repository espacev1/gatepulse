import { useState } from 'react'
import {
    CalendarDays, MapPin, Users, Plus, Search, Filter,
    MoreVertical, Edit2, Trash2, X, Check, Activity, Clock
} from 'lucide-react'
import { mockEvents as initialEvents } from '../../data/mockData'

export default function AdminEvents() {
    const [events, setEvents] = useState(initialEvents)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingEvent, setEditingEvent] = useState(null)

    const [form, setForm] = useState({
        name: '', location: '', start_time: '', end_time: '',
        max_capacity: 100, description: '', status: 'upcoming'
    })

    const filtered = events.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

    const handleOpenModal = (event = null) => {
        if (event) {
            setEditingEvent(event)
            setForm(event)
        } else {
            setEditingEvent(null)
            setForm({ name: '', location: '', start_time: '', end_time: '', max_capacity: 100, description: '', status: 'upcoming' })
        }
        setShowModal(true)
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Operational Node Management</h1>
                    <p className="page-subtitle">Configure and monitor event deployments and availability.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    <Plus size={16} /> Deploy New Node
                </button>
            </div>

            {/* Filters HUD */}
            <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <div className="search-bar">
                        <Search />
                        <input placeholder="Search Active Nodes..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-select" style={{ width: 'auto', minWidth: '180px' }}>
                        <option>SYSTEM_STATUS: ALL</option>
                        <option>ACTIVE_ONLY</option>
                        <option>UPCOMING</option>
                    </select>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid-3">
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
                            <span className={`badge ${event.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{event.status}</span>
                        </div>

                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }} className="truncate-2">
                            {event.description}
                        </p>

                        <div className="flex flex-col gap-2 mb-6" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                            <div className="flex items-center gap-2"><MapPin size={12} color="var(--accent)" /> {event.location}</div>
                            <div className="flex items-center gap-2"><Clock size={12} color="var(--accent)" /> {new Date(event.start_time).toLocaleString()}</div>
                        </div>

                        {/* Load Capacity */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-1">
                                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)' }}>LOAD FACTOR</span>
                                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>{event.registered_count} / {event.max_capacity}</span>
                            </div>
                            <div className="progress-bar-track">
                                <div className="progress-bar-fill" style={{ width: `${(event.registered_count / event.max_capacity) * 100}%` }} />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => handleOpenModal(event)} className="btn btn-secondary btn-sm flex-1"><Edit2 size={12} /> CONFIGURE</button>
                            <button className="btn btn-ghost btn-icon"><Activity size={14} /></button>
                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--status-critical)' }}><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Config Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ border: '2px solid var(--border-accent)' }}>
                        {/* Modal Scanning Line */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'var(--accent)', opacity: 0.3, animation: 'scanline 4s linear infinite' }} />

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
                                    <label className="form-label">Deployment Local (Location)</label>
                                    <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max Capacity (Entities)</label>
                                    <input type="number" className="form-input" value={form.max_capacity} onChange={e => setForm({ ...form, max_capacity: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Protocol Metadata (Description)</label>
                                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">ABORT</button>
                            <button onClick={() => setShowModal(false)} className="btn btn-primary">COMMIT CHANGES</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
