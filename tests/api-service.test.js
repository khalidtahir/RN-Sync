import { jest } from '@jest/globals';
import { ApiService } from '../src/services/api-service.js';

describe('ApiService', () => {
    let service;

    beforeEach(() => {
        service = new ApiService();
    });

    test('getHealth returns healthy message', async () => {
        const response = await service.getHealth();
        expect(response.message).toBe('API is healthy');
    });
});
