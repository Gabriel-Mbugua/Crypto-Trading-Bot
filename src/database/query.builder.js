import { default as client } from "./connect.js";

/**
 * A reusable query builder and executor
 */
class Query {
    /**
     * Execute a simple query with parameters
     * @param {string} text - SQL query text
     * @param {Array} params - Query parameters
     * @returns {Promise} - Query result
     */
    static async execute(text, params = []) {
        return client.query(text, params);
    }

    /**
     * Find records by criteria
     * @param {Object} options - Options object
     * @param {string} options.table - Table name
     * @param {Object} options.criteria - Where conditions (field: value)
     * @param {string} options.orderBy - Order by clause
     * @param {number} options.limit - Maximum records to return
     * @param {number} options.offset - Records to skip
     * @returns {Promise} - Query result
     */
    static async find({ table, criteria = {}, orderBy = "", limit = 100, offset = 0 }) {
        const keys = Object.keys(criteria);
        const values = Object.values(criteria);

        let query = `SELECT * FROM ${table}`;

        // Add WHERE clause if criteria exists
        if (keys.length > 0) {
            const conditions = keys.map((key, index) => `${key} = $${index + 1}`).join(" AND ");
            query += ` WHERE ${conditions}`;
        }

        // Add ORDER BY if provided
        if (orderBy) {
            query += ` ORDER BY ${orderBy}`;
        }

        // Add LIMIT and OFFSET
        query += ` LIMIT ${limit} OFFSET ${offset}`;

        return this.execute(query, values);
    }

    /**
     * Find a single record by ID
     * @param {Object} options - Options object
     * @param {string} options.table - Table name
     * @param {number|string} options.id - Record ID
     * @param {string} options.idField - ID field name (default: 'id')
     * @returns {Promise} - Query result
     */
    static async findById({ table, id, idField = "id" }) {
        const query = `SELECT * FROM ${table} WHERE ${idField} = $1 LIMIT 1`;
        const result = await this.execute(query, [id]);
        return result.rows[0];
    }

    /**
     * Insert a record
     * @param {Object} options - Options object
     * @param {string} options.table - Table name
     * @param {Object} options.data - Data to insert
     * @returns {Promise} - Query result with inserted row
     */
    static async insert({ table, data, id }) {
        try {
            let keys = Object.keys(data);
            let values = Object.values(data);

            if (id) {
                keys = ["id", ...keys];
                values = [id, ...values];
            }

            const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
            const columns = keys.join(", ");

            const query = `
        INSERT INTO ${table} (${columns})
        VALUES (${placeholders})
        RETURNING *
        `;

            return this.execute(query, values);
        } catch (err) {
            console.error(`[E-DB-101] Failed to insert record:`, err?.response?.data || err.message);
            console.error(JSON.stringify(data));
            throw err;
        }
    }

    /**
     * Update a record
     * @param {Object} options - Options object
     * @param {string} options.table - Table name
     * @param {number|string} options.id - Record ID
     * @param {Object} options.data - Data to update
     * @param {string} options.idField - ID field name (default: 'id')
     * @returns {Promise} - Query result with updated row
     */
    static async update({ table, id, data, idField = "id" }) {
        const keys = Object.keys(data);
        const values = Object.values(data);

        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
        const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${idField} = $${keys.length + 1}
      RETURNING *
    `;

        return this.execute(query, [...values, id]);
    }

    /**
     * Delete a record
     * @param {Object} options - Options object
     * @param {string} options.table - Table name
     * @param {number|string} options.id - Record ID
     * @param {string} options.idField - ID field name (default: 'id')
     * @returns {Promise} - Query result
     */
    static async delete({ table, id, idField = "id" }) {
        const query = `DELETE FROM ${table} WHERE ${idField} = $1 RETURNING *`;
        return this.execute(query, [id]);
    }

    /**
     * Execute a transaction with multiple queries
     * @param {Function} callback - Transaction callback
     * @returns {Promise} - Transaction result
     */
    static async transaction(callback) {
        const client = await client.connect();

        try {
            await client.query("BEGIN");
            const result = await callback(client);
            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Execute raw SQL with parameters
     * @param {Object} options - Options object
     * @param {string} options.sql - Raw SQL query
     * @param {Array} options.params - Query parameters
     * @returns {Promise} - Query result
     */
    static async raw({ sql, params = [] }) {
        return this.execute(sql, params);
    }
}

export default Query;
