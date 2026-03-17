import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://layqaorryunozuzvygrz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxheXFhb3JyeXVub3p1enZ5Z3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MDY4OTIsImV4cCI6MjA4ODE4Mjg5Mn0.wD6LyZmR2gFl2sBPQJGnFV2PB4YRyjQDIDgEd53qBjI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySchema() {
    console.log('--- SCHEMA VERIFICATION ---')
    
    const tables = [
        'profiles', 'events', 'teams', 'tickets', 'jury_marks', 
        'faculty_whitelist', 'staff_assignments', 'attendance_sessions', 
        'attendance_records', 'attendance_logs'
    ]

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error) {
            console.log(`[FAIL] ${table}: ${error.message}`)
        } else {
            console.log(`[OK] ${table} is accessible.`)
        }
    }

    console.log('--- COLUMN VERIFICATION (Profiles) ---')
    const { data: profile, error: pError } = await supabase.from('profiles').select('*').limit(1).maybeSingle()
    if (!pError && profile) {
        const columns = ['qr_token', 'face_url', 'id_barcode_url', 'reg_no', 'section']
        columns.forEach(col => {
            if (col in profile) {
                console.log(`[OK] Column '${col}' exists in profiles.`)
            } else {
                console.log(`[FAIL] Column '${col}' missing in profiles.`)
            }
        })
    } else if (pError) {
        console.log(`[ERROR] Profiling failed: ${pError.message}`)
    } else {
        console.log(`[INFO] Profiles table empty, skipping column check (cannot detect via empty select without RPC)`)
    }
}

verifySchema()

