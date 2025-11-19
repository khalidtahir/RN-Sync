/*
 * AWS Lambda WebSocket Handler for RN Sync
 */

import { WebSocketService } from '../services/websocket-service.js';

const service = new WebSocketService();

export const handler = async (event) => {
    const routeKey = event.requestContext.routeKey;
    const connectionId = event.requestContext.connectionId;

    console.log(`Received event: ${routeKey} from ${connectionId}`);

    try {
        switch (routeKey) {
            case '$connect':
                return await service.handleConnect();

            case '$disconnect':
                return await service.handleDisconnect();

            case 'ingest':
                const body = JSON.parse(event.body);
                return await service.handleIngest(body);

            default:
                return { statusCode: 400, body: 'Unknown route.' };
        }
    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: 'Server Error: ' + err.message };
    }
};
