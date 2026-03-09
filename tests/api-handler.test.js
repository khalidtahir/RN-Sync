import { jest } from '@jest/globals';

const mockGetHealth = jest.fn();
const mockGetAllPatients = jest.fn();
const mockCreatePatient = jest.fn();
const mockGetPatientById = jest.fn();
const mockUpdatePatient = jest.fn();
const mockGetPatientHistory = jest.fn();
const mockAddReading = jest.fn();
const mockGetPatientFiles = jest.fn();
const mockAddFile = jest.fn();
const mockGetFileById = jest.fn();
const mockDeleteFile = jest.fn();
const mockGetAllDoctors = jest.fn();
const mockGetDoctorById = jest.fn();

jest.unstable_mockModule('../src/services/api-service.js', () => ({
    ApiService: jest.fn().mockImplementation(() => ({
        getHealth: mockGetHealth
    }))
}));

jest.unstable_mockModule('../src/services/patient-service.js', () => ({
    PatientService: jest.fn().mockImplementation(() => ({
        getAllPatients: mockGetAllPatients,
        createPatient: mockCreatePatient,
        getPatientById: mockGetPatientById,
        updatePatient: mockUpdatePatient,
        getPatientHistory: mockGetPatientHistory,
        addReading: mockAddReading
    }))
}));

jest.unstable_mockModule('../src/services/file-service.js', () => ({
    FileService: jest.fn().mockImplementation(() => ({
        getPatientFiles: mockGetPatientFiles,
        addFile: mockAddFile,
        getFileById: mockGetFileById,
        deleteFile: mockDeleteFile
    }))
}));

jest.unstable_mockModule('../src/services/doctor-service.js', () => ({
    DoctorService: jest.fn().mockImplementation(() => ({
        getAllDoctors: mockGetAllDoctors,
        getDoctorById: mockGetDoctorById
    }))
}));

const { handler } = await import('../src/handlers/api-handler.js');

const baseEvent = {
    httpMethod: 'GET',
    path: '/health',
    queryStringParameters: null,
    body: null,
    headers: {}
};

describe('API Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const invoke = (overrides = {}) => handler({ ...baseEvent, ...overrides });

    test('handles health check', async () => {
        mockGetHealth.mockResolvedValue({ message: 'healthy' });

        const response = await invoke();
        const parsed = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(parsed.message).toBe('healthy');
        expect(mockGetHealth).toHaveBeenCalled();
        expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    });

    test('routes GET /patients after stripping stage prefix', async () => {
        mockGetAllPatients.mockResolvedValue({ success: true, data: [] });

        const response = await invoke({
            path: '/rnsync/patients',
            httpMethod: 'GET'
        });

        expect(mockGetAllPatients).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(200);
    });

    test('routes POST /patients and returns service status code', async () => {
        mockCreatePatient.mockResolvedValue({ success: true, statusCode: 201 });

        const body = { name: 'Jane', bed: 'ICU-2' };
        const response = await invoke({
            path: '/patients',
            httpMethod: 'POST',
            body: JSON.stringify(body)
        });

        expect(mockCreatePatient).toHaveBeenCalledWith(body);
        expect(response.statusCode).toBe(201);
    });

    test('routes patient history with query params', async () => {
        mockGetPatientHistory.mockResolvedValue({ success: true, statusCode: 200, data: [] });

        const response = await invoke({
            path: '/patients/abc/history',
            httpMethod: 'GET',
            queryStringParameters: { metric: 'spo2' }
        });

        expect(mockGetPatientHistory).toHaveBeenCalledWith('abc', { metric: 'spo2' });
        expect(response.statusCode).toBe(200);
    });

    test('routes add reading requests', async () => {
        mockAddReading.mockResolvedValue({ success: true, statusCode: 201 });

        const reading = { metric: 'hr', value: 90 };
        const response = await invoke({
            path: '/patients/abc/readings',
            httpMethod: 'POST',
            body: JSON.stringify(reading)
        });

        expect(mockAddReading).toHaveBeenCalledWith('abc', reading);
        expect(response.statusCode).toBe(201);
    });

    test('routes patient file operations', async () => {
        mockGetPatientFiles.mockResolvedValue({ success: true });

        const getResponse = await invoke({
            path: '/patients/abc/files',
            httpMethod: 'GET'
        });
        expect(mockGetPatientFiles).toHaveBeenCalledWith('abc');
        expect(getResponse.statusCode).toBe(200);

        mockAddFile.mockResolvedValue({ success: true, statusCode: 201 });
        const filePayload = { file_name: 'scan', storage_url: 's3://bucket' };
        const postResponse = await invoke({
            path: '/patients/abc/files',
            httpMethod: 'POST',
            body: JSON.stringify(filePayload)
        });

        expect(mockAddFile).toHaveBeenCalledWith('abc', filePayload);
        expect(postResponse.statusCode).toBe(201);
    });

    test('routes file detail operations', async () => {
        mockGetFileById.mockResolvedValue({ success: true, statusCode: 200 });

        const getResponse = await invoke({
            path: '/files/file-123',
            httpMethod: 'GET'
        });

        expect(mockGetFileById).toHaveBeenCalledWith('file-123');
        expect(getResponse.statusCode).toBe(200);

        mockDeleteFile.mockResolvedValue({ success: true, statusCode: 200 });
        const deleteResponse = await invoke({
            path: '/files/file-123',
            httpMethod: 'DELETE'
        });

        expect(mockDeleteFile).toHaveBeenCalledWith('file-123');
        expect(deleteResponse.statusCode).toBe(200);
    });

    test('routes PUT /patients/{id} to updatePatient with doctor_email', async () => {
        const updatedPatient = { id: 'p1', name: 'John', bed: 'ICU-1', doctor_id: 'uuid-smith' };
        mockUpdatePatient.mockResolvedValue({ success: true, data: updatedPatient });

        const body = { doctor_email: 'smith@h.com' };
        const response = await invoke({
            path: '/patients/p1',
            httpMethod: 'PUT',
            body: JSON.stringify(body)
        });

        expect(mockUpdatePatient).toHaveBeenCalledWith('p1', body);
        expect(response.statusCode).toBe(200);
        const parsed = JSON.parse(response.body);
        expect(parsed.success).toBe(true);
        expect(parsed.data.doctor_id).toBe('uuid-smith');
    });

    test('PUT /patients/{id} returns 404 when patient not found', async () => {
        mockUpdatePatient.mockResolvedValue({ success: false, message: 'Patient not found', statusCode: 404 });

        const response = await invoke({
            path: '/patients/missing-id',
            httpMethod: 'PUT',
            body: JSON.stringify({ doctor_email: 'smith@h.com' })
        });

        expect(response.statusCode).toBe(404);
    });

    test('routes GET /doctors to getAllDoctors', async () => {
        const doctors = [{ id: 'd1', name: 'Dr. Smith', email: 'smith@h.com' }];
        mockGetAllDoctors.mockResolvedValue({ success: true, count: 1, data: doctors });

        const response = await invoke({ path: '/doctors', httpMethod: 'GET' });

        expect(mockGetAllDoctors).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(200);
        const parsed = JSON.parse(response.body);
        expect(parsed.data).toHaveLength(1);
        expect(parsed.data[0].name).toBe('Dr. Smith');
    });

    test('routes GET /doctors/{id} to getDoctorById', async () => {
        mockGetDoctorById.mockResolvedValue({ success: true, data: { id: 'd1', name: 'Dr. Smith' } });

        const response = await invoke({ path: '/doctors/d1', httpMethod: 'GET' });

        expect(mockGetDoctorById).toHaveBeenCalledWith('d1');
        expect(response.statusCode).toBe(200);
    });

    test('GET /doctors/{id} returns 404 for unknown doctor', async () => {
        mockGetDoctorById.mockResolvedValue({ success: false, message: 'Doctor not found', statusCode: 404 });

        const response = await invoke({ path: '/doctors/unknown', httpMethod: 'GET' });

        expect(response.statusCode).toBe(404);
    });

    test('routes GET /patients/{id} to getPatientById', async () => {
        const patient = { id: 'p1', name: 'John', bed: 'ICU-1', latest_readings: [] };
        mockGetPatientById.mockResolvedValue({ success: true, data: patient });

        const response = await invoke({ path: '/patients/p1', httpMethod: 'GET' });

        expect(mockGetPatientById).toHaveBeenCalledWith('p1');
        expect(response.statusCode).toBe(200);
        const parsed = JSON.parse(response.body);
        expect(parsed.data.id).toBe('p1');
    });

    test('OPTIONS preflight returns 200 with CORS headers', async () => {
        const response = await invoke({ httpMethod: 'OPTIONS', path: '/patients' });

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe('');
        expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
        expect(response.headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
    });

    test('unknown route returns 404', async () => {
        const response = await invoke({ path: '/unknown-path', httpMethod: 'GET' });

        expect(response.statusCode).toBe(404);
        const parsed = JSON.parse(response.body);
        expect(parsed.message).toBe('Not Found');
    });

    test('returns 500 when a service throws', async () => {
        mockGetAllPatients.mockRejectedValue(new Error('DB connection failed'));

        const response = await invoke({ path: '/patients', httpMethod: 'GET' });

        expect(response.statusCode).toBe(500);
        const parsed = JSON.parse(response.body);
        expect(parsed.message).toBe('Internal Server Error');
        expect(parsed.error).toBe('DB connection failed');
    });
});

