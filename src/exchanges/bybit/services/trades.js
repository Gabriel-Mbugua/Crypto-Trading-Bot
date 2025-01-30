import axios from "axios";

import { configDetails, generateHeaders, generateSignature } from "./common.js";
import { commonUtils } from "../../../utils/index.js";

export const processOrder = async (alertMessage) => {
    try {
        const data = JSON.parse(alertMessage);

        // Map the TradingView alert data to your placeOrder parameters
        const request = {
            category: data.inverse === "1" ? "inverse" : "linear",
            symbol: data.coin_pair,
            side: data.action.toUpperCase(),
            orderType: "Market", // You can modify this based on your needs
            qty: data.qty,
            // Add other parameters as needed
            takeProfit: null, // You can calculate this based on your strategy
            stopLoss: null, // You can calculate this based on your strategy
        };

        // Place the order
        const result = await placeOrder({
            ...request,
            isLeverage: 1, // Set according to your needs
            timeInForce: "GTC",
            positionIdx: 0, // One-way position
            sandbox: true, // Set to false for live trading
        });

        console.log("Order placed successfully:", result);
        return result;
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};

const placeOrder = async ({
    // Required parameters
    category = "linear", // Product type (linear, inverse, spot, option)
    symbol, // Trading pair, e.g., "BTCUSDT"
    side, // "Buy" or "Sell"
    orderType, // "Market" or "Limit"
    qty, // Order quantity as string

    // Optional parameters with common defaults
    isLeverage = 0, // For spot trading: 0=spot, 1=margin
    price, // Required for Limit orders
    timeInForce = "GTC", // Default to Good Till Cancel
    positionIdx = 0, // 0=one-way, 1=hedge-buy, 2=hedge-sell
    orderLinkId = undefined, // Custom order ID

    // Take profit / Stop loss parameters
    takeProfit, // Take profit price
    stopLoss, // Stop loss price
    tpTriggerBy = "LastPrice", // Trigger price type for TP
    slTriggerBy = "LastPrice", // Trigger price type for SL
    tpslMode = "Full", // "Full" or "Partial"
    tpLimitPrice, // Limit price for TP
    slLimitPrice, // Limit price for SL
    tpOrderType = "Market", // "Market" or "Limit"
    slOrderType = "Market", // "Market" or "Limit"

    // Additional parameters
    reduceOnly = false, // Position can only be reduced
    closeOnTrigger = false, // Close position regardless of available margin

    // API configuration
    sandbox = true,
}) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);
        const url = `${baseUrl}/v5/order/create`;
        const method = "POST";

        const timestamp = Date.now();

        const orderParams = {
            category,
            symbol,
            side,
            orderType,
            qty: qty.toString(),
            isLeverage: isLeverage ? 1 : 0,
            price: price?.toString(),
            timeInForce,
            positionIdx,
            orderLinkId,
            takeProfit: takeProfit?.toString(),
            stopLoss: stopLoss?.toString(),
            tpTriggerBy,
            slTriggerBy,
            tpslMode,
            tpLimitPrice: tpLimitPrice?.toString(),
            slLimitPrice: slLimitPrice?.toString(),
            tpOrderType,
            slOrderType,
            reduceOnly,
            closeOnTrigger,
        };

        console.log("Request Parameters:", JSON.stringify(orderParams, null, 2));

        const cleanOrderParams = commonUtils.cleanAndSortData(orderParams);

        const signature = generateSignature({
            data: cleanOrderParams,
            timestamp,
            apiSecret,
            apiKey,
            sandbox,
            method,
        });
        const headers = generateHeaders({ sandbox, signature, timestamp, apiKey });

        const options = {
            method,
            headers,
            url,
            data: cleanOrderParams,
        };

        const response = await axios(options);

        if (response.data.retCode !== 0) throw new Error(response.data.retMsg);

        return {
            success: true,
            data: response.data.result,
            orderId: response.data.result.orderId,
            orderLinkId: response.data.result.orderLinkId,
        };
    } catch (err) {
        if (err.response) {
            console.error("API Error:", err.response.data);
            throw new Error(`Bybit API Error: ${err.response.data.retMsg || err.message}`);
        }

        if (err.request) {
            // Request made but no response received
            console.error("Network Error:", err.request);
            throw new Error("Network error: No response from Bybit API");
        }

        // Error in request setup
        console.error("Request Error:", err.message);
        throw err;
    }
};

const enterShort = {
    category: "linear",
    symbol: "SOLUSDT",
    side: "Sell",
    orderType: "Market",
    qty: "0.1",
    positionIdx: 0,
    timeInForce: "IOC",
};

const enterLong = {
    category: "linear",
    symbol: "SOLUSDT",
    side: "Buy",
    orderType: "Market",
    qty: "0.1",
    positionIdx: 0,
    timeInForce: "IOC",
};

const closeLongPosition = {
    category: "linear",
    symbol: "SOLUSDT",
    side: "Sell",
    orderType: "Market",
    qty: "0.1",
    positionIdx: 0,
    timeInForce: "IOC",
    reduceOnly: true,
};

const closeShortPosition = {
    category: "linear",
    symbol: "SOLUSDT",
    side: "Buy",
    orderType: "Market",
    qty: "0.1",
    positionIdx: 0,
    timeInForce: "IOC",
    reduceOnly: true,
};
// placeOrder(enterLong).then((res) => console.log(res));
// placeOrder(enterShort).then((res) => console.log(res));
// placeOrder(closeLongPosition).then((res) => console.log(res));
// placeOrder(closeShortPosition).then((res) => console.log(res));

export const cancelOrder = async ({ data, sandbox = true }) => {
    try {
        const { baseUrl } = configDetails(sandbox);
        const url = `${baseUrl}/v5/order/cancel`;

        const signature = generateSignature({ data, timeStamp, sandbox });
        const headers = generateHeaders({ sandbox, signature, timeStamp });

        const params = {
            category,
            symbol,
            orderId,
        };

        const options = {
            method: "POST",
            headers,
            url,
            params,
        };

        const response = await axios(options);

        if (response.data.retCode !== 0) throw new Error(response.data.retMsg);

        return {
            success: true,
            data: response.data.result,
        };
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};

export const getOpenClosedOrders = async ({ category = "linear", openOnly, symbol, sandbox = true }) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);

        const method = "GET";
        const url = `${baseUrl}/v5/order/realtime`;
        const timestamp = Date.now();

        const params = { category };

        if (symbol) params.symbol = symbol;
        if (openOnly) params.openOnly = openOnly;

        const cleanOrderParams = commonUtils.cleanAndSortData(params);

        const signature = generateSignature({
            data: cleanOrderParams,
            timestamp,
            sandbox,
            apiKey,
            apiSecret,
            method,
        });
        const headers = generateHeaders({ sandbox, signature, timestamp, apiKey });

        const options = {
            method,
            headers,
            url,
            params,
        };

        const response = await axios(options);

        if (response.data.retCode !== 0) throw new Error(response.data.retMsg);

        return {
            success: true,
            data: response.data.result,
        };
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};
