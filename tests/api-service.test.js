import { jest } from '@jest/globals';

const mockSelect = jest.fn();

jest.unstable_mockModule('../src/utils/supabase-client.js', () => ({
    SupabaseClient: jest.fn().mockImplementation(() => ({
        select: mockSelect
    }))
}));

const { ApiService } = await import('../src/services/api-service.js');

describe('ApiService', () => {
    let service;

    beforeEach(() => {
        mockSelect.mockClear();
        service = new ApiService();
    });

    test('getHealth returns healthy message', async () => {
        const response = await service.getHealth();
        expect(response.message).toBe('API is healthy');
    });

    test('getHistory calls Supabase select with correct params', async () => {
        mockSelect.mockResolvedValue([{ id: 1, bpm: 80 }]);

        const data = await service.getHistory('device-123', 10);

        expect(mockSelect).toHaveBeenCalledWith('readings', {
            order: 'timestamp.desc',
            limit: 10,
            filters: { device_id: 'device-123' }
        });
        expect(data).toHaveLength(1);
    });

    test('getHistory without deviceId does not apply filters', async () => {
        mockSelect.mockResolvedValue([]);

        await service.getHistory(undefined, 5);

        expect(mockSelect).toHaveBeenCalledWith('readings', {
            order: 'timestamp.desc',
            limit: 5,
            filters: {}
        });
    });
});
