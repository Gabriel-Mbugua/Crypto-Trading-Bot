import { config } from "../config.js";

export const getConfigDetails = () => {
    return {
        baseUrl: config.telegram.baseUrl,
        botToken: config.telegram.botToken,
    };
};

export const handleError = (err) => {
    let errorMessage = err.message

    if (err?.response?.data?.message) errorMessage = err.response.data.message

    return {
        success: false,
        data: errorMessage
    }
}