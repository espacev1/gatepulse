import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
    Shield, Mail, Lock, User, ArrowRight, ArrowLeft,
    Activity, AlertCircle, Building2, Layers, Hash,
    Camera, RefreshCw, CheckCircle2
} from 'lucide-react'

export default function Register() {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        dept: '',
        section: '',
        regNo: ''
    })
    const [idBarcode, setIdBarcode] = useState(null)
    const [facePic, setFacePic] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [isCameraActive, setIsCameraActive] = useState(false)

    const { register } = useAuth()
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    const ALLOWED_DOMAIN = '@vishnu.edu.in'
    const ADMIN_EMAIL = 'shanmukhamanikanta.inti@gmail.com'

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const startCamera = async () => {
        try {
            setError('')
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            })
            streamRef.current = stream
            setIsCameraActive(true)
        } catch (err) {
            setError('Camera access failed. Ensure permissions are granted.')
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
        }
        setIsCameraActive(false)
    }

    const capturePhoto = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (video && canvas) {
            const context = canvas.getContext('2d')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            context.drawImage(video, 0, 0, canvas.width, canvas.height)
            canvas.toBlob((blob) => {
                setFacePic(blob)
                stopCamera()
            }, 'image/jpeg', 0.9)
        }
    }

    const validateStep1 = () => {
        const email = formData.email.toLowerCase().trim()
        if (email !== ADMIN_EMAIL && !email.endsWith(ALLOWED_DOMAIN)) {
            setError(`ACCESS_DENIED: Restricted to ${ALLOWED_DOMAIN} domain.`)
            return false
        }
        if (formData.password.length < 6) {
            setError('Security key must be at least 6 characters.')
            return false
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Security keys do not match.')
            return false
        }
        setError('')
        return true
    }

    const validateStep2 = () => {
        if (!formData.fullName || !formData.dept || !formData.regNo) {
            setError('All academic credentials are required.')
            return false
        }
        setError('')
        return true
    }

    const handleFinalRegister = async () => {
        if (!idBarcode || !facePic) {
            setError('Biometric uplink (ID & Face) is mandatory.')
            return
        }

        setLoading(true)
        setError('')
        try {
            const qrToken = `GP-${uuidv4().slice(0, 8).toUpperCase()}`
            const email = formData.email.toLowerCase().trim()

            // 1. Storage Uplink (Supabase)
            const idPath = `barcodes/${Date.now()}-${email}.jpg`
            const facePath = `faces/${Date.now()}-${email}.jpg`

            const [idUpload, faceUpload] = await Promise.all([
                supabase.storage.from('id-barcodes').upload(idPath, idBarcode),
                supabase.storage.from('face-verification').upload(facePath, facePic)
            ])

            if (idUpload.error) throw idUpload.error
            if (faceUpload.error) throw faceUpload.error

            const idUrl = supabase.storage.from('id-barcodes').getPublicUrl(idPath).data.publicUrl
            const faceUrl = supabase.storage.from('face-verification').getPublicUrl(facePath).data.publicUrl

            // 2. Auth & Profile Synchronization
            await register(formData.email, formData.password, formData.fullName, 'participant', {
                dept: formData.dept,
                section: formData.section,
                reg_no: formData.regNo,
                id_barcode_url: idUrl,
                face_url: faceUrl,
                qr_token: qrToken,
                created_at: new Date().toISOString()
            })

            navigate('/events')
        } catch (err) {
            console.error(err)
            setError(err.message || 'Identity provisioning failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gradient-hero)', padding: 'var(--space-6)', position: 'relative'
        }}>
            <div className="card-glass shadow-2xl" style={{ width: '100%', maxWidth: '480px', padding: 'var(--space-8)', zIndex: 1, border: '1px solid rgba(255, 40, 40, 0.1)' }}>
                <div className="text-center mb-8">
                    <h1 className="page-title" style={{ fontSize: '24px' }}>Identity Provisioning</h1>
                    <p className="page-subtitle">Security Step {step} of 3</p>
                </div>

                {error && (
                    <div className="badge badge-error w-full mb-6 p-3 animate-head-shake">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                {/* Step 1: Core Credentials */}
                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        <div className="form-group">
                            <label className="form-label">University Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-3 text-accent" />
                                <input type="email" name="email" className="form-input pl-10" placeholder="identity@vishnu.edu.in" value={formData.email} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Secure Key</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-3 text-dim" />
                                <input type="password" name="password" className="form-input pl-10" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Key</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-3 text-dim" />
                                <input type="password" name="confirmPassword" className="form-input pl-10" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
                            </div>
                        </div>
                        <button onClick={() => validateStep1() && setStep(2)} className="btn btn-primary btn-lg w-full mt-4">
                            Next Stage <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* Step 2: Academic Node */}
                {step === 2 && (
                    <div className="flex flex-col gap-4">
                        <div className="form-group">
                            <label className="form-label">Full Legal Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-3 text-accent" />
                                <input type="text" name="fullName" className="form-input pl-10" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3 top-3 text-accent" />
                                <input type="text" name="dept" className="form-input pl-10" placeholder="e.g. Computer Science" value={formData.dept} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Section</label>
                                <input type="text" name="section" className="form-input" placeholder="A" value={formData.section} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reg No</label>
                                <input type="text" name="regNo" className="form-input" placeholder="2021CS001" value={formData.regNo} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <button onClick={() => setStep(1)} className="btn btn-secondary flex-1"><ArrowLeft size={18} /> Back</button>
                            <button onClick={() => validateStep2() && setStep(3)} className="btn btn-primary flex-1">Final Stage <ArrowRight size={18} /></button>
                        </div>
                    </div>
                )}

                {/* Step 3: Biometric Uplink */}
                {step === 3 && (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="verification-slot">
                                <label className="form-label mb-1 block">ID Barcode</label>
                                <div style={{
                                    height: 120, border: idBarcode ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative', background: 'rgba(0,0,0,0.2)', overflow: 'hidden'
                                }}>
                                    {idBarcode ? (
                                        <img src={URL.createObjectURL(idBarcode)} alt="ID" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="text-center">
                                            <Camera size={24} className="text-dim mb-2 mx-auto" />
                                            <span style={{ fontSize: '10px' }}>TAP TO UPLOAD ID</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" capture="environment" onChange={e => setIdBarcode(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                </div>
                            </div>

                            <div className="verification-slot">
                                <label className="form-label mb-1 block">Live Face</label>
                                <div style={{
                                    height: 120, border: facePic || isCameraActive ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative', background: 'rgba(0,0,0,0.2)', overflow: 'hidden'
                                }}>
                                    {isCameraActive ? (
                                        <>
                                            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                            <button type="button" onClick={capturePhoto} className="btn btn-primary btn-xs" style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)' }}>
                                                CAPTURE
                                            </button>
                                        </>
                                    ) : facePic ? (
                                        <>
                                            <img src={URL.createObjectURL(facePic)} alt="Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button onClick={startCamera} className="btn btn-ghost btn-xs" style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)' }}>
                                                <RefreshCw size={12} />
                                            </button>
                                        </>
                                    ) : (
                                        <div onClick={startCamera} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                            <Camera size={24} className="text-accent mb-2 mx-auto" />
                                            <span style={{ fontSize: '10px', color: 'var(--accent)' }}>START CAMERA</span>
                                        </div>
                                    )}
                                </div>
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setStep(2)} className="btn btn-secondary flex-1" disabled={loading}><ArrowLeft size={18} /> Back</button>
                            <button onClick={handleFinalRegister} className="btn btn-primary flex-1" disabled={loading}>
                                {loading ? <Activity className="animate-pulse" size={18} /> : 'INITIALIZE UPLINK'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="text-center mt-8">
                    <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>
                        Existing Entity? <Link to="/login" className="text-accent font-bold">Access Console</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
