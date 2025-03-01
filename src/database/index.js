import { default as client } from "./connect.js";
import Query from "./query.builder.js";

export const initializeDb = async () => {
    try {
        // Test the connection with a simple query
        await client.connect();
        const result = await client.query("SELECT NOW() as current_time");
        console.log(`Database initialized successfully at ${result.rows[0].current_time}`);
        return true;
    } catch (error) {
        console.error("Failed to initialize database:", error);
        throw error;
    }
};

export const closeDb = async () => {
    try {
        await client.end();
        console.log("Database connection closed");
        return true;
    } catch (error) {
        console.error("Error closing database connection:", error);
        throw error;
    }
};

export { Query };
