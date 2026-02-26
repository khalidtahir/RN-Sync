import { createContext, useContext, useEffect, useState } from "react";
// import WebSocket from "ws";

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { client } from "../lib/cognito";

// Load configuration
// const config = JSON.parse(fs.readFileSync("./aws-config.json", "utf8"));

// const WS_URL = config.api.websocketUrl;
// const CLIENT_ID = config.cognito.appClientId;

const WS_URL = "wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/";
const CLIENT_ID = "2n2bqionolrsftg1k7umtlh2aa";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  async function login(email, password) {
    console.log(`Authenticating as ${email}...`);

    try {
      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await client.send(command);
      console.log(
        "Authentication successful! Response:",
        JSON.stringify(response, null, 2),
      );

      setUser(email);
      setToken(response.AuthenticationResult.AccessToken);
      return response.AuthenticationResult.AccessToken;
    } catch (error) {
      setUser(null);

      throw new Error(error);
    }
  }

  return (
    <UserContext.Provider value={{ user, login, token }}>
      {children}
    </UserContext.Provider>
  );
}
