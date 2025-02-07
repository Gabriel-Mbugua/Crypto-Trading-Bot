import { config } from "../config.js";
import { getRedisClient } from "./connection.js";

const { defaultExpirationInSeconds } = config.redisConfig;

export const setKey = async ({ key, data, expiration = defaultExpirationInSeconds }) => {
    try {
        const redisClient = await getRedisClient();

        await redisClient.setex(key, expiration, JSON.stringify(data));
    } catch (err) {
        console.error(`[E-REDIS-FN-12] Failed to cache data in Redis for key ${key}:`, err);
    }
};

export const getKey = async (key) => {
    try {
        const redisClient = await getRedisClient();

        const cachedData = await redisClient.get(key);
        if (cachedData) return { success: true, data: JSON.parse(cachedData) };
        return { success: false, data: null };
    } catch (err) {
        console.error(`[E-REDIS-FN-16] Failed to fetch data from Redis for key ${key}:`, err);
        return { success: false, data: err.message };
    }
};

export const setIfNotExists = async ({ key, data, expiration = defaultExpirationInSeconds }) => {
    try {
        const redisClient = await getRedisClient();

        const result = await redisClient.set(key, JSON.stringify(data), "EX", expiration, "NX");
        return result === "OK";
    } catch (err) {
        console.error(`[E-REDIS-FN-36] Failed to set data in Redis for key ${key}:`, err);
    }
};

export const setLock = async ({ lockKey, lockPeriod = defaultExpirationInSeconds }) => {
    try {
        const redisClient = await getRedisClient();

        const result = await redisClient.set(lockKey, "locked", "NX", "EX", lockPeriod);
        return result === "OK";
    } catch (err) {
        console.error(`[E-REDIS-FN-47] Failed to set lock in Redis for key ${lockKey}:`, err);
        return false;
    }
};

export const deleteLock = async (lockKey) => {
    try {
        const redisClient = await getRedisClient();

        const result = await redisClient.del(lockKey);
        return result === 1;
    } catch (err) {
        console.error(`[E-REDIS-FN-58] Failed to delete lock in Redis for key ${lockKey}:`, err);
        return false;
    }
};
