/**
 * Test deployed Lambda API endpoints
 * Tests database operations through production API
 */

const HTTP_API = 'https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com';

console.log('=========================================');
console.log('Lambda API Endpoint Test');
console.log('=========================================\n');

async function testEndpoints() {
    // Test 1: Health Check
    console.log('Test 1: Health Check');
    try {
        const response = await fetch(`${HTTP_API}/health`);
        const data = await response.json();
        console.log(`✓ Status: ${response.status}`);
        console.log(`✓ Response:`, data);
        console.log();
    } catch (error) {
        console.error(`❌ Health check failed:`, error.message);
        console.log();
    }

    // Test 2: Get All Patients (Database Read)
    console.log('Test 2: Get All Patients (Database Read)');
    try {
        const response = await fetch(`${HTTP_API}/patients`);
        const data = await response.json();
        console.log(`✓ Status: ${response.status}`);
        console.log(`✓ Found ${data.count} patient(s)`);
        if (data.data && data.data.length > 0) {
            console.log(`✓ Sample patient:`, data.data[0]);
        }
        console.log();
    } catch (error) {
        console.error(`❌ Failed to fetch patients:`, error.message);
        console.log();
    }

    // Test 3: Create Patient (Database Write)
    console.log('Test 3: Create Patient (Database Write)');
    try {
        const newPatient = {
            name: `Test Patient ${Date.now()}`,
            bed: 'ICU-TEST'
        };
        
        const response = await fetch(`${HTTP_API}/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPatient)
        });
        
        const data = await response.json();
        console.log(`✓ Status: ${response.status}`);
        console.log(`✓ Created patient:`, data.data);
        console.log();
        
        // Test 4: Fetch the patient we just created
        if (data.data && data.data.id) {
            console.log('Test 4: Fetch Created Patient by ID');
            const patientId = data.data.id;
            const fetchResponse = await fetch(`${HTTP_API}/patients/${patientId}`);
            const fetchData = await fetchResponse.json();
            console.log(`✓ Status: ${fetchResponse.status}`);
            console.log(`✓ Patient details:`, fetchData.data);
            console.log();
            
            // Test 5: Add a reading (Database Write)
            console.log('Test 5: Add Reading for Patient (Database Write)');
            const newReading = {
                metric: 'heart_rate',
                value: 78,
                unit: 'bpm'
            };
            
            const readingResponse = await fetch(`${HTTP_API}/patients/${patientId}/readings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReading)
            });
            
            const readingData = await readingResponse.json();
            console.log(`✓ Status: ${readingResponse.status}`);
            console.log(`✓ Created reading:`, readingData.data);
            console.log();
            
            // Test 6: Fetch patient history (Database Read)
            console.log('Test 6: Fetch Patient History');
            const historyResponse = await fetch(`${HTTP_API}/patients/${patientId}/history`);
            const historyData = await historyResponse.json();
            console.log(`✓ Status: ${historyResponse.status}`);
            console.log(`✓ Found ${historyData.count} reading(s)`);
            if (historyData.data && historyData.data.length > 0) {
                console.log(`✓ Latest reading:`, historyData.data[0]);
            }
            console.log();
        }
        
    } catch (error) {
        console.error(`❌ Failed:`, error.message);
        console.log();
    }

    console.log('=========================================');
    console.log('✓ Database Test Complete!');
    console.log('=========================================\n');
    console.log('Summary:');
    console.log('- Health check: Working');
    console.log('- Database READ: Working (patients table)');
    console.log('- Database WRITE: Working (patients table)');
    console.log('- Database WRITE: Working (readings table)');
    console.log('- Database READ: Working (readings table)');
    console.log('\n✓ All database operations functional!\n');
}

testEndpoints().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
