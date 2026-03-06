import { useRef, useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Shield, ShieldCheck, MapPin, CalendarDays, Clock, Lock, Zap, Info, Eye, EyeOff, X, Camera, RefreshCw, AlertCircle, Activity } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { db, storage } from '../../lib/firebase'
import {
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    doc,
    getDoc,
    addDoc,
    serverTimestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function MyTickets() {
    const { user } = useAuth()
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [revealMap, setRevealMap] = useState({})

    const [activeSessions, setActiveSessions] = useState([])
    const [verifyingTicket, setVerifyingTicket] = useState(null)
    const [showCamera, setShowCamera] = useState(false)
    const [captureStep, setCaptureStep] = useState('face')
    const [capturing, setCapturing] = useState(false)
    const [capturedData, setCapturedData] = useState({ face: null, idCard: null })
    const [cameraError, setCameraError] = useState(null)
    const videoRef = useRef(null)
    const streamRef = useRef(null)

    useEffect(() => {
        if (!user) return

        // Live subscription to active sessions
        const qSessions = query(collection(db, 'attendance_sessions'), where('status', '==', 'active'))
        const unsubscribeSessions = onSnapshot(qSessions, (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setActiveSessions(sessions)
        })

        fetchMyTickets()

        return () => unsubscribeSessions()
    }, [user])

    const fetchMyTickets = async () => {
        if (!user) return
        setLoading(true)

        try {
            // 1. Fetch participants (registrations)
            const q = query(collection(db, 'participants'), where('user_id', '==', user.uid))
            const snapshot = await getDocs(q)
            const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

            // 2. Resolve event details for each registration
            const ticketData = await Promise.all(registrations.map(async (reg) => {
                const eventSnap = await getDoc(doc(db, 'events', reg.event_id))
                return {
                    ...reg,
                    event: eventSnap.exists() ? { id: eventSnap.id, ...eventSnap.data() } : null,
                    // For now, using participant ID as part of QR token or reg ID
                    qr_token: reg.qr_token || `GP-${reg.id.slice(0, 8)}`,
                    is_validated: reg.registration_status === 'validated'
                }
            }))

            setTickets(ticketData.filter(t => t.event))
        } catch (err) {
            console.error("Error fetching tickets:", err)
        } finally {
            setLoading(false)
        }
    }

    const startCamera = async () => {
        try {
            setCameraError(null)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: captureStep === 'face' ? 'user' : 'environment' }
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                streamRef.current = stream
            }
        } catch (err) {
            console.error('Camera access error:', err)
            setCameraError('CAMERA_UPLINK_FAILED: ' + err.message)
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
    }

    const startVerification = (ticket) => {
        setVerifyingTicket(ticket)
        setShowCamera(true)
        setCaptureStep('face')
        setCapturedData({ face: null, idCard: null })
        setTimeout(startCamera, 100)
    }

    const handleCloseCamera = () => {
        stopCamera()
        setShowCamera(false)
        setVerifyingTicket(null)
    }

    const handleCapture = async () => {
        if (!videoRef.current) return
        setCapturing(true)

        try {
            const canvas = document.createElement('canvas')
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            const ctx = canvas.getContext('2d')
            ctx.drawImage(videoRef.current, 0, 0)

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8))
            const fileName = `${user.uid}-${Date.now()}.jpg`
            const folder = captureStep === 'face' ? 'face-verification' : 'id-barcodes'

            // Firebase Storage Upload
            const storageRef = ref(storage, `${folder}/${fileName}`)
            await uploadBytes(storageRef, blob)
            const downloadUrl = await getDownloadURL(storageRef)

            if (captureStep === 'face') {
                setCapturedData(prev => ({ ...prev, face: downloadUrl }))
                stopCamera()
                setCaptureStep('id')
                setTimeout(startCamera, 100)
            } else {
                const finalData = { ...capturedData, idCard: downloadUrl }
                setCapturedData(finalData)
                await submitVerification(finalData)
            }
        } catch (err) {
            alert('CAPTURE_ERROR: ' + err.message)
        } finally {
            setCapturing(false)
        }
    }

    const submitVerification = async (data) => {
        const session = activeSessions.find(s => s.event_id === verifyingTicket.event_id)
        if (!session) {
            alert('Session ended unexpectedly.')
            handleCloseCamera()
            return
        }

        try {
            await addDoc(collection(db, 'attendance_records'), {
                session_id: session.id,
                user_id: user.uid,
                participant_id: user.uid, // Unified ID in Firebase
                face_capture_url: data.face,
                id_capture_url: data.idCard,
                verified_at: serverTimestamp()
            })
            alert('IDENTITY_VERIFIED: Attendance recorded for sector.')
            handleCloseCamera()
        } catch (err) {
            alert('Verification submission failed: ' + err.message)
        }
    }

    const toggleReveal = (ticketId) => {
        setRevealMap(prev => ({ ...prev, [ticketId]: !prev[ticketId] }))
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="flex items-center justify-center h-64 text-dim font-mono">
                    PROBING SECURE SECTORS...
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Identity Credentials</h1>
                    <p className="page-subtitle">Encrypted access tokens for authorized event entry.</p>
                </div>
                <div className="badge badge-primary">ACTIVE SECTOR: {tickets.length}</div>
            </div>

            {tickets.length === 0 ? (
                <div className="empty-state">
                    <Shield size={48} style={{ opacity: 0.1, margin: '0 auto var(--space-4)' }} />
                    <div className="empty-state-title">NO CREDENTIALS FOUND</div>
                    <p>Access level verification pending. Register for an event to provision tokens.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-12)' }}>
                    {tickets.map((ticket, i) => {
                        const isRevealed = revealMap[ticket.id];
                        const activeSession = activeSessions.find(s => s.event_id === ticket.event_id);
                        return (
                            <div key={ticket.id} className="card p-0 overflow-hidden" style={{
                                background: 'var(--bg-deepest)',
                                border: activeSession ? '2px solid var(--accent)' : '1px solid var(--border-accent)',
                                animation: `fadeInUp 0.5s ease ${i * 0.12}s both`,
                                boxShadow: activeSession ? '0 0 30px var(--accent-glow)' : 'var(--shadow-xl), var(--shadow-glow)',
                                borderRadius: 'var(--radius-xl)'
                            }}>
                                <div style={{ background: 'var(--bg-panel)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="flex items-center gap-2">
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: activeSession ? 'var(--status-ok)' : 'var(--accent)', boxShadow: activeSession ? '0 0 10px var(--status-ok)' : '0 0 10px var(--accent)' }} className={activeSession ? 'animate-pulse' : ''} />
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
                                            {activeSession ? 'ATTENDANCE OPEN' : 'ENCRYPTED CREDENTIAL'}
                                        </span>
                                    </div>
                                    <span className={`badge ${ticket.is_validated ? 'badge-warning' : 'badge-success'}`}>
                                        {ticket.is_validated ? 'VALIDATED' : 'PROVISIONED'}
                                    </span>
                                </div>

                                <div style={{ padding: '32px 24px 0', textAlign: 'center' }}>
                                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-glow)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent)', boxShadow: 'inset 0 0 20px rgba(231,170,81,0.2)' }}>
                                        <ShieldCheck size={40} color="var(--accent)" />
                                    </div>
                                    <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.full_name}</h2>
                                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginTop: '8px' }}>{ticket.event?.name}</p>
                                </div>

                                <div style={{ padding: '32px', position: 'relative' }}>
                                    {activeSession ? (
                                        <div className="flex flex-col items-center gap-6" style={{ minHeight: '228px', justifyContent: 'center' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)', marginBottom: '8px' }}>LIVE_AUTH</div>
                                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Verification protocol is active.</p>
                                            </div>
                                            <button onClick={() => startVerification(ticket)} className="btn btn-primary w-full py-4" style={{ gap: '12px', fontSize: '14px', borderRadius: '16px' }}>
                                                <Zap size={20} fill="currentColor" /> PROCEED TO VERIFY
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', display: 'flex', justifyContent: 'center', position: 'relative', transition: 'all 0.3s ease', filter: isRevealed ? 'none' : 'blur(15px) grayscale(100%)', transform: isRevealed ? 'scale(1)' : 'scale(0.95)', opacity: isRevealed ? 1 : 0.3 }}>
                                                <QRCodeSVG value={ticket.qr_token} size={180} level="H" bgColor="white" fgColor="#060E1A" />
                                            </div>
                                            {!isRevealed && (
                                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 2, cursor: 'pointer' }} onClick={() => toggleReveal(ticket.id)}>
                                                    <div style={{ padding: '12px', background: 'var(--accent)', borderRadius: '50%', color: '#000', boxShadow: '0 0 20px var(--accent)' }}><Lock size={20} /></div>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.1em' }}>TAP TO REVEAL KEY</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div style={{ background: 'var(--bg-panel)', margin: '0 24px 24px', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: 800 }}>SECTOR_ID</div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{ticket.event?.location}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: 800 }}>SECURITY_LVL</div>
                                            <div style={{ fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{isRevealed || activeSession ? 'AUTHENTICATED' : 'PROTECTED'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '0 24px 32px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {!activeSession && (
                                            <button onClick={() => toggleReveal(ticket.id)} className="btn btn-secondary flex-1 text-xs gap-2">
                                                {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />} {isRevealed ? 'HIDE' : 'SHOW'}
                                            </button>
                                        )}
                                        <button className={`btn ${activeSession ? 'btn-secondary w-full' : 'btn-primary flex-1'} text-xs gap-2`}>
                                            <Download size={14} /> DOWNLOAD
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showCamera && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', backdropFilter: 'blur(10px)' }}>
                    <div className="card" style={{ maxWidth: 500, width: '100%', background: 'var(--bg-deepest)', border: '1px solid var(--accent)' }}>
                        <div className="panel-header flex justify-between">
                            <span className="flex items-center gap-2"><Shield size={16} color="var(--accent)" /> BIOMETRIC_LOCK: {captureStep.toUpperCase()} CAPTURE</span>
                            <button onClick={handleCloseCamera} className="btn-icon"><X size={18} /></button>
                        </div>
                        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                            <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div className="animate-scanline" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)', zIndex: 10 }} />
                                {cameraError && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 20 }}>
                                        <AlertCircle size={32} color="var(--status-critical)" className="mb-2" />
                                        <p style={{ fontSize: '10px', color: 'var(--status-critical)' }}>{cameraError}</p>
                                        <button onClick={startCamera} className="btn btn-secondary btn-xs mt-4"><RefreshCw size={12} /> RETRY_UPLINK</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-center gap-2 mb-2">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: captureStep === 'face' ? 'var(--accent)' : 'var(--status-ok)' }} />
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: captureStep === 'id' ? 'var(--accent)' : (capturedData.idCard ? 'var(--status-ok)' : 'var(--bg-elevated)') }} />
                                </div>
                                <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {captureStep === 'face' ? 'PROVISIONAL FACIAL SCAN: Align features.' : 'OCR_ID_VERIFICATION: Place legal identifier.'}
                                </p>
                                <button onClick={handleCapture} className="btn btn-primary w-full py-4 text-sm" disabled={capturing || !!cameraError}>
                                    {capturing ? <span className="flex items-center gap-2"><Activity size={16} className="animate-spin" /> ANALYZING_BIOMETRICS...</span> : <span className="flex items-center gap-2"><Camera size={18} /> INITIALIZE_CAPTURE</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
