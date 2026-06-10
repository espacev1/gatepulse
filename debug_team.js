import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://layqaorryunozuzvygrz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxheXFhb3JyeXVub3p1enZ5Z3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MDY4OTIsImV4cCI6MjA4ODE4Mjg5Mn0.wD6LyZmR2gFl2sBPQJGnFV2PB4YRyjQDIDgEd53qBjI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTeam() {
  console.log('Fetching team members...')
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
    
    if (error) {
      console.error('Supabase Error:', error.message)
      console.error('Details:', error.details)
      console.error('Hint:', error.hint)
    } else {
      console.log('Success! Team Members Count:', data?.length || 0)
      console.log('Data:', JSON.stringify(data, null, 2))
    }
  } catch (err) {
    console.error('Execution Error:', err.message)
  }
}

checkTeam()
