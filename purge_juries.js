const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 

if (!supabaseUrl || !supabaseKey) {
    console.error('Environment variables missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function purge() {
    console.log('Purging juries and resetting admin...');
    
    // 1. Delete juries
    const { error: dError } = await supabase
        .from('profiles')
        .delete()
        .eq('role', 'jury');
    
    if (dError) console.error('Delete error:', dError);
    else console.log('Successfully deleted juries.');

    // 2. Reset admin identity
    const { error: uError } = await supabase
        .from('profiles')
        .update({ 
            full_name: 'SHANMUKHA INTI',
            role: 'admin'
        })
        .eq('email', 'shanmukhamanikanta.inti@gmail.com');

    if (uError) console.error('Update error:', uError);
    else console.log('Successfully reset admin identity.');

    process.exit(0);
}

purge();
