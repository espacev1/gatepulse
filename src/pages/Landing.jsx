import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Linkedin, Mail, Phone, ChevronDown, Calendar, MapPin, Users, Ticket, Check, ShieldAlert, Award, Star, Activity, Zap, QrCode, LayoutDashboard, BarChart3, Fingerprint, FileText, Smartphone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import SEO from '../components/SEO'
import BubbleMenu from '../components/BubbleMenu'
import './Landing.css'
import { motion } from 'framer-motion'

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
            <div className="ambient-bg">
                <div className="glow-orb primary"></div>
                <div className="glow-orb secondary"></div>
                <div className="glow-orb accent"></div>
            </div>
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
                            <motion.div 
                                className="hero-content"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <motion.div className="hero-top-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                    <span className="hero-category">SMART EVENT MANAGEMENT SYSTEM</span>
                                    <div className="hero-line"></div>
                                </motion.div>
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
                            </motion.div>
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
                                <motion.div className="about-card hero-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                                    <h2>Seamless Campus Event Management</h2>
                                    <p>VIT-PULSE is the official digital backbone for organizing and experiencing events at Vishnu Institute of Technology. From academic symposiums to cultural fests, our ecosystem streamlines registrations, issues secure digital tickets, manages live attendance, and aggregates real-time evaluation scores.</p>
                                </motion.div>

                                {/* Bento Grid Layer */}
                                <motion.div className="bento-container" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.1 }}>
                                    
                                    {/* Large Card: Express Check-in */}
                                    <motion.div className="bento-card bento-span-2 bento-row-span-2" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                        <div className="bento-visual bento-visual-large">
                                            <div className="bento-abstract-shape-1"></div>
                                            <div className="bento-abstract-shape-2"></div>
                                            <QrCode className="bento-visual-icon" style={{ width: '80px', height: '80px' }} />
                                        </div>
                                        <div className="bento-content">
                                            <h3>Express Check-In</h3>
                                            <p>Under-2-second QR code verification using standard smartphone cameras. Eliminate lines entirely.</p>
                                        </div>
                                    </motion.div>

                                    {/* Medium Card: Live Analytics */}
                                    <motion.div className="bento-card bento-span-2" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                        <div className="bento-visual">
                                            <BarChart3 className="bento-visual-icon" />
                                        </div>
                                        <div className="bento-content">
                                            <h3>Live Analytics</h3>
                                            <p>Track check-in ratios and branch demographic distribution dynamically.</p>
                                        </div>
                                    </motion.div>

                                    {/* Standard Cards */}
                                    <motion.div className="bento-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                        <div className="bento-visual" style={{ minHeight: '100px' }}>
                                            <LayoutDashboard className="bento-visual-icon" style={{ width: '40px', height: '40px' }} />
                                        </div>
                                        <div className="bento-content">
                                            <h3 style={{ fontSize: '1.2rem' }}>Role Hubs</h3>
                                            <p style={{ fontSize: '0.9rem' }}>Custom dashboards for staff, faculty, and jury.</p>
                                        </div>
                                    </motion.div>

                                    <motion.div className="bento-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                        <div className="bento-visual" style={{ minHeight: '100px' }}>
                                            <Fingerprint className="bento-visual-icon" style={{ width: '40px', height: '40px' }} />
                                        </div>
                                        <div className="bento-content">
                                            <h3 style={{ fontSize: '1.2rem' }}>Secure Tickets</h3>
                                            <p style={{ fontSize: '0.9rem' }}>Cryptographically secure QR-tokens prevent fraud.</p>
                                        </div>
                                    </motion.div>

                                    {/* Medium Card: Automated Synopsis */}
                                    <motion.div className="bento-card bento-span-2" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                        <div className="bento-visual">
                                            <FileText className="bento-visual-icon" />
                                        </div>
                                        <div className="bento-content">
                                            <h3>Automated Synopsis</h3>
                                            <p>Generate coordinator reports and audit logs for administrative approvals.</p>
                                        </div>
                                    </motion.div>

                                    {/* Medium Card: Jury Portals */}
                                    <motion.div className="bento-card bento-span-2" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                        <div className="bento-visual">
                                            <Star className="bento-visual-icon" />
                                        </div>
                                        <div className="bento-content">
                                            <h3>Jury Portals</h3>
                                            <p>Enable digital scoring, rubric evaluation, and instant leaderboards.</p>
                                        </div>
                                    </motion.div>

                                </motion.div>
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
                                            <motion.div
                                                key={section.id}
                                                className={`explore-item-card glass-card ${selectedSection?.id === section.id ? 'is-hidden-selected' : ''}`}
                                                style={{ "--i": index }}
                                                onClick={() => setSelectedSection(section)}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{section.icon}</div>
                                                <h4>{section.title}</h4>
                                            </motion.div>
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
                            ) : events.length === 0 ? (
                                <motion.div className="bento-container" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                                    <div className="bento-card bento-span-4" style={{ textAlign: 'center', padding: '64px' }}>
                                        <div className="bento-visual" style={{ minHeight: '120px' }}>
                                            <div className="bento-abstract-shape-1"></div>
                                            <Calendar className="bento-visual-icon" style={{ width: '60px', height: '60px' }} />
                                        </div>
                                        <div className="bento-content">
                                            <h3>Events Coming Soon</h3>
                                            <p>Stay tuned — the next wave of campus events is being organized. Register to get notified first.</p>
                                        </div>
                                        <button className="event-register-btn" style={{ marginTop: '24px' }} onClick={() => navigate('/auth')}>
                                            Get Notified <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div className="bento-container" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.1 }}>
                                    {events.map((event, i) => {
                                        const isLive = event.status === 'active' || event.is_live;
                                        const eventDate = event.event_date ? new Date(event.event_date) : null;
                                        const isHero = i === 0;
                                        return (
                                            <motion.div
                                                key={event.id || i}
                                                className={`bento-card ${isHero ? 'bento-span-2 bento-row-span-2' : ''}`}
                                                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                                                style={isLive ? { borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16,185,129,0.04)' } : {}}
                                            >
                                                {/* Visual Centerpiece */}
                                                <div className={`bento-visual ${isHero ? 'bento-visual-large' : ''}`} style={{ background: isLive ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,212,255,0.08))' : undefined }}>
                                                    <div className="bento-abstract-shape-1" style={isLive ? { background: 'radial-gradient(circle, rgba(16,185,129,0.6) 0%, transparent 70%)' } : {}}></div>
                                                    <div className="bento-abstract-shape-2"></div>
                                                    {isLive
                                                        ? <Zap className="bento-visual-icon" style={{ width: isHero ? '72px' : '48px', height: isHero ? '72px' : '48px', color: '#10B981' }} />
                                                        : <Calendar className="bento-visual-icon" style={{ width: isHero ? '72px' : '48px', height: isHero ? '72px' : '48px' }} />
                                                    }
                                                    {isLive && (
                                                        <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#10B981', color: '#fff', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', padding: '4px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }}></span>
                                                            LIVE
                                                        </span>
                                                    )}
                                                    {!isLive && (
                                                        <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(10,61,145,0.15)', color: '#0A3D91', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', padding: '4px 10px', borderRadius: '999px' }}>
                                                            UPCOMING
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="bento-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                                                    <h3 style={{ fontSize: isHero ? '1.8rem' : '1.2rem' }}>{event.name}</h3>
                                                    <p style={{ fontSize: isHero ? '1rem' : '0.9rem', flexGrow: 1 }}>{event.description}</p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: 'auto' }}>
                                                        <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--vit-text-muted)' }}>
                                                            <MapPin size={14} color="#0084FF" /><span>{event.location}</span>
                                                        </div>
                                                        <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--vit-text-muted)' }}>
                                                            <Calendar size={14} color="#0084FF" /><span>{eventDate ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</span>
                                                        </div>
                                                        <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--vit-text-muted)' }}>
                                                            <Users size={14} color="#0084FF" /><span style={{ textTransform: 'capitalize' }}>{event.registered_count || 0} registered</span>
                                                        </div>
                                                    </div>
                                                    <button className="event-register-btn" style={{ marginTop: '8px', alignSelf: 'flex-start' }} onClick={() => navigate('/auth')}>
                                                        Register Now <ArrowRight size={14} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
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

                            <motion.div className="bento-container" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.12 }}>
                                {(showAllTeam ? team : team.slice(0, 3)).map((member, i) => (
                                    <motion.div
                                        key={member.id}
                                        className="bento-card"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelectedMember(member)}
                                        variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                                        whileHover={{ y: -6 }}
                                    >
                                        {/* Visual Centerpiece: Avatar */}
                                        <div className="bento-visual" style={{ minHeight: '200px', padding: '0', overflow: 'hidden', borderRadius: '20px' }}>
                                            <div className="bento-abstract-shape-1"></div>
                                            <img
                                                src={member.display_image}
                                                alt={member.display_name}
                                                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.6)', boxShadow: '0 8px 32px rgba(10,61,145,0.15)', zIndex: 2, position: 'relative' }}
                                            />
                                        </div>
                                        <div className="bento-content" style={{ textAlign: 'center', paddingTop: '8px' }}>
                                            <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{member.display_name}</h3>
                                            <span style={{ display: 'inline-block', background: 'rgba(10,61,145,0.08)', color: 'var(--vit-primary)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', padding: '4px 12px', borderRadius: '999px', textTransform: 'uppercase' }}>
                                                {member.designation}
                                            </span>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                                                {member.linkedin_url && (
                                                    <button onClick={(e) => { e.stopPropagation(); window.open(member.linkedin_url, '_blank'); }} style={{ background: 'none', border: '1px solid rgba(10,61,145,0.2)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--vit-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                                                        <Linkedin size={14} /> LinkedIn
                                                    </button>
                                                )}
                                                {member.display_email && (
                                                    <button onClick={(e) => { e.stopPropagation(); window.open(`mailto:${member.display_email}`, '_blank'); }} style={{ background: 'none', border: '1px solid rgba(10,61,145,0.2)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--vit-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                                                        <Mail size={14} /> Email
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

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
