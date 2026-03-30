import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
    Mail, Lock, User, Building2, Eye, EyeOff, 
    ArrowRight, ArrowLeft, Camera, RefreshCw, AlertCircle, Activity
} from 'lucide-react'
import './AuthPortal.css'

export default function AuthPortal() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, register } = useAuth()
    
    // Panel Toggle State
    const [isRightPanelActive, setIsRightPanelActive] = useState(location.pathname === '/register')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    
    // Login State
    const [loginData, setLoginData] = useState({ email: '', password: '' })
    const [showLoginPassword, setShowLoginPassword] = useState(false)
    
    // Registration State
    const [regStep, setRegStep] = useState(1)
    const [regData, setRegData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        dept: '',
        section: '',
        regNo: ''
    })
    const [showRegPassword, setShowRegPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [idBarcode, setIdBarcode] = useState(null)
    const [facePic, setFacePic] = useState(null)
    const [isCameraActive, setIsCameraActive] = useState(false)
    
    // Camera Refs
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    const DEPARTMENTS = ['AIML', 'AIDS', 'IT', 'CSE', 'ECE', 'EEE', 'ME', 'CE', 'CSBS']
    const ALLOWED_DOMAIN = '@vishnu.edu.in'
    const ADMIN_EMAIL = 'shanmukhamanikanta.inti@gmail.com'

    useEffect(() => {
        setIsRightPanelActive(location.pathname === '/register')
    }, [location.pathname])

    useEffect(() => {
        if (isCameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current
        }
    }, [isCameraActive])

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const handleToggle = (active) => {
        setIsRightPanelActive(active)
        setError('')
        navigate(active ? '/register' : '/login', { replace: true })
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const loggedInUser = await login(loginData.email, loginData.password)
            const dashMap = {
                admin: '/admin',
                staff: '/staff/scanner',
                faculty: '/faculty',
                jury: '/jury/dashboard',
                participant: '/events'
            }
            navigate(dashMap[loggedInUser.role] || '/events')
        } catch (err) {
            setError(err.message || 'Authentication failed.')
        } finally {
            setLoading(false)
        }
    }

    const validateRegStep1 = () => {
        const email = regData.email.toLowerCase().trim()
        if (email !== ADMIN_EMAIL && !email.endsWith(ALLOWED_DOMAIN)) {
            setError(`Use ${ALLOWED_DOMAIN} email.`)
            return false
        }
        if (regData.password.length < 6) {
            setError('Password too short.')
            return false
        }
        if (regData.password !== regData.confirmPassword) {
            setError('Passwords mismatch.')
            return false
        }
        return true
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            streamRef.current = stream
            setIsCameraActive(true)
        } catch (err) {
            setError('Camera access failed.')
        }
    }

    const stopCamera = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
        setIsCameraActive(false)
    }

    const capturePhoto = () => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (video && canvas) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            canvas.getContext('2d').drawImage(video, 0, 0)
            canvas.toBlob(blob => {
                setFacePic(blob)
                stopCamera()
            }, 'image/jpeg', 0.9)
        }
    }

    const handleFinalRegister = async () => {
        if (!idBarcode || !facePic) {
            setError('Photos required.')
            return
        }
        setLoading(true)
        try {
            const qrToken = `GP-${uuidv4().slice(0, 8).toUpperCase()}`
            const email = regData.email.toLowerCase().trim()
            const idPath = `barcodes/${Date.now()}-${email}.jpg`
            const facePath = `faces/${Date.now()}-${email}.jpg`

            await Promise.all([
                supabase.storage.from('id-barcodes').upload(idPath, idBarcode),
                supabase.storage.from('face-verification').upload(facePath, facePic)
            ])

            const idUrl = supabase.storage.from('id-barcodes').getPublicUrl(idPath).data.publicUrl
            const faceUrl = supabase.storage.from('face-verification').getPublicUrl(facePath).data.publicUrl

            await register(regData.email, regData.password, regData.fullName, 'participant', {
                dept: regData.dept,
                section: regData.section,
                reg_no: regData.regNo,
                id_barcode_url: idUrl,
                face_url: faceUrl,
                qr_token: qrToken,
                created_at: new Date().toISOString()
            })
            navigate('/events')
        } catch (err) {
            setError(err.message || 'Registration failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-portal-container">
            <div className={`auth-main-wrapper ${isRightPanelActive ? 'right-panel-active' : ''}`}>
                
                {/* SIGN UP FORM AREA */}
                <div className="form-container sign-up-container">
                    <div className="auth-form">
                        <h1 className="auth-title">Create Account</h1>
                        <span className="auth-span" style={{marginTop: '20px'}}>FILL YOUR ACADEMIC DETAILS</span>

                        {error && isRightPanelActive && (
                            <div className="badge badge-error mb-4" style={{fontSize: '10px', padding: '5px 10px'}}><AlertCircle size={10}/> {error}</div>
                        )}

                        <div className="reg-step-container">
                            {regStep === 1 && (
                                <>
                                    <div className="auth-input-container"><input className="neo-input" type="email" placeholder="Email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} /></div>
                                    <div className="auth-input-container"><input className="neo-input" type="password" placeholder="Password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} /></div>
                                    <div className="auth-input-container"><input className="neo-input" type="password" placeholder="Confirm Password" value={regData.confirmPassword} onChange={e => setRegData({...regData, confirmPassword: e.target.value})} /></div>
                                    <button className="btn-auth" onClick={() => validateRegStep1() && setRegStep(2)}>Next</button>
                                </>
                            )}
                            {regStep === 2 && (
                                <>
                                    <div className="auth-input-container"><input className="neo-input" type="text" placeholder="Name" value={regData.fullName} onChange={e => setRegData({...regData, fullName: e.target.value})} /></div>
                                    <div className="auth-input-container">
                                        <select className="neo-input" value={regData.dept} onChange={e => setRegData({...regData, dept: e.target.value})}>
                                            <option value="">Dept</option>
                                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="auth-input-container"><input className="neo-input" type="text" placeholder="Reg No" value={regData.regNo} onChange={e => setRegData({...regData, regNo: e.target.value})} /></div>
                                    <div className="flex gap-2">
                                        <button className="btn-auth" style={{padding: '12px 20px'}} onClick={() => setRegStep(1)}>Back</button>
                                        <button className="btn-auth" style={{padding: '12px 20px'}} onClick={() => regData.fullName && regData.dept && regData.regNo ? setRegStep(3) : setError('Required')}>Next</button>
                                    </div>
                                </>
                            )}
                            {regStep === 3 && (
                                <>
                                    <div className="flex gap-2 mb-2">
                                        <div className="neo-input" style={{height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden'}}>
                                            {idBarcode ? <img src={URL.createObjectURL(idBarcode)} style={{width: '100%'}} /> : <span style={{fontSize: '10px'}}>ID Card</span>}
                                            <input type="file" accept="image/*" onChange={e => setIdBarcode(e.target.files[0])} style={{position: 'absolute', opacity: 0, inset: 0}} />
                                        </div>
                                        <div className="neo-input" style={{height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden'}}>
                                            {isCameraActive ? (
                                                <video ref={videoRef} autoPlay playsInline style={{height: '100%'}} onClick={capturePhoto} />
                                            ) : facePic ? (
                                                <img src={URL.createObjectURL(facePic)} style={{height: '100%'}} onClick={startCamera} />
                                            ) : (
                                                <span style={{fontSize: '10px'}} onClick={startCamera}>Face</span>
                                            )}
                                        </div>
                                    </div>
                                    <canvas ref={canvasRef} style={{display: 'none'}} />
                                    <div className="flex gap-2">
                                        <button className="btn-auth" style={{padding: '12px 20px'}} onClick={() => setRegStep(2)}>Back</button>
                                        <button className="btn-auth" style={{padding: '12px 20px'}} onClick={handleFinalRegister} disabled={loading}>{loading ? <Activity className="animate-pulse" size={14}/> : 'Finish'}</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* SIGN IN FORM AREA */}
                <div className="form-container sign-in-container">
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h1 className="auth-title">Sign in</h1>
                        <span className="auth-span" style={{marginTop: '20px'}}>USE YOUR UNIVERSITY ID</span>
                        
                        {error && !isRightPanelActive && (
                            <div className="badge badge-error mb-4" style={{fontSize: '10px', padding: '5px 10px'}}><AlertCircle size={10}/> {error}</div>
                        )}

                        <div className="auth-input-container">
                            <input className="neo-input" type="email" placeholder="Email" value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} required />
                        </div>
                        <div className="auth-input-container">
                            <input className="neo-input" type="password" placeholder="Password" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
                        </div>
                        <a href="#" className="auth-link">Forgot your password?</a>
                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? <Activity className="animate-pulse" size={14}/> : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* OVERLAY AREA */}
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <img src="/logo_refined.png" alt="Logo" style={{height: '60px', marginBottom: '20px'}} />
                            <h1 className="auth-title" style={{color: '#fff', fontSize: '32px'}}>WELCOME BACK!</h1>
                            <p style={{margin: '20px 0', fontSize: '14px', lineHeight: '1.4'}}>To keep connected with us please login with your personal info</p>
                            <button className="btn-auth btn-ghost" onClick={() => handleToggle(false)}>Sign In</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <img src="/logo_refined.png" alt="Logo" style={{height: '60px', marginBottom: '20px'}} />
                            <h1 className="auth-title" style={{color: '#fff', fontSize: '32px'}}>HELLO, STUDENT!</h1>
                            <p style={{margin: '20px 0', fontSize: '14px', lineHeight: '1.4'}}>GET STARTED WITH VITPULSE</p>
                            <button className="btn-auth btn-ghost" onClick={() => handleToggle(true)}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
