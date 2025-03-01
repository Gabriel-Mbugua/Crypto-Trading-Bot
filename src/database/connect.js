import pg from "pg";
import { config } from "../config.js";

const { Client } = pg;

const client = new Client({
    connectionString: config.database.connectionString,
});

export default client;
