import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Shield, Mail, Lock, User, ShieldCheck, ArrowRight, Activity, AlertCircle } from 'lucide-react'

export default function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'participant'
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1) // Keep for potential future use or just use 1
    const { register } = useAuth()
    const navigate = useNavigate()

    const ALLOWED_DOMAIN = '@vishnu.edu.in'
    const ADMIN_EMAIL = 'shanmukhamanikanta.inti@gmail.com'

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setError('')

        // Domain Validation
        const email = formData.email.toLowerCase().trim()
        if (email !== ADMIN_EMAIL && !email.endsWith(ALLOWED_DOMAIN)) {
            return setError(`ACCESS_DENIED: Enrollment restricted to authorized deployment domain (${ALLOWED_DOMAIN}).`)
        }

        if (formData.password !== formData.confirmPassword) {
            return setError('Cryptographic mismatch: Passwords do not align.')
        }

        setLoading(true)
        try {
            const qrToken = `GP-${uuidv4().slice(0, 8).toUpperCase()}`

            await register(formData.email, formData.password, formData.fullName, formData.role, {
                qr_token: qrToken,
                created_at: new Date().toISOString()
            })

            const dashMap = { admin: '/admin', staff: '/staff/scanner', participant: '/events' }
            navigate(dashMap[formData.role] || '/events')
        } catch (err) {
            console.error('Registration failure:', err)
            setError(err.message || 'System error during registration.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--gradient-hero)',
            padding: 'var(--space-6)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decor */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.05,
                backgroundImage: 'linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
            }} />

            <div className="card-glass shadow-2xl" style={{
                width: '100%',
                maxWidth: '480px',
                padding: 'var(--space-8)',
                position: 'relative',
                zIndex: 1,
                border: '1px solid rgba(0, 212, 255, 0.1)'
            }}>
                {/* Header */}
                <div className="text-center mb-8">
                    <div style={{
                        width: 60, height: 60,
                        display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto var(--space-4)',
                    }}>
                        <img
                            src="/logo_refined.png"
                            alt="GatePulse Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                    <h1 className="page-title" style={{ fontSize: 'var(--font-xl)', marginBottom: 4 }}>Entity Registration</h1>
                    <p className="page-subtitle">Provision New Security Credentials</p>
                </div>

                {error && (
                    <div className="badge badge-error w-full mb-6 p-3 animate-head-shake" style={{ borderRadius: 'var(--radius-md)', textTransform: 'none' }}>
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    {/* Role Selection */}
                    <div className="form-group">
                        <label className="form-label">Account Clearance Level</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'participant' })}
                                className={`btn btn-xs ${formData.role === 'participant' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ fontSize: '10px' }}
                            >
                                <User size={12} /> PARTICIPANT
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'staff' })}
                                className={`btn btn-xs ${formData.role === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ fontSize: '10px' }}
                            >
                                <ShieldCheck size={12} /> OPERATIONAL STAFF
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Full Legal Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                            <input
                                type="text"
                                name="fullName"
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                                placeholder="Student or Staff Name"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">University Deployment Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                                placeholder="identity@vishnu.edu.in"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                            <label className="form-label">Secure Key</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                <input
                                    type="password"
                                    name="password"
                                    className="form-input"
                                    style={{ paddingLeft: '40px' }}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Key</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="form-input"
                                    style={{ paddingLeft: '40px' }}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full mt-4" disabled={loading}>
                        {loading ? <Activity className="animate-pulse" size={18} /> : <>Initialize Deployment <ArrowRight size={18} /></>}
                    </button>
                </form>

                <p className="text-center mt-8" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)' }}>
                    Already have an entity ID?{' '}
                    <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Access Console</Link>
                </p>
            </div>
        </div>
    )
}
