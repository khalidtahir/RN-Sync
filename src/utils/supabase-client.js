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
            throw new Error("Missing Supabase configuration");
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

    /**
     * Upserts a row into a Supabase table, inserting if no conflict or merging if one exists.
     * @param {string} table - The table name.
     * @param {Object} data - The data to upsert.
     * @param {string} conflictColumn - The column to check for conflicts (e.g. 'email').
     * @returns {Promise<Array>} The upserted rows.
     */
    async upsert(table, data, conflictColumn) {
        if (!this.url || !this.key) {
            throw new Error("Missing Supabase configuration");
        }

        const response = await fetch(`${this.url}/rest/v1/${table}?on_conflict=${conflictColumn}`, {
            method: 'POST',
            headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${this.key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation,resolution=merge-duplicates'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Supabase error: ${response.status} ${text}`);
        }

        return await response.json();
    }

    /**
     * Updates rows in a Supabase table matching the given filters.
     * @param {string} table - The table name.
     * @param {Object} filters - Equality filters to identify rows (e.g. { id: '...' }).
     * @param {Object} data - The fields to update.
     * @returns {Promise<Array>} The updated rows.
     */
    async update(table, filters, data) {
        if (!this.url || !this.key) {
            throw new Error("Missing Supabase configuration");
        }

        const filterParams = Object.entries(filters)
            .map(([key, value]) => `${key}=eq.${value}`)
            .join('&');
        const queryUrl = `${this.url}/rest/v1/${table}?${filterParams}`;

        const response = await fetch(queryUrl, {
            method: 'PATCH',
            headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${this.key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Supabase error: ${response.status} ${text}`);
        }

        return await response.json();
    }
}
