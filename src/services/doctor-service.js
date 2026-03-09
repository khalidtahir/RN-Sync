import { SupabaseClient } from '../utils/supabase-client.js';

export class DoctorService {
    constructor() {
        this.supabase = new SupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    }

    async upsertDoctor(email, name) {
        const doctors = await this.supabase.upsert('doctors', { email, name }, 'email');
        return doctors[0];
    }

    async getAllDoctors() {
        const doctors = await this.supabase.select('doctors', { order: 'name.asc' });

        return {
            success: true,
            count: doctors.length,
            data: doctors
        };
    }

    async getDoctorById(id) {
        const doctors = await this.supabase.select('doctors', { filters: { id: id } });
        if (!doctors || doctors.length === 0) {
            return { success: false, message: 'Doctor not found', statusCode: 404 };
        }

        return {
            success: true,
            data: doctors[0]
        };
    }
}
