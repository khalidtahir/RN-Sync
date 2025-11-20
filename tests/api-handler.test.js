import { jest } from '@jest/globals';

const mockGetHealth = jest.fn();
const mockGetAllPatients = jest.fn();
const mockCreatePatient = jest.fn();
const mockGetPatientById = jest.fn();
const mockGetPatientHistory = jest.fn();
const mockAddReading = jest.fn();
const mockGetPatientFiles = jest.fn();
const mockAddFile = jest.fn();
const mockGetFileById = jest.fn();
const mockDeleteFile = jest.fn();

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

const { handler } = await import('../src/handlers/api-handler.js');

const baseEvent = {
    httpMethod: 'GET',
    path: '/health',
    queryStringParameters: null,
    body: null
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
});

