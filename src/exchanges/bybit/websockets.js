import websocket from "ws";
import crypto from "crypto";

import { configDetails } from "./common.js";
import { bybitPositionServices } from "./index.js";
import { config } from "../../config.js";
import { telegramChatsServices } from "../../telegram/index.js";

let client;
let resolveWebsocketReady;
let websocketReady = new Promise((resolve) => {
    resolveWebsocketReady = resolve;
});

export const initializeWebsocket = async (sandbox = true) => {
    try {
        const { apiKey, apiSecret, websocketTradeUrl } = configDetails(sandbox);

        console.info(`BYBIT- WEBSocket-18: Initializing websocket connection... ${websocketTradeUrl}`);

        client = new websocket(websocketTradeUrl);

        console.info(`BYBIT- WEBSocket-20: Websocket connection initialized... ${client}`);

        client.on("open", () => {
            console.info("Authenticating trade websocket connection...");

            const expiresIn = Date.now() + 600 * 1000; // 10 minutes expiry in ms

            const signature = crypto.createHmac("sha256", apiSecret).update(`GET/realtime${expiresIn}`).digest("hex");

            const authMessage = {
                op: "auth",
                args: [apiKey, expiresIn, signature],
            };

            client.send(JSON.stringify(authMessage));
        });

        client.on("message", async (message) => {
            console.info(`BYBIT-WEBSocket-29: ${message}`);
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
                console.info("Subscribed to order updates.");
                resolveWebsocketReady(); // Resolve the Promise when WebSocket is ready
            }

            if (data.topic === "order.linear") {
                console.info("BYBIT-WEBSocket-40: Order update received...", JSON.stringify(data));
                const orderStatus = data.data[0].orderStatus;
                const rejectReason = data.data[0].rejectReason;

                if (["Filled", "Cancelled"].includes(orderStatus)) {
                    await telegramChatsServices.sendMessage({
                        message: {
                            title: `🟠 Order ${orderStatus}: ${data.data[0].symbol}`,
                            symbol: data.data[0].symbol,
                            rejectReason,
                        },
                    });
                }

                if (data.data[0].orderStatus === "Filled" && data.data[0].rejectReason === "EC_NoError") {
                    console.info("BYBIT-WEBSocket-57: Order filled...");

                    const positionsRef = await bybitPositionServices.getPositions({
                        symbol: data.data[0].symbol,
                        sandbox,
                    });

                    const positions = positionsRef.data.list.find(
                        (position) => ["Buy", "Sell"].includes(position.side) && Number(position.size) > 0
                    );

                    if (positions.length > 0) {
                        bybitPositionServices.setTrailingStop({
                            symbol: data.data[0].symbol,
                            trailingStop: config.strategyConfigs.trailingStop,
                            sandbox,
                        });

                        await telegramChatsServices.sendMessage({
                            message: {
                                title: `🟢 Set trailing stop: ${config.strategyConfigs.trailingStop}%`,
                                symbol: data.data[0].symbol,
                            },
                        });
                        console.info("BYBIT-WEBSocket-60: Trailing stop set...");
                    }
                }
            }
        });

        client.on("close", () => {
            console.error("BYBIT-WEBSocket-105: WebSocket connection closed.");
        });

        client.on("error", async (err) => {
            await telegramChatsServices.sendMessage({
                message: {
                    title: `🛑 Error in websocket connection`,
                    message: err.message,
                },
            });

            console.error("BYBIT-WEBSocket-109: Detailed error:", {
                message: err.message,
                code: err.code,
                statusCode: err.statusCode,
                headers: err.headers,
                readyState: client.readyState,
                url: websocketTradeUrl,
            });
        });
    } catch (err) {
        console.error(err);
        throw err;
    }
};
// initializeWebsocket();

export const waitForWebsocketReady = async () => {
    await websocketReady;
};
