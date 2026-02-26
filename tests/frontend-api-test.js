/**
 * Frontend API Test - Simulate Frontend HTTP Calls
 * Tests creating patients and readings through the HTTP API with authentication
 */

import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./aws-config.json', 'utf8'));

const HTTP_API = config.api.httpUrl;
const CLIENT_ID = config.cognito.appClientId;
const REGION = config.cognito.region;
const USERNAME = config.simulator?.username || 'patient0@rnsync.com';
const PASSWORD = config.simulator?.password || '123456.Ab';

const client = new CognitoIdentityProviderClient({ region: REGION });

console.log('=========================================');
console.log('Frontend HTTP API Test');
console.log('=========================================\n');

async function testFrontendAPI() {
    // Step 1: Login (like frontend does)
    console.log('Step 1: Authenticating with Cognito...');
    console.log(`  Username: ${USERNAME}\n`);
    
    try {
        const command = new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME,
                PASSWORD
            }
        });

        const response = await client.send(command);
        
        if (!response.AuthenticationResult) {
            console.error('❌ No authentication result');
            process.exit(1);
        }

        const accessToken = response.AuthenticationResult.AccessToken;
        const idToken = response.AuthenticationResult.IdToken;
        
        console.log('✓ Authentication successful!');
        console.log(`  Access Token: ${accessToken.substring(0, 30)}... (${accessToken.length} chars)`);
        console.log(`  ID Token: ${idToken.substring(0, 30)}... (${idToken.length} chars)\n`);

        // Step 2: Get all patients (like frontend would do)
        console.log('Step 2: Fetching all patients from API...');
        const patientsResponse = await fetch(`${HTTP_API}/patients`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
        
        const patientsData = await patientsResponse.json();
        console.log(`✓ Status: ${patientsResponse.status}`);
        console.log(`✓ Found ${patientsData.count} patient(s)`);
        if (patientsData.data && patientsData.data.length > 0) {
            console.log(`  Sample: ${patientsData.data[0].name} (Bed: ${patientsData.data[0].bed})`);
        }
        console.log();

        // Step 3: Create a new patient (frontend form submission)
        console.log('Step 3: Creating new patient via frontend API call...');
        const newPatient = {
            name: `Frontend Test ${new Date().toLocaleTimeString()}`,
            bed: 'ICU-FRONTEND'
        };
        
        const createResponse = await fetch(`${HTTP_API}/patients`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newPatient)
        });
        
        const createData = await createResponse.json();
        console.log(`✓ Status: ${createResponse.status}`);
        console.log(`✓ Created: ${createData.data.name}`);
        console.log(`  ID: ${createData.data.id}`);
        console.log(`  Bed: ${createData.data.bed}\n`);

        const patientId = createData.data.id;

        // Step 4: Add vital signs reading (frontend monitoring page)
        console.log('Step 4: Adding vital signs reading...');
        const newReading = {
            metric: 'heart_rate',
            value: 82,
            unit: 'bpm'
        };
        
        const readingResponse = await fetch(`${HTTP_API}/patients/${patientId}/readings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newReading)
        });
        
        const readingData = await readingResponse.json();
        console.log(`✓ Status: ${readingResponse.status}`);
        console.log(`✓ Added reading: ${readingData.data.value} ${readingData.data.unit}`);
        console.log(`  Metric: ${readingData.data.metric}`);
        console.log(`  Timestamp: ${readingData.data.timestamp}\n`);

        // Step 5: Fetch patient details (frontend patient detail page)
        console.log('Step 5: Fetching patient details with readings...');
        const detailsResponse = await fetch(`${HTTP_API}/patients/${patientId}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
        
        const detailsData = await detailsResponse.json();
        console.log(`✓ Status: ${detailsResponse.status}`);
        console.log(`✓ Patient: ${detailsData.data.name}`);
        console.log(`✓ Latest readings: ${detailsData.data.latest_readings.length}`);
        if (detailsData.data.latest_readings.length > 0) {
            console.log(`  → ${detailsData.data.latest_readings[0].metric}: ${detailsData.data.latest_readings[0].value} ${detailsData.data.latest_readings[0].unit}`);
        }
        console.log();

        // Step 6: Fetch patient history (frontend charts/graphs)
        console.log('Step 6: Fetching patient history...');
        const historyResponse = await fetch(`${HTTP_API}/patients/${patientId}/history?metric=heart_rate`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
        
        const historyData = await historyResponse.json();
        console.log(`✓ Status: ${historyResponse.status}`);
        console.log(`✓ Found ${historyData.count} heart_rate reading(s)`);
        if (historyData.data && historyData.data.length > 0) {
            console.log(`  Latest: ${historyData.data[0].value} ${historyData.data[0].unit} at ${historyData.data[0].timestamp}`);
        }
        console.log();

        console.log('=========================================');
        console.log('✓ Frontend API Flow Test PASSED!');
        console.log('=========================================\n');
        console.log('All frontend operations working:');
        console.log('  ✓ Authentication with Cognito');
        console.log('  ✓ Fetch patient list');
        console.log('  ✓ Create new patient');
        console.log('  ✓ Add vital signs reading');
        console.log('  ✓ Fetch patient details');
        console.log('  ✓ Query patient history');
        console.log('\n✓ Database writes through frontend API confirmed!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testFrontendAPI();
