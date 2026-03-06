-- 1. Staff Assignments Table
CREATE TABLE IF NOT EXISTS public.staff_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, staff_id)
);

-- 2. Attendance Sessions Table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('opened', 'active', 'ended')) DEFAULT 'opened',
    activated_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    activated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    face_capture_url TEXT,
    id_capture_url TEXT,
    verified_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(session_id, participant_id)
);

-- Enable RLS
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Adjust as needed for production)
CREATE POLICY "Allow full access for admins" ON public.staff_assignments FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Allow staff to view their assignments" ON public.staff_assignments FOR SELECT USING (auth.uid() = staff_id);

CREATE POLICY "Allow full access for admins on sessions" ON public.attendance_sessions FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Allow staff to manage sessions" ON public.attendance_sessions FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'staff'));

CREATE POLICY "Allow admins to view all records" ON public.attendance_records FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Allow staff to view their assigned records" ON public.attendance_records FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM attendance_sessions s
        JOIN staff_assignments a ON s.event_id = a.event_id
        WHERE s.id = attendance_records.session_id
        AND a.staff_id = auth.uid()
    )
);
CREATE POLICY "Allow participants to create their own record" ON public.attendance_records FOR INSERT WITH CHECK (auth.uid() = participant_id);
