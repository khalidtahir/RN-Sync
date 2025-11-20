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

    test('handleIngest saves to Supabase and returns success', async () => {
        const mockBody = {
            patientId: '123-uuid',
            metric: 'heart_rate',
            value: 80,
            unit: 'bpm',
            timestamp: '2025-01-01T00:00:00Z'
        };

        const response = await service.handleIngest(mockBody);

        expect(mockInsert).toHaveBeenCalledWith('readings', {
            patient_id: '123-uuid',
            metric: 'heart_rate',
            value: 80,
            unit: 'bpm',
            timestamp: '2025-01-01T00:00:00Z'
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('Data saved for patient: 123-uuid');
    });

    test('handleIngest populates timestamp when missing', async () => {
        const response = await service.handleIngest({
            patientId: '999',
            metric: 'spo2',
            value: 98,
            unit: '%'
        });

        expect(mockInsert).toHaveBeenCalledWith('readings', expect.objectContaining({
            patient_id: '999',
            timestamp: expect.any(String)
        }));
        expect(response.statusCode).toBe(200);
    });
});
