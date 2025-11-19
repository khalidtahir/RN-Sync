import { SupabaseClient } from '../utils/supabase-client.js';

export class WebSocketService {
    constructor() {
        this.supabase = new SupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        this.tableName = process.env.TABLE_NAME || 'sensor_readings';
    }

    async handleConnect() {
        return { statusCode: 200, body: 'Connected.' };
    }

    async handleDisconnect() {
        return { statusCode: 200, body: 'Disconnected.' };
    }

    async handleIngest(body) {
        // 1. Save to Supabase
        await this.supabase.insert(this.tableName, body);

        // 2. Echo back (for now)
        return { statusCode: 200, body: `Echo from AWS: ${JSON.stringify(body.payload)}` };
    }
}
