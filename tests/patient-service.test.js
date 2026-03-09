import { jest } from '@jest/globals';

const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();

jest.unstable_mockModule('../src/utils/supabase-client.js', () => ({
    SupabaseClient: jest.fn().mockImplementation(() => ({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate
    }))
}));

const { PatientService } = await import('../src/services/patient-service.js');

describe('PatientService', () => {
    let service;

    beforeEach(() => {
        mockSelect.mockClear();
        mockInsert.mockClear();
        mockUpdate.mockClear();
        service = new PatientService();
    });

    test('getAllPatients returns list of patients', async () => {
        mockSelect.mockResolvedValue([{ id: 'p1', name: 'John' }]);

        const response = await service.getAllPatients();

        expect(mockSelect).toHaveBeenCalledWith('patients', { order: 'created_at.desc' });
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(1);
    });

    test('getPatientById returns patient and readings', async () => {
        mockSelect
            .mockResolvedValueOnce([{ id: 'p1', name: 'John' }]) // First call for patient
            .mockResolvedValueOnce([{ id: 'r1', value: 80 }]);   // Second call for readings

        const response = await service.getPatientById('p1');

        expect(mockSelect).toHaveBeenNthCalledWith(1, 'patients', { filters: { id: 'p1' } });
        expect(mockSelect).toHaveBeenNthCalledWith(2, 'readings', {
            filters: { patient_id: 'p1' },
            order: 'timestamp.desc',
            limit: 10
        });
        expect(response.success).toBe(true);
        expect(response.data.latest_readings).toHaveLength(1);
    });

    test('createPatient inserts new patient', async () => {
        const newPatient = { name: 'Jane', bed: 'A1' };

        const response = await service.createPatient(newPatient);

        expect(mockInsert).toHaveBeenCalledWith('patients', expect.objectContaining({
            name: 'Jane',
            bed: 'A1'
        }));
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(201);
    });

    test('addReading inserts new reading', async () => {
        mockSelect.mockResolvedValue([{ id: 'p1' }]); // Patient exists check

        const reading = { metric: 'bpm', value: 80, unit: 'bpm' };
        const response = await service.addReading('p1', reading);

        expect(mockInsert).toHaveBeenCalledWith('readings', expect.objectContaining({
            patient_id: 'p1',
            metric: 'bpm',
            value: 80
        }));
        expect(response.success).toBe(true);
    });

    test('createPatient validates required fields', async () => {
        const response = await service.createPatient({ name: '', bed: '' });

        expect(response.statusCode).toBe(400);
        expect(mockInsert).not.toHaveBeenCalled();
    });

    test('getPatientHistory returns readings with filters', async () => {
        mockSelect
            .mockResolvedValueOnce([{ id: 'p1' }])
            .mockResolvedValueOnce([{ id: 'r1', metric: 'spo2' }]);

        const response = await service.getPatientHistory('p1', { metric: 'spo2' });

        expect(mockSelect).toHaveBeenNthCalledWith(2, 'readings', {
            filters: { patient_id: 'p1', metric: 'spo2' },
            order: 'timestamp.desc',
            limit: 100
        });
        expect(response.success).toBe(true);
        expect(response.count).toBe(1);
    });

    test('getPatientHistory returns 404 when patient missing', async () => {
        mockSelect.mockResolvedValueOnce([]);

        const response = await service.getPatientHistory('missing');

        expect(response.statusCode).toBe(404);
        expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    test('addReading validates payload', async () => {
        const response = await service.addReading('p1', { value: 90 });

        expect(response.statusCode).toBe(400);
        expect(mockInsert).not.toHaveBeenCalled();
    });

    test('addReading returns 404 when patient missing', async () => {
        mockSelect.mockResolvedValueOnce([]);

        const response = await service.addReading('missing', { metric: 'hr', value: 90 });

        expect(response.statusCode).toBe(404);
    });

    test('updatePatient assigns a doctor_id', async () => {
        mockSelect
            .mockResolvedValueOnce([{ id: 'p1', name: 'John', bed: 'ICU-1' }]) // patient exists
            .mockResolvedValueOnce([{ id: 'd1', name: 'Dr. Smith' }]);          // doctor exists
        mockUpdate.mockResolvedValue([{ id: 'p1', name: 'John', bed: 'ICU-1', doctor_id: 'd1' }]);

        const response = await service.updatePatient('p1', { doctor_id: 'd1' });

        expect(mockSelect).toHaveBeenNthCalledWith(1, 'patients', { filters: { id: 'p1' } });
        expect(mockSelect).toHaveBeenNthCalledWith(2, 'doctors', { filters: { id: 'd1' } });
        expect(mockUpdate).toHaveBeenCalledWith('patients', { id: 'p1' }, { doctor_id: 'd1' });
        expect(response.success).toBe(true);
        expect(response.data.doctor_id).toBe('d1');
    });

    test('updatePatient clears doctor_id when set to null', async () => {
        mockSelect.mockResolvedValueOnce([{ id: 'p1', name: 'John', bed: 'ICU-1', doctor_id: 'd1' }]);
        mockUpdate.mockResolvedValue([{ id: 'p1', name: 'John', bed: 'ICU-1', doctor_id: null }]);

        const response = await service.updatePatient('p1', { doctor_id: null });

        expect(mockUpdate).toHaveBeenCalledWith('patients', { id: 'p1' }, { doctor_id: null });
        expect(response.success).toBe(true);
        expect(response.data.doctor_id).toBeNull();
    });

    test('updatePatient returns 404 when patient not found', async () => {
        mockSelect.mockResolvedValueOnce([]);

        const response = await service.updatePatient('missing', { doctor_id: 'd1' });

        expect(response.statusCode).toBe(404);
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    test('updatePatient returns 404 when doctor_id does not exist', async () => {
        mockSelect
            .mockResolvedValueOnce([{ id: 'p1' }]) // patient found
            .mockResolvedValueOnce([]);              // doctor not found

        const response = await service.updatePatient('p1', { doctor_id: 'bad-doctor-id' });

        expect(response.statusCode).toBe(404);
        expect(response.message).toBe('Doctor not found');
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    test('updatePatient returns 400 when no valid fields provided', async () => {
        mockSelect.mockResolvedValueOnce([{ id: 'p1' }]);

        const response = await service.updatePatient('p1', { unknown_field: 'x' });

        expect(response.statusCode).toBe(400);
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    test('updatePatient can update name and bed', async () => {
        mockSelect.mockResolvedValueOnce([{ id: 'p1', name: 'Old Name', bed: 'ICU-1' }]);
        mockUpdate.mockResolvedValue([{ id: 'p1', name: 'New Name', bed: 'ICU-5', doctor_id: null }]);

        const response = await service.updatePatient('p1', { name: 'New Name', bed: 'ICU-5' });

        expect(mockUpdate).toHaveBeenCalledWith('patients', { id: 'p1' }, { name: 'New Name', bed: 'ICU-5' });
        expect(response.success).toBe(true);
    });

    test('updatePatient assigns doctor by email', async () => {
        mockSelect
            .mockResolvedValueOnce([{ id: 'p1', name: 'John', bed: 'ICU-1' }])
            .mockResolvedValueOnce([{ id: 'abc-uuid', name: 'Dr. Smith', email: 'smith@hospital.com' }]);
        mockUpdate.mockResolvedValue([{ id: 'p1', name: 'John', bed: 'ICU-1', doctor_id: 'abc-uuid' }]);

        const response = await service.updatePatient('p1', { doctor_email: 'smith@hospital.com' });

        expect(mockSelect).toHaveBeenNthCalledWith(2, 'doctors', { filters: { email: 'smith@hospital.com' } });
        expect(mockUpdate).toHaveBeenCalledWith('patients', { id: 'p1' }, { doctor_id: 'abc-uuid' });
        expect(response.success).toBe(true);
        expect(response.data.doctor_id).toBe('abc-uuid');
    });

    test('updatePatient returns 404 when doctor_email does not match any doctor', async () => {
        mockSelect
            .mockResolvedValueOnce([{ id: 'p1' }])
            .mockResolvedValueOnce([]);

        const response = await service.updatePatient('p1', { doctor_email: 'nobody@hospital.com' });

        expect(response.statusCode).toBe(404);
        expect(response.message).toBe('Doctor not found');
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    test('updatePatient clears doctor_id when doctor_email is null', async () => {
        mockSelect.mockResolvedValueOnce([{ id: 'p1', doctor_id: 'abc-uuid' }]);
        mockUpdate.mockResolvedValue([{ id: 'p1', doctor_id: null }]);

        const response = await service.updatePatient('p1', { doctor_email: null });

        expect(mockUpdate).toHaveBeenCalledWith('patients', { id: 'p1' }, { doctor_id: null });
        expect(response.success).toBe(true);
    });
});
