import { SupabaseClient } from '../utils/supabase-client.js';
import { randomUUID } from 'crypto';

export class PatientService {
    constructor() {
        this.supabase = new SupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    }

    async getAllPatients() {
        // Fetch all patients
        const patients = await this.supabase.select('patients', { order: 'created_at.desc' });

        // Enhancement: In a real app, we'd want to join with readings to get latest vitals.
        // For now, we return the patient list. The frontend can fetch details individually.
        return {
            success: true,
            count: patients.length,
            data: patients
        };
    }

    async getPatientById(id) {
        const patients = await this.supabase.select('patients', { filters: { id: id } });
        if (!patients || patients.length === 0) {
            return { success: false, message: 'Patient not found', statusCode: 404 };
        }
        const patient = patients[0];

        // Fetch latest readings (limit 10 for snapshot)
        const readings = await this.supabase.select('readings', {
            filters: { patient_id: id },
            order: 'timestamp.desc',
            limit: 10
        });

        return {
            success: true,
            data: {
                ...patient,
                latest_readings: readings
            }
        };
    }

    async createPatient(data) {
        if (!data.name || !data.bed) {
            return { success: false, message: 'Name and bed are required', statusCode: 400 };
        }

        const newPatient = {
            id: randomUUID(),
            name: data.name,
            bed: data.bed,
            created_at: new Date().toISOString()
        };

        await this.supabase.insert('patients', newPatient);

        return {
            success: true,
            message: 'Patient created successfully',
            data: newPatient,
            statusCode: 201
        };
    }

    async getPatientHistory(id, filters = {}) {
        // Verify patient exists
        const patients = await this.supabase.select('patients', { filters: { id: id } });
        if (!patients || patients.length === 0) {
            return { success: false, message: 'Patient not found', statusCode: 404 };
        }

        // Construct filters for readings
        const readingFilters = { patient_id: id };
        // Note: Our simple SupabaseClient only supports equality filters for now.
        // Date ranges would require extending SupabaseClient, but for now we return all and let client filter or add simple metric filter.
        if (filters.metric) {
            readingFilters.metric = filters.metric;
        }

        const readings = await this.supabase.select('readings', {
            filters: readingFilters,
            order: 'timestamp.desc',
            limit: 100 // Reasonable limit
        });

        return {
            success: true,
            count: readings.length,
            data: readings
        };
    }

    async updatePatient(id, data) {
        const patients = await this.supabase.select('patients', { filters: { id: id } });
        if (!patients || patients.length === 0) {
            return { success: false, message: 'Patient not found', statusCode: 404 };
        }

        const allowedFields = ['name', 'bed', 'doctor_id'];
        const updateData = {};
        for (const field of allowedFields) {
            if (field in data) {
                updateData[field] = data[field];
            }
        }

        // Allow doctor lookup by email as an alternative to UUID.
        // Auto-creates the doctor record on first use so the frontend never needs to pre-seed the DB.
        if ('doctor_email' in data) {
            if (data.doctor_email === null) {
                updateData.doctor_id = null;
            } else {
                let byEmail = await this.supabase.select('doctors', { filters: { email: data.doctor_email } });
                if (!byEmail || byEmail.length === 0) {
                    const newDoctor = { id: randomUUID(), email: data.doctor_email, name: data.doctor_email };
                    await this.supabase.insert('doctors', newDoctor);
                    byEmail = [newDoctor];
                }
                updateData.doctor_id = byEmail[0].id;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return { success: false, message: 'No valid fields to update. Allowed: name, bed, doctor_id, doctor_email', statusCode: 400 };
        }

        // If assigning a doctor by UUID, verify that doctor exists
        if (updateData.doctor_id !== undefined && updateData.doctor_id !== null && !('doctor_email' in data)) {
            const doctors = await this.supabase.select('doctors', { filters: { id: updateData.doctor_id } });
            if (!doctors || doctors.length === 0) {
                return { success: false, message: 'Doctor not found', statusCode: 404 };
            }
        }

        const updated = await this.supabase.update('patients', { id: id }, updateData);

        return {
            success: true,
            message: 'Patient updated successfully',
            data: updated[0]
        };
    }

    async addReading(id, data) {
        if (!data.metric || data.value === undefined) {
            return { success: false, message: 'Metric and value are required', statusCode: 400 };
        }

        // Verify patient exists
        const patients = await this.supabase.select('patients', { filters: { id: id } });
        if (!patients || patients.length === 0) {
            return { success: false, message: 'Patient not found', statusCode: 404 };
        }

        const newReading = {
            id: randomUUID(),
            patient_id: id,
            metric: data.metric,
            value: data.value,
            unit: data.unit || '',
            timestamp: new Date().toISOString()
        };

        await this.supabase.insert('readings', newReading);

        return {
            success: true,
            message: 'Reading added successfully',
            data: newReading,
            statusCode: 201
        };
    }
}
