import { config } from "../../config.js";
import {
    bybitTradesServices,
    bybitPositionServices,
    bybitWebsocketServices,
    bybitAccountsServices,
    bybitMarketServices,
} from "../../exchanges/bybit/index.js";
import { redisFunctions } from "../../redis/index.js";
import { telegramChatsServices } from "../../telegram/index.js";

export const receiveOrder = async (data) => {
    try {
        console.info("L-ORDERS-5", JSON.stringify(data));

        const setLock = await redisFunctions.setLock({
            lockKey: `${data.symbol.toLowerCase()}-${data.side.toLowerCase()}`,
            lockPeriod: 10,
        });

        if (!setLock) return { success: true, message: "Order is already being processed" };

        const sandbox = config.nodeEnv === "development";

        data.symbol = data.symbol.replace(".P", "");
        data.sandbox = sandbox;

        if (data.side.toLowerCase() === "sell") data.side = "Sell";
        if (data.side.toLowerCase() === "buy") data.side = "Buy";

        const environment = sandbox ? "Sandbox" : "Production";

        await telegramChatsServices.sendMessage({
            message: {
                title: `🔄 ${environment} Order Received.`, // This message is now truly "received"
                symbol: data.symbol,
                side: data.side,
                category: data.category,
                orderType: data.orderType,
                qty: data.qty,
            },
        });

        processOrder(data);

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

// receiveOrder({
//     category: "linear",
//     symbol: "SOLUSDT",
//     side: "Buy",
//     orderType: "Market",
//     qty: "0.4",
//     sandbox: true,
// }).then((res) => console.log(res));
// receiveOrder({
//     category: "linear",
//     symbol: "SOLUSDT",
//     side: "Buy",
//     orderType: "Market",
//     qty: "0.4",
//     sandbox: true,
// }).then((res) => console.log(res));

const processOrder = async (data) => {
    try {
        const startTime = Date.now();
        const executionTmeInSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
        const sandbox = data.sandbox;

        const [positionsRef, pendingOrders, balanceInfo, ticker, liquidation] = await Promise.all([
            bybitPositionServices.getPositions({
                symbol: data.symbol,
                sandbox,
            }),
            bybitTradesServices.checkPendingOrders({
                symbol: data.symbol,
                sandbox,
            }),
            bybitAccountsServices.getBalance({ sandbox }),
            bybitMarketServices.getTickers({
                symbol: data.symbol,
                sandbox,
            }),
            bybitTradesServices.checkForLiquidation({ symbol: data.symbol, sandbox }),
        ]);

        const positions = positionsRef.data.list;
        const currentPrice = parseFloat(ticker.data.list[0].lastPrice);
        const availableBalance = parseFloat(balanceInfo.data[0].totalEquity);

        console.info(`Current price: ${currentPrice}, Available balance: ${availableBalance} USDT`);

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

            const realizedPnl = parseFloat(oppositeSidePosition.unrealisedPnl);
            const pnlEmoji = realizedPnl > 0 ? "✅ Profit" : realizedPnl < 0 ? "❌ Loss" : "➖ Breakeven";
            const formattedPnl = realizedPnl.toFixed(2);
            const executionTimeInSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

            await telegramChatsServices.sendMessage({
                message: {
                    title: `${pnlEmoji} Position Closed: ${data.symbol} ${oppositeSidePosition.side}`,
                    symbol: data.symbol,
                    side: oppositeSidePosition.side,
                    category: data.category,
                    orderType: data.orderType,
                    qty: data.qty,
                    avgEntryPrice: oppositeSidePosition.avgPrice, // Entry price from original position data
                    avgExitPrice: oppositeSidePosition.markPrice, // Assume exit price is returned in closePositionResult
                    realizedPnl: `${formattedPnl} USDT`, // Show PNL with currency
                    leverage: data.leverage, // Show leverage used
                    executionTime: executionTimeInSeconds,
                    note: `Current Open Positions: ${remainingPositions}`, // Keep track of remaining positions
                },
            });

            console.info("Position closed successfully:", closePositionResult);
            return true;
        }

        let orderQty = data.qty;

        const requestedPositionValue = parseFloat(data.qty) * currentPrice;
        const leverage = parseFloat(data.leverage || 1);

        if (requestedPositionValue > availableBalance) {
            const safetyFactor = 0.95; // Use 95% of available margin as safety buffer
            const maxMargin = availableBalance * safetyFactor;
            const maxPositionValue = maxMargin * leverage;
            const maxPositionSize = maxPositionValue / currentPrice;

            // Ensure order doesn't exceed available margin
            orderQty = Math.min(parseFloat(data.qty), maxPositionSize);
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
            qty: orderQty,
            leverage,
            sandbox,
        });

        const executionTimeInSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

        await telegramChatsServices.sendMessage({
            message: {
                title: `✅ Order Placed: Successfully placed a new order.`,
                symbol: data.symbol,
                side: data.side,
                category: data.category,
                orderType: data.orderType,
                qty: data.qty,
                currentPrice,
                executionTime: executionTimeInSeconds,
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
//     side: "Sell",
//     orderType: "Market",
//     qty: "0.1",
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
