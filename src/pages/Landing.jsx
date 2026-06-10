import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Linkedin, Mail, Phone, ChevronDown, Calendar, MapPin, Users, Ticket, Check, ShieldAlert, Award, Star, Activity, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import SEO from '../components/SEO'
import BubbleMenu from '../components/BubbleMenu'
import './Landing.css'

export default function Landing() {
    const navigate = useNavigate()

    const [team, setTeam] = useState([])
    const [showAllTeam, setShowAllTeam] = useState(false)
    const [events, setEvents] = useState([])
    const [loadingEvents, setLoadingEvents] = useState(true)

    const menuItems = [
        {
            label: 'home',
            href: '#hero',
            ariaLabel: 'Home',
            rotation: -8,
            hoverStyles: { bgColor: '#3b82f6', textColor: '#ffffff' }
        },
        {
            label: 'about',
            href: '#about',
            ariaLabel: 'About',
            rotation: 8,
            hoverStyles: { bgColor: '#10b981', textColor: '#ffffff' }
        },
        {
            label: 'explore',
            href: '#explore',
            ariaLabel: 'Explore',
            rotation: 8,
            hoverStyles: { bgColor: '#f59e0b', textColor: '#ffffff' }
        },
        {
            label: 'events',
            href: '#features',
            ariaLabel: 'Events',
            rotation: 8,
            hoverStyles: { bgColor: '#ef4444', textColor: '#ffffff' }
        },
        {
            label: 'team',
            href: '#team',
            ariaLabel: 'Team',
            rotation: -8,
            hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' }
        },
        {
            label: 'get started',
            href: '/auth',
            ariaLabel: 'Get Started',
            rotation: 8,
            hoverStyles: { bgColor: '#0084ff', textColor: '#ffffff' }
        }
    ]

    const fallbackEvents = [
        {
            id: "mock-1",
            name: "Nexus National Hackathon",
            description: "A 36-hour national hackathon challenging student developers to build solutions for real-world problems in fintech, healthcare, and education.",
            location: "Main Seminar Hall, block 2",
            event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: "upcoming",
            participation_type: "team",
            is_free: true,
            max_capacity: 120,
            registered_count: 87
        },
        {
            id: "mock-2",
            name: "Innovanza Technical Symposium",
            description: "Annual technical symposium of Vishnu Institute featuring paper presentations, coding contests, robotic races, and AI workshops.",
            location: "CSE Department Seminar Hall",
            event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: "upcoming",
            participation_type: "solo",
            is_free: true,
            max_capacity: 200,
            registered_count: 145
        },
        {
            id: "mock-3",
            name: "Colloquium: Future of Generative AI",
            description: "An interactive guest lecture and panel discussion featuring industry specialists talking about the evolution of LLMs and autonomous agents.",
            location: "Auditorium - Block 1",
            event_date: new Date().toISOString(),
            status: "active",
            participation_type: "solo",
            is_free: false,
            max_capacity: 350,
            registered_count: 312
        }
    ]

    const fetchEvents = useCallback(async () => {
        try {
            setLoadingEvents(true)
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('start_time', { ascending: true })
            
            if (error) throw error
            if (data && data.length > 0) {
                setEvents(data)
            } else {
                setEvents(fallbackEvents)
            }
        } catch (err) {
            console.error('Error fetching events from database:', err)
            setEvents(fallbackEvents)
        } finally {
            setLoadingEvents(false)
        }
    }, [])

    const fetchTeam = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*, profile:profiles(id, full_name, email, avatar_url)')
                .order('display_order', { ascending: true })

            if (error) {
                console.error('Error fetching team members:', error.message, error.details)
                return
            }

            if (data && data.length > 0) {
                const resolved = data.map(m => ({
                    ...m,
                    display_name: m.profile?.full_name || m.name || 'Team Member',
                    display_email: m.profile?.email || m.email || '',
                    display_image: m.profile?.avatar_url || m.image_url || '/default-avatar.png'
                }))
                setTeam(resolved)
            } else {
                console.warn('No team members found in the database.')
            }
        } catch (err) {
            console.error('Critical failure in fetchTeam:', err)
        }
    }, [])

    useEffect(() => {
        fetchTeam()
        fetchEvents()
    }, [fetchTeam, fetchEvents])

    const scrollToSection = (id) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const sections = [
        {
            id: 'ticketing',
            title: 'Digital QR Tickets',
            subtitle: 'Secure Access Provisioning',
            icon: '🎟️',
            color: '#FFD700',
            description: 'Instantly generate secure, unique QR-coded digital tickets upon registration. Tickets are sent directly to the participant\'s email for convenience.',
            highlights: [
                'Unique Token Generation',
                'Email Ticket Delivery',
                'Zero Paper Waste',
                'Instant Dashboard Sync'
            ]
        },
        {
            id: 'scanner',
            title: 'Express QR Scanning',
            subtitle: 'High-speed Gate Control',
            icon: '⚡',
            color: '#0084FF',
            description: 'Validate tickets in under two seconds. Gate check-in staff can scan participant QR codes using any standard smartphone camera—no specialized hardware required.',
            highlights: [
                'Under 2-Second Validation',
                'Device Agnostic Camera Scan',
                'Anti-Fraud Double Scan Guards',
                'Offline Check-in Resiliency'
            ]
        },
        {
            id: 'jury',
            title: 'Jury Evaluation Portal',
            subtitle: 'Real-Time Competition Scoring',
            icon: '🏆',
            color: '#FF4757',
            description: 'Judges can review submissions and assign scores based on custom rubrics and criteria directly through a dedicated portal. Real-time updates push standings instantly.',
            highlights: [
                'Multi-Criteria Rubrics',
                'Real-Time Leaderboard Updates',
                'Super-Admin Jury Assignment',
                'Streamlined Team Evaluation'
            ]
        },
        {
            id: 'analytics',
            title: 'Real-Time Analytics',
            subtitle: 'Live Attendance Monitor',
            icon: '📊',
            color: '#2ED573',
            description: 'Track registrations, capacity limits, and live gate check-in ratios. Access modern graphs displaying check-in rates and branch demographics.',
            highlights: [
                'Live Check-in Counters',
                'Department-wise Stats',
                'Interactive Recharts Visuals',
                'Accreditation-Ready Exports'
            ]
        },
        {
            id: 'management',
            title: 'Synopsis & Reports',
            subtitle: 'Accreditation Documents',
            icon: '📝',
            color: '#FF6B81',
            description: 'Generate comprehensive event synopses and attendance sheets automatically. Faculty coordinators can export audit-ready CSV/PDF reports.',
            highlights: [
                'Auto-Generated Event Synopses',
                'Faculty & Coordinator Sign-off',
                'One-Click CSV/PDF Download',
                'Verified Attendance Logs'
            ]
        }
    ]

    const [selectedSection, setSelectedSection] = useState(null)
    const [selectedMember, setSelectedMember] = useState(null)

    const structuredData = [
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "VIT-PULSE",
            "alternateName": ["VITPULSE", "VIT Pulse"],
            "url": "https://vitpulse-vitb.vercel.app",
            "potentialAction": {
                "@type": "SearchAction",
                "target": "https://vitpulse-vitb.vercel.app/events?q={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "VIT-PULSE",
            "url": "https://vitpulse-vitb.vercel.app",
            "logo": "https://vitpulse-vitb.vercel.app/logo_refined.png",
            "sameAs": [
                "https://linkedin.com/company/vitpulse"
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "VIT-PULSE",
            "operatingSystem": "Web",
            "applicationCategory": "EducationalApplication",
            "description": "Smart Event Management System for Vishnu Institute of Technology, featuring digital ticket validation and real-time attendance tracking.",
            "offers": {
                "@type": "Offer",
                "price": "0"
            }
        }
    ]

    return (
        <div className="landing-v2">
            <SEO
                title="Smart Event Management — Vishnu Institute of Technology"
                description="VIT-PULSE is a modern event management platform for VIT Bhimavaram, offering digital ticketing, QR verification, and real-time analytics for campus events."
                keywords="VIT-PULSE, Vishnu Institute of Technology, event management, digital tickets, campus events, QR validation"
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Fixed Viewport containing all morphing layers */}
            <div className="fixed-viewport">
                {/* Floating Bubble Menu replacing the header */}
                <BubbleMenu
                    logo={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img src="/logo_refined.png" alt="Logo" style={{ height: '24px', width: 'auto' }} />
                            <span style={{ fontFamily: 'norwester', fontSize: '1.4rem', color: '#111', fontWeight: 'bold', letterSpacing: '0.05em' }}>VITPULSE</span>
                        </div>
                    }
                    items={menuItems}
                    menuAriaLabel="Toggle navigation"
                    menuBg="#ffffff"
                    menuContentColor="#111111"
                    useFixedPosition={true}
                    animationEase="back.out(1.5)"
                    animationDuration={0.5}
                    staggerDelay={0.12}
                />

                <div className="morphing-container">
                    {/* Hero Section Layer */}
                    <main id="hero" className="hero-v2-layer">
                        <div className="hero-left-curtain">
                            <div className="hero-content">
                                <div className="hero-top-info">
                                    <span className="hero-category">SMART EVENT MANAGEMENT SYSTEM</span>
                                    <div className="hero-line"></div>
                                </div>
                                <h1 className="hero-title">
                                    VIT<br />PULSE
                                </h1>
                                <p className="hero-desc" style={{ fontSize: '1.15rem', color: '#555', margin: '1rem 0 2.5rem 0', maxWidth: '460px', lineHeight: 1.6 }}>
                                    A premium digital ticketing, express QR validation, and live jury evaluation network for Vishnu Institute of Technology campus events.
                                </p>
                                <div className="hero-actions" style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                    <button onClick={() => navigate('/auth')} className="get-started-btn">
                                        GET STARTED <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="hero-right-anchor">
                            <img src="/vishnu logo.webp" alt="Vishnu Logo" className="logo-main-image" />
                        </div>
                    </main>

                    {/* About Section Layer */}
                    <section id="about" className="about-v2-layer">
                        <div className="about-right-curtain">
                            <div className="about-content">
                                <span className="about-subtitle">ABOUT VIT-PULSE</span>

                                {/* Main Hero Card */}
                                <div className="about-card hero-card">
                                    <h2>Seamless Campus Event Management</h2>
                                    <p>VIT-PULSE is the official digital backbone for organizing and experiencing events at Vishnu Institute of Technology. From academic symposiums to cultural fests, our ecosystem streamlines registrations, issues secure digital tickets, manages live attendance, and aggregates real-time evaluation scores.</p>
                                </div>

                                {/* Overview Card */}
                                <div className="about-card overview-card">
                                    <h3>Our core ecosystem pillars</h3>
                                    <p>We leverage modern web technology to eliminate paper ticketing waste, prevent check-in fraud, and automate the tedious tasks of synopsis compilation and grading.</p>
                                </div>

                                <div className="highlight-grid">
                                    {/* Small Cards */}
                                    <div className="card-small">
                                        <div className="card-header"><h4>Express Check-In</h4></div>
                                        <p>Under-2-second QR code verification using standard smartphone cameras.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Role-Based Hubs</h4></div>
                                        <p>Custom dashboards for participants, event staff, faculty, and jury members.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Live Analytics</h4></div>
                                        <p>Track student check-in ratios and branch demographic distribution dynamically.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Jury Portals</h4></div>
                                        <p>Enable digital scoring, rubric evaluation, and instant leaderboards.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Branch Restrictions</h4></div>
                                        <p>Restrict event registrations based on department-specific eligibility criteria.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Automated Synopsis</h4></div>
                                        <p>Generate coordinator reports and audit logs for administrative approvals.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Secure Ticketing</h4></div>
                                        <p>Generate cryptographically secure QR-tokens to prevent ticket duplication.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Email Confirmation</h4></div>
                                        <p>Get digital tickets and check-in confirmation notes sent instantly to your inbox.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Explore Section Layer */}
                    <section id="explore" className="explore-v2-layer">
                        <div className={`explore-canvas ${selectedSection ? 'is-expanded' : ''}`}>
                            <div className="explore-header-group">
                                <h2 className="explore-title">EXPLORE MODULES</h2>
                            </div>

                            <div className="explore-interactive-area">
                                {/* The Large Intro / Detail Rectangle */}
                                <div className="explore-detail-box glass-card" key={selectedSection?.id || 'intro'}>
                                    {selectedSection ? (
                                        <div className="detail-view">
                                            <div className="detail-header" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                                <div className="detail-icon" style={{ background: selectedSection.color, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '15px', fontSize: '1.8rem' }}>
                                                    {selectedSection.icon}
                                                </div>
                                                <h3 style={{ margin: 0 }}>{selectedSection.title}</h3>
                                            </div>
                                            <h4>{selectedSection.subtitle}</h4>
                                            <p>{selectedSection.description}</p>
                                            <ul className="detail-list">
                                                {selectedSection.highlights.map((h, i) => <li key={i}>{h}</li>)}
                                            </ul>
                                            <button className="back-btn" onClick={() => setSelectedSection(null)}>CLOSE</button>
                                        </div>
                                    ) : (
                                        <div className="intro-view">
                                            <h3>Discover platform features</h3>
                                            <p>VIT-PULSE brings coordination and simplicity to campus events. Select a module on the right to discover how we streamline the entire event lifecycle from creation to grading.</p>
                                        </div>
                                    )}
                                </div>

                                {/* The 5 Square Cards in a Grid */}
                                <div className="explore-cards-container">
                                    {sections
                                        .map((section, index) => (
                                            <div
                                                key={section.id}
                                                className={`explore-item-card glass-card ${selectedSection?.id === section.id ? 'is-hidden-selected' : ''}`}
                                                style={{ "--i": index }}
                                                onClick={() => setSelectedSection(section)}
                                            >
                                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{section.icon}</div>
                                                <h4>{section.title}</h4>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Section Layer (Repurposed as Live & Upcoming Events) */}
                    <section id="features" className="features-v2-layer">
                        <div className="features-canvas">
                            <div className="features-header">
                                <span className="features-subtitle">CAMPUS HAPPENINGS</span>
                                <h2 className="features-main-title">Live & Upcoming Events</h2>
                            </div>

                            {loadingEvents ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0', width: '100%', color: '#0084FF' }}>
                                    <Activity className="animate-spin" size={32} />
                                </div>
                            ) : (
                                <div className="features-grid-container">
                                    {events.map((event, i) => {
                                        const isLive = event.status === 'active' || event.is_live;
                                        const eventDate = event.event_date ? new Date(event.event_date) : null;
                                        return (
                                            <div key={event.id || i} className={`event-card ${isLive ? 'live' : ''}`} style={{ "--i": i }}>
                                                <div>
                                                    <span className={`event-badge ${isLive ? 'live' : 'upcoming'}`}>
                                                        <Zap size={12} fill="currentColor" /> {isLive ? 'Live Now' : 'Upcoming'}
                                                    </span>
                                                    <h3 className="event-title">{event.name}</h3>
                                                    <p className="event-description">{event.description}</p>
                                                </div>
                                                <div>
                                                    <div className="event-meta">
                                                        <div className="meta-item">
                                                            <MapPin size={16} color="#0084FF" />
                                                            <span>{event.location}</span>
                                                        </div>
                                                        <div className="meta-item">
                                                            <Calendar size={16} color="#0084FF" />
                                                            <span>{eventDate ? eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}</span>
                                                        </div>
                                                        <div className="meta-item">
                                                            <Users size={16} color="#0084FF" />
                                                            <span style={{ textTransform: 'capitalize' }}>{event.participation_type || 'Solo'} Event ({event.registered_count || 0} Joined)</span>
                                                        </div>
                                                    </div>
                                                    <div className="event-card-actions">
                                                        <button 
                                                            className="event-register-btn"
                                                            onClick={() => navigate('/auth')}
                                                        >
                                                            Register Now <ArrowRight size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Team Section Layer */}
                    <section id="team" className="team-v2-layer">
                        <div className="team-canvas">
                            <div className="team-header">
                                <span className="team-subtitle">THE VISIONARIES</span>
                                <h2 className="team-main-title">About Us</h2>
                                <p className="team-description">Meet the creative minds building the future of campus event management systems.</p>
                            </div>

                            <div className="team-grid">
                                {(showAllTeam ? team : team.slice(0, 3)).map((member, i) => (
                                    <div
                                        key={member.id}
                                        className="team-card glass-card"
                                        style={{ "--i": i }}
                                        onClick={() => setSelectedMember(member)}
                                    >
                                        <div className="member-image-wrap">
                                            <img src={member.display_image} alt={member.display_name} />
                                        </div>
                                        <div className="member-info">
                                            <h4>{member.display_name}</h4>
                                            <span>{member.designation}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!showAllTeam && team.length > 3 && (
                                <button className="see-more-btn" onClick={() => setShowAllTeam(true)}>
                                    SEE MORE <ChevronDown size={18} />
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Team Member Detail Modal */}
                    {selectedMember && (
                        <div className="team-modal-overlay">
                            <div className="team-modal-content glass-card">
                                <div className="team-modal-layout">
                                    <div className="team-modal-media">
                                        <img src={selectedMember.display_image} alt={selectedMember.display_name} />
                                    </div>
                                    <div className="team-modal-text">
                                        <div className="detail-header">
                                            <h3 className="norwester">{selectedMember.display_name}</h3>
                                        </div>
                                        <h4>{selectedMember.designation}</h4>
                                        <p className="member-bio-large">{selectedMember.description}</p>

                                        <ul className="detail-list">
                                            {selectedMember.linkedin_url && (
                                                <li onClick={() => window.open(selectedMember.linkedin_url, '_blank')}>
                                                    <span>Connect on LinkedIn</span>
                                                </li>
                                            )}
                                            {selectedMember.display_email && (
                                                <li onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedMember.display_email}`, '_blank')}>
                                                    <span>Get in touch via Gmail</span>
                                                </li>
                                            )}
                                            {selectedMember.phone && (
                                                <li onClick={() => window.location.href = `tel:${selectedMember.phone}`}>
                                                    <span>Contact via Phone</span>
                                                </li>
                                            )}
                                        </ul>
                                        <button className="back-btn" onClick={() => setSelectedMember(null)}>CLOSE</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <p className="footer-text">
                        &copy; {new Date().getFullYear()} VIT-PULSE, Vishnu Institute of Technology. All rights reserved.
                    </p>
                    <div className="footer-links">
                        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                        <span className="footer-separator">|</span>
                        <Link to="/terms" className="footer-link">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
