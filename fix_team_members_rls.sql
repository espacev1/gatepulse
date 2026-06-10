-- FIX TEAM MEMBERS VISIBILITY AND DATABASE CONSISTENCY

-- 1. Create the table if it's completely missing
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    designation TEXT,
    description TEXT,
    image_url TEXT,
    linkedin_url TEXT,
    email TEXT,
    phone TEXT,
    display_order INTEGER DEFAULT 0,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure Row Level Security is Enabled
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 3. DROP old policies to avoid conflicts
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;

-- 4. CREATE Public Select Policy (Allows landing page to see them)
CREATE POLICY "Team members are viewable by everyone" 
ON public.team_members FOR SELECT 
USING (true);

-- 5. CREATE Admin Manage Policy
-- Uses the is_admin function defined in supabase_schema.sql
CREATE POLICY "Admins can manage team members" 
ON public.team_members FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 6. Ensure REALTIME is enabled for this table (matches Landing.jsx expectations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'team_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
    END IF;
EXCEPTION WHEN OTHERS THEN 
    -- Publication might not exist or other issue, safe to ignore in migration
    NULL;
END $$;

-- 7. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
