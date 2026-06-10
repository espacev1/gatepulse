-- 1. CLEAN UP TEAM MEMBERS TABLE
-- Add user_id column to link team members to their actual profiles
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. VERIFY ATTENDANCE LOGS CONSTRAINTS (Ensure they are not "disconnected")
-- If these already exist, Supabase will just ignore them
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_logs_ticket_id_fkey') THEN
        ALTER TABLE public.attendance_logs 
        ADD CONSTRAINT attendance_logs_ticket_id_fkey 
        FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_logs_event_id_fkey') THEN
        ALTER TABLE public.attendance_logs 
        ADD CONSTRAINT attendance_logs_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_logs_staff_id_fkey') THEN
        ALTER TABLE public.attendance_logs 
        ADD CONSTRAINT attendance_logs_staff_id_fkey 
        FOREIGN KEY (staff_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. ENABLE REALTIME FOR TEAM MEMBERS
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
EXCEPTION WHEN others THEN NULL; -- Ignore if already added

-- 4. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
