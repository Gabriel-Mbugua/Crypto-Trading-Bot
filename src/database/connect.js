import pg from "pg";
import { config } from "../config.js";

const { Client } = pg;

const client = new Client({
    connectionString: config.database.connectionString,
    ssl: {
        // WARNING: this skips verifying the server's cert.
        // In production you should provide a CA and set rejectUnauthorized: true
        rejectUnauthorized: false
    }
});

export default client;
