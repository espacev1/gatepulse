import { useState, useEffect, useCallback } from 'react'
import {
    BarChart3, PieChart, TrendingUp, Download, AlertTriangle,
    Activity, Users, CalendarDays, Search, Filter, Shield, Info
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
    LineChart, Line, AreaChart, Area
} from 'recharts'
import { supabase } from '../../lib/supabase'

const COLORS = ['#00D4FF', '#7B61FF', '#00BFA5', '#FF4DA6', '#FFB300']

export default function AdminAnalytics() {
    const [activeTab, setActiveTab] = useState('traffic')
    const [analyticsData, setAnalyticsData] = useState({
        stats: [],
        temporalData: [],
        distributionData: [],
        recentLogs: [],
        metrics: {
            avgAttendance: '0%',
            totalScans: 0,
            noShowRate: '0%',
            uptime: '100%'
        }
    })

    const fetchAnalyticsData = useCallback(async () => {
        // 1. Fetch Overall Metrics
        const [scansRes, validatedRes, ticketsRes, eventsRes, logsRes] = await Promise.all([
            supabase.from('attendance_logs').select('*', { count: 'exact', head: true }),
            supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('is_validated', true),
            supabase.from('tickets').select('*', { count: 'exact', head: true }),
            supabase.from('events').select('name, registered_count'),
            supabase.from('attendance_logs').select(`
                timestamp,
                event_id,
                verification_status,
                tickets (
                    participants (
                        profiles (*)
                    )
                )
            `).order('timestamp', { ascending: false }).limit(50)
        ])

        if (scansRes.error) console.error('Scans fetch error:', scansRes.error)
        if (logsRes.error) console.error('Recent logs fetch error:', logsRes.error)

        const totalTickets = ticketsRes.count || 0
        const validatedCount = validatedRes.count || 0
        const attendanceRate = totalTickets > 0 ? Math.round((validatedCount / totalTickets) * 100) : 0
        const noShowRate = 100 - attendanceRate

        // 2. Process Temporal Distribution (Actual data from logs)
        const hourlyGroups = {}
        const now = new Date()
        for (let i = 0; i < 12; i++) {
            const d = new Date(now)
            d.setHours(d.getHours() - i)
            const label = `${d.getHours().toString().padStart(2, '0')}:00`
            hourlyGroups[label] = 0
        }

        logsRes.data?.forEach(log => {
            const date = new Date(log.timestamp)
            const label = `${date.getHours().toString().padStart(2, '0')}:00`
            if (hourlyGroups[label] !== undefined) {
                hourlyGroups[label]++
            }
        })

        const temporalData = Object.entries(hourlyGroups)
            .map(([name, attendees]) => ({ name, attendees }))
            .reverse()

        setAnalyticsData({
            temporalData,
            distributionData: eventsRes.data?.map(e => ({ name: e.name, value: e.registered_count || 0 })) || [],
            recentLogs: logsRes.data?.slice(0, 8) || [],
            metrics: {
                avgAttendance: `${attendanceRate}%`,
                totalScans: scansRes.count || 0,
                noShowRate: `${noShowRate}%`,
                uptime: '100%'
            }
        })
    }, [])

    useEffect(() => {
        fetchAnalyticsData()

        const subscription = supabase
            .channel('analytics-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
                fetchAnalyticsData()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
                fetchAnalyticsData()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
                fetchAnalyticsData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [fetchAnalyticsData])

    const statsCards = [
        { label: 'Avg Attendance', value: analyticsData.metrics.avgAttendance, trend: 'LIVE', icon: Users, color: 'var(--accent)' },
        { label: 'Total Scans', value: analyticsData.metrics.totalScans.toLocaleString(), trend: 'SYNCED', icon: Activity, color: 'var(--secondary)' },
        { label: 'No-Show Rate', value: analyticsData.metrics.noShowRate, trend: 'CALC', icon: AlertTriangle, color: 'var(--status-warn)' },
        { label: 'System Health', value: 'OPTIMAL', trend: 'SECURE', icon: Shield, color: 'var(--status-ok)' },
    ]

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Event & Attendance Reports</h1>
                    <p className="page-subtitle">Detailed data analysis and attendance patterns.</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchAnalyticsData}>
                    <Download size={14} /> Refresh Data
                </button>
            </div>

            <div className="grid-4 mb-6">
                {statsCards.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}20` }} className="stat-card-icon">
                            <stat.icon size={20} color={stat.color} />
                        </div>
                        <div>
                            <div className="stat-card-value font-mono" style={{ fontSize: 'var(--font-2xl)' }}>{stat.value}</div>
                            <div className="stat-card-label">{stat.label}</div>
                            <div className="stat-card-trend" style={{ color: 'var(--text-dim)', background: 'var(--bg-elevated)', fontSize: '8px' }}>
                                {stat.trend}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
                {[
                    { id: 'traffic', label: 'Access Distribution', icon: Activity },
                    { id: 'distribution', label: 'Event Distribution', icon: PieChart },
                    { id: 'anomalies', label: 'Access Registry', icon: Info }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 16px', border: 'none', background: 'transparent',
                            color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-dim)',
                            fontSize: 'var(--font-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                            borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                            cursor: 'pointer', transition: 'all var(--transition-fast)'
                        }}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'traffic' && (
                <div className="card animate-fade-in">
                    <div className="panel-header">Scan Temporal Distribution (Last 12 Hours)</div>
                    <div style={{ height: 400, marginTop: 'var(--space-6)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.temporalData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,40,40,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '11px' }}
                                />
                                <Bar dataKey="attendees" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {activeTab === 'distribution' && (
                <div className="card animate-fade-in">
                    <div className="panel-header">Registrations per Event</div>
                    <div style={{ height: 400, marginTop: 'var(--space-6)' }}>
                        {analyticsData.distributionData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-dim font-mono">NO ACTIVE EVENTS FOUND</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={analyticsData.distributionData}
                                        cx="50%" cy="50%" innerRadius={100} outerRadius={140} paddingAngle={8} dataKey="value"
                                    >
                                        {analyticsData.distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '11px' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                                </RePieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'anomalies' && (
                <div className="card animate-fade-in">
                    <div className="panel-header">Recent Attendance History (Last 50 Entries)</div>
                    <div className="table-container mt-4">
                        <table>
                            <thead>
                                <tr>
                                    <th>Timestamp (UTC)</th>
                                    <th>Registration Type</th>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Verification</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.recentLogs.length === 0 && (
                                    <tr><td colSpan="5" className="text-center py-12 text-dim font-mono">NO ATTENDANCE LOGS FOUND</td></tr>
                                )}
                                {analyticsData.recentLogs.map((log, i) => {
                                    const profile = log.tickets?.participants?.profiles;
                                    const actualProfile = Array.isArray(profile) ? profile[0] : profile;
                                    const safeName = actualProfile?.full_name;
                                    const isSuccess = log.verification_status === 'success';

                                    return (
                                        <tr key={i}>
                                            <td className="font-mono" style={{ fontSize: '11px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                            <td><span className={`badge badge-secondary`}>AD-HOC</span></td>
                                            <td style={{ fontWeight: 600 }}>{safeName || (log.verification_status === 'invalid' ? 'UNKNOWN USER' : 'ANON USER')}</td>
                                            <td className="font-mono" style={{ color: isSuccess ? 'var(--status-ok)' : 'var(--status-critical)', fontSize: '11px' }}>
                                                {log.verification_status?.toUpperCase() || 'UNKNOWN'}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Shield size={10} color={isSuccess ? 'var(--status-ok)' : 'var(--status-critical)'} />
                                                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: isSuccess ? 'var(--status-ok)' : 'var(--status-critical)' }}>
                                                        {isSuccess ? 'VERIFIED' : 'DENIED'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
