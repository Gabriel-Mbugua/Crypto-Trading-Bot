import express from "express";
import cors from "cors";
import helmet from "helmet";

import apiRouter from "./src/api/routes/index.js";
import { config } from "./src/config.js";
import axios from "axios";
import { redisConnection } from "./src/redis/index.js";
import { telegramChatsServices } from "./src/telegram/index.js";
import { loggerMiddleware } from "./src/middleware/index.js";
import { closeDb, initializeDb } from "./src/database/index.js";

const port = config.port;

const app = express();

app.use(cors({ origin: true }));

app.use(express.json({ limit: "1mb" }));

app.use(loggerMiddleware.createLogger());

app.use(helmet());

app.use("/api", apiRouter);

app.get("/", (req, res) => {
    res.json({ message: "Hello World" });
});

app.get("/ip", async (req, res) => {
    try {
        const response = await axios.get("https://api.ipify.org?format=json");
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

const startServer = async () => {
    try {
        await initializeDb();
        await redisConnection.createRedisClient();

        app.listen(port, "0.0.0.0", () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error(`[E-SERVER-101] Failed to start server:`, error);
        await telegramChatsServices.sendMessage({
            message: {
                title: `❌ Server Failed: Failed to start server.`,
                error: error.message,
            },
        });

        await closeDb();

        process.exit(1);
    }
};

startServer();
