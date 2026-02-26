import { jest } from '@jest/globals';

const mockHandleConnect = jest.fn();
const mockHandleDisconnect = jest.fn();
const mockHandleIngest = jest.fn();

jest.unstable_mockModule('../src/services/websocket-service.js', () => ({
    WebSocketService: jest.fn().mockImplementation(() => ({
        handleConnect: mockHandleConnect,
        handleDisconnect: mockHandleDisconnect,
        handleIngest: mockHandleIngest
    }))
}));

const { handler } = await import('../src/handlers/websocket-handler.js');

describe('WebSocket Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const baseEvent = {
        requestContext: {
            routeKey: '$connect',
            connectionId: 'abc'
        },
        body: null
    };

    test('routes $connect events', async () => {
        mockHandleConnect.mockResolvedValue({ statusCode: 200 });

        const response = await handler(baseEvent);

        expect(mockHandleConnect).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(200);
    });

    test('routes $disconnect events', async () => {
        mockHandleDisconnect.mockResolvedValue({ statusCode: 200 });

        const response = await handler({
            ...baseEvent,
            requestContext: { ...baseEvent.requestContext, routeKey: '$disconnect' }
        });

        expect(mockHandleDisconnect).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(200);
    });

    test('routes ingest events and parses body', async () => {
        mockHandleIngest.mockResolvedValue({ statusCode: 200 });
        const payload = { metric: 'hr', patientId: 'p1' };

        const response = await handler({
            ...baseEvent,
            requestContext: { ...baseEvent.requestContext, routeKey: 'ingest' },
            body: JSON.stringify(payload)
        });

        expect(mockHandleIngest).toHaveBeenCalledWith(payload);
        expect(response.statusCode).toBe(200);
    });

    test('returns 400 for unknown route', async () => {
        const response = await handler({
            ...baseEvent,
            requestContext: { ...baseEvent.requestContext, routeKey: 'unknown' }
        });

        expect(response.statusCode).toBe(400);
        expect(response.body).toBe('Unknown route.');
    });

    test('returns 500 when service throws', async () => {
        mockHandleIngest.mockRejectedValue(new Error('boom'));

        const response = await handler({
            ...baseEvent,
            requestContext: { ...baseEvent.requestContext, routeKey: 'ingest' },
            body: JSON.stringify({ patientId: 'p1' })
        });

        expect(response.statusCode).toBe(500);
        expect(response.body).toContain('Server Error');
    });
});

