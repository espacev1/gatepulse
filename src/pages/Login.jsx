import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, Lock, Mail, ArrowRight, Activity, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function Login({ portalType }) {
    const isJury = portalType === 'jury'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login, user, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const requestedRole = location.state?.requestedRole
    const isFaculty = requestedRole === 'faculty'

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const loggedInUser = await login(email, password)
            
            const dashMap = {
                admin: '/admin',
                staff: '/staff/scanner',
                faculty: '/faculty',
                jury: '/jury/dashboard',
                participant: '/events'
            }
            
            navigate(dashMap[loggedInUser.role] || '/events')
        } catch (err) {
            setError(err.message || 'Authentication failed. Check credentials.')
        } finally {
            setLoading(false)
        }
    }

    const quickLogin = async (email, pass) => {
        setLoading(true)
        try {
            const loggedInUser = await login(email, pass)
            const dashMap = {
                admin: '/admin',
                staff: '/staff/scanner',
                faculty: '/faculty',
                jury: '/jury/dashboard',
                participant: '/events'
            }
            navigate(dashMap[loggedInUser.role] || '/events')
        } catch (err) {
            setError('Connection failed')
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
            background: 'transparent',
            padding: 'var(--space-6)',
            position: 'relative',
            overflow: 'hidden'
        }}>

            <div className="card-glass" style={{
                width: '100%',
                maxWidth: '420px',
                padding: 'var(--space-10)',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255, 40, 40, 0.1)'
            }}>
                <div className="text-center mb-10">
                    <h1 className="page-title" style={{ marginBottom: 4 }}>
                        {isJury ? 'Jury Access Console' : 
                         isFaculty ? 'Faculty Advisor Login' : 
                         'Access Console'}
                    </h1>
                    <p className="page-subtitle">
                        {isJury ? 'Secure Evaluation Node' : 
                         isFaculty ? 'Unified Academic Oversight' :
                         'Security Authentication Gateway'}
                    </p>
                </div>

                {error && (
                    <div className="badge badge-error w-full mb-6" style={{ padding: '10px', borderRadius: 'var(--radius-md)', textTransform: 'none' }}>
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div className="form-group">
                        <label className="form-label">Deployment Entity (Email)</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="email"
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                                placeholder="operator@gatepulse.io"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Encrypted Key (Password)</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-input"
                                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: 14,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-dim)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full mt-4" disabled={loading}>
                        {loading ? <Activity className="animate-pulse" size={18} /> : <>Initialize Access <ArrowRight size={18} /></>}
                    </button>

                    {isJury && isAuthenticated && user?.is_super_admin && (
                        <button 
                            type="button"
                            onClick={() => navigate(`/jury/dashboard${window.location.search}`)}
                            className="btn btn-secondary w-full"
                            style={{ borderStyle: 'dashed', borderColor: 'var(--accent)' }}
                        >
                            Bypass to Preview (Admin)
                        </button>
                    )}
                </form>

                <p className="text-center mt-8" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)' }}>
                    Unauthorized access is strictly logged.{' '}
                    <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Apply for Credentials</Link>
                </p>
            </div>
        </div>
    )
}

const styles = `
@media (max-width: 480px) {
    .card-glass {
        padding: var(--space-6) !important;
    }
    .page-title {
        font-size: var(--font-xl) !important;
    }
}
`;

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}
