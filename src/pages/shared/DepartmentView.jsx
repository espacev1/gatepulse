import { useState, useEffect } from 'react'
import { Users, Shield, Globe, Lock, Search, Filter, BarChart3, Database } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const DEPARTMENTS = [
    'AIML', 'AIDS', 'IT', 'CSE', 'ECE', 'EEE', 'ME', 'CE', 'CSBS'
]

export default function DepartmentView() {
    const { userProfile } = useAuth()
    const [stats, setStats] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalEntities, setTotalEntities] = useState(0)

    useEffect(() => {
        fetchDeptStats()
    }, [userProfile])

    const fetchDeptStats = async () => {
        setLoading(true)
        try {
            const isRestricted = userProfile?.role === 'faculty' && userProfile?.dept && userProfile.dept !== 'GLOBAL' && userProfile.dept !== 'WAITING_FOR_REGISTRATION'
            const restrictedDept = isRestricted ? userProfile.dept : null

            // 1. Fetch Profiles (User Entities)
            let profileQuery = supabase.from('profiles').select('dept')
            if (restrictedDept) profileQuery = profileQuery.eq('dept', restrictedDept)
            const { data: profiles } = await profileQuery

            // 2. Fetch Participants (Registered Entities)
            let participantQuery = supabase.from('participants').select('profiles(dept)')
            if (restrictedDept) participantQuery = participantQuery.eq('profiles.dept', restrictedDept)
            const { data: participants } = await participantQuery

            // Map and Aggregate
            const deptMap = {}
            const targets = restrictedDept ? [restrictedDept] : DEPARTMENTS

            targets.forEach(d => {
                deptMap[d] = { dept: d, users: 0, registrations: 0 }
            })

            // Unclassified/Global bucket for Admin/Global Faculty
            if (!restrictedDept) {
                deptMap['GLOBAL/UNDETERMINED'] = { dept: 'GLOBAL', users: 0, registrations: 0 }
            }

            profiles?.forEach(p => {
                const d = p.dept && targets.includes(p.dept) ? p.dept : (restrictedDept ? null : 'GLOBAL/UNDETERMINED')
                if (d && deptMap[d]) deptMap[d].users++
            })

            participants?.forEach(p => {
                const d = p.profiles?.dept && targets.includes(p.profiles.dept) ? p.profiles.dept : (restrictedDept ? null : 'GLOBAL/UNDETERMINED')
                if (d && deptMap[d]) deptMap[d].registrations++
            })

            const finalStats = Object.values(deptMap).sort((a, b) => b.registrations - a.registrations)
            setStats(finalStats)
            setTotalEntities(finalStats.reduce((acc, curr) => acc + curr.users, 0))
        } catch (error) {
            console.error('Dept stats error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Departmental Intelligence</h1>
                    <p className="page-subtitle">Granular auditing of entity distribution and registration telemetry.</p>
                </div>
                <div className="flex gap-3">
                    <div className="badge badge-primary">
                        {loading ? 'SYNCING...' : `${totalEntities} TOTAL_ENTITIES`}
                    </div>
                    {userProfile?.dept && userProfile.dept !== 'GLOBAL' && (
                        <div className="badge badge-warning">
                            <Lock size={10} className="mr-1" /> SECTOR_LOCKED: {userProfile.dept}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid-3 mb-8">
                {stats.map((s, i) => (
                    <div key={s.dept} className="stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="stat-card-icon bg-accent-glow">
                            <Database size={20} className="text-accent" />
                        </div>
                        <div className="flex-1">
                            <div className="stat-card-label">{s.dept} BRANCH</div>
                            <div className="stat-card-value text-2xl mt-1">{s.users}</div>
                            <div className="flex items-center gap-3 mt-4">
                                <div className="flex flex-col">
                                    <span style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Users</span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.users}</span>
                                </div>
                                <div style={{ width: 1, height: 20, background: 'var(--border-color)' }} />
                                <div className="flex flex-col">
                                    <span style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Regs</span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>{s.registrations}</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-4 right-4 text-[10px] font-mono text-dim opacity-50">
                            #{i + 1}
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="panel-header">Comparative Matrix</div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Department Branch</th>
                                <th>User Entities (Profiles)</th>
                                <th>Operational Registrations</th>
                                <th>Participation Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-12 text-dim font-mono">SCANNING DEPARTMENTS...</td></tr>
                            ) : stats.map((s, idx) => (
                                <tr key={s.dept} style={{ animation: `fadeInRight 0.4s ease ${idx * 0.05}s both` }}>
                                    <td className="font-bold">{s.dept}</td>
                                    <td>{s.users}</td>
                                    <td className="text-accent font-bold">{s.registrations}</td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="progress-bar-track flex-1" style={{ height: 6 }}>
                                                <div 
                                                    className="progress-bar-fill" 
                                                    style={{ width: `${(s.registrations / (s.users || 1)) * 100}%` }} 
                                                />
                                            </div>
                                            <span style={{ fontSize: '10px', color: 'var(--text-dim)', minWidth: 24 }}>
                                                {Math.round((s.registrations / (s.users || 1)) * 100)}%
                                            </span>
                                        </div>
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
