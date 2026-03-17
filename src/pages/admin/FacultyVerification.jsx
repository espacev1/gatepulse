import { useState, useEffect } from 'react'
import { 
    UserPlus, Mail, Shield, CheckCircle2, 
    XCircle, Clock, Search, Filter, Trash2, Lock, User, Eye, EyeOff 
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const DEPARTMENTS = [
    'AIML', 'AIDS', 'IT', 'CSE', 'ECE', 'EEE', 'ME', 'CE', 'CSBS'
]

export default function FacultyVerification() {
    const [faculties, setFaculties] = useState([])
    const [loading, setLoading] = useState(true)
    const [provisioning, setProvisioning] = useState(false)
    const [search, setSearch] = useState('')
    const [emailInput, setEmailInput] = useState('')
    const [nameInput, setNameInput] = useState('')
    const [passwordInput, setPasswordInput] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [provisionDept, setProvisionDept] = useState('GLOBAL')
    const [editingDept, setEditingDept] = useState(null)

    useEffect(() => {
        fetchFaculties()
    }, [])

    const fetchFaculties = async () => {
        setLoading(true)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'faculty')

        const { data: whitelist } = await supabase
            .from('faculty_whitelist')
            .select('*')

        const combined = [
            ...(profiles || []).map(p => ({ ...p, status: 'VERIFIED_ADVISOR', type: 'profile' })),
            ...(whitelist || []).map(w => ({ 
                id: w.email, 
                email: w.email, 
                full_name: w.full_name || 'WHITELISTED_PENDING', 
                dept: 'WAITING_FOR_REGISTRATION',
                status: 'WHITELISTED',
                type: 'whitelist'
            }))
        ]

        const registeredEmails = new Set((profiles || []).map(p => p.email.toLowerCase()))
        const filtered = combined.filter(item => {
            if (item.type === 'whitelist') return !registeredEmails.has(item.email.toLowerCase())
            return true
        })

        setFaculties(filtered)
        setLoading(false)
    }

    const handleProvision = async () => {
        if (!emailInput || !emailInput.includes('@')) {
            return alert('Enter a valid faculty email.')
        }

        const email = emailInput.trim().toLowerCase()
        setProvisioning(true)

        try {
            // 1. Check if user already exists
            const { data: existing } = await supabase.from('profiles').select('*').eq('email', email).single()

            if (existing) {
                if (existing.role === 'faculty') {
                    alert('This email is already verified as faculty.')
                    return
                }
                
                const { error: upgradeError } = await supabase
                    .from('profiles')
                    .update({ role: 'faculty' })
                    .eq('id', existing.id)
                
                if (upgradeError) alert('Upgrade failed: ' + upgradeError.message)
                else {
                    alert('✅ Existing user upgraded to Faculty Advisor!')
                    setEmailInput('')
                    setNameInput('')
                    setPasswordInput('')
                    fetchFaculties()
                }
            } else {
                // 2. Create a full account if password is provided
                if (passwordInput && passwordInput.length >= 6 && nameInput) {
                    // Try to create auth account via signUp
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email,
                        password: passwordInput,
                        options: {
                            data: {
                                full_name: nameInput,
                                role: 'faculty',
                                dept: provisionDept
                            }
                        }
                    })

                    if (!signUpError && signUpData?.user) {
                        // Account created successfully, upsert profile
                        await supabase.from('profiles').upsert({
                            email: email,
                            full_name: nameInput,
                            role: 'faculty',
                            dept: provisionDept
                        }, { onConflict: 'id' })

                        // Also add to whitelist as backup
                        await supabase.from('faculty_whitelist').upsert(
                            [{ email, full_name: nameInput }],
                            { onConflict: 'email' }
                        )

                        alert(`✅ Faculty account created!\n\nEmail: ${email}\nPassword: ${passwordInput}\nName: ${nameInput}\n\nThe advisor can now log in immediately.`)
                    } else {
                        // SignUp failed (likely DB trigger constraint) — fall back to whitelist
                        console.warn('SignUp failed, falling back to whitelist:', signUpError?.message)
                        
                        await supabase.from('faculty_whitelist').upsert(
                            [{ email, full_name: nameInput }],
                            { onConflict: 'email' }
                        )

                        alert(`📋 Note: Direct account creation failed (database constraint).\n\nThe email has been WHITELISTED instead.\nThe advisor should register at the login page with:\n  Email: ${email}\n  Password: (they choose their own)\n\nThey will be auto-promoted to Faculty on first login.`)
                    }
                } else {
                    // 3. Whitelist-only mode (no password)
                    const { error: insertError } = await supabase
                        .from('faculty_whitelist')
                        .upsert([{ email, full_name: nameInput || null, dept: provisionDept }], { onConflict: 'email' })
                    
                    if (insertError) {
                        if (insertError.code === '23505') {
                            alert('This email is already on the whitelist.')
                            return
                        }
                        alert('Whitelist failed: ' + insertError.message)
                        return
                    }
                    alert('📋 Email added to Faculty Whitelist.\nThe advisor will need to register with this email to gain access.')
                }

                setEmailInput('')
                setNameInput('')
                setPasswordInput('')
                fetchFaculties()
            }
        } finally {
            setProvisioning(false)
        }
    }

    const revokeAccess = async (item) => {
        if (!window.confirm(`Revoke faculty credentials for ${item.email}?`)) return
        
        let error
        if (item.type === 'profile') {
            const { error: err } = await supabase.from('profiles').update({ role: 'participant' }).eq('id', item.id)
            error = err
        } else {
            const { error: err } = await supabase.from('faculty_whitelist').delete().eq('email', item.email)
            error = err
        }

        if (error) alert('Revocation failed: ' + error.message)
        else fetchFaculties()
    }

    const updateDept = async (item, newDept) => {
        let error
        if (item.type === 'profile') {
            const { error: err } = await supabase.from('profiles').update({ dept: newDept }).eq('id', item.id)
            error = err
        }
        
        // Always update whitelist too
        const { error: wError } = await supabase.from('faculty_whitelist').update({ dept: newDept }).eq('email', item.email)
        if (!error) error = wError

        if (error) alert('Update failed: ' + error.message)
        else fetchFaculties()
        setEditingDept(null)
    }

    const filtered = faculties.filter(f => f.email.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Faculty Advisor Verification</h1>
                    <p className="page-subtitle">Provision secure credentials and whitelist faculty identities for sector oversight.</p>
                </div>
            </div>

            <div className="grid-3 mb-8">
                <div className="card col-span-1">
                    <div className="panel-header">Provision New Identity</div>
                    
                    <div className="form-group">
                        <label className="form-label">Institute Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                            <input 
                                className="form-input" 
                                style={{ paddingLeft: 34 }}
                                placeholder="name@vishnu.edu.in" 
                                value={emailInput}
                                onChange={e => setEmailInput(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input 
                                className="form-input" 
                                style={{ paddingLeft: 34 }}
                                placeholder="Dr. Faculty Name" 
                                value={nameInput}
                                onChange={e => setNameInput(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Login Password
                            <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: 400, marginLeft: 8 }}>
                                (min 6 chars)
                            </span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input 
                                className="form-input" 
                                style={{ paddingLeft: 34, paddingRight: 38 }}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••" 
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                            />
                            <button 
                                onClick={() => setShowPassword(!showPassword)}
                                className="btn-icon"
                                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sector Locking (Department)</label>
                        <select 
                            className="form-select"
                            value={provisionDept}
                            onChange={e => setProvisionDept(e.target.value)}
                        >
                            <option value="GLOBAL">🌐 GLOBAL ACCESS</option>
                            {DEPARTMENTS.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <p style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: 4 }}>
                            Restricts faculty views to this specific branch.
                        </p>
                    </div>

                    <button 
                        onClick={handleProvision} 
                        className="btn btn-primary w-full"
                        disabled={provisioning}
                        style={{ marginTop: 'var(--space-4)' }}
                    >
                        <UserPlus size={16} />
                        {provisioning ? 'PROVISIONING...' : passwordInput ? 'CREATE ACCOUNT & WHITELIST' : 'WHITELIST ONLY'}
                    </button>

                    <div style={{ 
                        marginTop: 'var(--space-4)', padding: 'var(--space-3)',
                        background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <p style={{ fontSize: '10px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                            <Shield size={10} style={{ display: 'inline', marginRight: 4 }} />
                            <strong>With password:</strong> Creates a full login account. Advisor can sign in immediately.
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 4 }}>
                            <Shield size={10} style={{ display: 'inline', marginRight: 4 }} />
                            <strong>Without password:</strong> Whitelist only. Advisor must register with this email to gain access.
                        </p>
                    </div>
                </div>

                <div className="card col-span-2">
                    <div className="panel-header">Verified Faculty Registry</div>
                    <div className="search-bar mb-4">
                        <Search size={14} />
                        <input placeholder="Search registry..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Faculty Identity</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="3" className="text-center py-8 text-dim font-mono">SCANNING REGISTRY...</td></tr>
                                ) : filtered.map(f => (
                                    <tr key={f.id}>
                                        <td>
                                            <div className="font-bold text-sm">{f.email}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-dim">{f.full_name}</span>
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-accent-glow rounded text-[9px] text-accent font-bold">
                                                    <Lock size={8} />
                                                    {editingDept === f.id ? (
                                                        <select 
                                                            autoFocus
                                                            className="bg-transparent border-none outline-none p-0 text-[10px] text-white"
                                                            value={f.dept || 'GLOBAL'}
                                                            onChange={(e) => updateDept(f, e.target.value)}
                                                            onBlur={() => setEditingDept(null)}
                                                        >
                                                            <option value="GLOBAL">GLOBAL</option>
                                                            {DEPARTMENTS.map(d => (
                                                                <option key={d} value={d}>{d}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span 
                                                            className="cursor-pointer hover:underline"
                                                            onClick={() => setEditingDept(f.id)}
                                                        >
                                                            {f.dept || 'GLOBAL'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${f.type === 'profile' ? 'badge-success' : 'badge-warning'} text-[10px]`}>
                                                {f.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button onClick={() => revokeAccess(f)} className="btn btn-ghost btn-icon text-critical">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filtered.length === 0 && (
                                    <tr><td colSpan="3" className="text-center py-8 text-dim">No verified faculty nodes found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
