import { SupabaseClient } from '../utils/supabase-client.js';
import { randomUUID } from 'crypto';

export class FileService {
    constructor() {
        this.supabase = new SupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    }

    async getPatientFiles(patientId) {
        // Verify patient exists
        const patients = await this.supabase.select('patients', { filters: { id: patientId } });
        if (!patients || patients.length === 0) {
            return { success: false, message: 'Patient not found', statusCode: 404 };
        }

        const files = await this.supabase.select('files', {
            filters: { patient_id: patientId },
            order: 'uploaded_at.desc'
        });

        return {
            success: true,
            count: files.length,
            data: files
        };
    }

    async getFileById(fileId) {
        const files = await this.supabase.select('files', { filters: { id: fileId } });
        if (!files || files.length === 0) {
            return { success: false, message: 'File not found', statusCode: 404 };
        }

        return {
            success: true,
            data: files[0]
        };
    }

    async addFile(patientId, data) {
        if (!data.file_name || !data.storage_url) {
            return { success: false, message: 'file_name and storage_url are required', statusCode: 400 };
        }

        // Verify patient exists
        const patients = await this.supabase.select('patients', { filters: { id: patientId } });
        if (!patients || patients.length === 0) {
            return { success: false, message: 'Patient not found', statusCode: 404 };
        }

        const newFile = {
            id: randomUUID(),
            patient_id: patientId,
            file_name: data.file_name,
            file_type: data.file_type || 'unknown',
            storage_url: data.storage_url,
            uploaded_at: new Date().toISOString()
        };

        await this.supabase.insert('files', newFile);

        return {
            success: true,
            message: 'File added successfully',
            data: newFile,
            statusCode: 201
        };
    }

    async deleteFile(fileId) {
        // Note: SupabaseClient currently only supports insert/select.
        // Deletion would require extending the client.
        // For now, we will return a 501 Not Implemented or mock success if we can't delete.
        // Ideally, we'd add a delete method to SupabaseClient.

        return {
            success: false,
            message: 'Delete operation not yet supported by SupabaseClient',
            statusCode: 501
        };
    }
}
