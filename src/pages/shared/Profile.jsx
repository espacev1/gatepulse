import { useState, useRef, useEffect } from 'react'
import {
    User, Mail, Building2, Layers, Hash, Camera,
    RefreshCw, Shield, CheckCircle2, AlertTriangle, Save,
    X, Edit3, Fingerprint, BadgeCheck, Upload
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function Profile() {
    const { user, refreshUser } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Form state
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        dept: user?.dept || '',
        section: user?.section || '',
        reg_no: user?.reg_no || ''
    })

    // Media state
    const [facePic, setFacePic] = useState(null)
    const [facePicPreview, setFacePicPreview] = useState(user?.face_url || null)
    const [idBarcode, setIdBarcode] = useState(null)
    const [idBarcodePreview, setIdBarcodePreview] = useState(user?.id_barcode_url || null)

    // Camera state
    const [isCameraActive, setIsCameraActive] = useState(false)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    useEffect(() => {
        if (isCameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current
        }
    }, [isCameraActive])

    useEffect(() => {
        return () => stopCamera()
    }, [])

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
            setError('ACCESS_DENIED: Camera hardware unreachable.')
            console.error(err)
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
                setFacePicPreview(URL.createObjectURL(blob))
                stopCamera()
            }, 'image/jpeg', 0.9)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setIdBarcode(file)
            setIdBarcodePreview(URL.createObjectURL(file))
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            let faceUrl = user.face_url
            let idUrl = user.id_barcode_url

            // Upload new media if changed
            if (facePic) {
                const facePath = `faces/${Date.now()}-${user.email}.jpg`
                const { error: fErr } = await supabase.storage.from('face-verification').upload(facePath, facePic)
                if (fErr) throw fErr
                faceUrl = supabase.storage.from('face-verification').getPublicUrl(facePath).data.publicUrl
            }

            if (idBarcode) {
                const idPath = `barcodes/${Date.now()}-${user.email}.jpg`
                const { error: iErr } = await supabase.storage.from('id-barcodes').upload(idPath, idBarcode)
                if (iErr) throw iErr
                idUrl = supabase.storage.from('id-barcodes').getPublicUrl(idPath).data.publicUrl
            }

            // Update Database
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    dept: formData.dept,
                    section: formData.section,
                    reg_no: formData.reg_no,
                    face_url: faceUrl,
                    id_barcode_url: idUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            await refreshUser()
            setSuccess('PROTOCOL_UPDATED: Identity record successfully synchronized.')
            setIsEditing(false)
        } catch (err) {
            setError(`SYNC_FAILURE: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-container" style={{ maxWidth: 800 }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Identity Profile</h1>
                    <p className="page-subtitle">Personal data registry and biometric authorization records.</p>
                </div>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="btn btn-primary btn-sm">
                        <Edit3 size={14} /> MODIFY_DATA
                    </button>
                )}
            </div>

            {error && <div className="badge badge-error w-full mb-6 p-4">{error}</div>}
            {success && <div className="badge badge-success w-full mb-6 p-4">{success}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-8)' }}>
                {/* Left: Biometrics & Photo */}
                <div className="flex flex-col gap-6">
                    <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                        <div style={{
                            width: 160, height: 160, borderRadius: 'var(--radius-xl)',
                            border: '2px solid var(--accent)', margin: '0 auto var(--space-6) auto',
                            overflow: 'hidden', background: 'var(--bg-deep)', position: 'relative'
                        }}>
                            {isCameraActive ? (
                                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                            ) : facePicPreview ? (
                                <img src={facePicPreview} alt="Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-dim">
                                    <User size={48} />
                                </div>
                            )}

                            {isEditing && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isCameraActive ? 0 : 1 }}>
                                    <button onClick={startCamera} className="btn btn-ghost btn-icon">
                                        <Camera size={24} color="white" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {isCameraActive && (
                            <button onClick={capturePhoto} className="btn btn-primary btn-xs w-full mb-4">CAPTURE IDENTITY</button>
                        )}

                        <div className="flex items-center justify-center gap-2 mb-2">
                            <BadgeCheck size={16} color="var(--status-ok)" />
                            <span style={{ fontWeight: 800, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{user?.full_name?.toUpperCase()}</span>
                        </div>
                        <div className="badge badge-primary">{user?.role?.toUpperCase()}</div>
                    </div>

                    <div className="card" style={{ padding: 'var(--space-4)' }}>
                        <div className="panel-header" style={{ marginBottom: 'var(--space-3)' }}>
                            <Fingerprint size={12} /> ID_CREDENTIAL_UPLOAD
                        </div>
                        <div style={{
                            height: 100, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)',
                            position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.2)'
                        }}>
                            {idBarcodePreview ? (
                                <img src={idBarcodePreview} alt="ID" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-dim"><Upload size={20} /></div>
                            )}
                            {isEditing && (
                                <input type="file" accept="image/*" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Personal Details Form */}
                <div className="card" style={{ padding: 'var(--space-8)' }}>
                    <div className="panel-header" style={{ marginBottom: 'var(--space-6)' }}>
                        <Shield size={12} /> DATA_REGISTRY_FIELDS
                    </div>

                    <form onSubmit={handleSave} className="flex flex-col gap-6">
                        <div className="form-group">
                            <label className="form-label">Email Designation (ReadOnly)</label>
                            <div className="flex items-center gap-3 p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <Mail size={14} color="var(--text-dim)" />
                                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)' }}>{user?.email}</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Full Legal Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                                <input
                                    className="form-input" style={{ paddingLeft: '38px' }}
                                    disabled={!isEditing}
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="form-group">
                                <label className="form-label">Branch (Department)</label>
                                <div style={{ position: 'relative' }}>
                                    <Building2 size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                                    <input
                                        className="form-input" style={{ paddingLeft: '38px' }}
                                        disabled={!isEditing}
                                        value={formData.dept}
                                        onChange={e => setFormData({ ...formData, dept: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Section</label>
                                <div style={{ position: 'relative' }}>
                                    <Layers size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                                    <input
                                        className="form-input" style={{ paddingLeft: '38px' }}
                                        disabled={!isEditing}
                                        value={formData.section}
                                        onChange={e => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Registration Identifier (Reg No)</label>
                            <div style={{ position: 'relative' }}>
                                <Hash size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                                <input
                                    className="form-input" style={{ paddingLeft: '38px' }}
                                    disabled={!isEditing}
                                    value={formData.reg_no}
                                    onChange={e => setFormData({ ...formData, reg_no: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex gap-4 mt-4 animate-fade-in-up">
                                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary flex-1">
                                    <X size={16} /> ABORT_CHANGES
                                </button>
                                <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                                    {loading ? 'SYNCHRONIZING...' : <><Save size={16} /> COMMIT_UPDATES</>}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
