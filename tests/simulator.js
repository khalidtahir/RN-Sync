/*
 * RN Sync Data Simulator (Secure Version)
 * 
 * This script simulates a patient monitor (laptop) sending data to the cloud.
 * NOW WITH SECURITY: It logs in to Cognito first to get a token.
 * 
 * PREREQUISITES:
 * 1. Node.js installed.
 * 2. Run `npm install ws @aws-sdk/client-cognito-identity-provider`
 * 3. Create a user in Cognito (see todo_list.md).
 */

import WebSocket from 'ws';
import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand } from "@aws-sdk/client-cognito-identity-provider";
import fs from 'fs';

// Load configuration
const config = JSON.parse(fs.readFileSync('./aws-config.json', 'utf8'));

const WS_URL = config.api.websocketUrl;
const CLIENT_ID = config.cognito.appClientId;
const REGION = config.cognito.region;

// USER CREDENTIALS (CHANGE THESE TO MATCH YOUR COGNITO USER)
const USERNAME = "doctor0@rnsync.com";
const PASSWORD = "123456.Ab";

const DEVICE_ID = 'simulated-laptop-01';

async function getAuthToken() {
    console.log(`Authenticating as ${USERNAME}...`);
    const client = new CognitoIdentityProviderClient({ region: REGION });

    try {
        const command = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME: USERNAME,
                PASSWORD: PASSWORD
            }
        });

        const response = await client.send(command);
        console.log("Authentication successful! Response:", JSON.stringify(response, null, 2));

        if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            console.log("User needs to set a new password. Setting it now...");
            const challengeCommand = new RespondToAuthChallengeCommand({
                ChallengeName: "NEW_PASSWORD_REQUIRED",
                ClientId: CLIENT_ID,
                ChallengeResponses: {
                    USERNAME: USERNAME,
                    NEW_PASSWORD: PASSWORD, // We set the permanent password to be the same as the config
                    SECRET_HASH: response.SecretHash
                },
                Session: response.Session
            });

            const challengeResponse = await client.send(challengeCommand);
            console.log("Password set successfully!");
            return challengeResponse.AuthenticationResult.AccessToken;
        }

        return response.AuthenticationResult.AccessToken; // GetUser requires AccessToken, not IdToken
    } catch (err) {
        console.error("Authentication failed:", err.message);
        process.exit(1);
    }
}

async function startSimulation() {
    // 1. Get Token
    const token = await getAuthToken();

    // 2. Connect with Token
    const secureUrl = `${WS_URL}?token=${token}`;
    console.log(`Connecting to WebSocket...`);

    const ws = new WebSocket(secureUrl);

    ws.on('open', () => {
        console.log('Connected! Starting data stream...');

        // Send data every 1 second
        setInterval(() => {
            const data = generateHeartRateData();
            const message = {
                action: 'ingest',
                deviceId: DEVICE_ID,
                payload: data
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
