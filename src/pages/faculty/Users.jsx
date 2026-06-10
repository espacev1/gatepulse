import { useState, useEffect } from 'react'
import { Search, Shield, User, ShieldCheck, Activity, UserCog, Info } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const ROLE_LEVELS = {
    participant: { label: 'Participant', level: 1, color: 'var(--status-info)', bg: 'var(--status-info-bg)', border: 'var(--status-info-border)' },
    staff: { label: 'Operational Staff', level: 2, color: 'var(--status-warn)', bg: 'var(--status-warn-bg)', border: 'var(--status-warn-border)' },
    faculty: { label: 'Faculty Advisor', level: 3, color: 'var(--secondary)', bg: 'rgba(234, 139, 6, 0.1)', border: 'rgba(234, 139, 6, 0.3)' },
    jury: { label: 'Jury', level: 3, color: 'var(--accent)', bg: 'rgba(255, 40, 40, 0.1)', border: 'rgba(255, 40, 40, 0.3)' },
    admin: { label: 'Administrator', level: 4, color: 'var(--status-critical)', bg: 'var(--status-critical-bg)', border: 'var(--status-critical-border)' },
}

export default function FacultyUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterRole, setFilterRole] = useState('all')

    useEffect(() => {
        fetchUsers()
        const channel = supabase
            .channel('profiles-faculty-sync')
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
        if (data) setUsers(data)
        setLoading(false)
    }

    const filtered = users.filter(u => {
        const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        const matchesRole = filterRole === 'all' || u.role === filterRole
        return matchesSearch && matchesRole
    })

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Identity Directory</h1>
                    <p className="page-subtitle">Broad oversight of all system entities and their designated roles.</p>
                </div>
                <div className="badge badge-primary">
                    {loading ? 'SYNCING...' : `${filtered.length} IDENTITIES DETECTED`}
                </div>
            </div>

            <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
                <div className="flex gap-4 flex-wrap" style={{ alignItems: 'center' }}>
                    <div className="search-bar flex-1">
                        <Search size={18} />
                        <input placeholder="Search entities..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-select" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
                        <option value="all">POSITION: ALL</option>
                        <option value="admin">ADMIN</option>
                        <option value="staff">STAFF</option>
                        <option value="faculty">FACULTY</option>
                        <option value="jury">JURY</option>
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
                                <th>Designated Position</th>
                                <th>Registration Date</th>
                                <th style={{ textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && users.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>SCANNING DIRECTORY...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>NO MATCHES FOUND</td></tr>
                            ) : filtered.map((u, i) => {
                                const roleInfo = ROLE_LEVELS[u.role] || ROLE_LEVELS.participant

                                return (
                                    <tr key={u.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.02}s both` }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: `1px solid rgba(255,255,255,0.05)`,
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
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '4px 12px', fontSize: '11px', fontWeight: 800,
                                                borderRadius: 'var(--radius-lg)', letterSpacing: '0.06em',
                                                background: roleInfo.bg, color: roleInfo.color, border: `2px solid ${roleInfo.border}`,
                                                textTransform: 'uppercase', boxShadow: `0 0 10px ${roleInfo.bg}`
                                            }}>
                                                <Shield size={12} /> {roleInfo.label}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: 'var(--status-ok)' }}>
                                                <Activity size={10} /> VERIFIED
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 flex items-center gap-3 p-4 bg-accent-glow border border-accent border-opacity-20 rounded-xl">
                <Info size={16} color="var(--accent)" />
                <p className="text-[11px] text-accent font-medium">As a Faculty Advisor, you have read-only permissions for identity management. Privilege escalation is restricted to Administrative nodes.</p>
            </div>
        </div>
    )
}
