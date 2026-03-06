import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, MapPin, Camera, Zap, X, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function ParticipantAttendance() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [activeSessions, setActiveSessions] = useState([])
    const [myTickets, setMyTickets] = useState([])
    const [attendanceRecords, setAttendanceRecords] = useState([])
    const [userLocation, setUserLocation] = useState(null)
    const [gpsStatus, setGpsStatus] = useState('offline')
    const [verifying, setVerifying] = useState(null) // ticket being verified
    const [captureStep, setCaptureStep] = useState('face') // face -> id -> match
    const [capturedData, setCapturedData] = useState({ face: null, idCard: null, faceUrl: null, idUrl: null })
    const [showCamera, setShowCamera] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [profileData, setProfileData] = useState(null)

    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const heartbeatRef = useRef(null)

    useEffect(() => {
        if (user) {
            loadData()
            loadProfile()

            const channel = supabase
                .channel('participant-attendance-live')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_sessions' }, () => loadData())
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_records' }, () => loadData())
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
                stopCamera()
                if (heartbeatRef.current) clearInterval(heartbeatRef.current)
            }
        }
    }, [user])

    // Heartbeat: sync location every 30s for monitoring
    useEffect(() => {
        if (myTickets.some(t => t.is_validated) && navigator.geolocation) {
            const sync = () => {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords
                    const ids = myTickets.filter(t => t.is_validated && t.participant_id).map(t => t.participant_id)
                    if (ids.length > 0) {
                        await supabase.from('participants').update({
                            last_lat: lat, last_lng: lng, last_seen_at: new Date().toISOString()
                        }).in('id', ids)
                    }
                }, null, { enableHighAccuracy: true })
            }
            sync()
            heartbeatRef.current = setInterval(sync, 30000)
        }
        return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current) }
    }, [myTickets])

    const loadData = async () => {
        setLoading(true)
        const [sessionsRes, ticketsRes, recordsRes] = await Promise.all([
            supabase.from('attendance_sessions').select('*').in('status', ['opened', 'active']),
            supabase.from('tickets').select('*, event:events(*)').order('created_at', { ascending: false }),
            supabase.from('attendance_records').select('*').eq('participant_id', user?.id)
        ])
        if (sessionsRes.data) setActiveSessions(sessionsRes.data)
        if (ticketsRes.data) setMyTickets(ticketsRes.data)
        if (recordsRes.data) setAttendanceRecords(recordsRes.data)
        setLoading(false)
    }

    const loadProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
        if (data) setProfileData(data)
    }

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3
        const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180
        const dp = (lat2 - lat1) * Math.PI / 180, dl = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    const requestLocation = () => {
        if (!navigator.geolocation) { alert('GPS not available on this device.'); return }
        setGpsStatus('acquiring')
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setGpsStatus('live')
            },
            () => {
                setGpsStatus('error')
                alert('Location access is MANDATORY for attendance verification. Please enable location services.')
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const startVerification = (ticket, session) => {
        if (gpsStatus !== 'live') {
            alert('Please enable GPS first by clicking the "Enable GPS" button.')
            return
        }
        setVerifying({ ticket, session })
        setCaptureStep('face')
        setCapturedData({ face: null, idCard: null, faceUrl: null, idUrl: null })
        setShowCamera(true)
        startCamera()
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
            streamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
        } catch (err) {
            alert('Camera access failed. Please grant camera permission.')
            setShowCamera(false)
        }
    }

    const stopCamera = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
    }

    const handleCapture = () => {
        const video = videoRef.current, canvas = canvasRef.current
        if (!video || !canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            if (captureStep === 'face') {
                setCapturedData(prev => ({ ...prev, face: blob, faceUrl: url }))
                setCaptureStep('id')
            } else {
                setCapturedData(prev => ({ ...prev, idCard: blob, idUrl: url }))
                setCaptureStep('match')
                stopCamera()
            }
        }, 'image/jpeg', 0.8)
    }

    const submitAttendance = async () => {
        if (!verifying || !capturedData.face || !capturedData.idCard) return
        setSubmitting(true)
        try {
            const { session } = verifying

            // 1. Proximity check (10m boundary)
            if (session.staff_lat && session.staff_lng) {
                const dist = getDistance(userLocation.lat, userLocation.lng, session.staff_lat, session.staff_lng)
                if (dist > 10) throw new Error(`PROXIMITY ERROR: You are ${dist.toFixed(1)}m away. Please approach within 10m of the staff checkpoint.`)
            } else {
                throw new Error('Staff GPS not available yet. Please wait for the staff device to broadcast its location.')
            }

            // 2. Upload captures
            const facePath = `verification/face-${Date.now()}-${user.email}.jpg`
            const idPath = `verification/id-${Date.now()}-${user.email}.jpg`
            const [faceUp, idUp] = await Promise.all([
                supabase.storage.from('face-verification').upload(facePath, capturedData.face),
                supabase.storage.from('id-barcodes').upload(idPath, capturedData.idCard)
            ])
            if (faceUp.error) throw faceUp.error
            if (idUp.error) throw idUp.error

            const faceUrl = supabase.storage.from('face-verification').getPublicUrl(facePath).data.publicUrl
            const idUrl = supabase.storage.from('id-barcodes').getPublicUrl(idPath).data.publicUrl

            // 3. Create attendance record
            const { error } = await supabase.from('attendance_records').insert([{
                session_id: session.id,
                participant_id: user.id,
                face_capture_url: faceUrl,
                id_capture_url: idUrl,
                verified_at: new Date().toISOString()
            }])
            if (error) throw error

            alert('✅ Attendance marked successfully!')
            cancelVerification()
            loadData()
        } catch (err) {
            alert('❌ ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const cancelVerification = () => {
        stopCamera()
        setVerifying(null)
        setShowCamera(false)
        setCaptureStep('face')
        setCapturedData({ face: null, idCard: null, faceUrl: null, idUrl: null })
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="flex items-center justify-center h-64 text-dim font-mono">LOADING ATTENDANCE DATA...</div>
            </div>
        )
    }

    // Build list of events with active sessions
    const attendableEvents = myTickets
        .map(ticket => {
            const session = activeSessions.find(s => s.event_id === ticket.event_id)
            const alreadyMarked = attendanceRecords.some(r => r.session_id === session?.id)
            return { ticket, session, alreadyMarked }
        })
        .filter(item => item.session) // Only show events that have an active attendance session

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance Verification</h1>
                    <p className="page-subtitle">Mark your attendance using biometric + proximity verification.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={requestLocation}
                        className={`btn ${gpsStatus === 'live' ? 'btn-success' : 'btn-primary'} btn-sm`}
                        style={{
                            gap: '8px',
                            background: gpsStatus === 'live' ? 'var(--status-ok)' : gpsStatus === 'error' ? 'var(--status-critical)' : undefined,
                            color: gpsStatus === 'live' || gpsStatus === 'error' ? '#000' : undefined
                        }}
                    >
                        <MapPin size={14} />
                        {gpsStatus === 'offline' ? 'ENABLE GPS' : gpsStatus === 'acquiring' ? 'ACQUIRING...' : gpsStatus === 'live' ? 'GPS ACTIVE' : 'GPS ERROR - RETRY'}
                    </button>
                </div>
            </div>

            {/* No active sessions */}
            {attendableEvents.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
                    <ShieldCheck size={64} style={{ margin: '0 auto 16px', opacity: 0.1, color: 'var(--accent)' }} />
                    <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        NO ACTIVE ATTENDANCE SESSIONS
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: 'var(--font-sm)' }}>
                        No attendance protocol is currently active for your registered events. Please wait for the operational staff to activate a session.
                    </p>
                </div>
            )}

            {/* Attendable Events */}
            <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
                {attendableEvents.map(({ ticket, session, alreadyMarked }) => (
                    <div key={ticket.id} className="card" style={{
                        borderLeft: alreadyMarked ? '4px solid var(--status-ok)' : '4px solid var(--accent)',
                        padding: 'var(--space-6)'
                    }}>
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: alreadyMarked ? 'var(--status-ok)' : 'var(--accent)',
                                        boxShadow: `0 0 8px ${alreadyMarked ? 'var(--status-ok)' : 'var(--accent)'}`
                                    }} className={alreadyMarked ? '' : 'animate-pulse'} />
                                    <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--text-dim)' }}>
                                        {alreadyMarked ? 'ATTENDANCE_RECORDED' : 'VERIFICATION_REQUIRED'}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {ticket.event?.name?.toUpperCase()}
                                </h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                                    <MapPin size={12} className="inline mr-1" />{ticket.event?.location}
                                </p>
                            </div>
                            <div>
                                {alreadyMarked ? (
                                    <div className="badge badge-success" style={{ padding: '10px 20px', fontSize: '12px', gap: '8px' }}>
                                        <CheckCircle2 size={16} /> VERIFIED
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => startVerification(ticket, session)}
                                        className="btn btn-primary"
                                        style={{ gap: '8px', fontSize: '13px', padding: '12px 24px', borderRadius: '16px' }}
                                    >
                                        <Zap size={18} fill="currentColor" /> MARK ATTENDANCE
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Verification Modal */}
            {showCamera && verifying && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="card" style={{
                        width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto',
                        background: 'var(--bg-deepest)', border: '2px solid var(--accent)',
                        borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)'
                    }}>
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 style={{ fontWeight: 900, fontSize: 'var(--font-lg)', color: 'var(--accent)' }}>
                                    {captureStep === 'face' ? 'STEP 1: FACE CAPTURE' :
                                        captureStep === 'id' ? 'STEP 2: ID CARD CAPTURE' :
                                            'STEP 3: IDENTITY MATCH'}
                                </h3>
                                <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                                    {verifying.ticket.event?.name}
                                </p>
                            </div>
                            <button onClick={cancelVerification} className="btn-icon">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex gap-2 mb-6">
                            {['face', 'id', 'match'].map((step, i) => (
                                <div key={step} style={{
                                    flex: 1, height: 4, borderRadius: 2,
                                    background: ['face', 'id', 'match'].indexOf(captureStep) >= i ? 'var(--accent)' : 'var(--border-color)'
                                }} />
                            ))}
                        </div>

                        {/* Camera View (face & id steps) */}
                        {(captureStep === 'face' || captureStep === 'id') && (
                            <div>
                                <div style={{
                                    position: 'relative', borderRadius: 'var(--radius-lg)',
                                    overflow: 'hidden', background: '#000', marginBottom: '16px'
                                }}>
                                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', minHeight: 300 }} />
                                    <div style={{
                                        position: 'absolute', top: 10, left: 10,
                                        padding: '4px 12px', background: 'rgba(0,0,0,0.7)',
                                        borderRadius: '8px', fontSize: '10px', fontWeight: 800,
                                        color: captureStep === 'face' ? 'var(--accent)' : 'var(--status-ok)',
                                        letterSpacing: '0.1em'
                                    }}>
                                        {captureStep === 'face' ? '📸 FACE CAPTURE' : '🪪 ID CARD CAPTURE'}
                                    </div>
                                </div>
                                <button onClick={handleCapture} className="btn btn-primary w-full" style={{ padding: '14px', fontSize: '14px', borderRadius: '16px', gap: '8px' }}>
                                    <Camera size={18} /> CAPTURE {captureStep === 'face' ? 'FACE' : 'ID CARD'}
                                </button>
                            </div>
                        )}

                        {/* Match Confirmation (step 3) */}
                        {captureStep === 'match' && (
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '16px', textAlign: 'center' }}>
                                    Compare your captured data with your profile. If they match, confirm and mark attendance.
                                </p>

                                {/* Side-by-side comparison */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                    {/* Live captures */}
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)', marginBottom: '8px', letterSpacing: '0.1em' }}>
                                            LIVE CAPTURE
                                        </div>
                                        {capturedData.faceUrl && (
                                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--accent)', marginBottom: '8px' }}>
                                                <img src={capturedData.faceUrl} alt="Face" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        {capturedData.idUrl && (
                                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--accent)' }}>
                                                <img src={capturedData.idUrl} alt="ID" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                                            </div>
                                        )}
                                    </div>
                                    {/* Profile data */}
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--status-ok)', marginBottom: '8px', letterSpacing: '0.1em' }}>
                                            PROFILE DATA
                                        </div>
                                        {profileData?.face_url ? (
                                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--status-ok)', marginBottom: '8px' }}>
                                                <img src={profileData.face_url} alt="Profile Face" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                                            </div>
                                        ) : (
                                            <div style={{ height: 120, borderRadius: '12px', background: 'var(--bg-panel)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>No profile face</span>
                                            </div>
                                        )}
                                        <div style={{
                                            borderRadius: '12px', padding: '12px',
                                            background: 'var(--bg-panel)', border: '1px solid var(--border-color)',
                                            height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center'
                                        }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px' }}>NAME</div>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{profileData?.full_name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '8px' }}>REG / DEPT</div>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{profileData?.reg_no || 'N/A'} / {profileData?.dept || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* GPS & Distance Info */}
                                <div className="card" style={{ padding: '12px 16px', marginBottom: '16px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} color="var(--accent)" />
                                        <div>
                                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)' }}>PROXIMITY STATUS</div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: gpsStatus === 'live' ? 'var(--status-ok)' : 'var(--status-critical)' }}>
                                                {gpsStatus === 'live' ? 'GPS LOCKED — READY' : 'GPS NOT AVAILABLE'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button onClick={cancelVerification} className="btn btn-secondary flex-1" style={{ padding: '14px' }}>
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={submitAttendance}
                                        disabled={submitting}
                                        className="btn btn-primary flex-1"
                                        style={{ padding: '14px', fontSize: '14px', gap: '8px', borderRadius: '16px' }}
                                    >
                                        {submitting ? (
                                            <><Activity size={16} className="animate-pulse" /> VERIFYING...</>
                                        ) : (
                                            <><ShieldCheck size={18} /> CONFIRM & MARK ATTENDANCE</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Hidden canvas for captures */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    )
}
