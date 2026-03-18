import { useState, useEffect } from 'react'
import {
    Users, Plus, Mail, Link as LinkIcon, Shield,
    UserCircle, Trash2, CheckCircle2, Copy, ExternalLink, Search, Trophy, Medal, Award, Star, TrendingUp, X
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function JuryManagement() {
    const [events, setEvents] = useState([])
    const [juries, setJuries] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showLeaderboard, setShowLeaderboard] = useState(false)
    const [leaderboardData, setLeaderboardData] = useState([])
    const [search, setSearch] = useState('')
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: 'vitpulse@jury',
        event_id: ''
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        const [eventsRes, juriesRes] = await Promise.all([
            supabase.from('events').select('*'),
            supabase.from('profiles').select('*').eq('role', 'jury')
        ])
        if (eventsRes.data) setEvents(eventsRes.data)
        if (juriesRes.data) setJuries(juriesRes.data)
        setLoading(false)
    }

    const fetchLeaderboard = async () => {
        const { data } = await supabase
            .from('jury_marks')
            .select(`
                id, total_marks,
                participant_id (
                    id, team:teams(name),
                    user:profiles(full_name, reg_no)
                ),
                event_id (name)
            `)

        if (data) {
            const map = {}
            data.forEach(m => {
                const pid = m.participant_id?.id
                if (!pid) return
                if (!map[pid]) {
                    map[pid] = {
                        id: pid,
                        name: m.participant_id.team?.name || m.participant_id.user?.full_name,
                        regNo: m.participant_id.user?.reg_no || 'TEAM',
                        eventName: m.event_id?.name,
                        totalScore: 0,
                        count: 0
                    }
                }
                map[pid].totalScore += m.total_marks
                map[pid].count += 1
            })
            const list = Object.values(map)
                .map(item => ({ ...item, avgScore: +(item.totalScore / item.count).toFixed(2) }))
                .sort((a, b) => b.avgScore - a.avgScore)
            setLeaderboardData(list)
        }
    }

    const handleCreateJury = async () => {
        if (!form.name || !form.event_id) return alert('Name and Event are required.')

        const email = `${form.name.toLowerCase().replace(/\s+/g, '')}@vitpulse.jury`
        
        // Check if exists
        const { data: existing } = await supabase.from('profiles').select('*').eq('email', email).single()
        if (existing) return alert('A jury account with this name already exists.')

        // Create a real auth account so we get a valid UUID for the profile
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: form.password,
            options: {
                data: {
                    full_name: `JURY: ${form.name}`,
                    role: 'jury'
                }
            }
        })

        if (signUpError) {
            // If the DB trigger constraint rejects 'jury' role, show a clear fix message
            alert(
                `⚠️ Jury creation failed: ${signUpError.message}\n\n` +
                `This is likely because the database role constraint hasn't been updated.\n\n` +
                `Please run this SQL in your Supabase SQL Editor:\n\n` +
                `ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;\n` +
                `ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin','staff','participant','faculty','jury'));`
            )
            return
        }

        // Upsert the profile with jury role and event mapping
        if (signUpData?.user) {
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: signUpData.user.id,
                full_name: `JURY: ${form.name}`,
                email: email,
                role: 'jury',
                dept: `JURY_EVENT:${form.event_id}`
            }, { onConflict: 'id' })

            if (profileError) {
                alert('Profile sync failed: ' + profileError.message)
                return
            }
        }

        const portalUrl = `${window.location.origin}/jury/login?event_id=${form.event_id}`
        alert(`✅ Jury account created!\n\nEmail: ${email}\nPassword: ${form.password}\n\nPortal Link:\n${portalUrl}`)
        setShowModal(false)
        fetchInitialData()
    }

    const handleDeleteJury = async (id, name) => {
        if (!confirm(`ARE YOU SURE? This will permanently delete the jury account for: ${name}`)) return
        
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (error) {
            alert('Failed to delete account: ' + error.message)
        } else {
            fetchInitialData()
        }
    }

    const copyPortalLink = (jury) => {
        const eventId = jury.dept?.startsWith('JURY_EVENT:') ? jury.dept.split(':')[1] : null
        const url = `${window.location.origin}/jury/login?event_id=${eventId}`
        navigator.clipboard.writeText(url)
        alert('Portal Link copied to clipboard!')
    }

    const filteredEvents = events.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Jury Management</h1>
                    <p className="page-subtitle">Assign jury members to events and generate evaluation links.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { fetchLeaderboard(); setShowLeaderboard(true); }} className="btn btn-secondary">
                        <Trophy size={16} /> VIEW LEADERBOARD
                    </button>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        <Plus size={16} /> ADD JURY ACCOUNT
                    </button>
                </div>
            </div>

            <div className="grid-2 mb-8">
                <div className="card">
                    <div className="panel-header">Active Juries</div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Jury Name</th>
                                    <th>Target Event</th>
                                    <th>Portal Link</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {juries.map(jury => {
                                    const eventId = jury.dept?.startsWith('JURY_EVENT:') ? jury.dept.split(':')[1] : (events[0]?.id || 'UNASSIGNED')
                                    const event = events.find(e => e.id === eventId)
                                    const portalUrl = `${window.location.origin}/jury/login?event_id=${eventId}&jury_id=${jury.id}`
                                    return (
                                        <tr key={jury.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-secondary-glow border border-secondary rounded">
                                                        <Shield size={14} color="var(--secondary)" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{jury.full_name}</div>
                                                        <div className="text-xs text-dim">{jury.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-info">{event?.name || 'GLOBAL'}</span>
                                            </td>
                                            <td>
                                                <div style={{ 
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '4px 8px', borderRadius: 'var(--radius-md)',
                                                    background: 'rgba(255,40,40,0.05)', border: '1px solid rgba(255,40,40,0.15)',
                                                    maxWidth: 280
                                                }}>
                                                    <LinkIcon size={10} color="var(--accent)" style={{ flexShrink: 0 }} />
                                                    <span style={{ 
                                                        fontSize: '9px', fontFamily: 'var(--font-mono)', 
                                                        color: 'var(--accent)', overflow: 'hidden',
                                                        textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                    }}>
                                                        {portalUrl}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => copyPortalLink(jury)} 
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ fontSize: '10px', gap: 4, padding: '4px 10px' }}
                                                    >
                                                        <Copy size={12} /> Copy
                                                    </button>
                                                    <a 
                                                        href={`/jury/login?event_id=${eventId}&jury_id=${jury.id}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="btn btn-primary btn-sm"
                                                        style={{ fontSize: '10px', gap: 4, padding: '4px 10px', textDecoration: 'none' }}
                                                    >
                                                        <ExternalLink size={12} /> Open Portal
                                                    </a>
                                                    <button 
                                                        onClick={() => handleDeleteJury(jury.id, jury.full_name)} 
                                                        className="btn btn-icon btn-sm text-error"
                                                        style={{ border: '1px solid rgba(255,40,40,0.1)' }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {juries.length === 0 && (
                                    <tr><td colSpan="4" className="text-center py-8 text-dim">No juries found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <div className="panel-header">Event Status for Evaluation</div>
                    <div className="search-bar mb-4">
                        <Search size={14} />
                        <input placeholder="Filter events..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
                        {filteredEvents.map(event => {
                            const hasJury = juries.some(j => j.dept === `JURY_EVENT:${event.id}`)
                            return (
                                <div key={event.id} className="p-3 border border-color rounded-lg hover:border-accent transition-colors">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-sm">{event.name}</span>
                                        <span className={`text-[10px] font-bold ${event.status === 'active' ? 'text-ok' : 'text-dim'}`}>
                                            {event.status?.toUpperCase() || 'DRAFT'}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-dim flex justify-between items-center">
                                        <span>REGISTERED: {event.registered_count || 0}</span>
                                        <div className="flex gap-2 items-center">
                                            {hasJury && (
                                                <a 
                                                    href={`/jury/login?event_id=${event.id}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        fontSize: '10px', fontWeight: 700, color: 'var(--secondary)',
                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    <ExternalLink size={10} /> OPEN PORTAL
                                                </a>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    setForm({ ...form, event_id: event.id, name: `${event.name} Jury` })
                                                    setShowModal(true)
                                                }}
                                                className="text-accent hover:underline font-bold"
                                            >SET JURY</button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">ADD JURY ACCOUNT</h2>
                            <button onClick={() => setShowModal(false)} className="btn-icon">×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Jury Designation (Name)</label>
                                <input 
                                    className="form-input" 
                                    placeholder="e.g. Technical Track A" 
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Target Event</label>
                                <select 
                                    className="form-select"
                                    value={form.event_id}
                                    onChange={e => setForm({ ...form, event_id: e.target.value })}
                                >
                                    <option value="">Select Event...</option>
                                    {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group border border-color p-3 rounded-lg bg-deepest">
                                <div className="text-[10px] font-bold text-dim mb-2">GENERATED CREDENTIALS</div>
                                <div className="text-xs text-accent font-mono mb-1">
                                    EMAIL: {form.name ? `${form.name.toLowerCase().replace(/\s+/g, '')}@vitpulse.jury` : '...'}
                                </div>
                                <div className="text-xs text-warn font-mono">
                                    PASSWORD: {form.password}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">CANCEL</button>
                            <button onClick={handleCreateJury} className="btn btn-primary">CREATE JURY ACCOUNT</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leaderboard Modal */}
            {showLeaderboard && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '900px', border: '1px solid var(--accent)' }}>
                        <div className="modal-header">
                            <h2 className="modal-title flex items-center gap-2"><Trophy size={20} color="var(--accent)" /> GLOBAL LEADERBOARD</h2>
                            <button onClick={() => setShowLeaderboard(false)} className="btn-icon"><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Participant Name</th>
                                            <th>Registration ID</th>
                                            <th>Sector</th>
                                            <th style={{ textAlign: 'right' }}>V-Score (AVG)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboardData.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-12 text-dim">NO SCORE DATA FOUND</td></tr>
                                        ) : leaderboardData.map((item, i) => (
                                            <tr key={item.id} style={{ background: i === 0 ? 'rgba(255, 40, 40, 0.03)' : 'transparent' }}>
                                                <td>
                                                    <div className="flex items-center justify-center">
                                                        {i === 0 ? <Medal size={18} color="var(--accent)" /> : 
                                                         i === 1 ? <Award size={16} color="var(--secondary)" /> : 
                                                         <span className="font-mono text-dim text-xs">#{(i+1)}</span>}
                                                    </div>
                                                </td>
                                                <td className="font-bold">{item.name}</td>
                                                <td className="font-mono text-[10px] text-dim">{item.regNo}</td>
                                                <td className="text-xs">{item.eventName}</td>
                                                <td style={{ textAlign: 'right' }} className="font-mono font-bold text-accent text-lg">
                                                    {item.avgScore}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
