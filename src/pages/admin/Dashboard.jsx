import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    Shield, Activity, Users, CalendarDays, TrendingUp, AlertTriangle,
    Clock, Server, Zap, PieChart, BarChart3, ArrowUpRight, Trash2, Plus, ShieldCheck
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
    const { user } = useAuth()
    const [timeRange, setTimeRange] = useState('5m')
    const [events, setEvents] = useState([])
    const [admins, setAdmins] = useState([])
    const [trafficData, setTrafficData] = useState([])
    const [metrics, setMetrics] = useState({
        totalTickets: 0,
        activeCheckins: 0,
        loadFactor: 0,
        securityAlerts: 0,
        totalUsers: 0
    })

    useEffect(() => {
        fetchDashboardData()

        const channel = supabase
            .channel('dashboard-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => fetchDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchDashboardData())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchDashboardData = async () => {
        // 1. Fetch Events & Admins
        const [eventsRes, ticketsRes, checkinsRes, adminsRes, logsRes, pendingRes, usersRes] = await Promise.all([
            supabase.from('events').select('*'),
            supabase.from('tickets').select('*', { count: 'exact', head: true }),
            supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('is_validated', true),
            supabase.from('profiles').select('*').eq('role', 'admin'),
            supabase.from('attendance_logs').select('timestamp').order('timestamp', { ascending: true }),
            supabase.from('participants').select('*', { count: 'exact', head: true }).eq('registration_status', 'pending'),
            supabase.from('profiles').select('*', { count: 'exact', head: true })
        ])

        if (eventsRes.data) setEvents(eventsRes.data)
        if (adminsRes.data) setAdmins(adminsRes.data)

        const totalCapacity = eventsRes.data?.reduce((acc, e) => acc + (e.max_capacity || 0), 0) || 1
        const loadFactor = Math.round(((checkinsRes.count || 0) / totalCapacity) * 100)

        setMetrics({
            totalTickets: ticketsRes.count || 0,
            activeCheckins: checkinsRes.count || 0,
            loadFactor: loadFactor,
            securityAlerts: 0,
            pendingApprovals: pendingRes.count || 0,
            totalUsers: usersRes.count || 0
        })

        // 2. Process Traffic Data (Group logs by time)
        if (logsRes.data) {
            const groups = {}
            logsRes.data.forEach(log => {
                const date = new Date(log.timestamp)
                const label = `${date.getHours().toString().padStart(2, '0')}:00`
                groups[label] = (groups[label] || 0) + 1
            })
            const chartData = Object.entries(groups).map(([name, attendees]) => ({
                name,
                attendees,
                registrations: Math.round(attendees * 1.2) // Estimate
            })).slice(-10)
            setTrafficData(chartData)
        }
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
                    {trend && (
                        <div className="stat-card-trend" style={{
                            color: trend.startsWith('+') ? 'var(--status-ok)' : 'var(--status-critical)',
                            background: trend.startsWith('+') ? 'var(--status-ok-bg)' : 'var(--status-critical-bg)'
                        }}>
                            {trend}
                        </div>
                    )}
                </div>
                <div className="stat-card-value font-mono">{value}</div>
                <div className="stat-card-label">{label}</div>
            </div>
        </div>
    )

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">VIT-PULSE System Overview</h1>
                    <p className="page-subtitle">Real-time coordination and management of all campus events.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn btn-primary" onClick={fetchDashboardData}><Activity size={14} /> Refresh Dashboard</button>
                </div>
            </div>

            <div className="grid-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <MetricBar icon={Users} label="TOTAL RESERVATIONS" value={metrics.totalTickets} trend="LIVE" />
                <MetricBar icon={ShieldCheck} label="TOTAL REGISTERED" value={metrics.totalUsers} trend="STABLE" color="var(--accent)" />
                <MetricBar icon={Clock} label="PENDING APPROVALS" value={metrics.pendingApprovals} trend="PENDING" color="var(--status-warn)" />
                <MetricBar icon={Activity} label="CURRENT ENTRIES" value={metrics.activeCheckins} trend="LIVE" color="var(--status-ok)" />
                <MetricBar icon={TrendingUp} label="CAPACITY STATUS" value={`${metrics.loadFactor}%`} trend="STABLE" color="var(--status-info)" />
            </div>

            <div className="grid-3 mb-6">
                <div className="stat-card">
                    <div className="w-full">
                        <div className="panel-header">System Health</div>
                        <div className="flex items-center gap-4 mb-4">
                            <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
                                <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%',
                                    background: 'conic-gradient(var(--status-ok) 100%, var(--bg-elevated) 0deg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <div style={{ width: '80%', height: '80%', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Shield size={18} color="var(--status-ok)" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="stat-card-value" style={{ color: 'var(--status-ok)' }}>100%</div>
                                <div className="badge badge-success">EXCELLENT</div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)' }}>MAIN STATUS</span>
                            <span style={{ fontSize: '10px', color: 'var(--status-ok)' }}>ACTIVE</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)' }}>RESPONSE TIME</span>
                            <span style={{ fontSize: '10px', color: 'var(--status-ok)' }}>FAST</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="w-full">
                        <div className="panel-header">Real-time Load</div>
                        <div className="flex items-end gap-1 mb-4" style={{ height: 60 }}>
                            {trafficData.map((d, i) => (
                                <div key={i} style={{ flex: 1, height: `${Math.min(100, d.attendees * 10)}%`, background: 'var(--accent)', borderRadius: '1px', opacity: 0.3 + (i * 0.07) }} />
                            ))}
                            {trafficData.length === 0 && <div className="w-full text-center text-dim" style={{ fontSize: '10px' }}>WAITING FOR DATA...</div>}
                        </div>
                        <div className="stat-card-value">{metrics.activeCheckins}</div>
                        <div className="stat-card-label">Verified Entrances</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="w-full">
                        <div className="panel-header">System Security</div>
                        <div style={{ position: 'relative', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={32} color="var(--accent)" className="animate-glow" />
                        </div>
                        <div className="stat-card-value">STABLE</div>
                        <div className="stat-card-label">Secure connection active</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                <div className="card">
                    <div className="panel-header">Attendance Flow Analysis</div>
                    <div style={{ height: 320, width: '100%', marginTop: 'var(--space-4)' }}>
                        {trafficData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-dim font-mono text-sm">NO ACCESS DATA DETECTED IN CURRENT TIME RANGE</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trafficData}>
                                    <defs>
                                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,40,40,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}
                                        itemStyle={{ color: 'var(--accent)' }}
                                    />
                                    <Area type="monotone" dataKey="attendees" stroke="var(--accent)" fillOpacity={1} fill="url(#colorTraffic)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="panel-header">Event Distribution</div>
                    <div style={{ height: 320, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {events.length === 0 && <p className="text-center text-dim text-sm">No active events listed.</p>}
                        {events.slice(0, 4).map((e, i) => (
                            <div key={e.id} className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--secondary)' : i === 2 ? 'var(--teal)' : 'var(--magenta)' }} />
                                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{e.name}</span>
                                    </div>
                                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)' }}>{e.registered_count || 0} USERS</span>
                                </div>
                                <div className="progress-bar-track">
                                    <div className="progress-bar-fill" style={{
                                        width: `${((e.registered_count || 0) / e.max_capacity) * 100}%`,
                                        background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--secondary)' : i === 2 ? 'var(--teal)' : 'var(--magenta)'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--space-6)' }}>
                <div className="card">
                    <div className="flex justify-between items-center mb-6">
                        <div className="panel-header" style={{ marginBottom: 0 }}>Active Event Locations</div>
                        <div className="badge badge-info"><Clock size={12} /> Auto Sync</div>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Event Name</th>
                                    <th>Status</th>
                                    <th>Attendance</th>
                                    <th>Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.length === 0 && (
                                    <tr><td colSpan="6" className="text-center py-8 text-dim">No events found in the database.</td></tr>
                                )}
                                {events.map((event) => (
                                    <tr key={event.id}>
                                        <td className="font-mono text-accent" style={{ fontSize: '11px' }}>{event.id.slice(-8).toUpperCase()}</td>
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
                                                    <div className="progress-bar-fill" style={{ width: `${((event.registered_count || 0) / event.max_capacity) * 100}%` }} />
                                                </div>
                                                <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700 }}>{Math.round(((event.registered_count || 0) / event.max_capacity) * 100)}%</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: event.is_free ? 'var(--status-ok)' : 'var(--status-warn)' }}>
                                            {event.is_free ? 'FREE' : `$${event.price}`}
                                        </td>
                                        <td>
                                            <Link to="/admin/synopsis" className="btn-icon">
                                                <Activity size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {user?.is_super_admin && (
                    <div className="card">
                        <div className="panel-header">System Overview</div>
                        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)', marginBottom: 'var(--space-4)' }}>Quick system status and access.</p>

                        <div className="flex flex-col gap-3">
                            {admins.map(admin => (
                                <div key={admin.id} className="flex items-center gap-3 p-3" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--secondary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--secondary)' }}>
                                        <Shield size={16} color="var(--secondary)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{admin.full_name}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{admin.email} {admin.id === user.id ? '(YOU)' : ''}</div>
                                    </div>
                                </div>
                            ))}
                            <a href="/admin/users" className="btn btn-secondary btn-sm w-full mt-2" style={{ textDecoration: 'none' }}>
                                <Users size={14} /> Manage Users & Roles
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
