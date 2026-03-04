import { useState } from 'react'
import {
    BarChart3, PieChart, TrendingUp, Download, AlertTriangle,
    Activity, Users, CalendarDays, Search, Filter, Shield, Info
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
    LineChart, Line, AreaChart, Area
} from 'recharts'
import { mockStats, mockEvents } from '../../data/mockData'

const COLORS = ['#00D4FF', '#7B61FF', '#00BFA5', '#FF4DA6', '#FFB300']

export default function AdminAnalytics() {
    const [activeTab, setActiveTab] = useState('traffic')

    const statsCards = [
        { label: 'Avg Attendance', value: '78.4%', trend: '+4.2%', icon: Users, color: 'var(--accent)' },
        { label: 'Total Scans', value: '14,204', trend: '+12%', icon: Activity, color: 'var(--secondary)' },
        { label: 'No-Show Rate', value: '12.1%', trend: '-2.4%', icon: AlertTriangle, color: 'var(--status-warn)' },
        { label: 'System Uptime', value: '99.98%', trend: 'Stable', icon: Shield, color: 'var(--status-ok)' },
    ]

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Intelligence & Forensic Analytics</h1>
                    <p className="page-subtitle">Historical data analysis and security metric extraction.</p>
                </div>
                <button className="btn btn-secondary">
                    <Download size={14} /> Export Intelligence (CSV)
                </button>
            </div>

            {/* Metric Grid */}
            <div className="grid-4 mb-6">
                {statsCards.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}20` }} className="stat-card-icon">
                            <stat.icon size={20} color={stat.color} />
                        </div>
                        <div>
                            <div className="stat-card-value font-mono" style={{ fontSize: 'var(--font-2xl)' }}>{stat.value}</div>
                            <div className="stat-card-label">{stat.label}</div>
                            <div className="stat-card-trend" style={{ color: stat.trend.includes('+') ? 'var(--status-ok)' : 'var(--status-critical)', background: stat.trend.includes('+') ? 'var(--status-ok-bg)' : 'var(--status-critical-bg)' }}>
                                {stat.trend}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
                {[
                    { id: 'traffic', label: 'Security Traffic', icon: Activity },
                    { id: 'distribution', label: 'Entity Distribution', icon: PieChart },
                    { id: 'anomalies', label: 'Anomaly Logs', icon: AlertTriangle }
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

            {/* Core Analytic Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                {/* Panel 1 */}
                <div className="card">
                    <div className="panel-header">Scan Temporal Distribution</div>
                    <div style={{ height: 350, marginTop: 'var(--space-6)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '11px' }}
                                />
                                <Bar dataKey="attendees" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Panel 2 */}
                <div className="card">
                    <div className="panel-header">Entity Sector Breakdown</div>
                    <div style={{ height: 350, marginTop: 'var(--space-6)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={mockEvents.slice(0, 5).map(e => ({ name: e.name, value: e.registered_count }))}
                                    cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value"
                                >
                                    {mockEvents.slice(0, 5).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '11px' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Forensic Registry Log */}
            <div className="card">
                <div className="panel-header">Forensic Access Registry (Logs)</div>
                <div className="table-container mt-4">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp (UTC)</th>
                                <th>Entity Class</th>
                                <th>Node Destination</th>
                                <th>Validation Key</th>
                                <th>Confidence Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { time: '2026-03-04 12:45:01', class: 'Admin', node: 'Main Entrance A', key: 'GP-A7-F3', score: '99.9%' },
                                { time: '2026-03-04 12:44:52', class: 'Staff', node: 'Main Entrance B', key: 'GP-B9-C2', score: '99.8%' },
                                { time: '2026-03-04 12:44:38', class: 'Participant', node: 'VIP Access Gate', key: 'GP-D1-K4', score: '100.0%' },
                                { time: '2026-03-04 12:43:12', class: 'Participant', node: 'Exit Portal 1', key: 'GP-X2-M9', score: '99.7%' },
                            ].map((log, i) => (
                                <tr key={i}>
                                    <td className="font-mono" style={{ fontSize: '11px' }}>{log.time}</td>
                                    <td><span className="badge badge-info">{log.class}</span></td>
                                    <td style={{ fontWeight: 600 }}>{log.node}</td>
                                    <td className="font-mono" style={{ color: 'var(--accent)', fontSize: '11px' }}>{log.key}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Shield size={10} color="var(--status-ok)" />
                                            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--status-ok)' }}>{log.score}</span>
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
