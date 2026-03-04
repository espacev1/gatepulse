import { useState, useEffect, useRef } from 'react'
import {
    Camera, Keyboard, ArrowLeft, Calendar, Users,
    ChevronRight, ScanLine, CheckCircle2, XCircle,
    ShieldCheck, AlertTriangle, Activity
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function StaffScanner() {
    const { user: staffUser } = useAuth()
    const [recentScans, setRecentScans] = useState([])
    const [dashView, setDashView] = useState('events')
    const [events, setEvents] = useState([])
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [participants, setParticipants] = useState([])
    const [selectedParticipant, setSelectedParticipant] = useState(null)
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState('camera')
    const [manualCode, setManualCode] = useState('')
    const [scanResult, setScanResult] = useState(null)
    const [scanning, setScanning] = useState(false)
    const [validatedTickets, setValidatedTickets] = useState(new Set())
    const html5QrRef = useRef(null)

    // Load initial data
    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        const [ticketsRes, eventsRes] = await Promise.all([
            supabase.from('tickets').select('qr_token').eq('is_validated', true),
            supabase.from('events').select('*').order('created_at', { ascending: false })
        ])

        if (ticketsRes.data) setValidatedTickets(new Set(ticketsRes.data.map(t => t.qr_token)))
        if (eventsRes.data) setEvents(eventsRes.data)
        setLoading(false)
    }

    const fetchParticipants = async (eventId) => {
        setLoading(true)
        const { data, error } = await supabase
            .from('participants')
            .select(`
                *,
                profiles:user_id (*)
            `)
            .eq('event_id', eventId)

        if (error) {
            console.error('Fetch error:', error)
            setParticipants([])
        } else {
            setParticipants(data || [])
        }
        setLoading(false)
    }

    const handleEventSelect = (event) => {
        setSelectedEvent(event)
        fetchParticipants(event.id)
        setDashView('participants')
    }

    const handleParticipantSelect = (participant) => {
        setSelectedParticipant(participant)
        setDashView('scanner')
        setScanResult(null)
    }

    const startCamera = async () => {
        setScanning(true)
        setScanResult(null)
        try {
            const { Html5Qrcode } = await import('html5-qrcode')

            // Check for cameras first to give better error messages
            const devices = await Html5Qrcode.getCameras().catch(() => []);
            if (devices.length === 0) {
                setScanning(false)
                setScanResult({ status: 'error', message: 'No camera hardware detected on this device.' })
                return;
            }

            const scanner = new Html5Qrcode('qr-reader')
            html5QrRef.current = scanner
            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    handleScan(decodedText)
                    stopCamera()
                },
                (errorMessage) => {
                    // Silent retry for scanning frames
                }
            ).catch(err => {
                setScanning(false)
                const msg = err?.message || err || 'Check hardware permissions';
                setScanResult({ status: 'error', message: `Sensor failure: ${msg}` })
            })
        } catch (err) {
            setScanning(false)
            setScanResult({ status: 'error', message: 'Sensor initialization failure. Critical system error.' })
        }
    }

    const stopCamera = async () => {
        if (html5QrRef.current) {
            try { await html5QrRef.current.stop() } catch { }
            html5QrRef.current = null
        }
        setScanning(false)
    }

    useEffect(() => { return () => { stopCamera() } }, [])

    const handleScan = async (code) => {
        setScanResult(null);

        // 1. First, check if it is a Profile Identity QR (format GP-XXXXXX)
        const { data: identProfile, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .eq('qr_token', code)
            .single()

        if (identProfile) {
            const result = {
                status: 'success',
                message: 'IDENTITY AUTHENTICATED',
                profile: identProfile,
                type: 'identity',
                code,
                time: new Date()
            }
            setScanResult(result);
            setRecentScans(prev => [result, ...prev].slice(0, 8))
            return
        }

        // 2. Check local cache for tickets
        if (validatedTickets.has(code)) {
            const result = { status: 'duplicate', message: 'Ticket previously authenticated', code, time: new Date() }
            setScanResult(result); setRecentScans(prev => [result, ...prev].slice(0, 8))
            return
        }

        // 3. Verify with Supabase (Ticket Verification)
        const { data: ticket, error } = await supabase
            .from('tickets')
            .select(`
                *,
                participants (
                    *,
                    profiles (*)
                ),
                events (*)
            `)
            .eq('qr_token', code.trim())
            .single()

        if (error || !ticket) {
            console.error('Ticket fetch error:', error);
            const result = { status: 'invalid', message: 'Token not recognized in system or sector mismatch', code, time: new Date() }
            setScanResult(result); setRecentScans(prev => [result, ...prev].slice(0, 8))
            return
        }

        // 4. Mark as validated in DB
        await supabase
            .from('tickets')
            .update({
                is_validated: true,
                validated_at: new Date().toISOString(),
                validated_by: staffUser?.id
            })
            .eq('id', ticket.id)

        setValidatedTickets(prev => new Set([...prev, code]))

        const mappedProfile = ticket.participants?.profiles ||
            (Array.isArray(ticket.participants) ? ticket.participants[0]?.profiles : null);

        const result = {
            status: 'success',
            message: 'Ticket Validated',
            ticket: ticket,
            profile: mappedProfile,
            type: 'ticket',
            code,
            time: new Date()
        }
        setScanResult(result); setRecentScans(prev => [result, ...prev].slice(0, 8))
    }

    const getSafeProfile = (item) => {
        if (!item) return null;
        // If it's a participant object directly
        if (item.profiles) {
            return Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        }
        // If it's a join object from tickets
        if (item.participants?.profiles) {
            return Array.isArray(item.participants.profiles) ? item.participants.profiles[0] : item.participants.profiles;
        }
        return null;
    }

    return (
        <div className="page-container" style={{ maxWidth: 1000 }}>
            {/* HUD Header */}
            <div className="page-header" style={{ marginBottom: 'var(--space-8)' }}>
                <div className="flex items-center gap-4">
                    {dashView !== 'events' && (
                        <button
                            onClick={() => setDashView(dashView === 'scanner' ? 'participants' : 'events')}
                            className="btn btn-secondary btn-icon btn-sm"
                        >
                            <ArrowLeft size={16} />
                        </button>
                    )}
                    <div>
                        <h1 className="page-title">
                            {dashView === 'events' ? 'Operational Sectors' :
                                dashView === 'participants' ? selectedEvent?.name :
                                    'Security Checkpoint'}
                        </h1>
                        <p className="page-subtitle">
                            {dashView === 'events' ? 'Initialize deployment by selecting an active sector.' :
                                dashView === 'participants' ? `Reviewing registered entities for ${selectedEvent?.location}.` :
                                    'Digital credential validation interface.'}
                        </p>
                    </div>
                </div>
                {dashView === 'scanner' && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button onClick={() => { setDashView('scanner'); setMode('camera'); setScanResult(null) }} className={`btn ${mode === 'camera' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
                            <Camera size={14} /> SENSOR
                        </button>
                        <button onClick={() => { stopCamera(); setDashView('scanner'); setMode('manual'); setScanResult(null) }} className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
                            <Keyboard size={14} /> MANUAL
                        </button>
                    </div>
                )}
            </div>

            {dashView === 'events' && (
                <div className="grid-3">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="card card-hover clickable"
                            onClick={() => handleEventSelect(event)}
                            style={{ padding: 'var(--space-6)', border: '1px solid var(--border-color)' }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="stat-card-icon" style={{ background: 'var(--accent-glow)' }}>
                                    <Calendar size={20} color="var(--accent)" />
                                </div>
                                <ChevronRight size={16} color="var(--text-dim)" />
                            </div>
                            <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>{event.name.toUpperCase()}</h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '16px' }}>{event.location}</p>
                            <div className="flex items-center gap-2" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)' }}>
                                <Users size={12} /> SECURE SECTOR ACCESS
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && !loading && (
                        <div className="card col-span-3 text-center" style={{ padding: 'var(--space-12)' }}>
                            <p style={{ color: 'var(--text-dim)' }}>No active operational sectors found.</p>
                        </div>
                    )}
                </div>
            )}

            {dashView === 'participants' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Registered Entity</th>
                                    <th>Department</th>
                                    <th>Reg No</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map((p) => {
                                    const prof = getSafeProfile(p);
                                    return (
                                        <tr key={p.id} className="clickable" onClick={() => handleParticipantSelect(p)}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                                        background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '14px', fontWeight: 800, color: 'var(--accent)'
                                                    }}>
                                                        {prof?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                    <div style={{ fontWeight: 600 }}>{prof?.full_name || 'PENDING_PROVISION'}</div>
                                                </div>
                                            </td>
                                            <td>{prof?.dept || 'N/A'}</td>
                                            <td className="font-mono" style={{ fontSize: '12px' }}>{prof?.reg_no || 'N/A'}</td>
                                            <td>
                                                <span className={`badge ${p.registration_status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                                                    {p.registration_status?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-primary btn-xs">VERIFY IDENTITY</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {dashView === 'scanner' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
                    {/* Main Scanner HUD */}
                    <div>
                        {selectedParticipant && (
                            <div className="card mb-4" style={{
                                background: 'rgba(0,212,255,0.05)',
                                border: '1px solid var(--accent)',
                                padding: 'var(--space-3) var(--space-4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <div className="flex items-center gap-3">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} className="animate-pulse" />
                                    <div style={{ fontSize: '12px', fontWeight: 700 }}>
                                        TARGETING: <span style={{ color: 'var(--accent)' }}>{getSafeProfile(selectedParticipant)?.full_name?.toUpperCase() || 'UNSYNCED'}</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 600 }}>
                                    {getSafeProfile(selectedParticipant)?.reg_no}
                                </div>
                            </div>
                        )}
                        <div className="card" style={{ padding: 'var(--space-2)', background: 'var(--bg-deepest)', border: '2px solid var(--border-color)', position: 'relative' }}>
                            {/* Corner Brackets */}
                            <div style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderLeft: '2px solid var(--accent)', borderTop: '2px solid var(--accent)' }} />
                            <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRight: '2px solid var(--accent)', borderTop: '2px solid var(--accent)' }} />
                            <div style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderLeft: '2px solid var(--accent)', borderBottom: '2px solid var(--accent)' }} />
                            <div style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderRight: '2px solid var(--accent)', borderBottom: '2px solid var(--accent)' }} />

                            {/* Scanline Animation */}
                            {scanning && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)', zIndex: 10, animation: 'scanline 2s linear infinite' }} />}

                            {mode === 'camera' ? (
                                <div style={{ padding: 'var(--space-4)' }}>
                                    <div id="qr-reader" style={{ width: '100%', minHeight: 320, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000' }}>
                                        {!scanning && (
                                            <div className="flex flex-col items-center justify-center" style={{ minHeight: 320, color: 'var(--text-dim)' }}>
                                                <ScanLine size={48} className="animate-pulse mb-4" />
                                                <p className="font-mono" style={{ fontSize: '12px' }}>[ STATION_ID: MAIN_GATE_01 ]</p>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={scanning ? stopCamera : startCamera} className={`btn ${scanning ? 'btn-danger' : 'btn-primary'} w-full mt-4`} style={{ borderRadius: 'var(--radius-md)' }}>
                                        {scanning ? 'OFFLINE SENSOR' : 'INITIALIZE SENSOR SCAN'}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ padding: 'var(--space-12) var(--space-8)' }}>
                                    <div className="text-center mb-6">
                                        <div className="panel-header" style={{ justifyContent: 'center' }}>Manual Key Entry</div>
                                    </div>
                                    <input
                                        className="form-input"
                                        style={{ textAlign: 'center', fontSize: 'var(--font-xl)', letterSpacing: '4px', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }}
                                        placeholder="TOKEN-CODE"
                                        value={manualCode}
                                        onChange={e => setManualCode(e.target.value.toUpperCase())}
                                    />
                                    <button onClick={() => handleScan(manualCode)} className="btn btn-primary w-full">AUTHENTICATE KEY</button>
                                </div>
                            )}
                        </div>

                        {/* Result Hud Overlay */}
                        {scanResult && (
                            <div className="animate-fade-in-up mt-6 card" style={{
                                background: scanResult.status === 'success' ? 'var(--status-ok-bg)' : 'var(--status-critical-bg)',
                                border: `1px solid ${scanResult.status === 'success' ? 'var(--status-ok-border)' : 'var(--status-critical-border)'}`,
                                padding: 'var(--space-6)'
                            }}>
                                <div className="flex gap-6">
                                    {scanResult.status === 'success' && scanResult.profile?.face_url ? (
                                        <div style={{
                                            width: 120, height: 120, borderRadius: 'var(--radius-md)',
                                            border: '2px solid var(--accent)', overflow: 'hidden', background: '#000'
                                        }}>
                                            <img src={scanResult.profile.face_url} alt="Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: 60, height: 60, borderRadius: 'var(--radius-xl)',
                                            background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {scanResult.status === 'success' ? <CheckCircle2 size={32} color="var(--status-ok)" /> : <XCircle size={32} color="var(--status-critical)" />}
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <h3 className="page-title" style={{ fontSize: 'var(--font-lg)', color: scanResult.status === 'success' ? 'var(--status-ok)' : 'var(--status-critical)', marginBottom: 2 }}>
                                            {scanResult.status === 'success' ? 'ACCESS GRANTED' : 'AUTH_FAILURE'}
                                        </h3>
                                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginBottom: 8 }}>{scanResult.message}</p>

                                        {scanResult.profile && (
                                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                                                <div>
                                                    <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>ENTITY NAME</div>
                                                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>{scanResult.profile.full_name}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>DEPARTMENT</div>
                                                    <div style={{ fontSize: 'var(--font-sm)' }}>{scanResult.profile.dept || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>SECTION / REG</div>
                                                    <div style={{ fontSize: 'var(--font-sm)' }}>{scanResult.profile.section || '-'} / {scanResult.profile.reg_no || '-'}</div>
                                                </div>
                                                {scanResult.type === 'ticket' && (
                                                    <div>
                                                        <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>EVENT</div>
                                                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--accent)' }}>{scanResult.ticket?.events?.name}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {scanResult.profile?.id_barcode_url && (
                                    <div className="mt-4 pt-4" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginBottom: '4px' }}>ID BARCODE VERIFICATION</div>
                                        <img src={scanResult.profile.id_barcode_url} alt="ID Barcode" style={{ width: '100%', height: '40px', objectFit: 'contain', opacity: 0.8 }} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Operational Log */}
                    <div className="card">
                        <div className="panel-header"><Activity size={12} /> Local Scan Log</div>
                        <div className="flex flex-col gap-3 mt-4">
                            {recentScans.length === 0 ? (
                                <div className="empty-state" style={{ padding: 'var(--space-12) 0' }}>
                                    <p style={{ fontSize: '10px' }}>NO RECENT OPERATIONS</p>
                                </div>
                            ) : (
                                recentScans.map((scan, i) => (
                                    <div key={i} className="flex items-center justify-between p-3" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                        <div className="flex items-center gap-3">
                                            {scan.status === 'success' ? <ShieldCheck size={14} color="var(--status-ok)" /> : <AlertTriangle size={14} color="var(--status-critical)" />}
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {scan.profile?.full_name || 'UNKNOWN_IDENTITY'}
                                                </div>
                                                <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{scan.code?.slice(-8)} @ {scan.time?.toLocaleTimeString()}</div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '9px', fontWeight: 800, color: scan.status === 'success' ? 'var(--status-ok)' : 'var(--status-critical)' }}>{scan.status.toUpperCase()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
