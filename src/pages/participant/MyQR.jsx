import { QRCodeCanvas } from 'qrcode.react'
import { useAuth } from '../../contexts/AuthContext'
import { QrCode, Mail, Download, Share2, ShieldCheck, User, Building2, Hash, AlertTriangle } from 'lucide-react'
import ProfileCompletionModal from '../../components/ProfileCompletionModal'

export default function MyQR() {
    const { user } = useAuth()
    const [profileModal, setProfileModal] = useState(false)

    const isProfileComplete = user?.dept && user?.reg_no && user?.face_url && user?.id_barcode_url

    const handleEmailQR = () => {
        // Mocking email triggering - normally this would call a backend service or EmailJS
        alert("Your Digital Entry Credential has been dispatched to: " + user?.email)
    }

    if (!user) return null

    if (!isProfileComplete) {
        return (
            <div className="page-container" style={{ maxWidth: 600, margin: '0 auto' }}>
                <div className="card-glass text-center" style={{ padding: 'var(--space-12)' }}>
                    <AlertTriangle size={48} color="var(--status-warn)" className="mx-auto mb-6" />
                    <h2 className="page-title">Identity Provisioning Incomplete</h2>
                    <p className="page-subtitle mb-8">Your digital entry credential cannot be generated until your profile is fully provisioned with academic and biometric data.</p>
                    <button onClick={() => setProfileModal(true)} className="btn btn-primary">
                        Complete Identity Setup
                    </button>
                </div>
                <ProfileCompletionModal
                    isOpen={profileModal}
                    onClose={() => setProfileModal(false)}
                    user={user}
                    onComplete={() => window.location.reload()}
                />
            </div>
        )
    }

    return (
        <div className="page-container" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="page-header text-center">
                <h1 className="page-title">Digital Entry Credential</h1>
                <p className="page-subtitle">Your unique identity token for secure gate access.</p>
            </div>

            <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <div style={{
                    background: '#fff',
                    padding: 'var(--space-6)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'inline-block',
                    boxShadow: '0 10px 30px rgba(0,212,255,0.2)',
                    marginBottom: 'var(--space-6)'
                }}>
                    <QRCodeCanvas
                        value={user.qr_token || `GP-TEMP-${user.id.slice(0, 8)}`}
                        size={256}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                <div className="badge badge-primary mb-6" style={{ fontSize: 'var(--font-md)', padding: 'var(--space-2) var(--space-4)' }}>
                    <QrCode size={16} /> {user.qr_token || 'INITIALIZING...'}
                </div>

                <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: 'var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: 'var(--space-8)' }}>
                    <div className="flex items-center gap-4 mb-4">
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={20} color="#000" />
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)' }}>REGISTERED ENTITY</div>
                            <div style={{ fontWeight: 700 }}>{user.full_name?.toUpperCase()}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center gap-2" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)' }}>
                                <Building2 size={12} /> DEPARTMENT
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)' }}>{user.dept || 'NOT_ASSIGNED'}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)' }}>
                                <Hash size={12} /> REG NO
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)' }}>{user.reg_no || 'NOT_FOUND'}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button onClick={handleEmailQR} className="btn btn-primary w-full">
                        <Mail size={18} /> Send Credential to Email
                    </button>
                    <div className="flex gap-3">
                        <button onClick={() => window.print()} className="btn btn-secondary flex-1">
                            <Download size={16} /> Save PDF
                        </button>
                        <button className="btn btn-secondary flex-1">
                            <Share2 size={16} /> Share Key
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center" style={{ color: 'var(--text-dim)', fontSize: 'var(--font-xs)' }}>
                <ShieldCheck size={12} className="inline mr-1" />
                SECURE ACCESS TOKEN GENERATED BY GATEPULSE ENCRYPTION ENGINE
            </div>
        </div>
    )
}
