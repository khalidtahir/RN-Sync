import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";

export class AuthService {
    constructor() {
        this.client = new CognitoIdentityProviderClient();
    }

    async verifyToken(token) {
        try {
            const command = new GetUserCommand({ AccessToken: token });
            const response = await this.client.send(command);
            return { valid: true, username: response.Username };
        } catch (err) {
            console.error("Token verification failed:", err.message);
            return { valid: false };
        }
    }

    generatePolicy(principalId, effect, resource) {
        const authResponse = { principalId };

        if (effect && resource) {
            authResponse.policyDocument = {
                Version: '2012-10-17',
                Statement: [{
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource
                }]
            };
        }

        return authResponse;
    }
}
