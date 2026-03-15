import { Link } from 'react-router-dom'
import { Shield, Ticket, BarChart3, ScanLine, Lock, Users, ArrowRight, CheckCircle2, Activity, Zap, Eye } from 'lucide-react'

const features = [
    { icon: Ticket, title: 'Secure QR Tickets', desc: 'HMAC-signed digital tickets with unique tokens — tamper-proof and impossible to duplicate.', color: '#00D4FF' },
    { icon: ScanLine, title: 'Real-Time Validation', desc: 'Sub-2-second ticket verification via device camera with instant duplicate detection.', color: '#7B61FF' },
    { icon: BarChart3, title: 'Live Monitoring', desc: 'Real-time attendance dashboards, peak detection, and automated anomaly alerts.', color: '#00BFA5' },
    { icon: Lock, title: 'Access Control', desc: 'Role-based security with JWT auth, RLS policies, and granular permission enforcement.', color: '#00D4FF' },
    { icon: Users, title: 'Event Operations', desc: 'End-to-end event lifecycle management with capacity control and participant tracking.', color: '#FF4DA6' },
    { icon: Eye, title: 'Analytics & Intel', desc: 'Post-event intelligence reports with attendance rates, no-show patterns, and trend analysis.', color: '#FFB300' },
]

const steps = [
    { num: '01', title: 'Deploy Event', desc: 'Admin configures event parameters — capacity, schedule, location, access policies.' },
    { num: '02', title: 'Secure Registration', desc: 'Participants register through verified channels. Unique QR tokens generated instantly.' },
    { num: '03', title: 'Gate Validation', desc: 'Staff scans QR at checkpoints. System validates, logs, and prevents duplicate entry.' },
    { num: '04', title: 'Intel & Reporting', desc: 'Real-time dashboards provide attendance metrics, anomaly detection, and exportable reports.' },
]

export default function Landing() {
    return (
        <div style={{ background: 'transparent', minHeight: '100vh' }}>
            {/* Navbar */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                padding: '12px var(--space-8)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'transparent',
                borderBottom: 'none',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <img src="/logo_refined.png" alt="Logo" style={{ height: '40px' }} />
                    <span style={{ fontWeight: 800, fontSize: 'var(--font-xl)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        VIT-PULSE
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <Link to="/login" className="btn btn-ghost">Sign In</Link>
                    <Link to="/register" className="btn btn-primary">Get Started</Link>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                minHeight: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center',
                padding: 'var(--space-20) var(--space-8)',
                background: 'transparent',
                position: 'relative', overflow: 'hidden',
            }}>

                <div style={{ maxWidth: 780, position: 'relative', zIndex: 1 }}>
                    <div className="badge" style={{
                        background: 'rgba(255,40,40,0.1)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(255,40,40,0.15)',
                        marginBottom: 'var(--space-6)',
                        padding: '4px 16px',
                        fontSize: 'var(--font-xs)', fontWeight: 700,
                        borderRadius: 'var(--radius-full)',
                        animation: 'fadeInUp 0.5s ease',
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
                    }}>
                        <span className="live-dot" /> Secure Event Intelligence Platform
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.25rem, 5.5vw, 4rem)',
                        fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em',
                        marginBottom: 'var(--space-6)',
                        animation: 'fadeInUp 0.5s ease 0.1s both',
                    }}>
                        <span style={{ color: 'var(--text-primary)' }}>Command Your Events</span><br />
                        <span style={{ color: 'var(--accent)' }}>With Digital Precision</span>
                    </h1>

                    <p style={{
                        fontSize: 'var(--font-xl)', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)',
                        maxWidth: 600, margin: '0 auto var(--space-8)', lineHeight: 1.6
                    }}>
                        From registration to post-event analytics — VIT-PULSE provides enterprise-grade
                        security and operational clarity for next-generation event management.
                    </p>

                    <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeInUp 0.5s ease 0.3s both' }}>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Deploy Now <ArrowRight size={16} />
                        </Link>
                        <Link to="/login" className="btn btn-secondary btn-lg">
                            Access Console
                        </Link>
                    </div>

                    {/* Stats */}
                    <div style={{
                        display: 'flex', gap: 'var(--space-12)', justifyContent: 'center',
                        marginTop: 'var(--space-16)',
                        animation: 'fadeInUp 0.5s ease 0.4s both',
                    }}>
                        {[
                            { value: '10K+', label: 'Validated' },
                            { value: '99.9%', label: 'Uptime' },
                            { value: '<2s', label: 'Scan Time' },
                        ].map(s => (
                            <div key={s.label}>
                                <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }} className="metric-glow">
                                    {s.value}
                                </div>
                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: 'var(--space-24) var(--space-8)', maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
                    <div className="panel-header" style={{ justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
                        System Capabilities
                    </div>
                    <h2 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 'var(--space-3)' }}>
                        Enterprise-Grade Security
                    </h2>
                    <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-dim)', maxWidth: 520, margin: '0 auto' }}>
                        Purpose-built for high-security event management with real-time threat detection.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
                    {features.map((f, i) => (
                        <div key={i} className="card" style={{
                            cursor: 'default',
                            animation: `fadeInUp 0.4s ease ${i * 0.08}s both`,
                        }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: 'var(--radius-lg)',
                                background: `${f.color}12`,
                                border: `1px solid ${f.color}20`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 'var(--space-4)',
                            }}>
                                <f.icon size={20} color={f.color} />
                            </div>
                            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                                {f.title}
                            </h3>
                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section style={{
                padding: 'var(--space-20) var(--space-8)',
                background: 'linear-gradient(180deg, transparent 0%, rgba(255,40,40,0.02) 50%, transparent 100%)',
                position: 'relative'
            }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
                        <div className="panel-header" style={{ justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
                            Operational Flow
                        </div>
                        <h2 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            Deployment Pipeline
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gap: 'var(--space-6)', position: 'relative' }}>
                        {/* Vertical line */}
                        <div style={{
                            position: 'absolute', left: 28, top: 32, bottom: 32, width: 1,
                            background: 'linear-gradient(180deg, var(--accent), rgba(255,40,40,0.1))',
                        }} />
                        {steps.map((step, i) => (
                            <div key={i} style={{
                                display: 'flex', gap: 'var(--space-5)', alignItems: 'center',
                                animation: `fadeInUp 0.4s ease ${i * 0.12}s both`,
                            }}>
                                <div style={{
                                    width: 56, height: 56, flexShrink: 0,
                                    borderRadius: 'var(--radius-xl)',
                                    background: i === 0 ? 'var(--accent-gradient)' : 'var(--bg-card)',
                                    border: i === 0 ? 'none' : '1px solid var(--border-color)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 'var(--font-base)', fontWeight: 800,
                                    color: i === 0 ? 'var(--bg-deepest)' : 'var(--accent)',
                                    position: 'relative', zIndex: 1,
                                }}>
                                    {step.num}
                                </div>
                                <div style={{
                                    flex: 1, padding: 'var(--space-4) var(--space-5)',
                                    background: 'var(--gradient-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-xl)',
                                }}>
                                    <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                                        {step.title}
                                    </h3>
                                    <p style={{ color: 'var(--text-dim)', fontSize: 'var(--font-sm)', lineHeight: 1.5 }}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: 'var(--space-24) var(--space-8)', textAlign: 'center' }}>
                <div style={{
                    maxWidth: 640, margin: '0 auto',
                    padding: 'var(--space-12) var(--space-8)',
                    background: 'var(--gradient-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-2xl)',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: 'var(--shadow-xl), var(--shadow-glow)',
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--gradient-accent-line)' }} />
                    <Shield size={36} color="var(--accent)" style={{ margin: '0 auto var(--space-4)', opacity: 0.6 }} />
                    <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' }}>
                        Secure Your Next Event
                    </h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: 'var(--space-6)', fontSize: 'var(--font-base)' }}>
                        Deploy enterprise-grade event security in minutes.
                    </p>
                    <Link to="/register" className="btn btn-primary btn-lg">
                        Initialize System <ArrowRight size={16} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: 'var(--space-6)',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center',
                color: 'var(--text-dim)',
                fontSize: 'var(--font-xs)',
                letterSpacing: '0.03em',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>VIT-PULSE</span>
                </div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)' }}>
                    © 2026 VIT-PULSE — Secure Event Intelligence Platform
                </div>
            </footer>
        </div>
    )
}
