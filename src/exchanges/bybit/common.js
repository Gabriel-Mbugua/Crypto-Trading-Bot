import crypto from "crypto";
import queryString from "node:querystring";

import { config } from "../../config.js";
import { commonUtils } from "../../utils/index.js";

const receiveWindow = 10_000;

export const configDetails = (sandbox = true) => {
    const baseUrl = sandbox ? config.bybit.demoBaseUrl : config.bybit.prodBaseUrl;
    const apiKey = sandbox ? config.bybit.demoApiKey : config.bybit.prodApiKey;
    const apiSecret = sandbox ? config.bybit.demoApiSecret : config.bybit.prodApiSecret;

    return {
        baseUrl,
        apiKey,
        apiSecret,
    };
};

export const generateSignature = ({ data, timestamp, apiSecret, sandbox = true, apiKey, method = "GET" }) => {
    const cleanData = commonUtils.cleanAndSortData(data);

    const stringifiedData = method === "POST" ? JSON.stringify(cleanData) : queryString.stringify(cleanData);

    const signaturePayload = `${timestamp}${apiKey}${receiveWindow}${stringifiedData}`;

    console.log(`signaturePayload: ${signaturePayload}`);

    const signature = crypto.createHmac("sha256", apiSecret).update(signaturePayload).digest("hex");

    return signature;
};

export const generateHeaders = ({ signature, timestamp, apiKey }) => {
    return {
        "cdn-request-id": commonUtils.generateUniqueId(),
        "x-bapi-api-key": apiKey,
        "x-bapi-timestamp": timestamp, // UTC timestamp in milliseconds
        "x-bapi-sign": signature, // signature derived from the request's parameters
        "x-bapi-recv-window": receiveWindow, // specify how long an HTTP request is valid.
        "Content-Type": "application/json",
    };
};
