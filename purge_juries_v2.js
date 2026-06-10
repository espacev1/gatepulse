const url = process.env.VITE_SUPABASE_URL + '/rest/v1';
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
    console.log('Executing deployment cleanup...');
    
    // 1. Delete all jury profiles
    const res1 = await fetch(`${url}/profiles?role=eq.jury`, {
        method: 'DELETE',
        headers: { 
            'apikey': key, 
            'Authorization': `Bearer ${key}` 
        }
    });
    console.log('Profile Purge:', res1.status === 204 ? 'SUCCESS' : 'FAILURE (' + res1.status + ')');

    // 2. Reset admin identity
    const res2 = await fetch(`${url}/profiles?email=eq.shanmukhamanikanta.inti@gmail.com`, {
        method: 'PATCH',
        headers: { 
            'apikey': key, 
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            full_name: 'SHANMUKHA INTI',
            role: 'admin'
        })
    });
    console.log('Admin Identity Restoration:', res2.status === 204 ? 'SUCCESS' : 'FAILURE (' + res2.status + ')');
}

run().catch(console.error);
