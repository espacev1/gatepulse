import { useState, useEffect, useRef } from 'react'
import { Search, Shield, User, ShieldCheck, Activity, UserCog, ArrowUpRight, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ROLE_LEVELS = {
    participant: { label: 'Participant', level: 1, color: 'var(--status-info)', bg: 'var(--status-info-bg)', border: 'var(--status-info-border)' },
    staff: { label: 'Operational Staff', level: 2, color: 'var(--status-warn)', bg: 'var(--status-warn-bg)', border: 'var(--status-warn-border)' },
    admin: { label: 'Administrator', level: 3, color: 'var(--status-critical)', bg: 'var(--status-critical-bg)', border: 'var(--status-critical-border)' },
}

export default function AdminUsers() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [escalatingUser, setEscalatingUser] = useState(null)
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
    const escalateBtnRefs = useRef({})

    useEffect(() => {
        fetchUsers()
        const channel = supabase
            .channel('profiles-admin-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
        if (error) console.error('Failed to fetch users:', error)
        if (data) setUsers(data)
        setLoading(false)
    }

    const escalateRole = async (userId, newRole) => {
        if (!currentUser?.is_super_admin) return alert('Only Super Admins can modify privilege levels.')
        if (userId === currentUser.id) return alert('You cannot modify your own privileges.')
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
        if (error) alert('Escalation failed: ' + error.message)
        else { setEscalatingUser(null); fetchUsers() }
    }

    const handleEscalateClick = (userId) => {
        if (escalatingUser === userId) {
            setEscalatingUser(null)
            return
        }
        const btn = escalateBtnRefs.current[userId]
        if (btn) {
            const rect = btn.getBoundingClientRect()
            setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
        }
        setEscalatingUser(userId)
    }

    const filtered = users.filter(u => {
        const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        const matchesRole = filterRole === 'all' || u.role === filterRole
        return matchesSearch && matchesRole
    })

    const escalatingUserData = users.find(u => u.id === escalatingUser)

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Entity Management</h1>
                    <p className="page-subtitle">Administrative oversight of all system identities and clearance levels.</p>
                </div>
                <div className="badge badge-primary">
                    {loading ? 'SYNCING...' : `${filtered.length} IDENTITIES DETECTED`}
                </div>
            </div>

            <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
                <div className="flex gap-4 flex-wrap" style={{ alignItems: 'center' }}>
                    <div className="search-bar flex-1">
                        <Search size={18} />
                        <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-select" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
                        <option value="all">CLEARANCE: ALL</option>
                        <option value="admin">ADMIN</option>
                        <option value="staff">STAFF</option>
                        <option value="participant">PARTICIPANT</option>
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Identity</th>
                                <th>Clearance Level</th>
                                <th>Deployment Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Privilege Escalation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && users.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>SCANNING DATABASE...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>NO IDENTITIES MATCHING QUERY</td></tr>
                            ) : filtered.map((u, i) => {
                                const roleInfo = ROLE_LEVELS[u.role] || ROLE_LEVELS.participant
                                const isCurrentUser = u.id === currentUser?.id

                                return (
                                    <tr key={u.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.03}s both` }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: `1px solid ${u.role === 'admin' ? 'rgba(255,255,255,0.2)' : u.role === 'staff' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {u.role === 'admin' ? <Shield size={16} color="var(--secondary)" /> :
                                                        u.role === 'staff' ? <UserCog size={16} color="var(--status-warn)" /> :
                                                            <User size={16} color="var(--text-dim)" />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                padding: '2px 10px', fontSize: '10px', fontWeight: 700,
                                                borderRadius: 'var(--radius-full)', letterSpacing: '0.04em',
                                                background: roleInfo.bg, color: roleInfo.color, border: `1px solid ${roleInfo.border}`,
                                                textTransform: 'uppercase'
                                            }}>
                                                {roleInfo.label}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: 'var(--status-ok)' }}>
                                                <Activity size={10} /> ACTIVE
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {isCurrentUser ? (
                                                <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>SUPER ADMIN</span>
                                            ) : currentUser?.is_super_admin ? (
                                                <button
                                                    ref={el => escalateBtnRefs.current[u.id] = el}
                                                    onClick={() => handleEscalateClick(u.id)}
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ gap: '6px', fontSize: '11px' }}
                                                >
                                                    <ArrowUpRight size={13} />
                                                    Escalate
                                                    <ChevronDown size={12} style={{
                                                        transform: escalatingUser === u.id ? 'rotate(180deg)' : 'none',
                                                        transition: 'transform 0.2s ease'
                                                    }} />
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fixed-position dropdown rendered OUTSIDE the table */}
            {escalatingUser && escalatingUserData && (
                <>
                    <div onClick={() => setEscalatingUser(null)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                    <div style={{
                        position: 'fixed',
                        top: dropdownPos.top,
                        right: dropdownPos.right,
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '6px',
                        minWidth: '200px',
                        zIndex: 999,
                        boxShadow: 'var(--shadow-xl)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        animation: 'fadeIn 0.15s ease'
                    }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-dim)', padding: '6px 10px 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            SET CLEARANCE LEVEL
                        </div>
                        {Object.entries(ROLE_LEVELS).map(([roleKey, info]) => (
                            <button
                                key={roleKey}
                                onClick={() => escalateRole(escalatingUser, roleKey)}
                                disabled={escalatingUserData.role === roleKey}
                                style={{
                                    width: '100%', textAlign: 'left',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 10px', borderRadius: 'var(--radius-md)',
                                    background: escalatingUserData.role === roleKey ? 'rgba(255,40,40,0.08)' : 'transparent',
                                    border: escalatingUserData.role === roleKey ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                                    color: escalatingUserData.role === roleKey ? 'var(--accent)' : 'var(--text-secondary)',
                                    cursor: escalatingUserData.role === roleKey ? 'default' : 'pointer',
                                    fontSize: '13px', fontWeight: 500,
                                    fontFamily: 'var(--font-family)',
                                    transition: 'all 0.15s ease',
                                    opacity: escalatingUserData.role === roleKey ? 0.5 : 1,
                                    marginBottom: '2px'
                                }}
                                onMouseOver={(e) => { if (escalatingUserData.role !== roleKey) e.currentTarget.style.background = 'rgba(255,40,40,0.06)' }}
                                onMouseOut={(e) => { if (escalatingUserData.role !== roleKey) e.currentTarget.style.background = 'transparent' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.color, flexShrink: 0 }} />
                                    {info.label}
                                </span>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                                    LVL {info.level}
                                </span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
