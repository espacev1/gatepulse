import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import GlowGrid from './GlowGrid'
import {
    LayoutDashboard, CalendarDays, Users, BarChart3, ScanLine,
    ClipboardCheck, Ticket, CalendarSearch, LogOut, Menu, X,
    Shield, ShieldCheck, ChevronLeft, Activity
} from 'lucide-react'

const navConfig = {
    admin: [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/admin/events', icon: CalendarDays, label: 'Events' },
        { to: '/admin/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { to: '/admin/participants', icon: Users, label: 'Participants' },
        { to: '/admin/users', icon: ShieldCheck, label: 'User Management' },
        { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    ],
    staff: [
        { to: '/staff/scanner', icon: ScanLine, label: 'QR Scanner' },
        { to: '/staff/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { to: '/staff/checkins', icon: ClipboardCheck, label: 'Check-ins' },
    ],
    participant: [
        { to: '/events', icon: CalendarSearch, label: 'Browse Events', end: true },
        { to: '/my-tickets', icon: Ticket, label: 'My Tickets' },
        { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
    ],
}

export default function Layout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileOpen, setMobileOpen] = useState(false)

    const links = navConfig[user?.role] || []

    const handleLogout = () => { logout(); navigate('/') }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deepest)' }}>
            <GlowGrid />
            {/* Mobile overlay */}
            {mobileOpen && (
                <div onClick={() => setMobileOpen(false)} className="mobile-overlay"
                    style={{ position: 'fixed', inset: 0, background: 'rgba(6,14,26,0.7)', zIndex: 40, display: 'none' }} />
            )}

            {/* Sidebar */}
            <aside style={{
                width: sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)',
                minHeight: '100vh',
                background: 'linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-deep) 100%)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column',
                transition: 'width var(--transition-base)',
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
                overflow: 'hidden',
            }}>
                {/* Logo */}
                <div style={{
                    padding: '14px var(--space-4)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    minHeight: 'var(--navbar-height)',
                }}>
                    {sidebarOpen && (
                        <div style={{ animation: 'fadeIn 0.2s ease' }}>
                            <div style={{ fontWeight: 800, fontSize: 'var(--font-base)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                Gate Pulse
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: -1 }}>
                                AN E-CELL INITIATIVE
                            </div>
                        </div>
                    )}
                </div>

                {/* Section label */}
                {sidebarOpen && (
                    <div style={{ padding: 'var(--space-4) var(--space-4) var(--space-2)', fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Navigation
                    </div>
                )}

                {/* Nav links */}
                <nav style={{ flex: 1, padding: '0 var(--space-2)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {links.map(link => (
                        <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMobileOpen(false)}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                padding: sidebarOpen ? '9px 14px' : '9px',
                                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                borderRadius: 'var(--radius-lg)',
                                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                background: isActive ? 'var(--accent-glow)' : 'transparent',
                                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                                fontWeight: isActive ? 600 : 400,
                                fontSize: 'var(--font-sm)',
                                textDecoration: 'none',
                                transition: 'all var(--transition-fast)',
                                whiteSpace: 'nowrap',
                            })}>
                            <link.icon size={18} style={{ flexShrink: 0 }} />
                            {sidebarOpen && <span>{link.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom */}
                <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-icon"
                        style={{ width: '100%', justifyContent: sidebarOpen ? 'flex-start' : 'center', padding: '8px', gap: 'var(--space-3)' }}>
                        <ChevronLeft size={16} style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition: 'transform var(--transition-base)' }} />
                        {sidebarOpen && <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)' }}>Collapse</span>}
                    </button>

                    <div
                        onClick={() => {
                            const profilePath = user.role === 'participant' ? '/profile' : `/${user.role}/profile`
                            navigate(profilePath)
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                            padding: '8px 10px', borderRadius: 'var(--radius-lg)',
                            background: 'rgba(255,40,40,0.03)', border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-base)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,40,40,0.08)'
                            e.currentTarget.style.borderColor = 'var(--accent)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,40,40,0.03)'
                            e.currentTarget.style.borderColor = 'var(--border-color)'
                        }}
                    >
                        <div style={{
                            width: 32, height: 32, borderRadius: 'var(--radius-full)',
                            background: 'var(--accent-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'var(--font-xs)', fontWeight: 800, color: 'var(--bg-deepest)',
                            flexShrink: 0,
                        }}>
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        {sidebarOpen && (
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
                                    {user?.full_name}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {user?.role}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                            className="btn-icon"
                            title="Sign Out"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main style={{
                flex: 1,
                marginLeft: sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)',
                transition: 'margin-left var(--transition-base)',
                minHeight: '100vh',
                background: 'var(--gradient-bg)',
            }}>
                {/* Top bar */}
                <header style={{
                    height: 'var(--navbar-height)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 var(--space-6)',
                    background: 'rgba(8,8,8,0.85)',
                    backdropFilter: 'blur(12px)',
                    position: 'sticky', top: 0, zIndex: 30,
                }}>
                    <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-icon" style={{ display: 'none' }} id="mobile-menu-btn">
                        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--font-sm)', color: 'var(--text-dim)' }}>
                        <Activity size={14} color="var(--accent)" />
                        <span>
                            <span className="live-dot" /> System Active
                        </span>
                        <span style={{ margin: '0 var(--space-2)', opacity: 0.3 }}>|</span>
                        <span>Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user?.full_name}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                            {user?.role}
                        </span>
                    </div>
                </header>

                <Outlet />
            </main>

            <style>{`
        @media (max-width: 768px) {
          aside { transform: translateX(${mobileOpen ? '0' : '-100%'}) !important; width: var(--sidebar-width) !important; }
          main { margin-left: 0 !important; }
          #mobile-menu-btn { display: flex !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
        </div>
    )
}
