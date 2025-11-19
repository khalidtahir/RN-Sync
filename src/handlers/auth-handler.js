/*
 * AWS Lambda Authorizer for RN Sync (WebSocket)
 */

import { AuthService } from '../services/auth-service.js';

const service = new AuthService();

export const handler = async (event) => {
    console.log("Auth Event:", JSON.stringify(event, null, 2));

    const token = event.queryStringParameters?.token;

    if (!token) {
        console.log("No token provided");
        return service.generatePolicy('user', 'Deny', event.methodArn);
    }

    const result = await service.verifyToken(token);

    if (result.valid) {
        console.log("User verified:", result.username);
        return service.generatePolicy(result.username, 'Allow', event.methodArn);
    } else {
        return service.generatePolicy('user', 'Deny', event.methodArn);
    }
};
