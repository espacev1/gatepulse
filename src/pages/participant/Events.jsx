import { useState, useEffect } from 'react'
import { MapPin, Clock, Users, CalendarDays, CheckCircle2, ArrowRight, Search, Activity, Zap, DollarSign } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function ParticipantEvents() {
    const { user } = useAuth()
    const [events, setEvents] = useState([])
    const [search, setSearch] = useState('')
    const [registeredEvents, setRegisteredEvents] = useState(new Set())
    const [showSuccess, setShowSuccess] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInitialData()

        const subscription = supabase
            .channel('participant-events-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
                fetchEvents()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        await Promise.all([fetchEvents(), fetchMyRegistrations()])
        setLoading(false)
    }

    const fetchEvents = async () => {
        const { data } = await supabase
            .from('events')
            .select('*')
            .order('start_time', { ascending: true })
        if (data) setEvents(data)
    }

    const fetchMyRegistrations = async () => {
        if (!user) return
        const { data } = await supabase
            .from('participants')
            .select('event_id')
            .eq('user_id', user.id)
        if (data) {
            setRegisteredEvents(new Set(data.map(r => r.event_id)))
        }
    }

    const handleRegister = async (event) => {
        if (!user) return alert('Please sign in to register.')

        // For demo purposes, we auto-generate a ticket token
        const qrToken = `GP-${event.id.slice(0, 4)}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

        const { data: participant, error: pError } = await supabase
            .from('participants')
            .insert([{ user_id: user.id, event_id: event.id }])
            .select()
            .single()

        if (pError) return alert('Registration error: ' + pError.message)

        const { error: tError } = await supabase
            .from('tickets')
            .insert([{
                participant_id: participant.id,
                event_id: event.id,
                qr_token: qrToken
            }])

        if (tError) return alert('Ticket generation error: ' + tError.message)

        setRegisteredEvents(prev => new Set([...prev, event.id]))
        setShowSuccess(event.id)
        setTimeout(() => setShowSuccess(null), 3500)
    }

    const filtered = events.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase())
    )

    const getStatusStyle = (status) => {
        if (status === 'active') return { accent: 'var(--status-ok)', badge: 'badge-success' }
        if (status === 'upcoming') return { accent: 'var(--accent)', badge: 'badge-info' }
        return { accent: 'var(--status-warn)', badge: 'badge-warning' }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Operational Sectors</h1>
                    <p className="page-subtitle">Available deployment zones and active security events.</p>
                </div>
            </div>

            {/* Search HUD */}
            <div className="search-bar mb-10" style={{ maxWidth: 480 }}>
                <Search />
                <input placeholder="Filter sectors by designation or coordinate..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Notification Toast */}
            {showSuccess && (
                <div style={{
                    position: 'fixed', top: 80, right: 32, zIndex: 1000,
                    padding: '16px 24px',
                    background: 'var(--bg-panel)',
                    borderLeft: '4px solid var(--status-ok)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-xl), var(--shadow-glow)',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    animation: 'slideInRight 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) both',
                }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--status-ok-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={18} color="var(--status-ok)" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 'var(--font-xs)', color: 'var(--status-ok)', letterSpacing: '0.05em' }}>REGISTRATION_SUCCESS</div>
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)' }}>Credential provisioned. Check "Identity Credentials".</div>
                    </div>
                </div>
            )}

            {/* Events Grid */}
            <div className="grid-3" style={{ gap: 'var(--space-6)' }}>
                {loading && <div className="col-span-3 text-center py-20 text-dim">Scanning for available sectors...</div>}
                {!loading && filtered.length === 0 && (
                    <div className="col-span-3 text-center py-20 text-dim">No operational sectors detected in this coordinate range.</div>
                )}
                {filtered.map((event, i) => {
                    const isRegistered = registeredEvents.has(event.id)
                    const ss = getStatusStyle(event.status)
                    const isFull = (event.registered_count || 0) >= event.max_capacity

                    return (
                        <div key={event.id} className="card" style={{
                            display: 'flex', flexDirection: 'column',
                            animation: `fadeInUp 0.4s ease ${i * 0.08}s both`,
                            padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)'
                        }}>
                            {/* Card Header Line */}
                            <div style={{ height: 3, background: isRegistered ? 'var(--accent-gradient)' : 'var(--bg-elevated)' }} />

                            <div style={{ padding: '24px' }}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} color={ss.accent} />
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>SECTOR_{event.id.slice(-4)}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`badge ${ss.badge}`} style={{ fontSize: '9px' }}>{event.status}</span>
                                        <span className={`badge ${event.is_free ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '9px' }}>
                                            {event.is_free ? 'FREE_ACCESS' : `CREDIT: $${event.price}`}
                                        </span>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                                    {event.name}
                                </h3>

                                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '24px', minHeight: '60px' }}>
                                    {event.description}
                                </p>

                                <div className="flex flex-col gap-3 mb-6" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                                    <div className="flex items-center gap-2"><MapPin size={12} color="var(--accent)" /> {event.location}</div>
                                    <div className="flex items-center gap-2"><CalendarDays size={12} color="var(--accent)" /> {new Date(event.start_time).toLocaleDateString()}</div>
                                </div>

                                {/* Load Factor Gauge */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)' }}>LOAD FACTOR</span>
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>{Math.round(((event.registered_count || 0) / event.max_capacity) * 100)}%</span>
                                    </div>
                                    <div className="progress-bar-track">
                                        <div className="progress-bar-fill" style={{
                                            width: `${((event.registered_count || 0) / event.max_capacity) * 100}%`,
                                            background: isFull ? 'var(--status-critical)' : 'var(--accent)'
                                        }} />
                                    </div>
                                </div>

                                {isRegistered ? (
                                    <button className="btn btn-secondary w-full" disabled style={{ opacity: 0.6, borderStyle: 'dashed' }}>
                                        <CheckCircle2 size={14} /> ACCESS_GRANTED
                                    </button>
                                ) : isFull ? (
                                    <button className="btn btn-secondary w-full" disabled style={{ opacity: 0.5 }}>
                                        SECTOR_FULL
                                    </button>
                                ) : (
                                    <button onClick={() => handleRegister(event)} className="btn btn-primary w-full">
                                        INITIALIZE ACCESS <ArrowRight size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
