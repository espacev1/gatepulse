import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Shield, ShieldCheck, MapPin, CalendarDays, Clock, Lock, Zap, Info } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function MyTickets() {
    const { user } = useAuth()
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)

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

        // Fetch tickets where the participant's user_id matches current user
        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                events (*)
            `)
            .eq('participants.user_id', user.id)

        // Supabase doesn't support deep filtering directly on nested objects easily in a single select eq
        // So we join via participant
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-8)' }}>
                    {tickets.map((ticket, i) => (
                        <div key={ticket.id} className="card" style={{
                            padding: 0, overflow: 'hidden', background: 'var(--bg-deepest)',
                            border: '1px solid var(--border-accent)',
                            animation: `fadeInUp 0.5s ease ${i * 0.12}s both`,
                            boxShadow: 'var(--shadow-xl), var(--shadow-glow)'
                        }}>
                            {/* Badge Top Header */}
                            <div style={{
                                background: 'var(--bg-panel)', padding: '12px 20px',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div className="flex items-center gap-2">
                                    <Shield size={14} color="var(--accent)" />
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>GATE PULSE SECURE</span>
                                </div>
                                <div className="live-dot" style={{ background: ticket.is_validated ? 'var(--status-warn)' : 'var(--status-ok)' }} />
                            </div>

                            {/* Identity Section */}
                            <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: 'var(--radius-xl)',
                                    background: 'var(--accent-gradient)', margin: '0 auto 12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: 'var(--shadow-glow)'
                                }}>
                                    <ShieldCheck size={32} color="var(--bg-deepest)" />
                                </div>
                                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                                    {user?.full_name || 'Authorized Entity'}
                                </h2>
                                <p style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                                    Access Profile: {user?.role || 'PARTICIPANT'}
                                </p>
                            </div>

                            {/* QR Token HUD */}
                            <div style={{ padding: '24px', position: 'relative' }}>
                                {/* HUD Corners */}
                                <div style={{ position: 'absolute', top: 12, left: 12, width: 12, height: 12, borderLeft: '1px solid var(--accent)', borderTop: '1px solid var(--accent)', opacity: 0.4 }} />
                                <div style={{ position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRight: '1px solid var(--accent)', borderTop: '1px solid var(--accent)', opacity: 0.4 }} />
                                <div style={{ position: 'absolute', bottom: 12, left: 12, width: 12, height: 12, borderLeft: '1px solid var(--accent)', borderBottom: '1px solid var(--accent)', opacity: 0.4 }} />
                                <div style={{ position: 'absolute', bottom: 12, right: 12, width: 12, height: 12, borderRight: '1px solid var(--accent)', borderBottom: '1px solid var(--accent)', opacity: 0.4 }} />

                                <div style={{
                                    background: 'white', padding: '16px', borderRadius: 'var(--radius-lg)',
                                    display: 'flex', justifyContent: 'center', boxShadow: '0 0 40px rgba(0, 212, 255, 0.15)'
                                }}>
                                    <QRCodeSVG value={ticket.qr_token} size={150} level="H" bgColor="white" fgColor="#060E1A" />
                                </div>
                            </div>

                            {/* Token Deets */}
                            <div style={{ textAlign: 'center', paddingBottom: '12px' }}>
                                <code style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '2px', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                                    {ticket.qr_token}
                                </code>
                            </div>

                            {/* Event Info Panel */}
                            <div style={{ background: 'rgba(0,212,255,0.03)', padding: '20px 24px', borderTop: '1px solid var(--border-color)' }}>
                                <div className="panel-header" style={{ marginBottom: '12px' }}>Operational Parameters</div>
                                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                                    {ticket.event?.name}
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                        <div style={{ fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>DEPLOYMENT</div>
                                        <div className="flex items-center gap-2"><MapPin size={10} /> {ticket.event?.location}</div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                        <div style={{ fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>SCHEDULE</div>
                                        <div className="flex items-center gap-2"><CalendarDays size={10} /> {ticket.event ? new Date(ticket.event.start_time).toLocaleDateString() : 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ padding: '16px 24px 24px' }}>
                                <button onClick={() => downloadBadge(ticket)} className="btn btn-primary w-full" style={{ gap: 'var(--space-3)' }}>
                                    <Download size={14} /> DOWNLOAD CREDENTIAL
                                </button>
                                <div style={{ height: '4px' }} />
                                <div className="text-center">
                                    <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                        Authorized for GATE: {ticket.event?.location?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
