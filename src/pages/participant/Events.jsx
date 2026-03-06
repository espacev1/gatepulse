import { useState, useEffect } from 'react'
import { MapPin, Clock, Users, CalendarDays, CheckCircle2, ArrowRight, Search, Activity, Zap, DollarSign, X, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../lib/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    onSnapshot,
    orderBy,
    serverTimestamp,
    doc,
    setDoc,
    updateDoc,
    increment
} from 'firebase/firestore'

export default function ParticipantEvents() {
    const { user } = useAuth()
    const [events, setEvents] = useState([])
    const [search, setSearch] = useState('')
    const [registeredEvents, setRegisteredEvents] = useState(new Set())
    const [showSuccess, setShowSuccess] = useState(null)
    const [loading, setLoading] = useState(true)
    const [teamModal, setTeamModal] = useState(false)
    const [pendingEvent, setPendingEvent] = useState(null)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [teamName, setTeamName] = useState('')
    const [teamMembers, setTeamMembers] = useState([''])

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        const q = query(collection(db, 'events'), orderBy('start_time', 'asc'))
        const unsubscribeEvents = onSnapshot(q, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setEvents(eventsData)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching events:", error)
            setLoading(false)
        })

        const fetchMyRegistrations = async () => {
            try {
                const regQ = query(collection(db, 'participants'), where('user_id', '==', user.uid))
                const regSnap = await getDocs(regQ)
                setRegisteredEvents(new Set(regSnap.docs.map(doc => doc.data().event_id)))
            } catch (error) {
                console.error("Error fetching registrations:", error)
            }
        }
        fetchMyRegistrations()

        return () => unsubscribeEvents()
    }, [user])

    const handleRegister = async (event) => {
        if (!user) return alert('Please sign in to register.')

        if (event.allowed_departments && event.allowed_departments.length > 0) {
            const userDept = user.dept?.toUpperCase()
            if (!event.allowed_departments.includes(userDept)) {
                return alert(`ACCESS_DENIED: This sector is restricted to ${event.allowed_departments.join(', ')} branches. Your current node affiliation (${userDept || 'NONE'}) is insufficient.`)
            }
        }

        if (event.participation_type === 'team') {
            setPendingEvent(event)
            setTeamModal(true)
            return
        }

        await executeSoloRegistration(event)
    }

    const executeSoloRegistration = async (event) => {
        try {
            const existingRegQuery = query(
                collection(db, 'participants'),
                where('user_id', '==', user.uid),
                where('event_id', '==', event.id)
            )
            const existingRegSnap = await getDocs(existingRegQuery)

            if (!existingRegSnap.empty) {
                return alert('ALREADY_REGISTERED: Your credentials for this sector are already in queue.')
            }

            await addDoc(collection(db, 'participants'), {
                user_id: user.uid,
                event_id: event.id,
                registration_status: 'pending',
                created_at: serverTimestamp()
            })

            const eventRef = doc(db, 'events', event.id)
            await updateDoc(eventRef, { registered_count: increment(1) })

            completeRegistration(event.id)
        } catch (error) {
            alert('Registration error: ' + error.message)
        }
    }

    const handleTeamSubmit = async () => {
        if (!teamName) return alert('Team Designation Required.')
        setLoading(true)

        try {
            const rawIdentifiers = [user.email, ...teamMembers.filter(m => m.trim())]
            const trimmedEmails = [...new Set(rawIdentifiers.map(m => m.trim().toLowerCase()))]

            let profiles = []
            if (trimmedEmails.length > 0) {
                const profilesRef = collection(db, 'profiles')
                const q = query(profilesRef, where('email', 'in', trimmedEmails.slice(0, 10)))
                const profileSnap = await getDocs(q)
                profiles = profileSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            }

            if (profiles.length < trimmedEmails.length) {
                const foundEmails = profiles.map(p => p.email?.toLowerCase())
                const missing = trimmedEmails.filter(m => !foundEmails.includes(m))
                throw new Error(`ENTITY_NOT_FOUND: Could not resolve credentials for: ${missing.join(', ')}. Please ensure they have created a participant account.`)
            }

            const teamRef = await addDoc(collection(db, 'teams'), {
                event_id: pendingEvent.id,
                name: teamName,
                leader_id: user.uid,
                created_at: serverTimestamp()
            })

            const participantPromises = profiles.map(async (p) => {
                const existingRegQuery = query(
                    collection(db, 'participants'),
                    where('user_id', '==', p.id),
                    where('event_id', '==', pendingEvent.id)
                )
                const existingRegSnap = await getDocs(existingRegQuery)

                if (!existingRegSnap.empty) {
                    throw new Error(`ONE_OR_MORE_MEMBERS_ALREADY_REGISTERED: ${p.email} is already registered.`)
                }

                return addDoc(collection(db, 'participants'), {
                    user_id: p.id,
                    event_id: pendingEvent.id,
                    team_id: teamRef.id,
                    registration_status: 'pending',
                    created_at: serverTimestamp()
                })
            })
            await Promise.all(participantPromises)

            const eventRef = doc(db, 'events', pendingEvent.id)
            await updateDoc(eventRef, { registered_count: increment(profiles.length) })

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

    const filtered = events.filter(e => {
        if (e.allowed_departments && e.allowed_departments.length > 0) {
            const userDept = user?.dept?.toUpperCase()
            if (!e.allowed_departments.includes(userDept)) return false
        }
        const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.description.toLowerCase().includes(search.toLowerCase()) ||
            e.location.toLowerCase().includes(search.toLowerCase())
        return matchesSearch
    })

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

            <div className="search-bar mb-10" style={{ maxWidth: 480 }}>
                <Search />
                <input placeholder="Filter sectors by designation or coordinate..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {showSuccess && (
                <div className="toast">
                    <CheckCircle2 size={18} color="var(--status-ok)" />
                    <div>
                        <div className="toast-title">REGISTRATION_SUCCESS</div>
                        <div className="toast-desc">Access pending admin approval.</div>
                    </div>
                </div>
            )}

            <div className="grid-3" style={{ gap: 'var(--space-6)' }}>
                {loading && <div className="col-span-3 text-center py-20 text-dim">Scanning for available sectors...</div>}
                {!loading && filtered.length === 0 && (
                    <div className="col-span-3 text-center py-20 text-dim">No operational sectors detected.</div>
                )}
                {filtered.map((event, i) => {
                    const isRegistered = registeredEvents.has(event.id)
                    const ss = getStatusStyle(event.status)
                    const isFull = (event.registered_count || 0) >= event.max_capacity

                    return (
                        <div key={event.id} className="card p-0" style={{ animation: `fadeInUp 0.4s ease ${i * 0.08}s both` }}>
                            <div style={{ height: 3, background: isRegistered ? 'var(--accent-gradient)' : 'var(--bg-elevated)' }} />
                            <div style={{ padding: '24px' }}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} color={ss.accent} />
                                        <span className="node-id">SECTOR_{event.id.slice(-4)}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`badge ${ss.badge}`}>{event.status}</span>
                                        <span className={`badge ${event.is_free ? 'badge-info' : 'badge-warning'}`}>
                                            {event.is_free ? 'FREE_ACCESS' : `CREDIT: $${event.price}`}
                                        </span>
                                    </div>
                                </div>
                                <h3>{event.name}</h3>
                                <p className="description">{event.description}</p>
                                <div className="meta-info">
                                    <div className="flex items-center gap-2"><MapPin size={12} color="var(--accent)" /> {event.location}</div>
                                    <div className="flex items-center gap-2"><CalendarDays size={12} color="var(--accent)" /> {event.start_time ? new Date(event.start_time).toLocaleDateString() : ''}</div>
                                </div>
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="load-factor">LOAD FACTOR</span>
                                        <span className="load-count">{Math.round(((event.registered_count || 0) / event.max_capacity) * 100)}%</span>
                                    </div>
                                    <div className="progress-bar-track">
                                        <div className="progress-bar-fill" style={{ width: `${((event.registered_count || 0) / event.max_capacity) * 100}%`, background: isFull ? 'var(--status-critical)' : 'var(--accent)' }} />
                                    </div>
                                </div>
                                {isRegistered && <div className="badge badge-success w-full mb-3 p-2">ACCESS_GRANTED</div>}
                                {isFull && !isRegistered ? (
                                    <button className="btn btn-secondary w-full" disabled>SECTOR_FULL</button>
                                ) : (
                                    <button onClick={() => setSelectedEvent(event)} className="btn btn-primary w-full">VIEW SECTOR DETAILS <ArrowRight size={14} /></button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {selectedEvent && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', border: '1px solid var(--accent)' }}>
                        <div className="modal-header">
                            <div className="flex items-center gap-2"><Zap size={18} color="var(--accent)" /><h2 className="modal-title">SECTOR_DETAILS: {selectedEvent.name}</h2></div>
                            <button onClick={() => setSelectedEvent(null)} className="btn-icon"><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-6">
                                <span className={`badge ${getStatusStyle(selectedEvent.status).badge} mb-2`}>{selectedEvent.status}</span>
                                <p className="modal-desc">{selectedEvent.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="stat-box">
                                    <div className="stat-label"><MapPin size={12} color="var(--accent)" /> DEPLOYMENT_LOCAL</div>
                                    <div className="stat-value">{selectedEvent.location}</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-label"><Users size={12} color="var(--accent)" /> CAPACITY_QUOTA</div>
                                    <div className="stat-value">{selectedEvent.registered_count || 0} / {selectedEvent.max_capacity} ENTITIES</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-label"><Clock size={12} color="var(--accent)" /> ACTIVATION_SIGNAL</div>
                                    <div className="stat-value">{selectedEvent.start_time ? new Date(selectedEvent.start_time).toLocaleString() : ''}</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-label"><Clock size={12} color="var(--status-critical)" /> DEACTIVATION_SIGNAL</div>
                                    <div className="stat-value">{selectedEvent.end_time ? new Date(selectedEvent.end_time).toLocaleString() : ''}</div>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-accent-glow border border-accent/20 mb-8">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="stat-label"><CalendarDays size={12} color="var(--accent)" /> NODE_ACTIVATION_DATE</div>
                                        <div className="node-date">{selectedEvent.event_date ? new Date(selectedEvent.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'NOT_SCHEDULED'}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="stat-label">REGISTRATION_COUNTDOWN</div>
                                        {(() => {
                                            const diff = new Date(selectedEvent.end_time) - new Date()
                                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
                                            if (days <= 0) return <div className="countdown expired">EXPIRED</div>
                                            return <div className="countdown active">{days} DAYS LEFT</div>
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setSelectedEvent(null)} className="btn btn-secondary">ABORT</button>
                            {(() => {
                                const now = new Date()
                                const start = new Date(selectedEvent.start_time)
                                const end = new Date(selectedEvent.end_time)
                                const isRegistered = registeredEvents.has(selectedEvent.id)
                                const isFull = (selectedEvent.registered_count || 0) >= selectedEvent.max_capacity
                                if (isRegistered) return <button className="btn btn-secondary" disabled>ACCESS_ALREADY_GRANTED</button>
                                if (now < start) return <button className="btn btn-secondary" disabled>AWAITING_ACTIVATION</button>
                                if (now > end) return <button className="btn btn-secondary" disabled>DEPLOYMENT_EXPIRED</button>
                                if (isFull) return <button className="btn btn-secondary" disabled>CAPACITY_EXHAUSTED</button>
                                return <button onClick={() => { handleRegister(selectedEvent); setSelectedEvent(null); }} className="btn btn-primary">INITIALIZE ACCESS <ArrowRight size={16} /></button>
                            })()}
                        </div>
                    </div>
                </div>
            )}

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
                                <p className="form-help">Your email is automatically included as Team Leader.</p>
                                {teamMembers.map((m, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input className="form-input" value={m} onChange={e => {
                                            const newMembers = [...teamMembers]
                                            newMembers[idx] = e.target.value
                                            setTeamMembers(newMembers)
                                        }} placeholder="Member Email" />
                                        <button onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))} className="btn btn-ghost btn-sm critical">DISCONNECT</button>
                                    </div>
                                ))}
                                <button onClick={() => setTeamMembers([...teamMembers, ''])} className="btn btn-secondary btn-xs mt-2">ADD_MEMBER_SLOT</button>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setTeamModal(false)} className="btn btn-secondary">ABORT</button>
                            <button onClick={handleTeamSubmit} className="btn btn-primary" disabled={loading}>{loading ? 'DEPLOYING...' : 'COMMIT TEAM REGISTRATION'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
