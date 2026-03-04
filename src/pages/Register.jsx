import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, Mail, Lock, User, ShieldCheck, ArrowRight, Activity, AlertCircle, Building2, Layers, Hash, Camera, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function Register() {
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
    const [step, setStep] = useState(1) // 1: Info, 2: Verification
    const { register } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setError('')

        if (step === 1) {
            if (formData.password !== formData.confirmPassword) {
                return setError('Cryptographic mismatch: Passwords do not align.')
            }
            setStep(2)
            return
        }

        if (!idBarcode || !facePic) {
            return setError('Verification data missing. Both ID scan and Face verification required.')
        }

        setLoading(true)
        try {
            const qrToken = `GP-${uuidv4().slice(0, 8).toUpperCase()}`

            // Upload images
            const idPath = `barcodes/${Date.now()}-${formData.email}.jpg`
            const facePath = `faces/${Date.now()}-${formData.email}.jpg`

            const [idUpload, faceUpload] = await Promise.all([
                supabase.storage.from('id-barcodes').upload(idPath, idBarcode),
                supabase.storage.from('face-verification').upload(facePath, facePic)
            ])

            if (idUpload.error) throw idUpload.error
            if (faceUpload.error) throw faceUpload.error

            const idUrl = supabase.storage.from('id-barcodes').getPublicUrl(idPath).data.publicUrl
            const faceUrl = supabase.storage.from('face-verification').getPublicUrl(facePath).data.publicUrl

            await register(formData.email, formData.password, formData.fullName, 'participant', {
                dept: formData.dept,
                section: formData.section,
                reg_no: formData.regNo,
                id_barcode_url: idUrl,
                face_url: faceUrl,
                qr_token: qrToken
            })
            navigate('/events')
        } catch (err) {
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

            <div className="card-glass" style={{
                width: '100%',
                maxWidth: '480px',
                padding: 'var(--space-8)',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
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
                    <div className="badge badge-error w-full mb-6" style={{ padding: '8px', borderRadius: 'var(--radius-md)', textTransform: 'none' }}>
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    {step === 1 ? (
                        <>
                            <div className="form-group">
                                <label className="form-label">Full Legal Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input
                                        type="text"
                                        name="fullName"
                                        className="form-input"
                                        style={{ paddingLeft: '40px' }}
                                        placeholder="John Doe"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Deployment Email</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        style={{ paddingLeft: '40px' }}
                                        placeholder="john@gatepulse.io"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Department</label>
                                <div style={{ position: 'relative' }}>
                                    <Building2 size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input
                                        type="text"
                                        name="dept"
                                        className="form-input"
                                        style={{ paddingLeft: '40px' }}
                                        placeholder="Computer Science"
                                        value={formData.dept}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Section</label>
                                    <div style={{ position: 'relative' }}>
                                        <Layers size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                        <input
                                            type="text"
                                            name="section"
                                            className="form-input"
                                            style={{ paddingLeft: '40px' }}
                                            placeholder="A"
                                            value={formData.section}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reg No</label>
                                    <div style={{ position: 'relative' }}>
                                        <Hash size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                        <input
                                            type="text"
                                            name="regNo"
                                            className="form-input"
                                            style={{ paddingLeft: '40px' }}
                                            placeholder="2021CS001"
                                            value={formData.regNo}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
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

                            <button type="submit" className="btn btn-primary btn-lg w-full mt-4">
                                Next: Identity Verification <ArrowRight size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col gap-6">
                                <div className="verification-slot">
                                    <label className="form-label mb-2 block">ID Barcode Scan</label>
                                    <div style={{
                                        height: 120,
                                        border: '2px dashed var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        background: idBarcode ? 'rgba(0, 212, 255, 0.05)' : 'transparent',
                                        overflow: 'hidden'
                                    }}>
                                        {idBarcode ? (
                                            <>
                                                <img src={URL.createObjectURL(idBarcode)} alt="ID Barcode" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', top: 5, right: 5 }}><CheckCircle2 size={20} color="var(--accent)" /></div>
                                            </>
                                        ) : (
                                            <>
                                                <Camera size={24} className="mb-2" style={{ color: 'var(--text-dim)' }} />
                                                <p style={{ fontSize: 12, opacity: 0.7 }}>Take photo of ID barcode</p>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(e) => setIdBarcode(e.target.files[0])}
                                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>

                                <div className="verification-slot">
                                    <label className="form-label mb-2 block">Live Face Verification</label>
                                    <div style={{
                                        height: 200,
                                        border: '2px dashed var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        background: facePic ? 'rgba(0, 212, 255, 0.05)' : 'transparent',
                                        overflow: 'hidden'
                                    }}>
                                        {facePic ? (
                                            <>
                                                <img src={URL.createObjectURL(facePic)} alt="Face Verification" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', top: 5, right: 5 }}><CheckCircle2 size={20} color="var(--accent)" /></div>
                                            </>
                                        ) : (
                                            <>
                                                <User size={32} className="mb-2" style={{ color: 'var(--text-dim)' }} />
                                                <p style={{ fontSize: 12, opacity: 0.7 }}>Capture live face verification</p>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="user"
                                            onChange={(e) => setFacePic(e.target.files[0])}
                                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary w-1/3">Back</button>
                                <button type="submit" className="btn btn-primary w-2/3" disabled={loading}>
                                    {loading ? <Activity className="animate-pulse" size={18} /> : <>Complete Enrollment <ShieldCheck size={18} /></>}
                                </button>
                            </div>
                        </>
                    )}
                </form>

                <p className="text-center mt-8" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)' }}>
                    Already have an entity ID?{' '}
                    <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Access Console</Link>
                </p>
            </div>
        </div>
    )
}
