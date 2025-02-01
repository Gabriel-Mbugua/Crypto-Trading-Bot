import { config } from "../config.js";

export const getConfigDetails = () => {
    return {
        baseUrl: config.telegram.baseUrl,
        botToken: config.telegram.botToken,
    };
};
