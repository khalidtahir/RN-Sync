/*
 * RN Sync Data Simulator (Secure Version)
 * 
 * This script simulates a patient monitor (laptop) sending data to the cloud.
 */

import WebSocket from 'ws';
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    RespondToAuthChallengeCommand,
    GetUserCommand
} from "@aws-sdk/client-cognito-identity-provider";
import fs from 'fs';

// Load configuration
const config = JSON.parse(fs.readFileSync('./aws-config.json', 'utf8'));

const WS_URL = config.api.websocketUrl;
const CLIENT_ID = config.cognito.appClientId;
const REGION = config.cognito.region;
const USERNAME = config.simulator?.username || process.env.SIM_USERNAME;
const PASSWORD = config.simulator?.password || process.env.SIM_PASSWORD;
const FALLBACK_PATIENT_ID = config.simulator?.patientId || process.env.SIM_PATIENT_ID;

if (!USERNAME || !PASSWORD) {
    console.error('Missing simulator credentials. Please update aws-config.json or set SIM_USERNAME and SIM_PASSWORD.');
    process.exit(1);
}

const client = new CognitoIdentityProviderClient({ region: REGION });

async function getAuthToken() {
    try {
        const command = new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME,
                PASSWORD
            }
        });

        let response = await client.send(command);
        console.log("Authentication response received.");

        if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            console.log("User needs to set a new password. Setting it now...");
            const challengeCommand = new RespondToAuthChallengeCommand({
                ChallengeName: "NEW_PASSWORD_REQUIRED",
                ClientId: CLIENT_ID,
                ChallengeResponses: {
                    USERNAME,
                    NEW_PASSWORD: PASSWORD
                },
                Session: response.Session
            });

            response = await client.send(challengeCommand);
            console.log("Password set successfully.");
        }

        const token = response.AuthenticationResult?.AccessToken;
        if (!token) {
            throw new Error('No AccessToken returned from Cognito.');
        }

        return token; // GetUser requires AccessToken, not IdToken
    } catch (err) {
        console.error("Authentication failed:", err.message);
        process.exit(1);
    }
}

async function getPatientId(token) {
    try {
        const command = new GetUserCommand({ AccessToken: token });
        const response = await client.send(command);

        const attrs = response.UserAttributes || [];
        const patientAttr = attrs.find(attr => attr.Name === 'custom:PATIENT_ID');
        const patientId = patientAttr?.Value || FALLBACK_PATIENT_ID;

        if (!patientId) {
            throw new Error('custom:PATIENT_ID attribute not set for this user.');
        }

        return patientId;
    } catch (err) {
        console.error("Failed to resolve patient id:", err.message);
        process.exit(1);
    }
}

async function startSimulation() {
    // 1. Get Token
    const token = await getAuthToken();
    const patientId = await getPatientId(token);

    // 2. Connect with Token
    const wsUrl = WS_URL.endsWith('/') ? WS_URL.slice(0, -1) : WS_URL;
    const secureUrl = `${wsUrl}?token=${token}`;
    console.log(`Connecting to WebSocket...`);

    const ws = new WebSocket(secureUrl);

    ws.on('open', () => {
        console.log('Connected! Starting data stream...');

        // Send data every 1 second
        setInterval(() => {
            const data = generateHeartRateData();
            // Match the 'readings' table schema: patient_id, metric, value, unit, timestamp
            const message = {
                action: 'ingest',
                patientId,
                metric: 'heart_rate',
                value: data.bpm,
                unit: 'bpm',
                timestamp: data.timestamp
            };

            ws.send(JSON.stringify(message));
            console.log('Sent:', message);
        }, 1000);
    });

    ws.on('message', (data) => {
        console.log('Received from server:', data.toString());
    });

    ws.on('close', () => {
        console.log('Disconnected.');
        process.exit(0);
    });

    ws.on('error', (err) => {
        console.error('Connection error:', err.message);
    });
}

function generateHeartRateData() {
    const heartRate = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
    return {
        type: 'ECG',
        bpm: heartRate,
        timestamp: new Date().toISOString()
    };
}

startSimulation();
