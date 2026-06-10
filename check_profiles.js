const url = 'https://vitpulse-vitb.supabase.co/rest/v1';
const key = '...'; 

async function run() {
    console.log('Fetching profiles...');
    const res = await fetch(`${url}/profiles`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    if (!res.ok) {
        console.error('Fetch failed:', res.status, await res.text());
        return;
    }
    const data = await res.json();
    console.log('PROFILES_DATA:');
    console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);
