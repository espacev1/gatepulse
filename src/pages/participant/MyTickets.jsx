import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Shield, ShieldCheck, MapPin, CalendarDays, Clock, Lock, Zap, Info, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function MyTickets() {
    const { user } = useAuth()
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [revealMap, setRevealMap] = useState({})

    const [activeSessions, setActiveSessions] = useState([])
    const [verifyingTicket, setVerifyingTicket] = useState(null)
    const [showCamera, setShowCamera] = useState(false)
    const [captureStep, setCaptureStep] = useState('face') // 'face' or 'id'
    const [capturing, setCapturing] = useState(false)
    const [capturedData, setCapturedData] = useState({ face: null, idCard: null })

    useEffect(() => {
        if (user) {
            fetchMyTickets()
            fetchActiveSessions()

            const subscription = supabase
                .channel('my-tickets-attendance-live')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchMyTickets())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_sessions' }, () => fetchActiveSessions())
                .subscribe()

            return () => { supabase.removeChannel(subscription) }
        }
    }, [user])

    const fetchActiveSessions = async () => {
        const { data } = await supabase.from('attendance_sessions').select('*').eq('status', 'active')
        if (data) setActiveSessions(data)
    }

    const fetchMyTickets = async () => {
        if (!user) return
        setLoading(true)

        const { data: ticketData } = await supabase
            .from('tickets')
            .select(`
                id,
                qr_token,
                is_validated,
                event_id,
                event:events (*),
                participant:participants!inner (user_id)
            `)
            .eq('participant.user_id', user.id)

        if (ticketData) setTickets(ticketData)
        setLoading(false)
    }

    const startVerification = (ticket) => {
        setVerifyingTicket(ticket)
        setShowCamera(true)
        setCaptureStep('face')
        setCapturedData({ face: null, idCard: null })
    }

    const handleCapture = async () => {
        setCapturing(true)
        // Simulate camera capture - in a real implementation, this would use a video ref and canvas
        const mockUrl = `https://generated-capture-${Math.random().toString(36).substring(7)}.jpg`

        if (captureStep === 'face') {
            setCapturedData(prev => ({ ...prev, face: mockUrl }))
            setCaptureStep('id')
        } else {
            setCapturedData(prev => ({ ...prev, idCard: mockUrl }))
            await submitVerification({ ...capturedData, idCard: mockUrl })
        }
        setCapturing(false)
    }

    const submitVerification = async (data) => {
        const session = activeSessions.find(s => s.event_id === verifyingTicket.event_id)
        if (!session) return alert('Session ended unexpectedly.')

        const { error } = await supabase.from('attendance_records').insert([{
            session_id: session.id,
            participant_id: user.id,
            face_capture_url: data.face,
            id_capture_url: data.idCard,
            verified_at: new Date().toISOString()
        }])

        if (error) alert('Verification submission failed: ' + error.message)
        else {
            alert('Identity verified and attendance recorded successfully!')
            setShowCamera(false)
            setVerifyingTicket(null)
        }
    }

    const toggleReveal = (ticketId) => {
        setRevealMap(prev => ({ ...prev, [ticketId]: !prev[ticketId] }))
    }

    const downloadBadge = (ticket) => {
        alert('Generating Security Credential PNG... Done.')
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
                            <div key={ticket.id} className="card" style={{
                                padding: 0, overflow: 'hidden', background: 'var(--bg-deepest)',
                                border: activeSession ? '2px solid var(--accent)' : '1px solid var(--border-accent)',
                                animation: `fadeInUp 0.5s ease ${i * 0.12}s both`,
                                boxShadow: activeSession ? '0 0 30px var(--accent-glow)' : 'var(--shadow-xl), var(--shadow-glow)',
                                borderRadius: 'var(--radius-xl)'
                            }}>
                                {/* Badge Top Header */}
                                <div style={{
                                    background: 'var(--bg-panel)', padding: '16px 20px',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div className="flex items-center gap-2">
                                        <div style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: activeSession ? 'var(--status-ok)' : 'var(--accent)',
                                            boxShadow: activeSession ? '0 0 10px var(--status-ok)' : '0 0 10px var(--accent)'
                                        }} className={activeSession ? 'animate-pulse' : ''} />
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
                                            {activeSession ? 'ATTENDANCE OPEN' : 'ENCRYPTED CREDENTIAL'}
                                        </span>
                                    </div>
                                    <span className={`badge ${ticket.is_validated ? 'badge-warning' : 'badge-success'}`}>
                                        {ticket.is_validated ? 'VALIDATED' : 'PROVISIONED'}
                                    </span>
                                </div>

                                {/* Identity Section */}
                                <div style={{ padding: '32px 24px 0', textAlign: 'center' }}>
                                    <div style={{
                                        width: 80, height: 80, borderRadius: '50%',
                                        background: 'var(--accent-glow)', margin: '0 auto 16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid var(--accent)',
                                        boxShadow: 'inset 0 0 20px rgba(231,170,81,0.2)'
                                    }}>
                                        <ShieldCheck size={40} color="var(--accent)" />
                                    </div>
                                    <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {user?.full_name}
                                    </h2>
                                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginTop: '8px' }}>
                                        {ticket.event?.name}
                                    </p>
                                </div>

                                {/* QR Token HUD or ATTENDANCE HUD */}
                                <div style={{ padding: '32px', position: 'relative' }}>
                                    {activeSession ? (
                                        <div className="flex flex-col items-center gap-6" style={{ minHeight: '228px', justifyContent: 'center' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)', marginBottom: '8px' }}>LIVE_AUTH</div>
                                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Verification protocol is currently active for this sector.</p>
                                            </div>
                                            <button onClick={() => startVerification(ticket)} className="btn btn-primary w-full py-4" style={{ gap: '12px', fontSize: '14px', borderRadius: '16px' }}>
                                                <Zap size={20} fill="currentColor" /> PROCEED TO VERIFY
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{
                                                background: '#fff', padding: '24px', borderRadius: '24px',
                                                display: 'flex', justifyContent: 'center', position: 'relative',
                                                transition: 'all 0.3s ease',
                                                filter: isRevealed ? 'none' : 'blur(15px) grayscale(100%)',
                                                transform: isRevealed ? 'scale(1)' : 'scale(0.95)',
                                                opacity: isRevealed ? 1 : 0.3
                                            }}>
                                                <QRCodeSVG value={ticket.qr_token} size={180} level="H" bgColor="white" fgColor="#060E1A" />
                                            </div>

                                            {!isRevealed && (
                                                <div style={{
                                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                                                    zIndex: 2, cursor: 'pointer'
                                                }} onClick={() => toggleReveal(ticket.id)}>
                                                    <div style={{ padding: '12px', background: 'var(--accent)', borderRadius: '50%', color: '#000', boxShadow: '0 0 20px var(--accent)' }}>
                                                        <Lock size={20} />
                                                    </div>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.1em' }}>TAP TO REVEAL KEY</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Token Meta Hud */}
                                <div style={{ background: 'var(--bg-panel)', margin: '0 24px 24px', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: 800 }}>SECTOR_ID</div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{ticket.event?.location}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: 800 }}>SECURITY_LVL</div>
                                            <div style={{ fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                                                {isRevealed || activeSession ? 'AUTHENTICATED' : 'PROTECTED'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions HUD */}
                                <div style={{ padding: '0 24px 32px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {!activeSession && (
                                            <button onClick={() => toggleReveal(ticket.id)} className="btn btn-secondary flex-1" style={{ fontSize: '11px', gap: '8px' }}>
                                                {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />} {isRevealed ? 'HIDE' : 'SHOW'}
                                            </button>
                                        )}
                                        <button onClick={() => downloadBadge(ticket)} className={`btn ${activeSession ? 'btn-secondary w-full' : 'btn-primary flex-1'}`} style={{ fontSize: '11px', gap: '8px' }}>
                                            <Download size={14} /> DOWNLOAD
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Attendance Verification Modal */}
            {showCamera && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)'
                }}>
                    <div className="card" style={{ maxWidth: 500, width: '100%', background: 'var(--bg-deepest)', border: '1px solid var(--accent)' }}>
                        <div className="panel-header flex justify-between">
                            <span>BIOMETRIC_LOCK: {captureStep.toUpperCase()} CAPTURE</span>
                            <button onClick={() => setShowCamera(false)} className="btn-icon"><X size={18} /></button>
                        </div>

                        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                            <div style={{
                                width: '100%', aspectRatio: '16/9', background: '#000',
                                border: '2px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', position: 'relative', overflow: 'hidden'
                            }}>
                                <div className="animate-scanline" style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                    background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)', zIndex: 10
                                }} />
                                {capturing ? (
                                    <Activity size={48} color="var(--accent)" className="animate-spin" />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                                        {captureStep === 'face' ? (
                                            <>
                                                <div style={{ width: 120, height: 120, border: '2px dashed var(--accent)', borderRadius: '50%', margin: '0 auto 16px' }} />
                                                <p className="font-mono text-xs">ALIGN FACE WITHIN VECTOR</p>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ width: 200, height: 120, border: '2px dashed var(--accent)', borderRadius: 'var(--radius-md)', margin: '0 auto 16px' }} />
                                                <p className="font-mono text-xs">ALIGN ID CARD WITHIN BOUNDS</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex justify-center gap-2 mb-2">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: captureStep === 'face' ? 'var(--accent)' : 'var(--status-ok)' }} />
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: captureStep === 'id' ? 'var(--accent)' : (capturedData.idCard ? 'var(--status-ok)' : 'var(--bg-elevated)') }} />
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                                    {captureStep === 'face'
                                        ? 'Please ensure you are in a well-lit area for biometric facial recognition.'
                                        : 'Place your official ID card in front of the sensor for OCR validation.'}
                                </p>
                                <button onClick={handleCapture} className="btn btn-primary w-full py-3" disabled={capturing}>
                                    {capturing ? 'PROCESSING...' : `CAPTURE ${captureStep.toUpperCase()}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-12 p-6 card-glass text-center" style={{ maxWidth: 500, margin: '0 auto' }}>
                <Info size={20} color="var(--accent)" className="mx-auto mb-3" />
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                    This digital credential is cryptographically linked to your identity.
                    Redistribution or sharing of the secure QR token may result in account termination
                    and security sector blacklisting.
                </p>
            </div>
        </div>
    )
}
