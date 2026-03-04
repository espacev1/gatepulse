import { useState, useRef, useEffect } from 'react'
import {
    ScanLine, CheckCircle2, XCircle, AlertTriangle, Camera,
    Keyboard, RefreshCw, Activity, ShieldCheck, Zap, Maximize
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function StaffScanner() {
    const { user: staffUser } = useAuth()
    const [mode, setMode] = useState('camera')
    const [manualCode, setManualCode] = useState('')
    const [scanResult, setScanResult] = useState(null)
    const [scanning, setScanning] = useState(false)
    const [validatedTickets, setValidatedTickets] = useState(new Set())
    const [recentScans, setRecentScans] = useState([])
    const html5QrRef = useRef(null)

    // Load initial validated tickets from Supabase
    useEffect(() => {
        const fetchValidated = async () => {
            const { data } = await supabase.from('tickets').select('qr_token').eq('is_validated', true)
            if (data) setValidatedTickets(new Set(data.map(t => t.qr_token)))
        }
        fetchValidated()
    }, [])

    const startCamera = async () => {
        setScanning(true)
        setScanResult(null)
        try {
            const { Html5Qrcode } = await import('html5-qrcode')
            const scanner = new Html5Qrcode('qr-reader')
            html5QrRef.current = scanner
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 15, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    handleScan(decodedText)
                    stopCamera()
                },
                () => { }
            )
        } catch (err) {
            setScanning(false)
            setScanResult({ status: 'error', message: 'Sensor initialization failure. Check hardware permissions.' })
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
        // 1. Check local cache first
        if (validatedTickets.has(code)) {
            const result = { status: 'duplicate', message: 'Token previously authenticated', code, time: new Date() }
            setScanResult(result); setRecentScans(prev => [result, ...prev].slice(0, 8))
            return
        }

        // 2. Verify with Supabase
        const { data: ticket, error } = await supabase
            .from('tickets')
            .select('*, participants(profiles(*)), events(name)')
            .eq('qr_token', code)
            .single()

        if (error || !ticket) {
            const result = { status: 'invalid', message: 'Token not found in registry', code, time: new Date() }
            setScanResult(result); setRecentScans(prev => [result, ...prev].slice(0, 8))
            return
        }

        // 3. Mark as validated in DB
        const { error: updateError } = await supabase
            .from('tickets')
            .update({
                is_validated: true,
                validated_at: new Date().toISOString(),
                validated_by: staffUser?.id
            })
            .eq('id', ticket.id)

        if (updateError) {
            const result = { status: 'error', message: 'Database synchronization failure', code, time: new Date() }
            setScanResult(result); setRecentScans(prev => [result, ...prev].slice(0, 8))
            return
        }

        // 4. Record attendance log
        await supabase.from('attendance_logs').insert({
            ticket_id: ticket.id,
            event_id: ticket.event_id,
            verification_status: 'success',
            staff_id: staffUser?.id
        })

        setValidatedTickets(prev => new Set([...prev, code]))
        const result = {
            status: 'success',
            message: 'Authentication Successful',
            ticket: ticket,
            code,
            time: new Date()
        }
        setScanResult(result); setRecentScans(prev => [result, ...prev].slice(0, 8))
    }

    return (
        <div className="page-container" style={{ maxWidth: 1000 }}>
            {/* HUD Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Digital Entry Interface</h1>
                    <p className="page-subtitle">Security checkpoint scanner for digital credential validation.</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={() => { setMode('camera'); setScanResult(null) }} className={`btn ${mode === 'camera' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
                        <Camera size={14} /> SENSOR
                    </button>
                    <button onClick={() => { stopCamera(); setMode('manual'); setScanResult(null) }} className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
                        <Keyboard size={14} /> MANUAL
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
                {/* Main Scanner HUD */}
                <div>
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
                            border: `1px solid ${scanResult.status === 'success' ? 'var(--status-ok-border)' : 'var(--status-critical-border)'}`
                        }}>
                            <div className="flex items-center gap-6">
                                <div style={{
                                    width: 60, height: 60, borderRadius: 'var(--radius-xl)',
                                    background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {scanResult.status === 'success' ? <CheckCircle2 size={32} color="var(--status-ok)" /> : <XCircle size={32} color="var(--status-critical)" />}
                                </div>
                                <div>
                                    <h3 className="page-title" style={{ fontSize: 'var(--font-lg)', color: scanResult.status === 'success' ? 'var(--status-ok)' : 'var(--status-critical)', marginBottom: 2 }}>
                                        {scanResult.status === 'success' ? 'IDENTITY VERIFIED' : 'AUTH_FAILURE'}
                                    </h3>
                                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{scanResult.message}</p>
                                    {scanResult.ticket && (
                                        <p className="font-mono mt-2" style={{ fontSize: '10px', opacity: 0.6 }}>
                                            ENTITY_UID: {(scanResult.ticket.participants?.profiles?.full_name || scanResult.ticket.participant?.user?.full_name || 'ANONYMOUS').toUpperCase()}
                                        </p>
                                    )}
                                </div>
                            </div>
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
                                                {scan.ticket?.participants?.profiles?.full_name || scan.ticket?.participant?.user?.full_name || 'UNKNOWN_IDENTITY'}
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
        </div>
    )
}
