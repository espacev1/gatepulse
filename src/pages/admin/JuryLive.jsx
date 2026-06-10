import { useState, useEffect } from 'react'
import { 
    Gavel, Trophy, Search, Activity, 
    ArrowUpRight, Star, TrendingUp, Filter,
    Users, Medal, Award
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminJuryLive() {
    const [events, setEvents] = useState([])
    const [selectedEventId, setSelectedEventId] = useState('all')
    const [leaderboard, setLeaderboard] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchEvents()
        fetchLeaderboard()

        const channel = supabase
            .channel('admin-jury-live-intel')
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
            const map = {}
            data.forEach(m => {
                const pid = m.participant_id?.id
                if (!pid) return
                if (!map[pid]) {
                    map[pid] = {
                        id: pid,
                        name: m.participant_id.team?.name || m.participant_id.user?.full_name,
                        regNo: m.participant_id.user?.reg_no || 'ENTITY',
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
                    avgScore: +(item.totalScore / (item.count || 1)).toFixed(2)
                }))
                .sort((a, b) => b.avgScore - a.avgScore)

            setLeaderboard(list)
        }
        setLoading(false)
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Event Leaderboard</h1>
                    <p className="page-subtitle">Real-time competitive standings and scoring updates.</p>
                </div>
                <div className="badge badge-success animate-pulse">LIVE UPDATING</div>
            </div>

            <div className="grid-4 mb-8">
                <div className="stat-card">
                    <div className="w-full">
                        <div className="stat-card-label">PARTICIPANTS SCORED</div>
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
                            <div className="stat-card-label">EVENT_FILTER</div>
                            <select 
                                className="form-select mt-2" 
                                value={selectedEventId} 
                                onChange={e => setSelectedEventId(e.target.value)}
                                style={{ background: 'var(--bg-deepest)', border: '1px solid var(--border-color)', width: '250px' }}
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
                        <span className="flex items-center gap-2"><Trophy size={18} color="var(--accent)" /> OFFICIAL RANKINGS</span>
                    </div>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Rank</th>
                                <th>Participant</th>
                                <th>Registration No</th>
                                <th>Event Area</th>
                                <th style={{ textAlign: 'right' }}>Score (AVG)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan="5" className="text-center py-16 text-dim font-mono">LOADING SCORES...</td></tr>
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
                                            <div className="live-dot" style={{ background: 'var(--accent)' }} />
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
        </div>
    )
}
