import { useState, useEffect } from 'react'
import {
    Activity, Play, Square, ClipboardCheck,
    Calendar, Users, Shield, Clock, BarChart3, Info, X, MapPin, CheckCircle2, AlertCircle
} from 'lucide-react'
import { db } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'
import {
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    doc,
    updateDoc,
    getDoc,
    serverTimestamp,
    orderBy,
    limit
} from 'firebase/firestore'

export default function StaffAttendance() {
    const { user: staffUser } = useAuth()
    const [availableSessions, setAvailableSessions] = useState([])
    const [historicalSessions, setHistoricalSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedSession, setSelectedSession] = useState(null)
    const [attendanceRecords, setAttendanceRecords] = useState([])
    const [loadingIntel, setLoadingIntel] = useState(false)

    useEffect(() => {
        if (!staffUser) return

        const fetchStaffData = async () => {
            setLoading(true)
            try {
                // 1. Fetch Assigned Events
                const qAssignments = query(collection(db, 'staff_assignments'), where('staff_id', '==', staffUser.uid))
                const assignmentsSnap = await getDocs(qAssignments)
                const eventIds = assignmentsSnap.docs.map(doc => doc.data().event_id)

                if (eventIds.length > 0) {
                    // 2. Fetch Sessions - Firestore 'in' query has limits, but here it's fine for small sets
                    const qCurrent = query(collection(db, 'attendance_sessions'), where('event_id', 'in', eventIds), where('status', '!=', 'ended'))
                    const currentSnap = await getDocs(qCurrent)
                    const currentData = await Promise.all(currentSnap.docs.map(async d => {
                        const session = { id: d.id, ...d.data() }
                        const eventSnap = await getDoc(doc(db, 'events', session.event_id))
                        return { ...session, event: eventSnap.exists() ? eventSnap.data() : null }
                    }))
                    setAvailableSessions(currentData)

                    // 3. Historical Reports
                    const qHistory = query(collection(db, 'attendance_sessions'), where('event_id', 'in', eventIds), where('status', '==', 'ended'), orderBy('ended_at', 'desc'), limit(10))
                    const historySnap = await getDocs(qHistory)
                    const historyData = await Promise.all(historySnap.docs.map(async d => {
                        const session = { id: d.id, ...d.data() }
                        const eventSnap = await getDoc(doc(db, 'events', session.event_id))
                        return { ...session, event: eventSnap.exists() ? eventSnap.data() : null }
                    }))
                    setHistoricalSessions(historyData)
                }
            } catch (err) {
                console.error("Fetch data error:", err)
            }
            setLoading(false)
        }

        fetchStaffData()

        const unsubscribe = onSnapshot(collection(db, 'attendance_sessions'), () => {
            fetchStaffData()
        })

        return () => unsubscribe()
    }, [staffUser])

    const activateProtocol = async (sessionId) => {
        try {
            await updateDoc(doc(db, 'attendance_sessions', sessionId), { status: 'active' })
        } catch (err) {
            alert('Critical: Protocol activation failure. ' + err.message)
        }
    }

    const endSession = async (sessionId) => {
        try {
            await updateDoc(doc(db, 'attendance_sessions', sessionId), {
                status: 'ended',
                ended_at: serverTimestamp()
            })
        } catch (err) {
            alert('Critical: Session termination failure. ' + err.message)
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
            console.error("Intel error:", err)
        }
        setLoadingIntel(false)
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Operational Attendance</h1>
                    <p className="page-subtitle">Activate protocols deployed by Admin and manage live verification.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-8)' }}>
                <div>
                    <div className="panel-header" style={{ marginBottom: 'var(--space-4)' }}>Assigned Operational Sectors</div>
                    <div className="flex flex-col gap-4">
                        {availableSessions.length === 0 && !loading && (
                            <div className="card text-center py-12">
                                <Shield size={48} className="mx-auto mb-4 opacity-10" />
                                <p className="text-dim">No deployed attendance protocols detected for your sectors.</p>
                                <p className="text-xs text-dim mt-2">Wait for Administrator to "Open Attendance" for your deployment.</p>
                            </div>
                        )}
                        {availableSessions.map(session => {
                            const isActive = session.status === 'active'
                            const isOpened = session.status === 'opened'
                            return (
                                <div key={session.id} className="card flex justify-between items-center" style={{ borderLeft: isActive ? '4px solid var(--status-ok)' : '4px solid var(--status-warn)' }}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {isActive && <div className="live-dot" />}
                                            <h3 style={{ fontWeight: 800, fontSize: 'var(--font-lg)' }}>{session.event?.name.toUpperCase()}</h3>
                                        </div>
                                        <p className="text-xs text-dim"><Info size={12} className="inline mr-1" />{session.event?.location} | PROTOCOL: {session.status.toUpperCase()}</p>
                                    </div>
                                    <div>
                                        {isActive ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => fetchIntel(session)} className="btn btn-secondary btn-sm">
                                                    <BarChart3 size={14} /> INTEL
                                                </button>
                                                <button onClick={() => endSession(session.id)} className="btn btn-danger btn-sm">
                                                    <Square size={14} /> END SESSION
                                                </button>
                                            </div>
                                        ) : isOpened ? (
                                            <button onClick={() => activateProtocol(session.id)} className="btn btn-primary btn-sm">
                                                <Play size={14} /> ACTIVATE PROTOCOL
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div>
                    <div className="panel-header" style={{ marginBottom: 'var(--space-4)' }}>Sector Reports (History)</div>
                    <div className="card p-0 overflow-hidden">
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Sector</th>
                                        <th>Duration</th>
                                        <th style={{ textAlign: 'right' }}>Intel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historicalSessions.map(s => {
                                        const end = s.ended_at?.toDate ? s.ended_at.toDate() : new Date()
                                        const start = s.activated_at?.toDate ? s.activated_at.toDate() : new Date()
                                        const duration = Math.round((end - start) / 60000)
                                        return (
                                            <tr key={s.id}>
                                                <td>
                                                    <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>{s.event?.name}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{end.toLocaleDateString()}</div>
                                                </td>
                                                <td className="font-mono text-xs">{duration} MIN</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button onClick={() => fetchIntel(s)} className="btn-icon">
                                                        <BarChart3 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {selectedSession && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '900px', border: '1px solid var(--accent)' }}>
                        <div className="modal-header">
                            <div className="flex items-center gap-2">
                                <Activity size={18} color="var(--accent)" />
                                <h2 className="modal-title">SECTOR_INTEL: {selectedSession.event?.name}</h2>
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
                            <button onClick={() => setSelectedSession(null)} className="btn btn-secondary">CLOSE_INTEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
