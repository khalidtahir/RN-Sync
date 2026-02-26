/*
 * AWS Lambda REST API Handler for RN Sync
 */

import { ApiService } from '../services/api-service.js';
import { PatientService } from '../services/patient-service.js';
import { FileService } from '../services/file-service.js';

const apiService = new ApiService();
const patientService = new PatientService();
const fileService = new FileService();

export const handler = async (event) => {
    console.log('API Handler received event:', JSON.stringify(event, null, 2));

    // Normalize Event (Handle HTTP API v2 and REST API v1)
    const httpMethod = event.httpMethod || (event.requestContext?.http?.method);
    let path = event.path || event.rawPath;
    const queryStringParameters = event.queryStringParameters;
    const body = event.body;

    // Strip stage name from path if present (e.g., /rnsync/health -> /health)
    // This is a simple fix to handle the user's specific URL structure
    if (path.startsWith('/rnsync')) {
        path = path.replace('/rnsync', '');
    }
    // Ensure path starts with /
    if (!path.startsWith('/')) {
        path = '/' + path;
    }

    const parsedBody = body ? JSON.parse(body) : {};

    // CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
    };

    if (httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        let result = { statusCode: 404, body: { message: 'Not Found' } };

        // --- ROUTING LOGIC ---

        // 1. Health Check
        if (path === '/health' && httpMethod === 'GET') {
            const data = await apiService.getHealth();
            result = { statusCode: 200, body: data };
        }

        // 2. Patients
        else if (path === '/patients') {
            if (httpMethod === 'GET') {
                const response = await patientService.getAllPatients();
                result = { statusCode: response.statusCode || 200, body: response };
            } else if (httpMethod === 'POST') {
                const response = await patientService.createPatient(parsedBody);
                result = { statusCode: response.statusCode || 201, body: response };
            }
        }
        // /patients/{id}
        else if (path.match(/^\/patients\/[\w-]+$/)) {
            const id = path.split('/')[2];
            if (httpMethod === 'GET') {
                const response = await patientService.getPatientById(id);
                result = { statusCode: response.statusCode || 200, body: response };
            }
        }
        // /patients/{id}/history
        else if (path.match(/^\/patients\/[\w-]+\/history$/)) {
            const id = path.split('/')[2];
            if (httpMethod === 'GET') {
                const response = await patientService.getPatientHistory(id, queryStringParameters || {});
                result = { statusCode: response.statusCode || 200, body: response };
            }
        }
        // /patients/{id}/readings
        else if (path.match(/^\/patients\/[\w-]+\/readings$/)) {
            const id = path.split('/')[2];
            if (httpMethod === 'POST') {
                const response = await patientService.addReading(id, parsedBody);
                result = { statusCode: response.statusCode || 201, body: response };
            }
        }
        // /patients/{id}/files
        else if (path.match(/^\/patients\/[\w-]+\/files$/)) {
            const id = path.split('/')[2];
            if (httpMethod === 'GET') {
                const response = await fileService.getPatientFiles(id);
                result = { statusCode: response.statusCode || 200, body: response };
            } else if (httpMethod === 'POST') {
                const response = await fileService.addFile(id, parsedBody);
                result = { statusCode: response.statusCode || 201, body: response };
            }
        }
        // /files/{id}
        else if (path.match(/^\/files\/[\w-]+$/)) {
            const id = path.split('/')[2];
            if (httpMethod === 'GET') {
                const response = await fileService.getFileById(id);
                result = { statusCode: response.statusCode || 200, body: response };
            } else if (httpMethod === 'DELETE') {
                const response = await fileService.deleteFile(id);
                result = { statusCode: response.statusCode || 200, body: response };
            }
        }

        return {
            statusCode: result.statusCode,
            headers,
            body: JSON.stringify(result.body),
        };

    } catch (error) {
        console.error('API Handler Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
        };
    }
};
