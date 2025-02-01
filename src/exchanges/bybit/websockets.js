import websocket from "ws";
import crypto from "crypto";

import { configDetails } from "./common.js";
import { bybitPositionServices } from "./index.js";

let client;
let resolveWebsocketReady;
let websocketReady = new Promise((resolve) => {
    resolveWebsocketReady = resolve;
});

export const initializeWebsocket = async (sandbox = true) => {
    const { apiKey, apiSecret, websocketTradeUrl } = configDetails(sandbox);

    client = new websocket(websocketTradeUrl);

    client.on("open", () => {
        console.log("Authenticating trade websocket connection...");

        const expiresIn = Date.now() + 600 * 1000; // 10 minutes expiry in ms

        const signature = crypto.createHmac("sha256", apiSecret).update(`GET/realtime${expiresIn}`).digest("hex");

        const authMessage = {
            op: "auth",
            args: [apiKey, expiresIn, signature],
        };

        client.send(JSON.stringify(authMessage));
    });

    client.on("message", (message) => {
        console.log(`BYBIT-WEBSocket-29: ${message}`);
        const data = JSON.parse(message);

        // Handle authentication response
        if (data.op === "auth" && data.success) {
            const subscribeMessage = {
                op: "subscribe",
                args: ["order.linear"],
            };
            client.send(JSON.stringify(subscribeMessage));
        }

        // Handle subscription response
        if (data.op === "subscribe" && data.success) {
            console.log("Subscribed to order updates.");
            resolveWebsocketReady(); // Resolve the Promise when WebSocket is ready
        }

        if (
            data.topic === "order.linear" &&
            data.data[0].orderStatus === "Filled" &&
            data.data[0].rejectReason === "EC_NoError"
        ) {
            console.log("L-WEBSocket: Order filled...");
            bybitPositionServices.setTrailingStop({
                symbol: data.data[0].symbol,
                trailingStop: 20,
                sandbox,
            });
        }
    });

    client.on("close", () => {
        console.log("WebSocket connection closed.");
    });

    client.on("error", (err) => {
        console.error("WebSocket error:", err);
    });
};

export const waitForWebsocketReady = async () => {
    await websocketReady;
};
