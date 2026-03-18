import { useState, useEffect } from 'react'
import { 
    Gavel, Trophy, Search, Activity, 
    ArrowUpRight, Star, TrendingUp, Filter,
    Users, Medal, Award
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function FacultyJuryLive() {
    const [events, setEvents] = useState([])
    const [selectedEventId, setSelectedEventId] = useState('all')
    const [leaderboard, setLeaderboard] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchEvents()
        fetchLeaderboard()

        const channel = supabase
            .channel('faculty-jury-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jury_marks' }, () => fetchLeaderboard())
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [selectedEventId])

    const fetchEvents = async () => {
        const { data } = await supabase.from('events').select('id, name')
        if (data) setEvents(data)
    }

    const fetchLeaderboard = async () => {
        setLoading(true)
        
        let query = supabase
            .from('jury_marks')
            .select(`
                id,
                total_marks,
                participant_id (
                    id,
                    team:teams(name),
                    user:profiles(full_name, reg_no)
                ),
                event_id (name)
            `)

        if (selectedEventId !== 'all') {
            query = query.eq('event_id', selectedEventId)
        }

        const { data } = await query

        if (data) {
            // Aggregate marks by participant
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
                .map(item => ({
                    ...item,
                    avgScore: +(item.totalScore / item.count).toFixed(2)
                }))
                .sort((a, b) => {
                    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore
                    return a.name.localeCompare(b.name)
                })

            setLeaderboard(list)
        }
        setLoading(false)
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Jury Live Standings</h1>
                    <p className="page-subtitle">Real-time aggregation of scoring updates and competitive standing.</p>
                </div>
            </div>

            <div className="grid-4 mb-8">
                <div className="stat-card">
                    <div className="w-full">
                        <div className="stat-card-label">EVENTS_SCORED</div>
                        <div className="stat-card-value">{leaderboard.length}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="w-full">
                        <div className="stat-card-label">HIGHEST SCORE</div>
                        <div className="stat-card-value text-secondary">{leaderboard[0]?.avgScore || 0}</div>
                    </div>
                </div>
                <div className="stat-card" style={{ gridColumn: 'span 2' }}>
                    <div className="w-full flex justify-between items-center">
                        <div>
                            <div className="stat-card-label">EVENT FILTER</div>
                            <select 
                                className="form-select mt-2" 
                                value={selectedEventId} 
                                onChange={e => setSelectedEventId(e.target.value)}
                                style={{ background: 'var(--bg-deepest)', border: '1px solid var(--border-color)', width: '200px' }}
                            >
                                <option value="all">ALL EVENTS</option>
                                {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <Filter size={24} className="opacity-20" />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div className="panel-header" style={{ padding: 'var(--space-6)' }}>
                    <div className="flex justify-between items-center w-full">
                        <span className="flex items-center gap-2"><Trophy size={18} color="var(--accent)" /> EVENT LEADERBOARD</span>
                        <div className="badge badge-success animate-pulse">LIVE UPDATES</div>
                    </div>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Rank</th>
                                <th>Participant</th>
                                <th>Registration ID</th>
                                <th>Event Name</th>
                                <th style={{ textAlign: 'right' }}>Score (AVG)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan="5" className="text-center py-16 text-dim font-mono">UPDATING STANDINGS...</td></tr>
                            )}
                            {!loading && leaderboard.length === 0 && (
                                <tr><td colSpan="5" className="text-center py-16 text-dim font-mono">NO SCORES FOUND</td></tr>
                            )}
                            {leaderboard.map((item, i) => (
                                <tr key={item.id} style={{ 
                                    animation: `fadeIn 0.4s ease ${i * 0.05}s both`,
                                    background: i === 0 ? 'rgba(255, 40, 40, 0.03)' : i === 1 ? 'rgba(234, 139, 6, 0.03)' : i === 2 ? 'rgba(0, 204, 255, 0.03)' : 'transparent'
                                }}>
                                    <td>
                                        <div className="flex items-center justify-center">
                                            {i === 0 ? <Medal size={20} color="var(--accent)" /> : 
                                             i === 1 ? <Award size={18} color="var(--secondary)" /> : 
                                             i === 2 ? <Star size={18} color="var(--status-info)" /> : 
                                             <span className="font-mono text-dim">#{(i + 1).toString().padStart(2, '0')}</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-bold text-primary">{item.name}</div>
                                    </td>
                                    <td>
                                        <span className="font-mono text-[11px] text-dim">{item.regNo}</span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="live-dot" />
                                            <span style={{ fontSize: '11px', fontWeight: 600 }}>{item.eventName}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="flex items-center justify-end gap-2">
                                            <TrendingUp size={14} className="text-accent" />
                                            <span className="text-xl font-bold font-mono text-accent">{item.avgScore}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 grid-2 gap-6">
                <div className="p-6 bg-accent-glow border border-accent border-opacity-20 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp size={24} color="var(--accent)" />
                        <h3 className="text-lg font-bold">Scoring Method</h3>
                    </div>
                    <p className="text-sm text-dim leading-relaxed">The leaderboard aggregates scores from all assigned juries per event. Ranks are determined by the average of all recorded scores to ensure fairness.</p>
                </div>
                <div className="p-6 bg-secondary-glow border border-secondary border-opacity-20 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity size={24} color="var(--secondary)" />
                        <h3 className="text-lg font-bold">Live Updates</h3>
                    </div>
                    <p className="text-sm text-dim leading-relaxed">Live synchronization is active. As juries commit scores to the secure database, the positions will update automatically in real-time.</p>
                </div>
            </div>
        </div>
    )
}
