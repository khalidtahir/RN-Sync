import { jest } from '@jest/globals';

const mockSelect = jest.fn();
const mockUpsert = jest.fn();

jest.unstable_mockModule('../src/utils/supabase-client.js', () => ({
    SupabaseClient: jest.fn().mockImplementation(() => ({
        select: mockSelect,
        upsert: mockUpsert
    }))
}));

const { DoctorService } = await import('../src/services/doctor-service.js');

describe('DoctorService', () => {
    let service;

    beforeEach(() => {
        mockSelect.mockClear();
        mockUpsert.mockClear();
        service = new DoctorService();
    });

    test('getAllDoctors returns list of doctors', async () => {
        const doctors = [
            { id: 'd1', name: 'Dr. Smith', email: 'smith@h.com' },
            { id: 'd2', name: 'Dr. Jones', email: 'jones@h.com' }
        ];
        mockSelect.mockResolvedValue(doctors);

        const response = await service.getAllDoctors();

        expect(mockSelect).toHaveBeenCalledWith('doctors', { order: 'name.asc' });
        expect(response.success).toBe(true);
        expect(response.count).toBe(2);
        expect(response.data).toHaveLength(2);
    });

    test('getAllDoctors returns empty list when no doctors exist', async () => {
        mockSelect.mockResolvedValue([]);

        const response = await service.getAllDoctors();

        expect(response.success).toBe(true);
        expect(response.count).toBe(0);
        expect(response.data).toHaveLength(0);
    });

    test('getDoctorById returns the matching doctor', async () => {
        const doctor = { id: 'd1', name: 'Dr. Smith', email: 'smith@h.com' };
        mockSelect.mockResolvedValue([doctor]);

        const response = await service.getDoctorById('d1');

        expect(mockSelect).toHaveBeenCalledWith('doctors', { filters: { id: 'd1' } });
        expect(response.success).toBe(true);
        expect(response.data.name).toBe('Dr. Smith');
    });

    test('getDoctorById returns 404 when doctor not found', async () => {
        mockSelect.mockResolvedValue([]);

        const response = await service.getDoctorById('missing-id');

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(404);
        expect(response.message).toBe('Doctor not found');
    });

    test('upsertDoctor creates doctor on first login and returns the row', async () => {
        const doctor = { id: 'new-uuid', name: 'Dr. Smith', email: 'smith@h.com' };
        mockUpsert.mockResolvedValue([doctor]);

        const result = await service.upsertDoctor('smith@h.com', 'Dr. Smith');

        expect(mockUpsert).toHaveBeenCalledWith('doctors', { email: 'smith@h.com', name: 'Dr. Smith' }, 'email');
        expect(result.id).toBe('new-uuid');
        expect(result.email).toBe('smith@h.com');
    });

    test('upsertDoctor returns existing row on subsequent logins', async () => {
        const existing = { id: 'existing-uuid', name: 'Dr. Smith', email: 'smith@h.com' };
        mockUpsert.mockResolvedValue([existing]);

        const result = await service.upsertDoctor('smith@h.com', 'Dr. Smith');

        expect(mockUpsert).toHaveBeenCalledTimes(1);
        expect(result.id).toBe('existing-uuid');
    });
});
