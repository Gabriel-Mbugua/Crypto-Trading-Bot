import { Redis } from "ioredis";

import { config } from "../config.js";

config.redisConfig;

let redisClient;

export const createRedisClient = async () => {
    try {
        if (redisClient) return redisClient;

        redisClient = new Redis(config.redisConfig.connectionUrl);

        redisClient.on("connect", () => {
            console.log("Redis connected");
        });

        redisClient.on("error", (err) => {
            console.error("Redis connection error:", err);
        });

        redisClient.on("close", () => {
            console.log("Redis connection closed");
        });

        redisClient.on("reconnecting", () => {
            console.log("Redis reconnecting...");
        });

        redisClient.on("end", () => {
            console.log("Redis connection ended");
        });

        return redisClient;
    } catch (err) {
        console.error("REDIS-CONNECTION-101: Error connecting to Redis:", err);
        throw err;
    }
};

export const getRedisClient = async () => {
    if (!redisClient) await createRedisClient();

    return redisClient;
};
