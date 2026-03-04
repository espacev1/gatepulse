import { useState, useEffect } from 'react'
import { MapPin, Clock, Users, CalendarDays, CheckCircle2, ArrowRight, Search, Activity, Zap, DollarSign } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import ProfileCompletionModal from '../../components/ProfileCompletionModal'

export default function ParticipantEvents() {
    const { user } = useAuth()
    const [events, setEvents] = useState([])
    const [search, setSearch] = useState('')
    const [registeredEvents, setRegisteredEvents] = useState(new Set())
    const [showSuccess, setShowSuccess] = useState(null)
    const [loading, setLoading] = useState(true)
    const [profileModal, setProfileModal] = useState(false)
    const [teamModal, setTeamModal] = useState(false)
    const [pendingEvent, setPendingEvent] = useState(null)
    const [teamName, setTeamName] = useState('')
    const [teamMembers, setTeamMembers] = useState(['']) // Array of emails or reg_nos

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

        // 1. Department Check
        if (event.allowed_departments && event.allowed_departments.length > 0) {
            const userDept = user.dept?.toUpperCase()
            if (!event.allowed_departments.includes(userDept)) {
                return alert(`ACCESS_DENIED: This sector is restricted to ${event.allowed_departments.join(', ')} branches. Your current node affiliation (${userDept || 'NONE'}) is insufficient.`)
            }
        }

        // 2. Profile Completion Check
        // Team events don't require face/barcode as per requirements
        const isSolo = event.participation_type !== 'team'
        const isProfileComplete = user.dept && user.reg_no && (!isSolo || (user.face_url && user.id_barcode_url))

        if (!isProfileComplete) {
            setPendingEvent(event)
            setProfileModal(true)
            return
        }

        if (event.participation_type === 'team') {
            setPendingEvent(event)
            setTeamModal(true)
            return
        }

        await executeSoloRegistration(event)
    }

    const executeSoloRegistration = async (event) => {
        const { data: participant, error: pError } = await supabase
            .from('participants')
            .insert([{
                user_id: user.id,
                event_id: event.id,
                registration_status: 'pending'
            }])
            .select()
            .single()

        if (pError) {
            if (pError.code === '23505') return alert('ALREADY_REGISTERED: Your credentials for this sector are already in queue.')
            return alert('Registration error: ' + pError.message)
        }

        completeRegistration(event.id)
    }

    const handleTeamSubmit = async () => {
        if (!teamName) return alert('Team Designation Required.')
        setLoading(true)

        try {
            // 1. Resolve members (Support Email or Reg No)
            const rawIdentifiers = [user.email, ...teamMembers.filter(m => m.trim())]
            const trimmedIdentifiers = [...new Set(rawIdentifiers.map(m => m.trim().toLowerCase()))]
            const regIdentifiers = [...new Set(rawIdentifiers.map(m => m.trim()))]

            // Query by email and reg_no separately to be robust
            const { data: profiles, error: prError } = await supabase
                .from('profiles')
                .select('id, email, full_name, reg_no')
                .or(`email.in.("${trimmedIdentifiers.join('","')}"),reg_no.in.("${regIdentifiers.join('","')}")`)

            if (prError) throw prError

            // Validate all members found
            if (profiles.length < trimmedIdentifiers.length) {
                const foundEmails = profiles.map(p => p.email?.toLowerCase())
                const foundRegs = profiles.map(p => p.reg_no?.toLowerCase())
                const missing = rawIdentifiers.filter(m => {
                    const cleanM = m.trim().toLowerCase()
                    return !foundEmails.includes(cleanM) && !foundRegs.includes(cleanM)
                })
                throw new Error(`ENTITY_NOT_FOUND: Could not resolve credentials for: ${missing.join(', ')}. Please ensure they have created a participant account and you are using their exact Email or Reg No.`)
            }

            // 2. Create Team
            const { data: team, error: tError } = await supabase
                .from('teams')
                .insert([{
                    event_id: pendingEvent.id,
                    name: teamName,
                    leader_id: user.id
                }])
                .select()
                .single()

            if (tError) throw tError

            // 3. Create Participants
            const participantData = profiles.map(p => ({
                user_id: p.id,
                event_id: pendingEvent.id,
                team_id: team.id,
                registration_status: 'pending'
            }))

            const { error: finalError } = await supabase
                .from('participants')
                .insert(participantData)

            if (finalError) {
                if (finalError.code === '23505') throw new Error('ONE_OR_MORE_MEMBERS_ALREADY_REGISTERED: A member of your team is already registered for this node.')
                throw finalError
            }

            setTeamModal(false)
            setTeamName('')
            setTeamMembers([''])
            completeRegistration(pendingEvent.id)
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    const completeRegistration = (eventId) => {
        setRegisteredEvents(prev => new Set([...prev, eventId]))
        setShowSuccess(eventId)
        setTimeout(() => setShowSuccess(null), 3500)
    }

    const handleProfileComplete = () => {
        // Since useAuth user state might not update instantly, we can't easily auto-register
        // but we can alert the user to try again
        alert("Identity Provisioned. You may now initialize access.")
        // Optionally reload or re-fetch profile if AuthContext supports it
        window.location.reload()
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
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)' }}>Access pending admin approval. Credentials issued upon clearance.</div>
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

            <ProfileCompletionModal
                isOpen={profileModal}
                onClose={() => setProfileModal(false)}
                user={user}
                onComplete={handleProfileComplete}
            />

            {teamModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ border: '2px solid var(--border-accent)' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">TEAM_REGISTRATION</h2>
                            <button onClick={() => setTeamModal(false)} className="btn-icon"><Users size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Team Designation (Name)</label>
                                <input className="form-input" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Nexus Squad Alpha" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Team Members (Linked Emails)</label>
                                <p style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '8px' }}>
                                    Your email is automatically included as Team Leader.
                                </p>
                                {teamMembers.map((m, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input
                                            className="form-input"
                                            value={m}
                                            onChange={e => {
                                                const newMembers = [...teamMembers]
                                                newMembers[idx] = e.target.value
                                                setTeamMembers(newMembers)
                                            }}
                                            placeholder="Member Email"
                                        />
                                        <button
                                            onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: 'var(--status-critical)' }}
                                        >DISCONNECT</button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setTeamMembers([...teamMembers, ''])}
                                    className="btn btn-secondary btn-xs mt-2"
                                >ADD_MEMBER_SLOT</button>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setTeamModal(false)} className="btn btn-secondary">ABORT</button>
                            <button onClick={handleTeamSubmit} className="btn btn-primary" disabled={loading}>
                                {loading ? 'DEPLOYING...' : 'COMMIT TEAM REGISTRATION'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
