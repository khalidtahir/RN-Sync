import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

// const config = JSON.parse(fs.readFileSync("../aws-config.json", "utf8"));
const REGION = "us-east-2";

export const client = new CognitoIdentityProviderClient({ region: REGION });
