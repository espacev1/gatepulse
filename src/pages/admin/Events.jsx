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

    const [form, setForm] = useState({
        name: '', location: '', start_time: '', end_time: '',
        max_capacity: 100, description: '', status: 'upcoming',
        is_free: true, price: 0
    })

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
                price: event.price ?? 0
            })
        } else {
            setEditingEvent(null)
            setForm({
                name: '', location: '', start_time: '', end_time: '',
                max_capacity: 100, description: '', status: 'upcoming',
                is_free: true, price: 0
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
            start_time: new Date(form.start_time).toISOString(),
            end_time: new Date(form.end_time).toISOString(),
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
                {user?.is_super_admin && (
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
                    <select className="form-select" style={{ width: 'auto', minWidth: '180px' }}>
                        <option>SYSTEM_STATUS: ALL</option>
                        <option>ACTIVE_ONLY</option>
                        <option>UPCOMING</option>
                    </select>
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
                                <span className={`badge ${event.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{event.status}</span>
                                <span className={`badge ${event.is_free ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '9px' }}>
                                    {event.is_free ? 'FREE_ACCESS' : `CREDIT: $${event.price}`}
                                </span>
                            </div>
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
                                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>{event.registered_count || 0} / {event.max_capacity}</span>
                            </div>
                            <div className="progress-bar-track">
                                <div className="progress-bar-fill" style={{ width: `${((event.registered_count || 0) / event.max_capacity) * 100}%` }} />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => handleOpenModal(event)} className="btn btn-secondary btn-sm flex-1"><Edit2 size={12} /> CONFIGURE</button>
                            {user?.is_super_admin && (
                                <button onClick={() => handleDelete(event.id)} className="btn btn-ghost btn-icon" style={{ color: 'var(--status-critical)' }}><Trash2 size={14} /></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Config Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ border: '2px solid var(--border-accent)' }}>
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
                                    <input type="number" className="form-input" value={form.max_capacity} onChange={e => setForm({ ...form, max_capacity: parseInt(e.target.value) })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Activation Time (Start)</label>
                                    <input type="datetime-local" className="form-input" value={form.start_time ? form.start_time.slice(0, 16) : ''} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Deactivation Time (End)</label>
                                    <input type="datetime-local" className="form-input" value={form.end_time ? form.end_time.slice(0, 16) : ''} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Access Protocol</label>
                                    <div className="flex gap-2 p-1 bg-deepest rounded-lg border border-border-color">
                                        <button
                                            onClick={() => setForm({ ...form, is_free: true })}
                                            className={`btn btn-sm flex-1 ${form.is_free ? 'btn-primary' : 'btn-ghost'}`}
                                        >FREE</button>
                                        <button
                                            onClick={() => setForm({ ...form, is_free: false })}
                                            className={`btn btn-sm flex-1 ${!form.is_free ? 'btn-primary' : 'btn-ghost'}`}
                                        >PAID</button>
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
        </div>
    )
}
