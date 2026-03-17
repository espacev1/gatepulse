import { useState, useEffect } from 'react'
import {
    CalendarDays, MapPin, Users, Plus, Search, Filter,
    MoreVertical, Edit2, Trash2, X, Check, Activity, Clock, CreditCard, DollarSign
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function FacultyCreateEvents() {
    const { user, userProfile } = useAuth()
    const [events, setEvents] = useState([])
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingEvent, setEditingEvent] = useState(null)
    const [loading, setLoading] = useState(true)

    const DEPARTMENTS = ['AIML', 'AIDS', 'IT', 'CSE', 'ECE', 'EEE', 'ME', 'CE', 'CSBS']
    const isRestricted = userProfile?.dept && userProfile.dept !== 'GLOBAL' && userProfile.dept !== 'WAITING_FOR_REGISTRATION'
    const assignedDept = isRestricted ? userProfile.dept : null

    const initialFormState = {
        name: '', location: '', start_time: '', end_time: '',
        event_date: '',
        max_capacity: 100, description: '', status: 'upcoming',
        is_free: true, price: 0,
        participation_type: 'solo',
        allowed_departments: assignedDept ? [assignedDept] : [],
        registration_start: '',
        registration_end: '',
        is_live: false,
        genre: 'Culturals',
        marking_criteria: ['Technical Execution', 'Innovation & Impact', 'Presentation Quality', 'Practical Usability']
    }

    const [form, setForm] = useState(initialFormState)

    useEffect(() => {
        fetchEvents()
        const subscription = supabase
            .channel('faculty-events-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
                fetchEvents()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [userProfile])

    const fetchEvents = async () => {
        setLoading(true)
        let query = supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false })
            
        if (assignedDept) {
            query = query.or(`created_by.eq.${user.id},allowed_departments.cs.{${assignedDept}}`)
        }

        const { data, error } = await query
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
                event_date: event.event_date ? event.event_date.split('T')[0] : '',
                registration_start: event.registration_start ? event.registration_start.slice(0, 16) : '',
                registration_end: event.registration_end ? event.registration_end.slice(0, 16) : '',
                start_time: event.start_time ? event.start_time.slice(0, 16) : '',
                end_time: event.end_time ? event.end_time.slice(0, 16) : '',
                is_live: event.is_live ?? false,
                genre: event.genre || 'Culturals',
                marking_criteria: event.marking_criteria || ['Technical Execution', 'Innovation & Impact', 'Presentation Quality', 'Practical Usability']
            })
        } else {
            setEditingEvent(null)
            setForm(initialFormState)
        }
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.name) return alert('Event name is required.')
        
        const payload = {
            ...form,
            start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
            end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
            event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
            registration_start: form.registration_start ? new Date(form.registration_start).toISOString() : null,
            registration_end: form.registration_end ? new Date(form.registration_end).toISOString() : null,
            created_by: user.id,
            updated_at: new Date().toISOString()
        }

        if (assignedDept) {
            payload.allowed_departments = [assignedDept]
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
        if (assignedDept) return
        setForm(prev => {
            const current = [...(prev.allowed_departments || [])]
            if (current.includes(dept)) {
                return { ...prev, allowed_departments: current.filter(d => d !== dept) }
            } else {
                return { ...prev, allowed_departments: [...current, dept] }
            }
        })
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to decommission this node?')) return
        const { error } = await supabase.from('events').delete().eq('id', id).eq('created_by', user.id)

        if (error) {
            alert('Error deleting event: ' + error.message)
        } else {
            fetchEvents()
        }
    }

    const filtered = events.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sector Node Deployment</h1>
                    <p className="page-subtitle">Provision and manage events within your authorized operational sector.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    <Plus size={16} /> Deploy New Node
                </button>
            </div>

            <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <div className="search-bar">
                        <Search />
                        <input placeholder="Search Authorized Nodes..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="grid-3">
                {loading && <div className="col-span-3 text-center py-12">Synchronizing sector data...</div>}
                {!loading && filtered.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-dim">No authorized nodes detected.</div>
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
                            <span className={`badge ${event.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{event.status}</span>
                        </div>

                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }} className="truncate-2">
                            {event.description}
                        </p>

                        <div className="flex flex-col gap-2 mb-4" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                            <div className="flex items-center gap-2"><MapPin size={12} color="var(--accent)" /> {event.location}</div>
                            <div className="flex items-center gap-2"><Clock size={12} color="var(--accent)" /> {new Date(event.start_time).toLocaleString()}</div>
                            <div className="flex items-center gap-2">
                                <Users size={12} color="var(--accent)" />
                                {event.allowed_departments?.length > 0 ? `RESTRICTED: ${event.allowed_departments.join(', ')}` : 'OPEN TO ALL'}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {event.created_by === user.id ? (
                                <>
                                    <button onClick={() => handleOpenModal(event)} className="btn btn-secondary btn-sm flex-1"><Edit2 size={12} /> CONFIGURE</button>
                                    <button onClick={() => handleDelete(event.id)} className="btn btn-ghost btn-icon" style={{ color: 'var(--status-critical)' }}><Trash2 size={14} /></button>
                                </>
                            ) : (
                                <div className="text-[10px] text-dim italic py-2 px-1">READ-ONLY ACCESS (FOREIGN NODE)</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

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
                                            {form.participation_type === 'solo' && <Check size={12} className="mr-1" />} SOLO
                                        </button>
                                        <button
                                            onClick={() => setForm({ ...form, participation_type: 'team' })}
                                            className={`btn btn-sm flex-1 ${form.participation_type === 'team' ? 'btn-primary' : 'btn-outline'}`}
                                        >
                                            {form.participation_type === 'team' && <Check size={12} className="mr-1" />} TEAM
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max Capacity (Entities)</label>
                                    <input type="number" className="form-input" value={form.max_capacity} onChange={e => setForm({ ...form, max_capacity: parseInt(e.target.value) })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Sector Lock (Target Departments)</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-transparent rounded-lg border border-border-color">
                                    {DEPARTMENTS.map(dept => (
                                        <button
                                            key={dept}
                                            onClick={() => toggleDept(dept)}
                                            className={`btn btn-xs ${form.allowed_departments?.includes(dept) ? 'btn-primary' : 'btn-outline'}`}
                                            disabled={assignedDept && assignedDept !== dept}
                                        >
                                            {form.allowed_departments?.includes(dept) && <Check size={10} className="mr-1" />}
                                            {dept}
                                        </button>
                                    ))}
                                    {!assignedDept && (
                                        <button
                                            onClick={() => setForm({ ...form, allowed_departments: [] })}
                                            className="btn btn-xs btn-ghost"
                                            style={{ fontSize: '10px', marginLeft: 'auto' }}
                                        >RESET (OPEN ALL)</button>
                                    )}
                                </div>
                                {assignedDept && (
                                    <p style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: 6 }}>
                                        <Lock size={8} className="inline mr-1" /> Sector locked to your assigned department: {assignedDept}
                                    </p>
                                )}
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
                                        >
                                            {form.genre === g && <Check size={10} className="mr-1" />} {g.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Registration Start</label>
                                    <input type="datetime-local" className="form-input" value={form.registration_start} onChange={e => setForm({ ...form, registration_start: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Registration End</label>
                                    <input type="datetime-local" className="form-input" value={form.registration_end} onChange={e => setForm({ ...form, registration_end: e.target.value })} />
                                </div>
                             </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Event Start</label>
                                    <input type="datetime-local" className="form-input" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Event End</label>
                                    <input type="datetime-local" className="form-input" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Event Date</label>
                                    <input type="date" className="form-input" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label flex items-center gap-2">
                                    <input type="checkbox" checked={form.is_live} onChange={e => setForm({ ...form, is_live: e.target.checked })} />
                                    MARK AS LIVE EVENT
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
                                            {form.is_free && <Check size={12} className="mr-1" />} FREE
                                        </button>
                                        <button
                                            onClick={() => setForm({ ...form, is_free: false })}
                                            className={`btn btn-sm flex-1 ${!form.is_free ? 'btn-primary' : 'btn-outline'}`}
                                        >
                                            {!form.is_free && <Check size={12} className="mr-1" />} PAID
                                        </button>
                                    </div>
                                </div>
                                {!form.is_free && (
                                    <div className="form-group">
                                        <label className="form-label">Unit Credit (Price $)</label>
                                        <div style={{ position: 'relative' }}>
                                            <DollarSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                                            <input type="number" className="form-input" style={{ paddingLeft: 32 }} value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Criteria</label>
                                <div className="flex flex-col gap-2">
                                    {form.marking_criteria.map((c, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input className="form-input" value={c} onChange={e => {
                                                const nc = [...form.marking_criteria]; nc[i] = e.target.value; setForm({ ...form, marking_criteria: nc })
                                            }} />
                                            <button onClick={() => setForm({ ...form, marking_criteria: form.marking_criteria.filter((_, idx) => idx !== i) })} className="btn btn-ghost text-critical"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => setForm({ ...form, marking_criteria: [...form.marking_criteria, 'New Criteria'] })} className="btn btn-secondary btn-xs">+ Add Criteria</button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Protocol Metadata (Description)</label>
                                <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: 80 }} />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-ghost">ABORT</button>
                            <button onClick={handleSave} className="btn btn-primary">CONFIRM_DEPLOYMENT</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
