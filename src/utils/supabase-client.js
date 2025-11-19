/**
 * Supabase Client Utility
 * Wraps fetch calls to Supabase for easier testing and reuse.
 */
export class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
    }

    /**
     * Inserts data into a Supabase table.
     * @param {string} table - The table name.
     * @param {Object} data - The data to insert.
     * @returns {Promise<void>}
     */
    async insert(table, data) {
        if (!this.url || !this.key) {
            console.warn("Supabase credentials not set. Skipping DB save.");
            return;
        }

        const response = await fetch(`${this.url}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${this.key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Supabase error: ${response.status} ${text}`);
        }
    }

    /**
     * Selects data from a Supabase table.
     * @param {string} table - The table name.
     * @param {Object} params - Query parameters (select, order, limit, filters).
     * @returns {Promise<Array>}
     */
    async select(table, params = {}) {
        if (!this.url || !this.key) {
            throw new Error("Missing Supabase configuration");
        }

        let queryUrl = `${this.url}/rest/v1/${table}?select=*`;

        if (params.order) queryUrl += `&order=${params.order}`;
        if (params.limit) queryUrl += `&limit=${params.limit}`;

        // Handle simple equality filters
        if (params.filters) {
            for (const [key, value] of Object.entries(params.filters)) {
                queryUrl += `&${key}=eq.${value}`;
            }
        }

        const response = await fetch(queryUrl, {
            method: 'GET',
            headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${this.key}`
            }
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Supabase error: ${response.status} ${text}`);
        }

        return await response.json();
    }
}
