import { useState, useEffect } from 'react'
import { Search, Filter, CheckCircle2, Shield, Users, Clock, Mail, Globe, Download, ThumbsUp, XCircle } from 'lucide-react'
import { db } from '../../lib/firebase'
import {
    collection,
    query,
    getDocs,
    onSnapshot,
    orderBy,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    where,
    serverTimestamp
} from 'firebase/firestore'

export default function AdminParticipants() {
    const [search, setSearch] = useState('')
    const [filterEvent, setFilterEvent] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [participants, setParticipants] = useState([])
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchEvents = async () => {
            const snapshot = await getDocs(collection(db, 'events'))
            setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        }
        fetchEvents()

        const unsubscribe = onSnapshot(collection(db, 'participants'), async (snapshot) => {
            const data = await Promise.all(snapshot.docs.map(async d => {
                const p = { id: d.id, ...d.data() }

                // Manual Joins
                const [userSnap, eventSnap, teamSnap, ticketSnap] = await Promise.all([
                    getDoc(doc(db, 'profiles', p.user_id)),
                    getDoc(doc(db, 'events', p.event_id)),
                    p.team_id ? getDoc(doc(db, 'teams', p.team_id)) : Promise.resolve({ exists: () => false }),
                    getDocs(query(collection(db, 'tickets'), where('participant_id', '==', p.id)))
                ])

                const ticket = ticketSnap.docs[0]?.data()
                return {
                    ...p,
                    user: userSnap.exists() ? userSnap.data() : { full_name: 'Unknown', email: 'N/A', dept: 'N/A' },
                    event: eventSnap.exists() ? eventSnap.data() : { name: 'N/A' },
                    team_name: teamSnap.exists() ? teamSnap.data().name : null,
                    ticket: ticket || null,
                    ticket_id: ticket?.qr_token || 'NO_CREDENTIAL'
                }
            }))

            setParticipants(data.sort((a, b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0)))
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const handleApprove = async (participant) => {
        if (!window.confirm(`Approve registration for ${participant.user.full_name}?`)) return

        try {
            // 1. Update participant status
            await updateDoc(doc(db, 'participants', participant.id), {
                registration_status: 'confirmed',
                updated_at: serverTimestamp()
            })

            // 2. Provision Ticket
            const qrToken = `GP-${participant.event_id.slice(0, 4)}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
            await addDoc(collection(db, 'tickets'), {
                participant_id: participant.id,
                event_id: participant.event_id,
                qr_token: qrToken,
                is_validated: false,
                created_at: serverTimestamp()
            })

            alert('Registration approved and ticket provisioned.')
        } catch (err) {
            alert('Approval failed: ' + err.message)
        }
    }

    const filtered = participants.filter(p => {
        const matchesSearch = p.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
            p.user.email.toLowerCase().includes(search.toLowerCase()) ||
            p.ticket_id.toLowerCase().includes(search.toLowerCase())

        const matchesEvent = filterEvent === 'all' || p.event_id === filterEvent
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'pending-approval' && p.registration_status === 'pending') ||
            (filterStatus === 'checked-in' && p.ticket?.is_validated) ||
            (filterStatus === 'pending-check-in' && p.registration_status === 'confirmed' && !p.ticket?.is_validated)

        return matchesSearch && matchesEvent && matchesStatus
    })

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Entity Registry</h1>
                    <p className="page-subtitle">Historical and active participant credentials mapping.</p>
                </div>
                <div className="badge badge-primary">
                    {loading ? 'SYNCING...' : `${filtered.length} NODES LOGGED`}
                </div>
            </div>

            <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <div className="search-bar">
                        <Search />
                        <input placeholder="Filter by Identity/UID..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-select" value={filterEvent} onChange={e => setFilterEvent(e.target.value)} style={{ width: 'auto', minWidth: 200 }}>
                        <option value="all">Sectors: All</option>
                        {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
                        <option value="all">Auth_Status: All</option>
                        <option value="pending-approval">Clearance Required</option>
                        <option value="pending-check-in">Confirmed Coverage</option>
                        <option value="checked-in">Authenticated Entry</option>
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Identity Name</th>
                                <th>Entity Class</th>
                                <th>Target Sector</th>
                                <th>Status</th>
                                <th>Credential</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-12 text-dim font-mono">SCANNING REGISTRY...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-12 text-dim font-mono">NO ENTITIES REGISTERED</td></tr>
                            ) : filtered.map((p, i) => (
                                <tr key={p.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.03}s both` }}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-accent-gradient flex items-center justify-center text-bg-deepest font-bold text-xs">
                                                {p.user?.full_name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{p.user?.full_name || 'Anonymous'}</div>
                                                <div className="text-xs text-dim">{p.user?.dept || 'NO_DEPT'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-dim text-xs">
                                        <div className="flex items-center gap-1"><Mail size={10} /> {p.user?.email}</div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-accent font-bold">{p.event?.name?.toUpperCase() || 'N/A'}</span>
                                            {p.team_name && <span className="text-[10px] text-status-warn font-semibold">TEAM: {p.team_name.toUpperCase()}</span>}
                                        </div>
                                    </td>
                                    <td>
                                        {p.registration_status === 'pending' ? <span className="badge badge-warning"><Clock size={10} /> PENDING_APPROVAL</span> :
                                            p.ticket?.is_validated ? <span className="badge badge-success"><CheckCircle2 size={10} /> VERIFIED</span> :
                                                <span className="badge badge-info"><Shield size={10} /> CONFIRMED</span>}
                                    </td>
                                    <td><code className="text-[10px] text-dim">{p.registration_status === 'pending' ? 'SEC_CLEARANCE_REQUIRED' : p.ticket_id}</code></td>
                                    <td>
                                        {p.registration_status === 'pending' && (
                                            <button onClick={() => handleApprove(p)} className="btn btn-primary btn-xs text-[10px] px-2 py-1">
                                                <ThumbsUp size={10} /> APPROVE
                                            </button>
                                        )}
                                        {p.registration_status === 'confirmed' && <span className="text-[10px] text-dim">ACT_LOGGED</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
