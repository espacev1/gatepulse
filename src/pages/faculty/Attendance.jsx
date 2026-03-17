import { useState, useEffect } from 'react'
import { 
    ClipboardCheck, Users, Search, Activity, 
    Clock, MapPin, Calendar, CheckCircle,
    BarChart3, Users2, ListChecks, Download
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function FacultyAttendance() {
    const [sessions, setSessions] = useState([])
    const [selectedSession, setSelectedSession] = useState(null)
    const [attendees, setAttendees] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchSessions()
        const subscription = supabase
            .channel('faculty-attendance-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_sessions' }, () => fetchSessions())
            .subscribe()

        return () => supabase.removeChannel(subscription)
    }, [])

    const fetchSessions = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('attendance_sessions')
            .select('*, event:events(name, location)')
            .order('created_at', { ascending: false })
        if (data) setSessions(data)
        setLoading(false)
    }

    const fetchSessionAttendees = async (session) => {
        setSelectedSession(session)
        setAttendees([])

        // Join attendance_logs with profile data via tickets and participants
        const { data } = await supabase
            .from('attendance_logs')
            .select(`
                id,
                timestamp,
                ticket_id (
                    participant_id (
                        user_id (
                            full_name,
                            reg_no,
                            dept,
                            section
                        )
                    )
                )
            `)
            .eq('event_id', session.event_id)
            .eq('verification_status', 'success')
            // Filter by timestamp if session has start/end
            .gte('timestamp', session.activated_at || session.created_at)
            .lte('timestamp', session.ended_at || new Date().toISOString())
            .order('timestamp', { ascending: false })

        setAttendees(data?.map(a => ({
            id: a.id,
            time: a.timestamp,
            name: a.ticket_id?.participant_id?.user_id?.full_name,
            regNo: a.ticket_id?.participant_id?.user_id?.reg_no,
            dept: a.ticket_id?.participant_id?.user_id?.dept,
            section: a.ticket_id?.participant_id?.user_id?.section
        })) || [])
    }

                                <div className="flex gap-2">
                                    <button className="btn btn-secondary btn-sm">
                                        <Users2 size={12} /> SYNC ALL DATA
                                    </button>
                                </div>
}
