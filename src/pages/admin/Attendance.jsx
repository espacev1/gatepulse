import { useState, useEffect } from 'react'
import {
    Users, Calendar, ClipboardCheck, Activity, Search,
    UserPlus, Shield, Clock, BarChart3, ChevronRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminAttendance() {
    const { user } = useAuth()
    const [events, setEvents] = useState([])
    const [staff, setStaff] = useState([])
    const [assignments, setAssignments] = useState([])
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchInitialData()

        const channel = supabase
            .channel('admin-attendance-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_assignments' }, () => fetchAssignments())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_sessions' }, () => fetchSessions())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        await Promise.all([
            fetchEvents(),
            fetchStaff(),
            fetchAssignments(),
            fetchSessions()
        ])
        setLoading(false)
    }

    const fetchEvents = async () => {
        const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false })
        if (data) setEvents(data)
    }

    const fetchStaff = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('role', 'staff')
        if (data) setStaff(data)
    }

    const fetchAssignments = async () => {
        const { data } = await supabase
            .from('staff_assignments')
            .select('*, event:events(*), staff:profiles(*)')
        if (data) setAssignments(data)
    }

    const fetchSessions = async () => {
        const { data } = await supabase
            .from('attendance_sessions')
            .select('*, event:events(*)')
            .order('activated_at', { ascending: false })
        if (data) setSessions(data)
    }

    const assignStaff = async (eventId, staffId) => {
        const { error } = await supabase.from('staff_assignments').insert([{ event_id: eventId, staff_id: staffId }])
        if (error) alert('Assignment failed: ' + error.message)
        else fetchAssignments()
    }

    const removeAssignment = async (id) => {
        const { error } = await supabase.from('staff_assignments').delete().eq('id', id)
        if (error) alert('De-assignment failed: ' + error.message)
        else fetchAssignments()
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance Command</h1>
                    <p className="page-subtitle">Assign operational staff to secure sectors and oversee live attendance sessions.</p>
                </div>
            </div>

            <div className="grid-3 mb-8">
                <div className="card">
                    <div className="panel-header">Staff Deployment</div>
                    <div className="flex flex-col gap-4">
                        {events.slice(0, 5).map(event => (
                            <div key={event.id} className="p-3 border border-color rounded-lg bg-elevated">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-sm">{event.name}</span>
                                    <span className="badge badge-secondary text-xs">{event.location}</span>
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        className="form-select text-xs py-1"
                                        onChange={(e) => assignStaff(event.id, e.target.value)}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Deploy Staff...</option>
                                        {staff.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="panel-header">Manual Identity Validation</div>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const eventId = formData.get('eventId');
                        const participantEmail = formData.get('email');

                        // Find participant by email
                        const { data: prof } = await supabase.from('profiles').select('id').eq('email', participantEmail).single();
                        if (!prof) return alert('Identity not found in database.');

                        // Find active session
                        const session = sessions.find(s => s.event_id === eventId && s.status === 'active');
                        if (!session) return alert('No active session for this sector.');

                        const { error } = await supabase.from('attendance_records').insert([{
                            session_id: session.id,
                            participant_id: prof.id,
                            verified_at: new Date().toISOString(),
                            face_capture_url: 'MANUAL_ADMIN_BYPASS',
                            id_capture_url: 'MANUAL_ADMIN_BYPASS'
                        }]);

                        if (error) alert('Bypass failed: ' + error.message);
                        else alert('Identity successfully validated via Admin Bypass.');
                    }} className="flex flex-col gap-3">
                        <select name="eventId" className="form-select text-xs" required>
                            <option value="">Select Sector...</option>
                            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        <input name="email" className="form-input text-xs" placeholder="Participant Email" required />
                        <button type="submit" className="btn btn-primary btn-sm w-full">VALIDATE IDENTITY</button>
                    </form>
                </div>

                <div className="card col-span-2">
                    <div className="panel-header">Active Assignments & sessions</div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Sector / Event</th>
                                    <th>Assigned Staff</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map(a => {
                                    const activeSession = sessions.find(s => s.event_id === a.event_id && s.status === 'active')
                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <div className="font-bold">{a.event?.name}</div>
                                                <div className="text-xs text-dim">{a.event?.location}</div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-accent-glow flex items-center justify-center text-xs font-bold text-accent">
                                                        {a.staff?.full_name?.charAt(0)}
                                                    </div>
                                                    <span>{a.staff?.full_name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {activeSession ? (
                                                    <span className="badge badge-success animate-pulse">LIVE SESSION</span>
                                                ) : (
                                                    <span className="badge badge-secondary">STANDBY</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button onClick={() => removeAssignment(a.id)} className="btn btn-secondary btn-xs text-critical">Revoke</button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {assignments.length === 0 && (
                                    <tr><td colSpan="4" className="text-center py-8 text-dim">No operational staff deployed to sectors.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="panel-header">Global Attendance Intelligence</div>
                <div className="grid-4 mb-6">
                    <div className="stat-card">
                        <div className="stat-card-icon bg-status-ok-bg"><ClipboardCheck size={20} color="var(--status-ok)" /></div>
                        <div>
                            <div className="stat-card-value font-mono">{sessions.length}</div>
                            <div className="stat-card-label">Total Sessions</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon bg-status-warn-bg"><Activity size={20} color="var(--status-warn)" /></div>
                        <div>
                            <div className="stat-card-value font-mono">{sessions.filter(s => s.status === 'active').length}</div>
                            <div className="stat-card-label">Active Now</div>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Event</th>
                                <th>Result</th>
                                <th>Verified By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => (
                                <tr key={s.id}>
                                    <td className="font-mono text-xs">{new Date(s.activated_at).toLocaleString()}</td>
                                    <td className="font-bold">{s.event?.name}</td>
                                    <td>
                                        <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-primary'}`}>
                                            {s.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="text-xs text-dim">ID: {s.id.slice(0, 8)}</td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr><td colSpan="4" className="text-center py-8 text-dim">No attendance forensic data available.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
