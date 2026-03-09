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

import WebSocket from "ws";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import fs from "fs";
import axios from "axios";

// Load configuration
const config = JSON.parse(fs.readFileSync("./aws-config.json", "utf8"));

const WS_URL = config.api.websocketUrl;
const CLIENT_ID = config.cognito.appClientId;
const REGION = config.cognito.region;

// USER CREDENTIALS (CHANGE THESE TO MATCH YOUR COGNITO USER)
const USERNAME = "doctor0@rnsync.com";
const PASSWORD = "123456.Ab";

const DEVICE_ID = "simulated-laptop-01";

const HTTP_URL = "https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com";

async function getAuthToken() {
  console.log(`Authenticating as ${USERNAME}...`);
  const client = new CognitoIdentityProviderClient({ region: REGION });

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: USERNAME,
        PASSWORD: PASSWORD,
      },
    });

    const response = await client.send(command);
    console.log(
      "Authentication successful! Response:",
      JSON.stringify(response, null, 2),
    );

    if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      console.log("User needs to set a new password. Setting it now...");
      const challengeCommand = new RespondToAuthChallengeCommand({
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        ClientId: CLIENT_ID,
        ChallengeResponses: {
          USERNAME: USERNAME,
          NEW_PASSWORD: PASSWORD, // We set the permanent password to be the same as the config
          SECRET_HASH: response.SecretHash,
        },
        Session: response.Session,
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

async function getPatients() {
  console.log("Fetching patients");

  try {
    const response = await axios.get(`${HTTP_URL}/patients`);
    console.log("Patients fetched successfully!");
    console.log(response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("couldn't be done champ", error);
    process.exit(1);
  }
}

async function startSimulation() {
  // 1. Get Token and patient IDs
  const token = await getAuthToken();
  const patients = await getPatients();
  console.log(patients);

  // Initialize patient metrics with base values
  const patientMetrics = {};
  patients.forEach((patient) => {
    if (!patient.name.includes("Test")) {
      patientMetrics[patient.id] = {
        heartRate: 72, // Normal resting heart rate
        temperature: 37.0, // Normal body temperature
      };
    }
  });

  // 2. Connect with Token
  const secureUrl = `${WS_URL}?token=${token}`;
  console.log(`Connecting to WebSocket...`);

  const ws = new WebSocket(secureUrl);

  ws.on("open", () => {
    console.log("Connected! Starting data stream...");

    // Send data every 1 second
    setInterval(() => {
      patients.forEach((patient) => {
        if (!patient.name.includes("Test")) {
          // Heart rate data
          let data = generateHeartRateData(patient.id, patientMetrics);

          let message = {
            action: "ingest",
            patientId: data.patient_id, // Use the patient ID from the route
            metric: data.metric,
            value: data.value,
            unit: data.unit,
            timestamp: data.timestamp,
          };

          ws.send(JSON.stringify(message));
          console.log("Sent:", message);

          // Temperature data
          data = generateTemperatureData(patient.id, patientMetrics);

          message = {
            action: "ingest",
            patientId: data.patient_id, // Use the patient ID from the route
            metric: data.metric,
            value: data.value,
            unit: data.unit,
            timestamp: data.timestamp,
          };

          ws.send(JSON.stringify(message));
          console.log("Sent:", message);
        }
      });
    }, 1000);
  });

  ws.on("message", (data) => {
    console.log("Received from server:", data.toString());
  });

  ws.on("close", () => {
    console.log("Disconnected.");
    process.exit(0);
  });

  ws.on("error", (err) => {
    console.error("Connection error:", err.message);
  });
}

function generateHeartRateData(patientId, patientMetrics) {
  // Get the current heart rate for this patient
  let currentHeartRate = patientMetrics[patientId].heartRate;

  // Simulate natural heart rate variation (±1 to ±3 bpm per second)
  const variance = Math.floor(Math.random() * 5) - 2; // Random value between -2 and 2
  let newHeartRate = currentHeartRate + variance;

  // Keep heart rate within realistic bounds (60-100 bpm for normal activity)
  newHeartRate = Math.max(60, Math.min(100, newHeartRate));

  // Update the stored heart rate for next iteration
  patientMetrics[patientId].heartRate = newHeartRate;

  return {
    metric: "heart_rate",
    value: newHeartRate,
    timestamp: new Date().toISOString(),
    patient_id: patientId,
    unit: "bpm",
  };
}

function generateTemperatureData(patientId, patientMetrics) {
  // Get the current temperature for this patient
  let currentTemp = patientMetrics[patientId].temperature;

  // Simulate natural body temperature variation (±0.05 to ±0.15°C per second)
  const variance = Math.random() * 0.2 - 0.1; // Random value between -0.1 and 0.1
  let newTemp = currentTemp + variance;

  // Keep temperature within realistic bounds (36.1-38.5°C, accounting for normal variation)
  newTemp = Math.max(36.1, Math.min(38.5, newTemp));

  // Update the stored temperature for next iteration
  patientMetrics[patientId].temperature = newTemp;

  return {
    metric: "temperature",
    value: parseFloat(newTemp.toFixed(1)),
    timestamp: new Date().toISOString(),
    patient_id: patientId,
    unit: "°C",
  };
}

startSimulation();
