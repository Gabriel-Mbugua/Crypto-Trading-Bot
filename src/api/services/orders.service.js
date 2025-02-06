import { bybitTradesServices, bybitPositionServices, bybitWebsocketServices } from "../../exchanges/bybit/index.js";
import { telegramChatsServices } from "../../telegram/index.js";
import { sleep } from "../../utils/common.utils.js";
import { commonUtils } from "../../utils/index.js";

const orderQueues = new Map();

export const receiveOrder = async (data) => {
    try {
        console.info("L-ORDERS-5", JSON.stringify(data));

        const sandbox = data.sandbox === "true";

        data.symbol = data.symbol.replace(".P", "");
        data.sandbox = sandbox;

        if (data.side.toLowerCase() === "sell") data.side = "Sell";
        if (data.side.toLowerCase() === "buy") data.side = "Buy";

        if (!orderQueues.has(data.symbol)) {
            orderQueues.set(data.symbol, []);
        }
        const queue = orderQueues.get(data.symbol);

        // Add the processing function to the queue.  This is a *non-blocking* operation.
        queue.push(async () => {
            try {
                await telegramChatsServices.sendMessage({
                    message: {
                        title: `🔄 Order Received.`, // This message is now truly "received"
                        symbol: data.symbol,
                        side: data.side,
                        category: data.category,
                        orderType: data.orderType,
                        qty: data.qty,
                    },
                });
                await processOrder(data); // Await processOrder *within the queued function*
                //Success message is sent inside processOrder
            } catch (err) {
                //Handle errors and send messages from processOrder
                console.error("Error in queued processOrder:", err);
            } finally {
                // Remove this task from the queue and process the next one.
                queue.shift();
                if (queue.length > 0) {
                    queue[0](); // Immediately start the next task.
                }
            }
        });

        // If this is the only task in the queue, start it immediately.
        if (queue.length === 1) queue[0](); // This starts the processing *without* blocking receiveOrder.

        return {
            success: true,
            message: "Order received successfully",
        };
    } catch (err) {
        console.error(err?.response?.data || err.message);

        await telegramChatsServices.sendMessage({
            message: {
                title: `❌ Order Failed: Failed to place a new order.`,
                symbol: data.symbol,
                side: data.side,
                category: data.category,
                orderType: data.orderType,
                qty: data.qty,
                error: err,
            },
        });

        throw new Error(err.message);
    }
};

const processOrder = async (data) => {
    try {
        const sandbox = data.sandbox;

        if (data.qty === "0") {
            const closingSide = data.side === "Sell" ? "Buy" : "Sell";

            await bybitPositionServices.closePosition({
                category: data.category,
                symbol: data.symbol,
                side: closingSide,
                sandbox,
            });

            await telegramChatsServices.sendMessage({
                message: {
                    title: `✅ Position Closed: Successfully closed the position.`,
                    symbol: data.symbol,
                    side: closingSide,
                    category: data.category,
                    orderType: data.orderType,
                    qty: data.qty,
                },
            });

            return true;
        }

        const [positionsRef, pendingOrders] = await Promise.all([
            bybitPositionServices.getPositions({
                symbol: data.symbol,
                sandbox,
            }),
            bybitTradesServices.checkPendingOrders({
                symbol: data.symbol,
                sandbox,
            }),
        ]);

        const positions = positionsRef.data.list;

        console.info(`There are ${positions.length} positions currently open for ${data.symbol}`);

        if (pendingOrders) {
            console.info("Pending orders found. Ignoring the new order.");
            await telegramChatsServices.sendMessage({
                message: {
                    title: `🚫Ignored Order.: Pending orders found.`,
                },
            });
            return;
        }

        const sameSidePosition = positions.find(
            (position) =>
                position.side === data.side && Number(position.size) > 0 && ["Buy", "Sell"].includes(position.side)
        );
        const oppositeSidePosition = positions.find(
            (position) =>
                position.side !== data.side && Number(position.size) > 0 && ["Buy", "Sell"].includes(position.side)
        );

        if (sameSidePosition) {
            console.info("An active position already exists in the same direction. Ignoring the new order.");
            await telegramChatsServices.sendMessage({
                message: {
                    title: `🚫Ignored Order.: Active position in the same direction.`,
                    symbol: data.symbol,
                    side: data.side,
                    category: data.category,
                    orderType: data.orderType,
                    qty: data.qty,
                },
            });
            return { success: false, message: "Active position in the same direction" };
        }

        // Check if there's an active position in the opposite direction
        // if so, close it before placing the new order
        if (oppositeSidePosition) {
            console.info(
                "An active position exists in the opposite direction. Closing it before placing the new order."
            );

            const closingSide = oppositeSidePosition.side === "Sell" ? "Buy" : "Sell";

            const closePositionResult = await bybitPositionServices.closePosition({
                category: data.category,
                symbol: data.symbol,
                side: closingSide,
                sandbox,
            });

            const remainingPositions = positions.length - 1;

            await telegramChatsServices.sendMessage({
                message: {
                    title: `🟡 Closing Position: Current open positions: ${remainingPositions}`,
                    symbol: data.symbol,
                    side: oppositeSidePosition.side,
                    category: data.category,
                    orderType: data.orderType,
                    qty: data.qty,
                },
            });

            console.info("Position closed successfully:", closePositionResult);
            return true;
        }

        // Initialize WebSocket
        // await bybitWebsocketServices.initializeWebsocket(sandbox);

        // Wait for WebSocket to be ready
        // await bybitWebsocketServices.waitForWebsocketReady();

        // Place the order
        const result = await bybitTradesServices.placeTrade({
            category: data.category,
            symbol: data.symbol,
            side: data.side,
            orderType: data.orderType,
            qty: data.qty,
            sandbox,
        });

        await telegramChatsServices.sendMessage({
            message: {
                title: `✅ Order Placed: Successfully placed a new order.`,
                symbol: data.symbol,
                side: data.side,
                category: data.category,
                orderType: data.orderType,
                qty: data.qty,
            },
        });
        console.info("Order placed successfully:", result);

        return result;
    } catch (err) {
        console.error(err?.response?.data || err.message);

        await telegramChatsServices.sendMessage({
            message: {
                title: `❌ Order Failed: Failed to place a new order.`,
                symbol: data.symbol,
                side: data.side,
                category: data.category,
                orderType: data.orderType,
                qty: data.qty,
                error: err,
            },
        });

        return {
            success: false,
            message: err.message,
        };
    }
};

export const getOrders = async ({ openOnly = true, symbol = "SOLUSDT" }) => {
    try {
        const orders = await bybitTradesServices.getOpenClosedOrders({ openOnly, symbol, sandbox: true });

        return orders;
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};

// processOrder({
//     category: "linear",
//     symbol: "SOLUSDT",
//     postionSize: "0",
//     side: "Buy",
//     orderType: "Market",
//     qty: "0.4",
//     sandbox: true,
// }).then((res) => console.log(res));

// processOrder({
//     category: "linear",
//     symbol: "SOLUSDT",
//     side: "Buy",
//     orderType: "Market",
//     qty: "0.466",
//     sandbox: true,
// }).then((res) => console.log(res));

// receiveOrder({
//     category: "linear",
//     symbol: "SOLUSDT",
//     postionSize: "0",
//     side: "Buy",
//     orderType: "Market",
//     qty: "0.4",
//     sandbox: "true",
// }).then((res) => console.log(res));
