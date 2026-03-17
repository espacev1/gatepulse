import { useState, useEffect } from 'react'
import {
    Activity, Download, FileText, Table, Search,
    Filter, Calendar, Users, Star, ArrowUpRight, CheckCircle2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function FacultyActiveEvents() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchActiveEvents()
    }, [])

    const fetchActiveEvents = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .or('status.eq.active,is_live.eq.true')
            .order('event_date', { ascending: true })
        
        if (data) setEvents(data)
        setLoading(false)
    }

    const filtered = events.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Active Operational Nodes</h1>
                    <p className="page-subtitle">Broad oversight of live sector performance and data streams.</p>
                </div>
            </div>

            <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
                <div className="search-bar">
                    <Search color="var(--accent)" />
                    <input placeholder="Filter active nodes..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="grid-3">
                {loading ? (
                    <div className="col-span-3 text-center py-12 text-dim font-mono uppercase">Scanning Active Sectors...</div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-3 text-center py-12 text-dim font-mono">NO LIVE CHANNELS DETECTED</div>
                ) : filtered.map(event => (
                    <div key={event.id} className="card hover:border-accent group transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg mb-1">{event.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-dim">
                                    <Calendar size={12} /> {new Date(event.event_date).toLocaleDateString()}
                                </div>
                            </div>
                            <span className="badge badge-success animate-pulse">LIVE</span>
                        </div>

                        <div className="grid-2 gap-4 mb-6">
                            <div className="p-3 bg-deepest border border-color rounded-lg">
                                <div className="text-[10px] font-bold text-dim mb-1">REGISTRATIONS</div>
                                <div className="text-xl font-mono text-accent">{event.registered_count || 0}</div>
                            </div>
                            <div className="p-3 bg-deepest border border-color rounded-lg">
                                <div className="text-[10px] font-bold text-dim mb-1">CAPACITY</div>
                                <div className="text-xl font-mono text-secondary">{event.max_capacity}</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                             <a href="/faculty/events" className="btn btn-secondary btn-sm w-full flex justify-between px-4">
                                <span className="flex items-center gap-2"><ArrowUpRight size={14} /> VIEW FULL SYNOPSIS</span>
                                <CheckCircle2 size={12} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
