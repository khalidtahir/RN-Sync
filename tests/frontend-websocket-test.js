/**
 * Frontend WebSocket Connection Test
 * Simulates the exact flow Jack's frontend uses
 */

import WebSocket from 'ws';
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./aws-config.json', 'utf8'));

const WS_URL = config.api.websocketUrl;
const CLIENT_ID = config.cognito.appClientId;
const REGION = config.cognito.region;
const USERNAME = config.simulator?.username || 'patient0@rnsync.com';
const PASSWORD = config.simulator?.password || '123456.Ab';

const client = new CognitoIdentityProviderClient({ region: REGION });

console.log('=========================================');
console.log('Frontend WebSocket Connection Test');
console.log('=========================================\n');

async function testFrontendFlow() {
    // Step 1: Authenticate (like frontend login)
    console.log('Step 1: Authenticating with Cognito...');
    console.log(`  Username: ${USERNAME}`);
    
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
        
        if (!response.AuthenticationResult?.AccessToken) {
            console.error('❌ No access token in response');
            console.log('Response:', JSON.stringify(response, null, 2));
            process.exit(1);
        }

        const token = response.AuthenticationResult.AccessToken;
        console.log('✓ Authentication successful!');
        console.log(`  Access Token length: ${token.length}`);
        console.log(`  Token preview: ${token.substring(0, 30)}...\n`);

        // Step 2: Connect to WebSocket with token
        console.log('Step 2: Connecting to WebSocket...');
        const wsUrl = WS_URL.endsWith('/') ? WS_URL.slice(0, -1) : WS_URL;
        const secureUrl = `${wsUrl}?token=${token}`;
        console.log(`  URL: ${secureUrl.substring(0, 80)}...?token=[REDACTED]\n`);

        const ws = new WebSocket(secureUrl);

        ws.on('open', () => {
            console.log('✓ WebSocket Connected Successfully!\n');
            
            // Step 3: Send data (like frontend does)
            console.log('Step 3: Sending test data...');
            
            const testMessage = {
                action: 'ingest',
                patientId: '9d6e8c1c-7f9a-4af5-9d4d-e4c1c097d33e', // Sample patient ID
                metric: 'heart_rate',
                value: 75,
                unit: 'bpm',
                timestamp: new Date().toISOString()
            };

            ws.send(JSON.stringify(testMessage));
            console.log('  Sent:', JSON.stringify(testMessage, null, 2));
        });

        ws.on('message', (data) => {
            console.log('\n✓ Received from server:', data.toString());
            console.log('\n=========================================');
            console.log('✓ WebSocket Test PASSED!');
            console.log('=========================================\n');
            ws.close();
            process.exit(0);
        });

        ws.on('error', (err) => {
            console.error('\n❌ WebSocket Error:', err.message);
            console.error('Full error:', err);
            process.exit(1);
        });

        ws.on('close', (code, reason) => {
            if (code === 1006) {
                console.error('\n❌ Connection closed abnormally (1006)');
                console.error('This usually means:');
                console.error('  - Auth handler rejected the connection (403 Forbidden)');
                console.error('  - Token is invalid or expired');
                console.error('  - Check CloudWatch logs: /aws/lambda/ws-auth-handler\n');
                process.exit(1);
            } else {
                console.log(`\nConnection closed: ${code} - ${reason || 'Normal closure'}`);
            }
        });

        // Keep alive for 10 seconds
        setTimeout(() => {
            console.log('\nTimeout reached, closing connection...');
            ws.close();
            process.exit(0);
        }, 10000);

    } catch (error) {
        console.error('\n❌ Authentication failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testFrontendFlow();
