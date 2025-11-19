/*
 * AWS Lambda REST API Handler for RN Sync
 */

import { ApiService } from '../services/api-service.js';

const service = new ApiService();

export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const rawPath = event.rawPath || event.path;
    const queryStringParameters = event.queryStringParameters;

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    try {
        if (rawPath === "/" || rawPath === "/health") {
            const body = await service.getHealth();
            return { statusCode: 200, headers, body: JSON.stringify(body) };
        }

        if (rawPath.endsWith("/history")) {
            const deviceId = queryStringParameters?.deviceId;
            const limit = queryStringParameters?.limit || 50;

            const data = await service.getHistory(deviceId, limit);
            return { statusCode: 200, headers, body: JSON.stringify(data) };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: "Route not found", path: rawPath }),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error", error: err.message }),
        };
    }
};
