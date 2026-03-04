import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Shield, ShieldCheck, MapPin, CalendarDays, Clock, Lock, Zap, Info, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function MyTickets() {
    const { user } = useAuth()
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [revealMap, setRevealMap] = useState({})

    useEffect(() => {
        if (user) {
            fetchMyTickets()

            const subscription = supabase
                .channel('my-tickets-live')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'tickets'
                }, () => {
                    fetchMyTickets()
                })
                .subscribe()

            return () => {
                supabase.removeChannel(subscription)
            }
        }
    }, [user])

    const fetchMyTickets = async () => {
        if (!user) return
        setLoading(true)

        // Supabase join via participant
        const { data: ticketData } = await supabase
            .from('tickets')
            .select(`
                id,
                qr_token,
                is_validated,
                event_id,
                event:events (*),
                participant:participants!inner (user_id)
            `)
            .eq('participant.user_id', user.id)

        if (ticketData) {
            setTickets(ticketData)
        }
        setLoading(false)
    }

    const toggleReveal = (ticketId) => {
        setRevealMap(prev => ({
            ...prev,
            [ticketId]: !prev[ticketId]
        }))
    }

    const downloadBadge = (ticket) => {
        alert('Generating Security Credential PNG... Done.')
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="flex items-center justify-center h-64 text-dim font-mono">
                    PROBING SECURE SECTORS...
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Identity Credentials</h1>
                    <p className="page-subtitle">Encrypted access tokens for authorized event entry.</p>
                </div>
                <div className="badge badge-primary">ACTIVE SECTOR: {tickets.length}</div>
            </div>

            {tickets.length === 0 ? (
                <div className="empty-state">
                    <Shield size={48} style={{ opacity: 0.1, margin: '0 auto var(--space-4)' }} />
                    <div className="empty-state-title">NO CREDENTIALS FOUND</div>
                    <p>Access level verification pending. Register for an event to provision tokens.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-12)' }}>
                    {tickets.map((ticket, i) => {
                        const isRevealed = revealMap[ticket.id];
                        return (
                            <div key={ticket.id} className="card" style={{
                                padding: 0, overflow: 'hidden', background: 'var(--bg-deepest)',
                                border: '1px solid var(--border-accent)',
                                animation: `fadeInUp 0.5s ease ${i * 0.12}s both`,
                                boxShadow: 'var(--shadow-xl), var(--shadow-glow)',
                                borderRadius: 'var(--radius-xl)'
                            }}>
                                {/* Badge Top Header */}
                                <div style={{
                                    background: 'var(--bg-panel)', padding: '16px 20px',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div className="flex items-center gap-2">
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.15em' }}>ENCRYPTED CREDENTIAL</span>
                                    </div>
                                    <span className={`badge ${ticket.is_validated ? 'badge-warning' : 'badge-success'}`}>
                                        {ticket.is_validated ? 'VALIDATED' : 'PROVISIONED'}
                                    </span>
                                </div>

                                {/* Identity Section */}
                                <div style={{ padding: '32px 24px 0', textAlign: 'center' }}>
                                    <div style={{
                                        width: 80, height: 80, borderRadius: '50%',
                                        background: 'var(--accent-glow)', margin: '0 auto 16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid var(--accent)',
                                        boxShadow: 'inset 0 0 20px rgba(0,212,255,0.2)'
                                    }}>
                                        <ShieldCheck size={40} color="var(--accent)" />
                                    </div>
                                    <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {user?.full_name}
                                    </h2>
                                    <div style={{ height: 1, width: 40, background: 'var(--accent)', margin: '12px auto' }} />
                                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                                        {ticket.event?.name} Security Node
                                    </p>
                                </div>

                                {/* QR Token HUD with SECURITY OVERLAY */}
                                <div style={{ padding: '32px', position: 'relative' }}>
                                    <div style={{
                                        background: '#fff', padding: '24px', borderRadius: '24px',
                                        display: 'flex', justifyContent: 'center', position: 'relative',
                                        transition: 'all 0.3s ease',
                                        filter: isRevealed ? 'none' : 'blur(15px) grayscale(100%)',
                                        transform: isRevealed ? 'scale(1)' : 'scale(0.95)',
                                        opacity: isRevealed ? 1 : 0.3
                                    }}>
                                        <QRCodeSVG value={ticket.qr_token} size={180} level="H" bgColor="white" fgColor="#060E1A" />
                                    </div>

                                    {!isRevealed && (
                                        <div style={{
                                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                                            zIndex: 2, cursor: 'pointer'
                                        }} onClick={() => toggleReveal(ticket.id)}>
                                            <div style={{ padding: '12px', background: 'var(--accent)', borderRadius: '50%', color: '#000', boxShadow: '0 0 20px var(--accent)' }}>
                                                <Lock size={20} />
                                            </div>
                                            <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.1em' }}>TAP TO REVEAL KEY</span>
                                        </div>
                                    )}
                                </div>

                                {/* Token Meta Hud */}
                                <div style={{ background: 'var(--bg-panel)', margin: '0 24px 24px', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: 800 }}>SECTOR_ID</div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{ticket.event?.location}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: 800 }}>TOKEN_UUID</div>
                                            <div style={{ fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                                                {isRevealed ? ticket.qr_token.slice(-8) : '********'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions HUD */}
                                <div style={{ padding: '0 24px 32px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => toggleReveal(ticket.id)} className="btn btn-secondary flex-1" style={{ fontSize: '11px', gap: '8px' }}>
                                            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />} {isRevealed ? 'HIDE' : 'SHOW'}
                                        </button>
                                        <button onClick={() => downloadBadge(ticket)} className="btn btn-primary flex-1" style={{ fontSize: '11px', gap: '8px' }}>
                                            <Download size={14} /> DOWNLOAD
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-12 p-6 card-glass text-center" style={{ maxWidth: 500, margin: '0 auto' }}>
                <Info size={20} color="var(--accent)" className="mx-auto mb-3" />
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                    This digital credential is cryptographically linked to your identity.
                    Redistribution or sharing of the secure QR token may result in account termination
                    and security sector blacklisting.
                </p>
            </div>
        </div>
    )
}
