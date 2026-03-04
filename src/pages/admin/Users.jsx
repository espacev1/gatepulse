import { useState, useEffect } from 'react'
import { Search, Shield, User, Mail, ShieldCheck, Activity, Trash2, UserCog, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminUsers() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterRole, setFilterRole] = useState('all')

    useEffect(() => {
        fetchUsers()

        const channel = supabase
            .channel('profiles-admin-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
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

    const updateRole = async (userId, newRole) => {
        if (!currentUser?.is_super_admin) return alert('Priority Authorization Required: Only Super Admins can reclassify entity roles.')
        if (userId === currentUser.id) return alert('Internal Conflict: You cannot reclassify your own root credentials.')

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)

        if (error) alert('Redeployment Failed: ' + error.message)
        else fetchUsers()
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
                    <h1 className="page-title">Entity Management</h1>
                    <p className="page-subtitle">Administrative oversight of all system identities and clearance levels.</p>
                </div>
                <div className="badge badge-primary">
                    {loading ? 'SYNCING...' : `${filtered.length} IDENTITIES DETECTED`}
                </div>
            </div>

            <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
                <div className="flex gap-4 flex-wrap">
                    <div className="search-bar flex-1">
                        <Search size={18} />
                        <input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-select"
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        style={{ width: 'auto', minWidth: 160 }}
                    >
                        <option value="all">CLEARANCE: ALL</option>
                        <option value="admin">ADMIN</option>
                        <option value="staff">STAFF</option>
                        <option value="participant">PARTICIPANT</option>
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Identity</th>
                                <th>Clearance Level</th>
                                <th>Deployment Date</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && users.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12 text-dim font-mono">SCANNING DATABASE...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12 text-dim font-mono">NO IDENTITIES MATCHING QUERY</td></tr>
                            ) : filtered.map((u, i) => (
                                <tr key={u.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.03}s both` }}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                                                background: u.role === 'admin' ? 'var(--secondary-glow)' : 'var(--bg-elevated)',
                                                border: `1px solid ${u.role === 'admin' ? 'var(--secondary)' : 'var(--border-color)'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {u.role === 'admin' ? <Shield size={16} color="var(--secondary)" /> : <User size={16} color="var(--text-dim)" />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${u.role === 'admin' ? 'badge-error' :
                                            u.role === 'staff' ? 'badge-warning' :
                                                'badge-info'
                                            }`} style={{ fontSize: '10px' }}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-dim)', fontFileName: 'var(--font-mono)' }}>
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1 text-status-ok" style={{ fontSize: '10px', fontWeight: 700 }}>
                                            <Activity size={10} /> ENCRYPTED
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        {currentUser?.is_super_admin && u.id !== currentUser.id && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => updateRole(u.id, u.role === 'participant' ? 'staff' : 'participant')}
                                                    className="btn btn-ghost btn-xs"
                                                    title={u.role === 'participant' ? 'Promote to Staff' : 'Revert to Participant'}
                                                >
                                                    <UserCog size={14} />
                                                </button>
                                                <button
                                                    onClick={() => updateRole(u.id, u.role === 'admin' ? 'participant' : 'admin')}
                                                    className="btn btn-ghost btn-xs"
                                                    title={u.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}
                                                    style={{ color: u.role === 'admin' ? 'var(--status-critical)' : 'var(--accent)' }}
                                                >
                                                    <Shield size={14} />
                                                </button>
                                            </div>
                                        )}
                                        {u.id === currentUser.id && (
                                            <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontStyle: 'italic' }}>PRIMARY_ENTITY</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
