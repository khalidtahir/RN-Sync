import { SupabaseClient } from '../utils/supabase-client.js';

export class WebSocketService {
    constructor() {
        this.supabase = new SupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        this.tableName = process.env.TABLE_NAME || 'readings';
    }

    async handleConnect() {
        return { statusCode: 200, body: 'Connected.' };
    }

    async handleDisconnect() {
        return { statusCode: 200, body: 'Disconnected.' };
    }

    async handleIngest(body) {
        // Map to 'readings' table schema
        const record = {
            patient_id: body.patientId,
            metric: body.metric,
            value: body.value,
            unit: body.unit,
            timestamp: body.timestamp || new Date().toISOString()
        };

        // 1. Save to Supabase
        await this.supabase.insert('readings', record);

        // 2. Echo back
        return { statusCode: 200, body: `Data saved for patient: ${body.patientId}` };
    }
}
