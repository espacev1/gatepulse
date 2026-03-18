import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './Landing.css'

export default function Landing() {
    const [scrollProgress, setScrollProgress] = useState(0)
    const [smoothedProgress, setSmoothedProgress] = useState(0)

    useEffect(() => {
        let currentScroll = 0
        const handleScroll = () => {
            const viewportHeight = window.innerHeight
            const scrollY = window.scrollY
            const maxScroll = document.documentElement.scrollHeight - viewportHeight

            // Infinite Loop check
            if (scrollY >= maxScroll - 10) {
                window.scrollTo(0, 0)
                currentScroll = 0
                return
            }

            currentScroll = scrollY / viewportHeight
        }

        let rafId
        const lerp = (start, end, factor) => start + (end - start) * factor

        const updateProgress = () => {
            setSmoothedProgress(prev => {
                const next = lerp(prev, currentScroll, 0.1) // Lerp factor for smoothness
                // Only update if the difference is meaningful to save cycles
                return Math.abs(next - currentScroll) < 0.0001 ? currentScroll : next
            })
            rafId = requestAnimationFrame(updateProgress)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        rafId = requestAnimationFrame(updateProgress)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            cancelAnimationFrame(rafId)
        }
    }, [])

    const sections = [
        {
            id: 'map',
            title: 'Interactive Campus Map',
            subtitle: 'Digital Navigation',
            icon: '',
            color: '#FFD700',
            description: 'Navigate the campus seamlessly with a smart, real-time digital map.',
            highlights: [
                'Real-time Positioning',
                'Interactive Building Info',
                'Offline Map Access',
                'Emergency Point Markers'
            ]
        },
        {
            id: 'navigation',
            title: 'Smart Navigation',
            subtitle: 'Optimized Routes',
            icon: '',
            color: '#0084FF',
            description: 'Find classrooms, labs, and facilities instantly with optimized routes.',
            highlights: [
                'Indoor Navigation',
                'Lab & Facility Search',
                'Shortest Path Algorithm',
                'Voice Assistance Support'
            ]
        },
        {
            id: 'events',
            title: 'Event & Activity Hub',
            subtitle: 'Campus Vibrancy',
            icon: '',
            color: '#FF4757',
            description: 'Stay updated with campus events, fests, and club activities in one place.',
            highlights: [
                'Live Event Calendars',
                'Club Activity Tracking',
                'Festival Announcements',
                'Workshop Registrations'
            ]
        },
        {
            id: 'community',
            title: 'Student Community',
            subtitle: 'Collaborate & Engage',
            icon: '',
            color: '#2ED573',
            description: 'Connect with peers, clubs, and groups to collaborate and engage.',
            highlights: [
                'Peer Collaboration Groups',
                'Club Communication Tools',
                'Project Discussion Forums',
                'Skill Sharing Platforms'
            ]
        },
        {
            id: 'updates',
            title: 'Real-Time Updates',
            subtitle: 'Instant Info',
            icon: '',
            color: '#FF6B81',
            description: 'Get instant notifications on schedules, announcements, and campus info.',
            highlights: [
                'Schedule Change Alerts',
                'Official Announcements',
                'Live Campus News',
                'Notification History'
            ]
        }
    ]

    const [selectedSection, setSelectedSection] = useState(null)

    return (
        <div className="landing-v2" style={{ '--scroll-progress': smoothedProgress }}>
            {/* Extended Scroll Catcher for 3 stages */}
            <div className="scroll-spacer"></div>

            {/* Fixed Viewport containing all morphing layers */}
            <div className="fixed-viewport">
                {/* Header */}
                <header className="landing-header">
                    <div className="logo-wrap">
                        <img src="/logo_refined.png" alt="Logo" className="logo-icon" />
                        <span className="logo-text">VITPULSE</span>
                    </div>
                    <nav className="nav-links">
                        <Link to="/register" className="nav-link">GET STARTED</Link>
                        <Link to="/login" className="nav-link">LOGIN</Link>
                        <Link to="/register" className="nav-link">EXPLORE</Link>
                        <Link to="/register" className="nav-link">FEATURES</Link>
                        <Link to="/register" className="nav-link">TEAM</Link>
                    </nav>
                </header>

                <div className="morphing-container">
                    {/* Hero Section Layer (Visible 0 -> 0.8) */}
                    <main className="hero-v2-layer" style={{
                        opacity: Math.max(0, 1 - smoothedProgress * 2.5),
                        transform: `scale(${1 + smoothedProgress * 0.1}) translateY(${smoothedProgress * -20}vh)`,
                        pointerEvents: smoothedProgress < 0.4 ? 'auto' : 'none'
                    }}>
                        <div className="hero-left-curtain">
                            <div className="hero-content">
                                <span className="subtitle">SMART EVENT MANAGEMENT SYSTEM</span>
                                <h1 className="main-title">
                                    VIT<br />
                                    PULSE
                                </h1>
                                <Link to="/register" className="get-started-btn">
                                    GET STARTED <ArrowRight size={24} />
                                </Link>
                            </div>
                        </div>
                    </main>

                    {/* About Section Layer (Visible 0.4 -> 1.5) */}
                    <section className="about-v2-layer" style={{
                        opacity: smoothedProgress < 1.1 ?
                            Math.min(1, Math.max(0, (smoothedProgress - 0.3) * 3)) :
                            Math.max(0, 1 - (smoothedProgress - 1.2) * 3),
                        transform: `translateY(${(1 - Math.min(1, Math.max(0, (smoothedProgress - 0.3) * 2))) * 20 + (smoothedProgress > 1.2 ? (smoothedProgress - 1.2) * -50 : 0)}vh)`,
                        pointerEvents: smoothedProgress > 0.4 && smoothedProgress < 1.4 ? 'auto' : 'none'
                    }}>
                        <div className="about-right-curtain">
                            <div className="about-content">
                                <span className="about-subtitle">ABOUT VITB</span>

                                {/* Main Hero Card */}
                                <div className="about-card hero-card">
                                    <h2>About Vishnu Institute of Technology Bhimavaram</h2>
                                    <p>Vishnu Institute of Technology (VIT), Bhimavaram, is a premier engineering institution known for its excellence in education, innovation, and student development. The college provides a vibrant learning environment that blends academic knowledge with practical experience, preparing students to excel in the global technology landscape.</p>
                                </div>

                                {/* Overview Card */}
                                <div className="about-card overview-card">
                                    <h3>Our Vision & Excellence</h3>
                                    <p>VIT is committed to nurturing future engineers and leaders through quality education, advanced infrastructure, and industry-oriented learning. The institution emphasizes creativity, research, and real-world problem solving, helping students build strong technical and professional skills.</p>
                                </div>

                                <div className="highlight-grid">
                                    {/* Small Cards */}
                                    <div className="card-small">
                                        <div className="card-header"><h4>Academic Excellence</h4></div>
                                        <p>Delivering high-quality education with a modern and updated curriculum.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>World-Class Infrastructure</h4></div>
                                        <p>Equipped with advanced labs, smart classrooms, and digital facilities.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Experienced Faculty</h4></div>
                                        <p>Guidance from highly qualified and dedicated teaching professionals.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Strong Placements</h4></div>
                                        <p>Excellent placement support with top companies recruiting students.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Research & Innovation</h4></div>
                                        <p>Encouraging students to work on projects, startups, and new technologies.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Holistic Development</h4></div>
                                        <p>Focus on extracurricular activities, leadership, and personality growth.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Industry Collaboration</h4></div>
                                        <p>Partnerships with industries to provide real-world exposure.</p>
                                    </div>
                                    <div className="card-small">
                                        <div className="card-header"><h4>Career Opportunities</h4></div>
                                        <p>Preparing students for global careers and higher education.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Explore Section Layer */}
                    <section className="explore-v2-layer" style={{
                        opacity: smoothedProgress < 2.5 ? 
                            (smoothedProgress > 1.15 ? 1 : 0) : 
                            Math.max(0, 1 - (smoothedProgress - 2.5) * 4),
                        transform: `translateY(${
                            smoothedProgress > 2.5 ? (smoothedProgress - 2.5) * -80 : 
                            Math.max(0, 100 - (smoothedProgress - 1.15) * 200)
                        }%)`,
                        pointerEvents: smoothedProgress > 1.3 && smoothedProgress < 2.5 ? 'auto' : 'none'
                    }}>
                        <div className={`explore-canvas ${selectedSection ? 'is-expanded' : ''}`}>
                            <div className="explore-header-group">
                                <h2 className="explore-title">EXPLORE</h2>
                            </div>

                            <div className="explore-interactive-area">
                                {/* The Large Intro / Detail Rectangle */}
                                <div className="explore-detail-box glass-card" key={selectedSection?.id || 'intro'}>
                                    {selectedSection ? (
                                        <div className="detail-view">
                                            <div className="detail-header">
                                                <h3>{selectedSection.title}</h3>
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
                                            <h3>Discover Vishnu Institute</h3>
                                            <p>A hub of innovation and excellence, shaping future engineers and leaders. From research labs to startups, explore a dynamic ecosystem where talent meets opportunity.</p>
                                        </div>
                                    )}
                                </div>

                                {/* The 5 Square Cards in a 3x2 Grid */}
                                <div className="explore-cards-container">
                                    {sections
                                        .map((section, index) => (
                                            <div
                                                key={section.id}
                                                className={`explore-item-card glass-card ${selectedSection?.id === section.id ? 'is-hidden-selected' : ''}`}
                                                style={{ "--i": index }}
                                                onClick={() => setSelectedSection(section)}
                                            >
                                                <h4>{section.title}</h4>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Section Layer */}
                    <section className="features-v2-layer" style={{
                        opacity: smoothedProgress < 3.4 ?
                            (smoothedProgress > 2.5 ? 1 : 0) :
                            Math.max(0, 1 - (smoothedProgress - 3.4) * 4),
                        transform: `translateY(${smoothedProgress > 3.4 ? (smoothedProgress - 3.4) * -80 : (Math.max(0, 100 - (smoothedProgress - 2.5) * 200))}%)`,
                        pointerEvents: smoothedProgress > 2.7 && smoothedProgress < 3.4 ? 'auto' : 'none'
                    }}>
                        <div className="features-canvas">
                            <div className="features-header">
                                <span className="features-subtitle">CORE CAPABILITIES</span>
                                <h2 className="features-main-title">Features of VIT Pulse</h2>
                            </div>

                            <div className="features-grid-container">
                                {[
                                    { id: 'f1', title: '1. Interactive Campus Map', desc: 'Navigate the campus seamlessly with a smart, real-time digital map.' },
                                    { id: 'f2', title: '2. Smart Navigation', desc: 'Find classrooms, labs, and facilities instantly with optimized routes.' },
                                    { id: 'f3', title: '3. Event & Activity Hub', desc: 'Stay updated with campus events, fests, and club activities in one place.' },
                                    { id: 'f4', title: '4. Student Community', desc: 'Connect with peers, clubs, and groups to collaborate and engage.' },
                                    { id: 'f5', title: '5. Real-Time Updates', desc: 'Get instant notifications on schedules, announcements, and campus info.' }
                                ].map((feature, i) => (
                                    <div key={feature.id} className="feature-card glass-card" style={{ "--i": i }}>
                                        <h3>{feature.title}</h3>
                                        <p>{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Team Section Layer */}
                    <section className="team-v2-layer" style={{
                        opacity: Math.min(1, Math.max(0, (smoothedProgress - 3.4) * 4)),
                        transform: `translateY(${(1 - Math.min(1, Math.max(0, (smoothedProgress - 3.4) * 3))) * 20}vh)`,
                        pointerEvents: smoothedProgress > 3.6 ? 'auto' : 'none'
                    }}>
                        <div className="team-canvas">
                            <div className="team-header">
                                <span className="team-subtitle">THE VISIONARIES</span>
                                <h2 className="team-main-title">About Us</h2>
                                <p className="team-description">Meet the creative minds building the future of campus management.</p>
                            </div>

                            <div className="team-grid">
                                {[
                                    { name: "Alex Rivera", role: "Lead Architect", img: "/brain/ca321cf7-c7ad-4bd3-be7b-4bfb82365519/team_member_1_1773809476277.png" },
                                    { name: "Sarah Chen", role: "UI/UX Director", img: "/brain/ca321cf7-c7ad-4bd3-be7b-4bfb82365519/team_member_2_1773809494571.png" },
                                    { name: "Marcus Thorne", role: "System Engineer", img: "/brain/ca321cf7-c7ad-4bd3-be7b-4bfb82365519/team_member_3_1773809513338.png" }
                                ].map((member, i) => (
                                    <div key={i} className="team-card glass-card" style={{ "--i": i }}>
                                        <div className="member-image-wrap">
                                            <img src={member.img} alt={member.name} />
                                        </div>
                                        <div className="member-info">
                                            <h4>{member.name}</h4>
                                            <span>{member.role}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* The Traveling Logo - Standalone for clean cutout look */}
                    <div className="traveling-logo-wrap">
                        <img src="/vishnu logo.webp" alt="Vishnu Logo" className="logo-main-image" />
                    </div>
                </div>
            </div>
        </div>
    )
}
