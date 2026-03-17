-- 0. Storage Buckets Setup
-- Note: Run these individually or ensure extensions are enabled
INSERT INTO storage.buckets (id, name, public) 
VALUES ('id-barcodes', 'id-barcodes', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('face-verification', 'face-verification', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('id-barcodes', 'face-verification'));

DROP POLICY IF EXISTS "Public View" ON storage.objects;
CREATE POLICY "Public View" ON storage.objects FOR SELECT USING (bucket_id IN ('id-barcodes', 'face-verification'));

-- 1. Users Profile Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('admin', 'staff', 'participant', 'faculty', 'jury')),
    dept TEXT,
    section TEXT,
    reg_no TEXT,
    id_barcode_url TEXT,
    face_url TEXT,
    qr_token TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('active', 'upcoming', 'completed', 'cancelled')),
    image_url TEXT,
    max_capacity INTEGER DEFAULT 100,
    registered_count INTEGER DEFAULT 0,
    checked_in_count INTEGER DEFAULT 0,
    participation_type TEXT DEFAULT 'solo' CHECK (participation_type IN ('solo', 'team')),
    allowed_departments TEXT[] DEFAULT NULL, -- NULL means all departments allowed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.1 Teams Table (For Group Participation)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    leader_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Participants Table (Registration)
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    registration_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (registration_status IN ('confirmed', 'pending', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- 4. Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    qr_token TEXT UNIQUE NOT NULL,
    is_validated BOOLEAN DEFAULT FALSE,
    validated_at TIMESTAMPTZ,
    validated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Attendance Logs Table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    verification_status TEXT NOT NULL CHECK (verification_status IN ('success', 'duplicate', 'invalid', 'error')),
    staff_id UUID REFERENCES public.profiles(id)
);

-- Enable Realtime
DO $$
BEGIN
    -- Attendance Logs
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
    END IF;
    
    -- Tickets
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tickets') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
    END IF;
    
    -- Participants
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'participants') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
    END IF;
    
    -- Teams
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'teams') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
    END IF;
END $$;

-- 6. SYSTEM FRESH START (RUN THIS TO WIPE DATA)
-- TRUNCATE public.attendance_logs, public.tickets, public.participants, public.events, public.profiles CASCADE;

-- Row Level Security (RLS) Policies

-- 1. Profiles: Ensure every auth user has a profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, email, full_name, role, 
        dept, section, reg_no, 
        id_barcode_url, face_url, qr_token
    )
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name', 
        CASE 
            WHEN new.email = 'shanmukhamanikanta.inti@gmail.com' THEN 'admin'
            WHEN new.raw_user_meta_data->>'role' IN ('admin', 'staff', 'participant', 'faculty', 'jury') 
                THEN new.raw_user_meta_data->>'role'
            WHEN new.email LIKE '%@vishnu.edu.in' THEN 'participant'
            WHEN new.email LIKE '%@vitpulse.jury' THEN 'jury'
            ELSE 'participant'
        END,
        new.raw_user_meta_data->>'dept',
        new.raw_user_meta_data->>'section',
        new.raw_user_meta_data->>'reg_no',
        new.raw_user_meta_data->>'id_barcode_url',
        new.raw_user_meta_data->>'face_url',
        new.raw_user_meta_data->>'qr_token'
    )
    ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name, 
        dept = EXCLUDED.dept,
        section = EXCLUDED.section,
        reg_no = EXCLUDED.reg_no,
        id_barcode_url = EXCLUDED.id_barcode_url,
        face_url = EXCLUDED.face_url,
        qr_token = EXCLUDED.qr_token,
        role = CASE 
            WHEN EXCLUDED.email = 'shanmukhamanikanta.inti@gmail.com' THEN 'admin'
            WHEN new.raw_user_meta_data->>'role' IN ('admin', 'staff', 'participant', 'faculty', 'jury') 
                THEN new.raw_user_meta_data->>'role'
            ELSE profiles.role 
        END;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Permission Helpers (SECURITY DEFINER bypasses RLS on profiles table)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff(user_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role IN ('admin', 'staff')
    );
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage any profile" ON public.profiles;
CREATE POLICY "Admins can manage any profile" ON public.profiles FOR ALL USING (is_admin(auth.uid()));

-- 2. Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own participation" ON public.participants;
CREATE POLICY "Users can view own participation" ON public.participants FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and Staff can view all participants" ON public.participants;
CREATE POLICY "Admins and Staff can view all participants" ON public.participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

DROP POLICY IF EXISTS "Users can register themselves" ON public.participants;
CREATE POLICY "Users can register themselves" ON public.participants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update participant status" ON public.participants;
CREATE POLICY "Admins can update participant status" ON public.participants FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.participants 
        WHERE participants.id = tickets.participant_id 
        AND participants.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins and Staff can view all tickets" ON public.tickets;
CREATE POLICY "Admins and Staff can view all tickets" ON public.tickets FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

DROP POLICY IF EXISTS "Admins can provision tickets" ON public.tickets;
CREATE POLICY "Admins can provision tickets" ON public.tickets FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Staff can validate tickets" ON public.tickets;
CREATE POLICY "Staff can validate tickets" ON public.tickets FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- 5. Attendance Logs
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins and Staff can log attendance" ON public.attendance_logs;
CREATE POLICY "Admins and Staff can log attendance" ON public.attendance_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

DROP POLICY IF EXISTS "Admins and Staff can view logs" ON public.attendance_logs;
CREATE POLICY "Admins and Staff can view logs" ON public.attendance_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- 6. Teams RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teams are viewable by participants of that team" ON public.teams;
CREATE POLICY "Teams are viewable by participants of that team" ON public.teams FOR SELECT USING (
    auth.uid() = leader_id OR 
    EXISTS (SELECT 1 FROM public.participants WHERE team_id = teams.id AND user_id = auth.uid()) OR
    is_staff(auth.uid())
);

DROP POLICY IF EXISTS "Leaders can manage their teams" ON public.teams;
CREATE POLICY "Leaders can manage their teams" ON public.teams FOR ALL USING (auth.uid() = leader_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Participants can create teams during registration" ON public.teams;
CREATE POLICY "Participants can create teams during registration" ON public.teams FOR INSERT WITH CHECK (true);
