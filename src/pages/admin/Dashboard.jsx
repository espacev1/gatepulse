import { useState, useEffect } from 'react'
import {
    Shield, Activity, Users, CalendarDays, TrendingUp, AlertTriangle,
    Clock, Server, Zap, PieChart, BarChart3, ArrowUpRight, Trash2, Plus
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { mockEvents, mockStats, mockUsers } from '../../data/mockData'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
    const { user } = useAuth()
    const [timeRange, setTimeRange] = useState('5m')
    const [events, setEvents] = useState([])
    const [metrics, setMetrics] = useState({
        totalTickets: 0,
        activeCheckins: 0,
        loadFactor: 0,
        securityAlerts: 0
    })

    useEffect(() => {
        fetchDashboardData()

        const logsChannel = supabase
            .channel('dashboard-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
                fetchDashboardData()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
                fetchDashboardData()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
                fetchDashboardData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(logsChannel)
        }
    }, [])

    const fetchDashboardData = async () => {
        const { data: eventsData } = await supabase.from('events').select('*')
        if (eventsData) setEvents(eventsData)

        const { count: ticketsCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true })
        const { count: checkinsCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('is_validated', true)

        const totalCapacity = eventsData?.reduce((acc, e) => acc + (e.max_capacity || 0), 0) || 1
        const loadFactor = Math.round(((checkinsCount || 0) / totalCapacity) * 100)

        setMetrics({
            totalTickets: ticketsCount || 0,
            activeCheckins: checkinsCount || 0,
            loadFactor: loadFactor,
            securityAlerts: 0
        })
    }

    const MetricBar = ({ icon: Icon, label, value, trend, color = 'var(--accent)' }) => (
        <div className="stat-card">
            <div className="w-full">
                <div className="flex justify-between items-start mb-4">
                    <div style={{
                        width: 38, height: 38, borderRadius: 'var(--radius-lg)',
                        background: `${color}15`, border: `1px solid ${color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Icon size={18} color={color} />
                    </div>
                    <div className="stat-card-trend" style={{
                        color: trend.startsWith('+') ? 'var(--status-ok)' : 'var(--status-critical)',
                        background: trend.startsWith('+') ? 'var(--status-ok-bg)' : 'var(--status-critical-bg)'
                    }}>
                        {trend.startsWith('+') ? <TrendingUp size={10} /> : <AlertTriangle size={10} />} {trend}
                    </div>
                </div>
                <div className="stat-card-value">{value}</div>
                <div className="stat-card-label">{label}</div>
            </div>
        </div>
    )

    const HealthMetric = ({ label, value, color }) => (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}%</span>
            </div>
            <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${value}%`, background: color }} />
            </div>
        </div>
    )

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Operations Command</h1>
                    <p className="page-subtitle">Real-time event security and orchestration oversight.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="form-select" style={{ width: 'auto', minWidth: '150px' }} value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                        <option value="5m">Last 5 Minutes</option>
                        <option value="1h">Last 60 Minutes</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                    </select>
                    <button className="btn btn-primary" onClick={fetchDashboardData}><Activity size={14} /> Refresh Node</button>
                </div>
            </div>

            <div className="grid-4 mb-8">
                <MetricBar icon={Users} label="TOTAL RESERVATIONS" value={metrics.totalTickets.toLocaleString()} trend="+12.4%" />
                <MetricBar icon={Activity} label="ACTIVE_CHECKINS" value={metrics.activeCheckins.toLocaleString()} trend="+8.2%" color="var(--status-ok)" />
                <MetricBar icon={TrendingUp} label="LOAD_FACTOR" value={`${metrics.loadFactor}%`} trend="+2.1%" color="var(--status-warn)" />
                <MetricBar icon={Shield} label="THREAT_LEVEL" value="LOW" trend="0% Delta" color="var(--status-ok)" />
            </div>

            <div className="grid-3 mb-6" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)' }}>
                <div className="stat-card">
                    <div className="w-full">
                        <div className="panel-header">System Health</div>
                        <div className="flex items-center gap-4 mb-4">
                            <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
                                <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%',
                                    background: 'conic-gradient(var(--status-ok) 92%, var(--bg-elevated) 0deg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <div style={{ width: '80%', height: '80%', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Shield size={18} color="var(--status-ok)" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="stat-card-value" style={{ color: 'var(--status-ok)' }}>92%</div>
                                <div className="badge badge-success animate-pulse">PROTECTED</div>
                            </div>
                        </div>
                        <HealthMetric label="CPU LOAD" value={24} color="var(--accent)" />
                        <HealthMetric label="MEMORY ADDR" value={42} color="var(--secondary)" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="w-full">
                        <div className="panel-header">Log Activity</div>
                        <div className="flex items-end gap-1 mb-4" style={{ height: 60 }}>
                            {[30, 45, 25, 60, 80, 50, 40, 70, 90, 65].map((h, i) => (
                                <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--accent)', borderRadius: '1px', opacity: 0.3 + (i * 0.07) }} />
                            ))}
                        </div>
                        <div className="stat-card-value">14.2k</div>
                        <div className="stat-card-label">Total Logs / Hour</div>
                        <div className="stat-card-trend" style={{ color: 'var(--status-ok)', background: 'var(--status-ok-bg)' }}>
                            <TrendingUp size={10} /> +12.4%
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="w-full">
                        <div className="panel-header">Event Flow</div>
                        <div style={{ position: 'relative', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={32} color="var(--accent)" className="animate-glow" />
                        </div>
                        <div className="stat-card-value">124 <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)', fontWeight: 400 }}>EPS</span></div>
                        <div className="stat-card-label">Events Per Second</div>
                        <div style={{ marginTop: 'var(--space-2)' }}>
                            <div className="progress-bar-track" style={{ height: 2 }}>
                                <div className="progress-bar-fill" style={{ width: '65%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                <div className="card">
                    <div className="panel-header">Security Traffic Analysis</div>
                    <div style={{ height: 320, width: '100%', marginTop: 'var(--space-4)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockStats}>
                                <defs>
                                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}
                                    itemStyle={{ color: 'var(--accent)' }}
                                />
                                <Area type="monotone" dataKey="attendees" stroke="var(--accent)" fillOpacity={1} fill="url(#colorTraffic)" strokeWidth={2} />
                                <Area type="monotone" dataKey="registrations" stroke="var(--secondary)" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="panel-header">Event Distribution</div>
                    <div style={{ height: 320, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {events.slice(0, 4).map((e, i) => (
                            <div key={e.id} className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--secondary)' : i === 2 ? 'var(--teal)' : 'var(--magenta)' }} />
                                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{e.name}</span>
                                    </div>
                                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)' }}>{e.registered_count} ENTITIES</span>
                                </div>
                                <div className="progress-bar-track">
                                    <div className="progress-bar-fill" style={{
                                        width: `${(e.registered_count / e.max_capacity) * 100}%`,
                                        background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--secondary)' : i === 2 ? 'var(--teal)' : 'var(--magenta)'
                                    }} />
                                </div>
                            </div>
                        ))}
                        <button className="btn btn-ghost w-full mt-2" style={{ border: '1px dashed var(--border-color)' }}>
                            View All Intelligence <ArrowUpRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--space-6)' }}>
                <div className="card">
                    <div className="flex justify-between items-center mb-6">
                        <div className="panel-header" style={{ marginBottom: 0 }}>Active Operational Nodes</div>
                        <div className="badge badge-info"><Clock size={12} /> Real-time Streaming</div>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Node ID</th>
                                    <th>Resource Name</th>
                                    <th>Status</th>
                                    <th>Load Factor</th>
                                    <th>Last Update</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr key={event.id}>
                                        <td className="font-mono" style={{ color: 'var(--accent)', fontSize: '11px' }}>{event.id.slice(-8)}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="live-dot" style={{ background: event.status === 'active' ? 'var(--status-ok)' : 'var(--status-warn)' }} />
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{event.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${event.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                                {event.status}
                                            </span>
                                        </td>
                                        <td style={{ width: '150px' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="progress-bar-track" style={{ flex: 1 }}>
                                                    <div className="progress-bar-fill" style={{ width: `${(event.registered_count / event.max_capacity) * 100}%` }} />
                                                </div>
                                                <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700 }}>{Math.round((event.registered_count / event.max_capacity) * 100)}%</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)' }}>{new Date(event.start_time).toLocaleTimeString()}</td>
                                        <td>
                                            <button className="btn-icon"><Activity size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {user?.is_super_admin && (
                    <div className="card">
                        <div className="panel-header">Admin Management</div>
                        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)', marginBottom: 'var(--space-4)' }}>Privileged node authority control.</p>

                        <div className="flex flex-col gap-3">
                            {mockUsers.filter(u => u.role === 'admin' && u.email !== user?.email).map(admin => (
                                <div key={admin.id} className="flex justify-between items-center p-3" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <div className="flex items-center gap-3">
                                        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--secondary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Shield size={16} color="var(--secondary)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{admin.full_name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{admin.email}</div>
                                        </div>
                                    </div>
                                    <button className="btn-icon" style={{ color: 'var(--status-critical)' }}><Trash2 size={14} /></button>
                                </div>
                            ))}
                            <button className="btn btn-ghost btn-sm w-full mt-2" style={{ border: '1px dashed var(--border-color)' }}>
                                <Plus size={14} /> Provision Temporary Admin
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
