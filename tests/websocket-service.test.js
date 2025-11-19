import { jest } from '@jest/globals';

// 1. Mock the dependency BEFORE importing the module under test
const mockInsert = jest.fn();

jest.unstable_mockModule('../src/utils/supabase-client.js', () => ({
    SupabaseClient: jest.fn().mockImplementation(() => ({
        insert: mockInsert
    }))
}));

// 2. Dynamic import of the module under test
const { WebSocketService } = await import('../src/services/websocket-service.js');

describe('WebSocketService', () => {
    let service;

    beforeEach(() => {
        mockInsert.mockClear();
        service = new WebSocketService();
    });

    test('handleConnect returns 200', async () => {
        const response = await service.handleConnect();
        expect(response.statusCode).toBe(200);
        expect(response.body).toBe('Connected.');
    });

    test('handleDisconnect returns 200', async () => {
        const response = await service.handleDisconnect();
        expect(response.statusCode).toBe(200);
        expect(response.body).toBe('Disconnected.');
    });

    test('handleIngest saves to Supabase and returns echo', async () => {
        const mockBody = { payload: { bpm: 80 } };

        const response = await service.handleIngest(mockBody);

        expect(mockInsert).toHaveBeenCalledWith('sensor_readings', mockBody);
        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('Echo from AWS');
        expect(response.body).toContain('80');
    });
});
