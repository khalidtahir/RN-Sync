/**
 * Simple database test using node-fetch fallback
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);
console.log('Key length:', SUPABASE_KEY?.length || 0);

async function testConnection() {
    try {
        // Use dynamic import for fetch if native fetch not available
        let fetchFn = globalThis.fetch;
        
        if (!fetchFn) {
            console.log('Native fetch not available, trying node-fetch...');
            const nodeFetch = await import('node-fetch');
            fetchFn = nodeFetch.default;
        }

        const url = `${SUPABASE_URL}/rest/v1/patients?select=*&limit=1`;
        console.log('\nQuerying:', url);
        
        const response = await fetchFn(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers));
        
        const text = await response.text();
        console.log('Response body:', text);

        if (response.ok) {
            const data = JSON.parse(text);
            console.log('\n✓ Successfully connected to Supabase!');
            console.log(`  Found ${data.length} patient(s)`);
            if (data.length > 0) {
                console.log('  Sample:', data[0]);
            }
        } else {
            console.error('\n❌ Error:', response.status, text);
        }
    } catch (error) {
        console.error('\n❌ Connection failed:', error.message);
        console.error('Full error:', error);
    }
}

testConnection();
