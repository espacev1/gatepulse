import { useState, useEffect } from 'react'
import { 
    Gavel, Star, Users, Trophy, ChevronRight, 
    Save, CheckCircle2, AlertCircle, Info, User
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function JuryPortal({ view = 'live' }) {
    const { user } = useAuth()
    const [event, setEvent] = useState(null)
    const [participants, setParticipants] = useState([])
    const [markedIds, setMarkedIds] = useState(new Set())
    const [selectedParticipant, setSelectedParticipant] = useState(null)
    const [scores, setScores] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [juryProfile, setJuryProfile] = useState(null)

    useEffect(() => {
        fetchJuryContext()
    }, [view])

    const fetchJuryContext = async () => {
        setLoading(true)
        const params = new URLSearchParams(window.location.search)
        const urlEventId = params.get('event_id')
        const profileEventId = user.dept?.startsWith('JURY_EVENT:') ? user.dept.split(':')[1] : null
        
        const eventId = urlEventId || profileEventId
        if (!eventId) {
            console.error('CRITICAL: No event_id resolved for Jury Portal.')
            return setLoading(false)
        }

        const [eventRes, participantsRes, marksRes, juryRes] = await Promise.all([
            supabase.from('events').select('*').eq('id', eventId).single(),
            supabase.from('participants').select(`
                *,
                user:profiles(full_name, email, dept),
                team:teams(name)
            `).eq('event_id', eventId),
            supabase.from('jury_marks')
                .select('participant_id')
                .eq('event_id', eventId)
                .eq('jury_id', params.get('jury_id') || user.id),
            supabase.from('profiles').select('*').eq('id', params.get('jury_id') || user.id).single()
        ])

        if (eventRes.data) {
            setEvent(eventRes.data)
            // Initialize scores based on criteria
            const criteria = eventRes.data.marking_criteria || ['Technical Execution', 'Innovation & Impact', 'Presentation Quality', 'Practical Usability']
            const initialScores = {}
            criteria.forEach(c => initialScores[c] = 0)
            setScores(initialScores)
        }
        if (participantsRes.data) setParticipants(participantsRes.data)
        if (marksRes.data) {
            setMarkedIds(new Set(marksRes.data.map(m => m.participant_id)))
        }
        if (juryRes.data) {
            setJuryProfile(juryRes.data)
        }
        setLoading(false)
    }

    const handleScoreChange = (category, value) => {
        setScores(prev => ({ ...prev, [category]: value }))
    }

    const submitScores = async () => {
        if (!selectedParticipant) return alert('Select a participant/team first.')
        setSaving(true)
        
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
        
        const { error } = await supabase.from('jury_marks').insert([{
            event_id: event.id,
            jury_id: juryProfile?.id || user.id,
            participant_id: selectedParticipant.id,
            marks: scores,
            total_marks: totalScore,
            comments: '' 
        }])

        if (error) alert('Scoring failed: ' + error.message)
        else {
            alert('Verification data committed successfully!')
            const resetScores = {}
            const criteria = event.marking_criteria || ['Technical Execution', 'Innovation & Impact', 'Presentation Quality', 'Practical Usability']
            criteria.forEach(c => resetScores[c] = 0)
            setScores(resetScores)
            setMarkedIds(prev => new Set([...prev, selectedParticipant.id]))
            setSelectedParticipant(null)
            fetchJuryContext()
        }
        setSaving(false)
    }

    if (loading) return <div className="page-container">Loading secure evaluation node...</div>

    if (!event && !loading) {
        return (
            <div className="page-container flex flex-col items-center justify-center text-center p-20">
                <AlertCircle size={48} className="text-warn mb-4" />
                <h1 className="text-2xl font-bold mb-2">SECTOR_NOT_RESOLVED</h1>
                <p className="text-dim max-w-md">The evaluation node could not be synchronized with a specific event. Please ensure the portal was opened with a valid <code>event_id</code>.</p>
                {user.is_super_admin && (
                    <button onClick={() => window.location.href='/admin/jury'} className="btn btn-primary mt-6">
                        RETURN TO ORCHESTRATION
                    </button>
                )}
            </div>
        )
    }

    if (view === 'status') {
        const markedCount = markedIds.size
        const totalCount = participants.length
        const percent = totalCount > 0 ? Math.round((markedCount / totalCount) * 100) : 0

        return (
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Verification Status</h1>
                        <p className="page-subtitle">Progress report for {event?.name}</p>
                    </div>
                </div>

                <div className="grid-3 mb-8">
                    <div className="card">
                        <div className="text-3xl font-bold mb-1">{totalCount}</div>
                        <div className="text-xs text-dim">TOTAL ENTITIES</div>
                    </div>
                    <div className="card">
                        <div className="text-3xl font-bold mb-1 text-success">{markedCount}</div>
                        <div className="text-xs text-dim">EVALUATIONS COMPLETED</div>
                    </div>
                    <div className="card">
                        <div className="text-3xl font-bold mb-1 text-accent">{totalCount - markedCount}</div>
                        <div className="text-xs text-dim">PENDING EVALUATIONS</div>
                    </div>
                </div>

                <div className="card mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm font-bold uppercase tracking-wider">Evaluation Progress</div>
                        <div className="text-2xl font-mono text-accent">{percent}%</div>
                    </div>
                    <div style={{ width: '100%', height: 12, background: 'var(--bg-deepest)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 1s ease' }} />
                    </div>
                </div>

                <div className="card">
                    <div className="panel-header">Entity Verification Status</div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Entity Name</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map(p => (
                                    <tr key={p.id}>
                                        <td className="font-bold">{p.team?.name || p.user?.full_name}</td>
                                        <td className="text-xs font-mono">{p.team ? 'TEAM' : 'SOLO'}</td>
                                        <td>
                                            {markedIds.has(p.id) ? (
                                                <span className="badge badge-success">COMPLETED</span>
                                            ) : (
                                                <span className="badge badge-error">PENDING</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {!markedIds.has(p.id) && (
                                                <button onClick={() => window.location.href='/jury/dashboard'} className="btn btn-ghost btn-xs text-accent">
                                                    Evaluate <ChevronRight size={12} />
                                                </button>
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

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Live Verification</h1>
                    <p className="page-subtitle">
                        Sector: {event?.name} | <span className="text-accent">Node: {juryProfile?.full_name?.replace('JURY: ', '') || 'UNSYNCED'}</span>
                    </p>
                </div>
                <div className="badge badge-success">
                    <Gavel size={14} className="mr-2" /> {user.is_super_admin ? 'SUPER_ADMIN_MODE' : 'SECURE_JURY_AUTH'}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--space-8)' }}>
                {/* Participant List */}
                <div className="card h-[calc(100vh-250px)] flex flex-col">
                    <div className="panel-header">Registered Entities</div>
                    <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                        {participants.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => setSelectedParticipant(p)}
                                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                                    selectedParticipant?.id === p.id 
                                    ? 'border-accent bg-accent-glow' 
                                    : 'border-color hover:border-accent-glow'
                                }`}
                                style={{ position: 'relative' }}
                            >
                                {markedIds.has(p.id) && (
                                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                        <CheckCircle2 size={16} className="text-success" />
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <div className="font-bold flex items-center gap-2">
                                        <div className="w-8 h-8 rounded bg-deepest border border-color flex items-center justify-center">
                                            {p.team ? <Users size={14} /> : <User size={14} />}
                                        </div>
                                        {p.team?.name || p.user?.full_name}
                                    </div>
                                    <ChevronRight size={16} className="text-dim" />
                                </div>
                                {p.team && (
                                    <div className="mt-2 text-[10px] text-dim font-mono">
                                        MEMBER: {p.user?.full_name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scoring Interface */}
                <div className="card">
                    {selectedParticipant ? (
                        <div className="h-full flex flex-col">
                            <div className="panel-header flex justify-between items-center">
                                <span>MARKING_PROTOCOL: {selectedParticipant.team?.name || selectedParticipant.user?.full_name}</span>
                                {markedIds.has(selectedParticipant.id) && (
                                    <span className="badge badge-success">ALREADY_MARKED</span>
                                )}
                                <Trophy size={18} color="var(--secondary)" />
                            </div>

                            <div className="flex flex-col gap-8 flex-1 py-4">
                                {(event?.marking_criteria || ['Technical Execution', 'Innovation & Impact', 'Presentation Quality', 'Practical Usability']).map((label) => (
                                    <div key={label}>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-sm font-bold text-primary uppercase tracking-wider">{label}</label>
                                            <span className="text-xl font-mono text-accent">{scores[label] || 0}/10</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {[...Array(11)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleScoreChange(label, i)}
                                                    className={`w-10 h-10 rounded-lg font-mono text-sm transition-all ${
                                                        scores[label] === i 
                                                        ? 'bg-accent text-bg-deepest border-accent' 
                                                        : 'bg-transparent border border-color text-dim hover:border-accent'
                                                    }`}
                                                >
                                                    {i}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 border-top border-color">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="text-sm font-bold text-dim">AGGREGATED_TOTAL</div>
                                    <div className="text-4xl font-mono text-secondary">
                                        {Object.values(scores).reduce((a, b) => a + b, 0)}<span className="text-lg opacity-30">/{ (event?.marking_criteria?.length || 4) * 10 }</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={submitScores}
                                    disabled={saving || markedIds.has(selectedParticipant.id)}
                                    className="btn btn-primary w-full py-4 text-lg font-bold"
                                >
                                    <Save size={20} className="mr-2" /> 
                                    {saving ? 'COMMITTING SECURE DATA...' : markedIds.has(selectedParticipant.id) ? 'ALREADY EVALUATED' : 'SUBMIT EVALUATION'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-dim text-center p-12">
                            <Gavel size={64} style={{ opacity: 0.1 }} className="mb-6" />
                            <h3 className="text-xl font-bold mb-2">SCORING_STANDBY</h3>
                            <p className="text-sm max-w-[300px]">Select a participant from the left wing to initiate evaluation protocol.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
