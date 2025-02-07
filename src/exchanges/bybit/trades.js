import axios from "axios";

import { configDetails, generateHeaders, generateSignature } from "./common.js";
import { commonUtils } from "../../utils/index.js";
import { marketService } from "../../api/services/index.js";

export const placeTrade = async ({
    // Required parameters
    category = "linear", // Product type (linear, inverse, spot, option)
    symbol, // Trading pair, e.g., "BTCUSDT"
    side, // "Buy" or "Sell"
    orderType, // "Market" or "Limit"
    qty, // Order quantity as string

    // Optional parameters with common defaults
    isLeverage, // For spot trading: 0=spot, 1=margin
    timeInForce = "GTC", // Default to Good Till Cancel
    positionIdx = 0, // 0=one-way, 1=hedge-buy, 2=hedge-sell
    orderLinkId = undefined, // Custom order ID

    marketUnit, // quoteCoin or baseCoin e.g BTCUSDT (BTC = baseCoin, USDT = quoteCoin) only for spot trading

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

        const adjustedQty = await marketService.adjustQuantity({ desiredQty: qty, symbol });

        let formattedQty = adjustedQty.toString();

        if (reduceOnly) formattedQty = "0";

        const timestamp = Date.now();

        const orderParams = {
            category,
            symbol,
            side,
            orderType,
            qty: formattedQty,
            timeInForce,
            positionIdx,
            reduceOnly,
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

        console.log("BYBIT-TRADES-90:", JSON.stringify(response.data));

        return {
            success: true,
            data: response.data.result,
            orderId: response.data.result.orderId,
            orderLinkId: response.data.result.orderLinkId,
        };
    } catch (err) {
        if (err.response) {
            console.error("BYBIT-TRADES-101: API Error:", err.response.data);
            throw new Error(`Bybit API Error: ${err.response.data.retMsg || err.message}`);
        }

        if (err.request) {
            // Request made but no response received
            console.error("BYBIT-TRADES-107: Network Error:", err.request);
            throw new Error("Network error: No response from Bybit API");
        }

        // Error in request setup
        console.error("BYBIT-TRADES-106: Request Error:", err);
        throw err;
    }
};

const enterShort = {
    category: "linear",
    symbol: "SOLUSDT",
    side: "Sell",
    orderType: "Market",
    qty: "0.1",
};

const enterLong = {
    category: "linear",
    symbol: "SOLUSDT",
    side: "Buy",
    orderType: "Market",
    qty: "0.1",
};

const closeLongPosition = {
    category: "linear",
    symbol: "SOLUSDT",
    side: "Sell",
    orderType: "Market",
    qty: "0",
    reduceOnly: true,
};

const closeShortPosition = {
    category: "linear",
    symbol: "SOLUSDT",
    side: "Buy",
    orderType: "Market",
    qty: "0",
    reduceOnly: true,
};
// placeOrder(enterLong).then((res) => console.log(res));
// placeOrder(enterShort).then((res) => console.log(res));
// placeOrder(closeLongPosition).then((res) => console.log(res));
// placeOrder(closeShortPosition).then((res) => console.log(res));

export const cancelOrder = async ({ category = "linear", symbol, orderId, sandbox = true }) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);
        const url = `${baseUrl}/v5/order/cancel`;
        const method = "POST";

        const timestamp = Date.now();

        const params = {
            category,
            symbol,
            orderId,
        };

        const signature = generateSignature({
            data: params,
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
            data: params,
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
// cancelOrder({
//     orderId: "c1da1ae1-79c5-4a0d-8b8a-7527948cfda2",
//     symbol: "SOLUSDT",
//     sandbox: true,
// }).then((res) => console.log(res));

export const getOpenClosedOrders = async ({
    category = "linear",
    orderId,
    openOnly,
    baseCoin,
    symbol,
    sandbox = true,
}) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);

        const method = "GET";
        const url = `${baseUrl}/v5/order/realtime`;
        const timestamp = Date.now();

        const params = { category };

        if (symbol) params.symbol = symbol;
        if (orderId) params.orderId = orderId;
        if (openOnly) params.openOnly = openOnly;
        if (baseCoin) params.baseCoin = baseCoin;

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
// getOpenClosedOrders({ orderId: "44b4ba33-596e-4659-982f-667afd40f94a" }).then((res) =>
// console.log(JSON.stringify(res))
// );
// getOpenClosedOrders({ symbol: "SOLUSDT", sandbox: false }).then((res) => console.log(JSON.stringify(res)));

export const getOrder = async ({ orderId, symbol, side, sandbox = true }) => {
    try {
        if (!orderId && (!symbol || !side)) throw new Error("Order ID or symbol and side are required");

        const ordersRef = await getOpenClosedOrders({ symbol, side, sandbox });

        if (!ordersRef.success) return null;

        const orders = ordersRef.data.list;

        let order;

        if (orderId) order = orders.find((order) => order.orderId === orderId);

        if (!order) order = orders.find((order) => order.symbol === symbol && order.side === side);

        return order;
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};
// getOrder({ symbol: "SOLUSDT", side: "Buy" }).then((res) => console.log(res));
// getOrder({ orderId: "c1da1ae1-79c5-4a0d-8b8a-7527948cfda2", symbol: "SOLUSDT" }).then((res) => console.log(res));

export const cancelAllOrders = async ({ category = "linear", symbol, sandbox = true }) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);
        const url = `${baseUrl}/v5/order/cancel-all`;
        const method = "POST";

        const timestamp = Date.now();

        const params = {
            category,
            symbol,
        };

        const signature = generateSignature({
            data: params,
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
            data: params,
        };

        const response = await axios(options);

        if (response.data.retCode !== 0) throw new Error(response.data.retMsg);

        return response.data;
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};
// cancelAllOrders({ symbol: "SOLUSDT", sandbox: true }).then((res) => console.log(res));

export const checkPendingOrders = async ({ symbol, sandbox = true }) => {
    const ordersRef = await getOpenClosedOrders({
        symbol,
        sandbox,
    });

    const orders = ordersRef.data.list;

    if (!orders) return false;

    const pendingOrders = orders.filter(
        (order) => order.status === "Created" || order.status === "New" || order.status === "Processing"
    );

    return pendingOrders.length > 0;
};
// checkPendingOrders({ symbol: "SOLUSDT", sandbox: false }).then((res) => console.log(res));

export const getTradeHistory = async ({ category = "linear", orderId, symbol, sandbox = true }) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);

        const method = "GET";
        const url = `${baseUrl}/v5/execution/list`;
        const timestamp = Date.now();

        const params = { category };

        if (symbol) params.symbol = symbol;
        if (orderId) params.orderId = orderId;

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
    } catch (error) {
        console.error(error?.response?.data || error.message);
        throw new Error(error.message);
    }
};
// getTradeHistory({ orderId: "44b4ba33-596e-4659-982f-667afd40f94a" }).then((res) => console.log(res));
