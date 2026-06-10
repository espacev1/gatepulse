-- [FIX] Add 'dept' column to faculty_whitelist if missing
-- This resolves the 'Update failed' error on the Faculty Verification page.

DO $$ 
BEGIN
    -- Ensure table exists first if not already
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faculty_whitelist') THEN
        CREATE TABLE public.faculty_whitelist (
            email TEXT PRIMARY KEY,
            full_name TEXT,
            dept TEXT DEFAULT 'GLOBAL',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- If the column is missing (it might be since users are reporting it), add it
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'faculty_whitelist' 
                       AND column_name = 'dept') THEN
            ALTER TABLE public.faculty_whitelist ADD COLUMN dept TEXT DEFAULT 'GLOBAL';
        END IF;
    END IF;
END $$;
