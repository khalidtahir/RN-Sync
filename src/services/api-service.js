import { SupabaseClient } from '../utils/supabase-client.js';

export class ApiService {
    constructor() {
        this.supabase = new SupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        this.tableName = process.env.TABLE_NAME || 'readings';
    }

    async getHealth() {
        return { message: "API is healthy" };
    }

    async getHistory(deviceId, limit = 50) {
        const filters = deviceId ? { device_id: deviceId } : {};

        return await this.supabase.select(this.tableName, {
            order: 'timestamp.desc',
            limit: limit,
            filters: filters
        });
    }
}
