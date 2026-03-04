import { useState } from 'react'
import { Shield, Lock, X, ArrowRight, AlertCircle, Activity } from 'lucide-react'

export default function AccessModal({ isOpen, onClose, onVerified, type }) {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const codes = {
        admin: 'GATEPULSEADMIN2026',
        staff: 'GATEPULSEOPS2026'
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        setTimeout(() => {
            if (code === codes[type]) {
                onVerified(type)
                setCode('')
                onClose()
            } else {
                setError('INVALID ACCESS CREDENTIAL')
            }
            setLoading(false)
        }, 800)
    }

    return (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-content" style={{ maxWidth: '400px', position: 'relative', border: '2px solid var(--border-accent)' }}>
                {/* Scanline Animation */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'var(--accent)', opacity: 0.3, animation: 'scanline 4s linear infinite' }} />

                <div className="modal-header">
                    <div className="flex items-center gap-2">
                        <Shield size={20} color="var(--accent)" />
                        <h2 className="modal-title" style={{ fontSize: 'var(--font-base)', letterSpacing: '0.05em' }}>
                            {type === 'admin' ? 'SECURE_ADMIN_GATEWAY' : 'STAFF_AUTH_PORTAL'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="btn-icon"><X size={18} /></button>
                </div>

                <div className="modal-body">
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)', marginBottom: 'var(--space-2)' }}>
                        ENTER ENCRYPTED PROTOCOL ACCESS KEY:
                    </p>

                    {error && (
                        <div className="badge badge-error w-full mb-4" style={{ padding: '8px', textTransform: 'none' }}>
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-group">
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                <input
                                    type="password"
                                    className="form-input"
                                    style={{ paddingLeft: '40px', textAlign: 'center', letterSpacing: '2px', fontFamily: 'var(--font-mono)' }}
                                    placeholder="••••••••••••"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? <Activity className="animate-pulse" size={18} /> : <>VERIFY CREDENTIALS <ArrowRight size={16} /></>}
                        </button>
                    </form>
                </div>

                <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Unauthorized access attempts are logged and flagged.
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes scanline {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
            `}</style>
        </div>
    )
}
