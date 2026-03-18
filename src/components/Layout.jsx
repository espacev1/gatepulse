import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    LayoutDashboard, CalendarDays, Users, BarChart3, ScanLine,
    ClipboardCheck, Ticket, CalendarSearch, LogOut, Menu, X,
    Shield, ShieldCheck, ChevronLeft, Activity, Gavel, UserCheck, Play, Trophy
} from 'lucide-react'

const navConfig = {
    admin: [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/admin/events', icon: CalendarDays, label: 'Events' },
        { to: '/admin/synopsis', icon: Activity, label: 'Event Synopsis' },
        { to: '/admin/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { to: '/admin/participants', icon: Users, label: 'User Directory' },
        { to: '/admin/users', icon: Shield, label: 'User Management' },
        { to: '/admin/team', icon: Users, label: 'Team Management' },
        { to: '/admin/jury', icon: Gavel, label: 'Jury Management' },
        { to: '/admin/jury-live', icon: Trophy, label: 'Live Verification' },
        { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/admin/faculty', icon: UserCheck, label: 'Faculty Verification' },
        { to: '/admin/active-events', icon: Play, label: 'Active Events' },
        { id: 'f23', to: '/admin/department-view', icon: BarChart3, label: 'Department View' },
    ],
    staff: [
        { to: '/staff/scanner', icon: ScanLine, label: 'QR Scanner' },
        { to: '/staff/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { to: '/staff/checkins', icon: ClipboardCheck, label: 'Check-ins' },
    ],
    participant: [
        { to: '/events', icon: CalendarSearch, label: 'Events', end: true },
        { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { to: '/my-tickets', icon: Ticket, label: 'My Tickets' },
    ],
    faculty: [
        { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/faculty/events', icon: CalendarDays, label: 'Event Synopsis' },
        { to: '/faculty/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { to: '/faculty/users', icon: Users, label: 'All Users' },
        { to: '/faculty/jury', icon: Gavel, label: 'Live Verification' },
        { to: '/faculty/active-events', icon: Play, label: 'Active Events' },
        { to: '/faculty/department-view', icon: BarChart3, label: 'Department View' },
        { to: '/faculty/create-events', icon: CalendarDays, label: 'Create Events' },
    ],
    jury: [
        { to: '/jury/dashboard', icon: Activity, label: 'Live Verification', end: true },
        { to: '/jury/status', icon: ClipboardCheck, label: 'Verification Status' },
    ],
}

export default function Layout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const path = location.pathname
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileOpen, setMobileOpen] = useState(false)

    let links = navConfig[user?.role] || []

    // If super admin, adapt sidebar to current portal context
    if (user?.is_super_admin) {
        if (path.startsWith('/jury')) {
            links = [...navConfig.faculty, { to: '/admin', icon: ShieldCheck, label: 'Back to Dashboard', end: true }]
        }
    }

    const handleLogout = () => { logout(); navigate('/') }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div onClick={() => setMobileOpen(false)} className="mobile-overlay"
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40, display: 'none' }} />
            )}

            {/* Sidebar */}
            <aside style={{
                width: sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)',
                minHeight: '100vh',
                background: '#FFFFFF',
                borderRight: '1px solid rgba(0, 132, 255, 0.1)',
                display: 'flex', flexDirection: 'column',
                transition: 'width var(--transition-base)',
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
                overflow: 'hidden',
                boxShadow: '10px 0 30px rgba(0, 132, 255, 0.03)'
            }}>
                {/* Logo */}
                <div style={{
                    padding: '20px var(--space-4)',
                    borderBottom: '1px solid rgba(0, 132, 255, 0.05)',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    minHeight: '80px',
                }}>
                    {sidebarOpen && (
                        <div style={{ animation: 'fadeIn 0.2s ease', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src="/logo_refined.png" alt="Logo" style={{ height: '36px' }} />
                            <div style={{ 
                                fontFamily: 'var(--font-family-display)', 
                                fontSize: '24px', 
                                color: 'var(--accent)', 
                                letterSpacing: '0.02em',
                                textTransform: 'uppercase'
                            }}>
                                VIT-PULSE
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
                                padding: sidebarOpen ? '12px 18px' : '12px',
                                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                borderRadius: 'var(--radius-lg)',
                                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                                background: isActive ? 'var(--accent)' : 'transparent',
                                fontWeight: 800,
                                fontSize: '13px',
                                textDecoration: 'none',
                                transition: 'all var(--transition-base)',
                                whiteSpace: 'nowrap',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                boxShadow: isActive ? '0 8px 20px rgba(0, 132, 255, 0.2)' : 'none',
                                margin: '2px 0'
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
                background: 'transparent',
            }}>
                {/* Top bar */}
                <header style={{
                    height: '80px',
                    borderBottom: '1px solid rgba(0, 132, 255, 0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 var(--space-8)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    position: 'sticky', top: 0, zIndex: 30,
                }}>
                    <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-icon" style={{ display: 'none' }} id="mobile-menu-btn">
                        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: '12px', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        <Activity size={14} color="var(--accent)" />
                        <span>System Active</span>
                        <span style={{ margin: '0 var(--space-2)', opacity: 0.1 }}>|</span>
                        <span>User: <strong style={{ color: 'var(--accent)' }}>{user?.full_name}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span className="badge badge-primary" style={{ padding: '4px 12px', background: 'var(--accent)', color: '#fff', border: 'none' }}>
                            {user?.role} Access
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
