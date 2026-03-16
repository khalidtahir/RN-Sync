/*
 * RN Sync Oxygen Saturation Simulator (Secure Version)
 *
 * This script simulates sending oxygen saturation data to one patient only.
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

const DEVICE_ID = "simulated-laptop-02";

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

  // Find the first non-test patient
  const targetPatient = patients.find(
    (patient) => !patient.name.includes("Test"),
  );
  if (!targetPatient) {
    console.error("No suitable patient found.");
    process.exit(1);
  }

  console.log(
    `Simulating oxygen saturation for patient: ${targetPatient.name} (ID: ${targetPatient.id})`,
  );

  // Initialize oxygen saturation with base value
  let oxygenSaturation = 98; // Normal oxygen saturation

  // 2. Connect with Token
  const secureUrl = `${WS_URL}?token=${token}`;
  console.log(`Connecting to WebSocket...`);

  const ws = new WebSocket(secureUrl);

  ws.on("open", () => {
    console.log("Connected! Starting oxygen saturation data stream...");

    // Send data every 1 second
    setInterval(() => {
      // Oxygen saturation data
      const data = generateOxygenSaturationData(
        targetPatient.id,
        oxygenSaturation,
      );
      oxygenSaturation = data.value; // Update for next iteration

      const message = {
        action: "ingest",
        patientId: data.patient_id,
        metric: data.metric,
        value: data.value,
        unit: data.unit,
        timestamp: data.timestamp,
      };

      ws.send(JSON.stringify(message));
      console.log("Sent:", message);
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

function generateOxygenSaturationData(patientId, currentOxygenSaturation) {
  // Simulate natural oxygen saturation variation (±0.5% to ±1.5% per second)
  const variance = Math.random() * 2 - 1; // Random value between -1 and 1
  let newOxygenSaturation = currentOxygenSaturation + variance;

  // Keep oxygen saturation within realistic bounds (90-100% for normal)
  newOxygenSaturation = Math.max(90, Math.min(100, newOxygenSaturation));

  return {
    metric: "oxygen_saturation",
    value: parseFloat(newOxygenSaturation.toFixed(1)),
    timestamp: new Date().toISOString(),
    patient_id: patientId,
    unit: "%",
  };
}

startSimulation();
