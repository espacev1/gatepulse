import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Ticket, BarChart3, ScanLine, Lock, Users, ArrowRight, CheckCircle2, Eye, ChevronDown } from 'lucide-react'

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

const heroSlides = [
    {
        bg: '/hero1.jpg',
        subtitle: 'Welcome to VIT-PULSE',
        title: 'COMMAND YOUR\nEVENTS',
        desc: 'Enterprise-grade security and operational clarity for next-generation event management.',
        cta: true,
    },
    {
        bg: '/hero2.jpg',
        subtitle: 'Built for Scale',
        title: 'SYSTEM\nCAPABILITIES',
        desc: 'Purpose-built for high-security event management with real-time threat detection.',
        showFeatures: true,
    },
    {
        bg: '/hero3.jpg',
        subtitle: 'Secure Your Next Event',
        title: 'DEPLOYMENT\nPIPELINE',
        desc: 'From event creation to post-event analytics — a seamless four-stage process.',
        showSteps: true,
    },
    {
        bg: '/hero4.png',
        subtitle: 'Campus Intelligence',
        title: 'VISHNU INSTITUTE\nOF TECHNOLOGY',
        desc: 'Integrated security and attendance solutions for modern academic environments.',
        ctaFinal: true,
    },
]

export default function Landing() {
    const [activeSlide, setActiveSlide] = useState(0)
    const containerRef = useRef(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleScroll = () => {
            const scrollTop = container.scrollTop
            const viewportHeight = container.clientHeight
            const newSlide = Math.round(scrollTop / viewportHeight)
            setActiveSlide(Math.min(newSlide, heroSlides.length - 1))
        }

        container.addEventListener('scroll', handleScroll, { passive: true })
        return () => container.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToSlide = (index) => {
        const container = containerRef.current
        if (container) {
            container.scrollTo({
                top: index * container.clientHeight,
                behavior: 'smooth'
            })
        }
    }

    return (
        <div className="landing-root" ref={containerRef}>
            {/* Fixed Navbar */}
            <nav className="landing-nav">
                <div className="nav-logo-container">
                    <img src="/logo_refined.png" alt="Logo" className="nav-logo-img" />
                    <span className="nav-logo-text">VIT-PULSE</span>
                </div>
                <div className="nav-links-container">
                    <Link to="/login" className="btn btn-ghost nav-btn">Sign In</Link>
                    <Link to="/register" className="btn btn-primary nav-btn">Get Started</Link>
                </div>
            </nav>

            {/* Dot Navigation */}
            <div className="dot-nav">
                {heroSlides.map((_, i) => (
                    <button
                        key={i}
                        className={`dot-nav-item ${activeSlide === i ? 'active' : ''}`}
                        onClick={() => scrollToSlide(i)}
                        aria-label={`Go to section ${i + 1}`}
                    />
                ))}
            </div>

            {/* Side Labels */}
            <div className="side-label side-label-left">SCROLL DOWN</div>
            <div className="side-label side-label-right">VIT-PULSE</div>

            {/* Hero Sections */}
            {heroSlides.map((slide, index) => (
                <section
                    key={index}
                    className={`hero-section ${activeSlide === index ? 'hero-active' : ''}`}
                    style={{ backgroundImage: `url(${slide.bg})` }}
                >
                    <div className="hero-overlay" />

                    <div className="hero-inner">
                        <span className="hero-subtitle">{slide.subtitle}</span>
                        <h1 className="hero-title">{slide.title}</h1>
                        <p className="hero-desc">{slide.desc}</p>

                        {slide.cta && (
                            <div className="hero-cta-group">
                                <Link to="/register" className="btn btn-primary btn-lg hero-cta-btn">
                                    Deploy Now <ArrowRight size={16} />
                                </Link>
                                <Link to="/login" className="btn btn-secondary btn-lg hero-cta-btn">
                                    Access Console
                                </Link>
                            </div>
                        )}

                        {slide.showFeatures && (
                            <div className="features-grid">
                                {features.map((f, i) => (
                                    <div key={i} className="feature-card">
                                        <div className="feature-icon" style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                                            <f.icon size={20} color={f.color} />
                                        </div>
                                        <h3 className="feature-title">{f.title}</h3>
                                        <p className="feature-desc">{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {slide.showSteps && (
                            <div className="steps-grid">
                                {steps.map((step, i) => (
                                    <div key={i} className="step-card">
                                        <div className="step-num">{step.num}</div>
                                        <div className="step-content">
                                            <h3 className="step-title">{step.title}</h3>
                                            <p className="step-desc">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {slide.ctaFinal && (
                            <div className="hero-cta-group" style={{ marginTop: '24px' }}>
                                <Link to="/register" className="btn btn-primary btn-lg hero-cta-btn hero-cta-glow">
                                    Initialize System <ArrowRight size={16} />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Scroll indicator on first slide */}
                    {index === 0 && (
                        <div className="scroll-indicator" onClick={() => scrollToSlide(1)}>
                            <ChevronDown size={24} className="scroll-chevron" />
                        </div>
                    )}
                </section>
            ))}

            {/* Footer */}
            <section className="hero-section landing-footer-section">
                <div className="hero-overlay" style={{ background: 'rgba(0,0,0,0.95)' }} />
                <div className="hero-inner" style={{ justifyContent: 'center' }}>
                    <div className="landing-footer-content">
                        <img src="/logo_refined.png" alt="Logo" style={{ height: '48px', marginBottom: '16px' }} />
                        <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#fff', letterSpacing: '-0.02em' }}>VIT-PULSE</span>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '12px' }}>
                            © 2026 VIT-PULSE — Secure Event Intelligence Platform
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
