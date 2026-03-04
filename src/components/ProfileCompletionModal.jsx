import { useState } from 'react'
import { X, Camera, User, Building2, Layers, Hash, Activity, CheckCircle2, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ProfileCompletionModal({ isOpen, onClose, user, onComplete }) {
    const [formData, setFormData] = useState({
        dept: '',
        section: '',
        regNo: ''
    })
    const [idBarcode, setIdBarcode] = useState(null)
    const [facePic, setFacePic] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSave = async (e) => {
        e.preventDefault()
        if (!formData.dept || !formData.section || !formData.regNo || !idBarcode || !facePic) {
            return setError('All identity credentials and captures are required for secure authorization.')
        }

        setLoading(true)
        setError('')
        try {
            const idPath = `barcodes/${Date.now()}-${user.email}.jpg`
            const facePath = `faces/${Date.now()}-${user.email}.jpg`

            const [idUpload, faceUpload] = await Promise.all([
                supabase.storage.from('id-barcodes').upload(idPath, idBarcode),
                supabase.storage.from('face-verification').upload(facePath, facePic)
            ])

            if (idUpload.error) throw idUpload.error
            if (faceUpload.error) throw faceUpload.error

            const idUrl = supabase.storage.from('id-barcodes').getPublicUrl(idPath).data.publicUrl
            const faceUrl = supabase.storage.from('face-verification').getPublicUrl(facePath).data.publicUrl

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    dept: formData.dept,
                    section: formData.section,
                    reg_no: formData.regNo,
                    id_barcode_url: idUrl,
                    face_url: faceUrl,
                    qr_token: user.qr_token || `GP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            onComplete()
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            padding: '20px'
        }}>
            <div className="card-glass animate-fade-in-up" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="panel-header" style={{ justifyContent: 'space-between' }}>
                    <div className="flex items-center gap-2 text-accent">
                        <ShieldCheck size={16} /> Identity Provisioning Required
                    </div>
                </div>

                <div style={{ padding: '24px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '20px' }}>
                        To initialize access to secure sectors, you must provide your academic credentials and biometric verification.
                    </p>

                    {error && (
                        <div className="badge badge-error w-full mb-6" style={{ padding: '8px', borderRadius: '4px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="flex flex-col gap-4">
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <div style={{ position: 'relative' }}>
                                <Building2 size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                <input
                                    className="form-input" style={{ paddingLeft: '36px' }}
                                    placeholder="e.g. Computer Science"
                                    value={formData.dept}
                                    onChange={e => setFormData({ ...formData, dept: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Section</label>
                                <div style={{ position: 'relative' }}>
                                    <Layers size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input
                                        className="form-input" style={{ paddingLeft: '36px' }}
                                        placeholder="Section A"
                                        value={formData.section}
                                        onChange={e => setFormData({ ...formData, section: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reg No</label>
                                <div style={{ position: 'relative' }}>
                                    <Hash size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input
                                        className="form-input" style={{ paddingLeft: '36px' }}
                                        placeholder="2021CS001"
                                        value={formData.regNo}
                                        onChange={e => setFormData({ ...formData, regNo: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="verification-slot">
                                <label className="form-label mb-1 block">ID Barcode</label>
                                <div style={{
                                    height: 100, border: '1px dashed var(--border-color)', borderRadius: '4px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative', background: idBarcode ? 'rgba(0,212,255,0.05)' : 'transparent',
                                    overflow: 'hidden'
                                }}>
                                    {idBarcode ? (
                                        <img src={URL.createObjectURL(idBarcode)} alt="ID" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Camera size={20} style={{ color: 'var(--text-dim)' }} />
                                    )}
                                    <input type="file" accept="image/*" capture="environment" onChange={e => setIdBarcode(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                </div>
                            </div>

                            <div className="verification-slot">
                                <label className="form-label mb-1 block">Live Face</label>
                                <div style={{
                                    height: 100, border: '1px dashed var(--border-color)', borderRadius: '4px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative', background: facePic ? 'rgba(0,212,255,0.05)' : 'transparent',
                                    overflow: 'hidden'
                                }}>
                                    {facePic ? (
                                        <img src={URL.createObjectURL(facePic)} alt="Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={20} style={{ color: 'var(--text-dim)' }} />
                                    )}
                                    <input type="file" accept="image/*" capture="user" onChange={e => setFacePic(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full mt-6" disabled={loading}>
                            {loading ? <Activity className="animate-pulse" size={18} /> : 'PROVISION IDENTITY'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
