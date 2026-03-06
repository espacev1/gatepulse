import { useState, useEffect } from 'react'
import {
    Users, Calendar, ClipboardCheck, Activity, Search,
    UserPlus, Shield, Clock, BarChart3, ChevronRight, Play, X, MapPin, CheckCircle2, AlertCircle
} from 'lucide-react'
import { db } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'
import {
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    getDoc,
    orderBy,
    serverTimestamp
} from 'firebase/firestore'

export default function AdminAttendance() {
    const { user } = useAuth()
    const [events, setEvents] = useState([])
    const [staff, setStaff] = useState([])
    const [assignments, setAssignments] = useState([])
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedSession, setSelectedSession] = useState(null)
    const [attendanceRecords, setAttendanceRecords] = useState([])
    const [loadingIntel, setLoadingIntel] = useState(false)

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            await Promise.all([
                fetchEvents(),
                fetchStaff()
            ])
            setLoading(false)
        }
        fetchInitialData()

        const unsubscribeAssignments = onSnapshot(collection(db, 'staff_assignments'), async (snapshot) => {
            const data = await Promise.all(snapshot.docs.map(async d => {
                const assignment = { id: d.id, ...d.data() }
                const eventSnap = await getDoc(doc(db, 'events', assignment.event_id))
                const staffSnap = await getDoc(doc(db, 'profiles', assignment.staff_id))
                return {
                    ...assignment,
                    event: eventSnap.exists() ? { id: eventSnap.id, ...eventSnap.data() } : null,
                    staff: staffSnap.exists() ? { id: staffSnap.id, ...staffSnap.data() } : null
                }
            }))
            setAssignments(data)
        })

        const qSessions = query(collection(db, 'attendance_sessions'), orderBy('activated_at', 'desc'))
        const unsubscribeSessions = onSnapshot(qSessions, async (snapshot) => {
            const data = await Promise.all(snapshot.docs.map(async d => {
                const session = { id: d.id, ...d.data() }
                const eventSnap = await getDoc(doc(db, 'events', session.event_id))
                return {
                    ...session,
                    event: eventSnap.exists() ? { id: eventSnap.id, ...eventSnap.data() } : null
                }
            }))
            setSessions(data)
        })

        return () => {
            unsubscribeAssignments()
            unsubscribeSessions()
        }
    }, [])

    const fetchEvents = async () => {
        const q = query(collection(db, 'events'), orderBy('created_at', 'desc'))
        const snapshot = await getDocs(q)
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }

    const fetchStaff = async () => {
        const q = query(collection(db, 'profiles'), where('role', '==', 'staff'))
        const snapshot = await getDocs(q)
        setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }

    const assignStaff = async (eventId, staffId) => {
        try {
            await addDoc(collection(db, 'staff_assignments'), {
                event_id: eventId,
                staff_id: staffId,
                assigned_at: serverTimestamp()
            })
        } catch (err) {
            alert('Assignment failed: ' + err.message)
        }
    }

    const removeAssignment = async (id) => {
        try {
            await deleteDoc(doc(db, 'staff_assignments', id))
        } catch (err) {
            alert('De-assignment failed: ' + err.message)
        }
    }

    const fetchIntel = async (session) => {
        setSelectedSession(session)
        setLoadingIntel(true)

        try {
            const q = query(collection(db, 'attendance_records'), where('session_id', '==', session.id))
            const snapshot = await getDocs(q)
            const records = await Promise.all(snapshot.docs.map(async d => {
                const record = { id: d.id, ...d.data() }
                const profileSnap = await getDoc(doc(db, 'profiles', record.user_id || record.participant_id))
                return {
                    ...record,
                    profile: profileSnap.exists() ? profileSnap.data() : null
                }
            }))
            setAttendanceRecords(records)
        } catch (err) {
            console.error("Error fetching intel:", err)
        } finally {
            setLoadingIntel(false)
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance Command</h1>
                    <p className="page-subtitle">Assign operational staff to secure sectors and oversee live attendance sessions.</p>
                </div>
            </div>

            <div className="grid-3 mb-8">
                <div className="card">
                    <div className="panel-header">Staff Deployment</div>
                    <div className="flex flex-col gap-4">
                        {events.slice(0, 5).map(event => (
                            <div key={event.id} className="p-3 border border-color rounded-lg bg-elevated">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-sm">{event.name}</span>
                                    <span className="badge badge-secondary text-xs">{event.location}</span>
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        className="form-select text-xs py-1"
                                        onChange={(e) => assignStaff(event.id, e.target.value)}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Deploy Staff...</option>
                                        {staff.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="panel-header">Session Deployment Control</div>
                    <div className="flex flex-col gap-4">
                        <p className="text-xs text-dim">Deploy an attendance protocol to a sector.</p>
                        <select id="openEventSelect" className="form-select text-xs">
                            <option value="">Select Target Sector...</option>
                            {events.map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.location})</option>
                            ))}
                        </select>
                        <button
                            onClick={async () => {
                                const eventId = document.getElementById('openEventSelect').value;
                                if (!eventId) return alert('Select a sector first.');

                                try {
                                    await addDoc(collection(db, 'attendance_sessions'), {
                                        event_id: eventId,
                                        status: 'opened',
                                        activated_at: serverTimestamp(),
                                        activated_by: user?.uid
                                    })
                                    alert('Attendance protocol deployed to sector.')
                                } catch (err) {
                                    alert('Deployment failed: ' + err.message)
                                }
                            }}
                            className="btn btn-primary btn-sm w-full"
                        >
                            <Play size={14} /> OPEN ATTENDANCE
                        </button>
                    </div>
                </div>

                <div className="card col-span-2">
                    <div className="panel-header">Active Assignments & sessions</div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Sector / Event</th>
                                    <th>Assigned Staff</th>
                                    <th>Protocol Status</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map(a => {
                                    const session = sessions.find(s => s.event_id === a.event_id && s.status !== 'ended')
                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <div className="font-bold">{a.event?.name}</div>
                                                <div className="text-xs text-dim">{a.event?.location}</div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-accent-glow flex items-center justify-center text-xs font-bold text-accent">
                                                        {a.staff?.full_name?.charAt(0)}
                                                    </div>
                                                    <span>{a.staff?.full_name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {session?.status === 'active' ? (
                                                    <span className="badge badge-success animate-pulse">LIVE VERIFICATION</span>
                                                ) : session?.status === 'opened' ? (
                                                    <span className="badge badge-warning">PROTOCOL OPENED</span>
                                                ) : (
                                                    <span className="badge badge-secondary">STANDBY</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="flex justify-end gap-2">
                                                    {session && (
                                                        <button onClick={() => fetchIntel(session)} className="btn btn-secondary btn-xs">Intel</button>
                                                    )}
                                                    <button onClick={() => removeAssignment(a.id)} className="btn btn-secondary btn-xs text-critical">Revoke</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="panel-header">Global Attendance Intelligence</div>
                <div className="grid-4 mb-6">
                    <div className="stat-card">
                        <div className="stat-card-icon bg-status-ok-bg"><ClipboardCheck size={20} color="var(--status-ok)" /></div>
                        <div>
                            <div className="stat-card-value font-mono">{sessions.length}</div>
                            <div className="stat-card-label">Total Sessions</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon bg-status-warn-bg"><Activity size={20} color="var(--status-warn)" /></div>
                        <div>
                            <div className="stat-card-value font-mono">{sessions.filter(s => s.status === 'active').length}</div>
                            <div className="stat-card-label">Active Now</div>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Event</th>
                                <th>Result</th>
                                <th>Verified By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => (
                                <tr key={s.id}>
                                    <td className="font-mono text-xs">{s.activated_at?.toDate ? s.activated_at.toDate().toLocaleString() : ''}</td>
                                    <td className="font-bold">{s.event?.name}</td>
                                    <td>
                                        <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-primary'}`}>
                                            {s.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button onClick={() => fetchIntel(s)} className="btn-icon">
                                            <BarChart3 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedSession && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '900px', border: '1px solid var(--accent)' }}>
                        <div className="modal-header">
                            <div className="flex items-center gap-2">
                                <Activity size={18} color="var(--accent)" />
                                <h2 className="modal-title">GLOBAL_INTEL: {selectedSession.event?.name}</h2>
                            </div>
                            <button onClick={() => setSelectedSession(null)} className="btn-icon"><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="stat-card">
                                    <div className="stat-card-label">PROTOCOL_STATUS</div>
                                    <div className="stat-card-value">{selectedSession.status.toUpperCase()}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-label">VERIFIED_ENTITIES</div>
                                    <div className="stat-card-value">{attendanceRecords.length}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-label">SECTOR_LOCATION</div>
                                    <div className="stat-card-value text-xs">{selectedSession.event?.location}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-label">ACTIVATION_TIMESTAMP</div>
                                    <div className="stat-card-value text-xs font-mono">{selectedSession.activated_at?.toDate ? selectedSession.activated_at.toDate().toLocaleTimeString() : ''}</div>
                                </div>
                            </div>

                            {loadingIntel ? (
                                <div className="flex justify-center py-12"><Activity className="animate-spin" /></div>
                            ) : attendanceRecords.length === 0 ? (
                                <div className="text-center py-12 text-dim font-mono text-xs">NO_VERIFICATION_SIGNALS_DETECTED</div>
                            ) : (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Entity Profile</th>
                                                <th>Biometric Uplink (ID/Face)</th>
                                                <th>Verification Time</th>
                                                <th style={{ textAlign: 'right' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceRecords.map(record => (
                                                <tr key={record.id}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-accent-glow flex items-center justify-center font-bold text-accent">
                                                                {record.profile?.full_name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold">{record.profile?.full_name}</div>
                                                                <div className="text-xs text-dim font-mono">{record.profile?.reg_no}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ minWidth: '180px' }}>
                                                        <div className="flex gap-2">
                                                            {record.id_capture_url && (
                                                                <a href={record.id_capture_url} target="_blank" rel="noreferrer" className="relative group">
                                                                    <img src={record.id_capture_url} alt="ID" className="w-12 h-8 object-cover rounded border border-white/10 hover:border-accent transition-colors" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded"><Users size={12} /></div>
                                                                </a>
                                                            )}
                                                            {record.face_capture_url && (
                                                                <a href={record.face_capture_url} target="_blank" rel="noreferrer" className="relative group">
                                                                    <img src={record.face_capture_url} alt="Face" className="w-12 h-8 object-cover rounded border border-white/10 hover:border-accent transition-colors" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded"><Shield size={12} /></div>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="font-mono text-xs">
                                                        {record.verified_at?.toDate ? record.verified_at.toDate().toLocaleTimeString() : ''}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <span className="badge badge-success text-xs">VERIFIED</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setSelectedSession(null)} className="btn btn-secondary">ABORT_INTEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
