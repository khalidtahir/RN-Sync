import { jest } from '@jest/globals';

const mockSelect = jest.fn();
const mockInsert = jest.fn();

jest.unstable_mockModule('../src/utils/supabase-client.js', () => ({
    SupabaseClient: jest.fn().mockImplementation(() => ({
        select: mockSelect,
        insert: mockInsert
    }))
}));

const { FileService } = await import('../src/services/file-service.js');

describe('FileService', () => {
    let service;

    beforeEach(() => {
        mockSelect.mockClear();
        mockInsert.mockClear();
        service = new FileService();
    });

    test('getPatientFiles returns files', async () => {
        mockSelect
            .mockResolvedValueOnce([{ id: 'p1' }]) // Patient check
            .mockResolvedValueOnce([{ id: 'f1', file_name: 'test.pdf' }]); // Files

        const response = await service.getPatientFiles('p1');

        expect(mockSelect).toHaveBeenNthCalledWith(2, 'files', {
            filters: { patient_id: 'p1' },
            order: 'uploaded_at.desc'
        });
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(1);
    });

    test('addFile inserts file metadata', async () => {
        mockSelect.mockResolvedValue([{ id: 'p1' }]); // Patient check

        const fileData = { file_name: 'scan.jpg', storage_url: 's3://bucket/scan.jpg' };
        const response = await service.addFile('p1', fileData);

        expect(mockInsert).toHaveBeenCalledWith('files', expect.objectContaining({
            patient_id: 'p1',
            file_name: 'scan.jpg',
            storage_url: 's3://bucket/scan.jpg'
        }));
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(201);
    });

    test('getFileById returns single file', async () => {
        mockSelect.mockResolvedValue([{ id: 'f1', file_name: 'test.pdf' }]);

        const response = await service.getFileById('f1');

        expect(mockSelect).toHaveBeenCalledWith('files', { filters: { id: 'f1' } });
        expect(response.success).toBe(true);
        expect(response.data.file_name).toBe('test.pdf');
    });

    test('getPatientFiles returns 404 when patient missing', async () => {
        mockSelect.mockResolvedValueOnce([]);

        const response = await service.getPatientFiles('missing');

        expect(response.statusCode).toBe(404);
    });

    test('addFile validates required fields', async () => {
        const response = await service.addFile('p1', { storage_url: 's3://bucket/file' });

        expect(response.statusCode).toBe(400);
        expect(mockInsert).not.toHaveBeenCalled();
    });

    test('getFileById returns 404 when not found', async () => {
        mockSelect.mockResolvedValueOnce([]);

        const response = await service.getFileById('missing');

        expect(response.statusCode).toBe(404);
    });

    test('deleteFile reports not implemented', async () => {
        const response = await service.deleteFile('file-1');

        expect(response.statusCode).toBe(501);
        expect(response.message).toMatch(/not yet supported/i);
    });
});
