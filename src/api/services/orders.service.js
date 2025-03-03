import { config } from "../../config.js";
import Query from "../../database/query.builder.js";
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

        const sandbox = config.nodeEnv !== "production";

        data.symbol = data.symbol.replace(".P", "");
        data.sandbox = sandbox;

        if (data.side.toLowerCase() === "sell") data.side = "Sell";
        if (data.side.toLowerCase() === "buy") data.side = "Buy";

        const environment = sandbox ? "Sandbox" : "Production";

        data.environment = environment;

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

        const orderRef = await Query.insert({
            table: "orders",
            data: {
                symbol: data.symbol,
                side: data.side,
                category: data.category,
                type: data.orderType,
                quantity: data.qty,
                environment,
            },
        });
        const { id } = orderRef.rows[0];

        data.orderId = id;

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

export const processOrder = async (data) => {
    try {
        const startTime = Date.now();
        const sandbox = data.sandbox;

        if (data?.testing) return { success: true, message: "Order received successfully" };

        const [positionsRef, pendingOrders, balanceInfo, ticker, ordersRef] = await Promise.all([
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
            Query.find({
                table: "orders",
                criteria: { symbol: data.symbol, environment: data.environment },
                orderBy: "created_at DESC",
                limit: 2,
            }),
        ]);

        const positions = positionsRef.data.list;
        const currentPrice = parseFloat(ticker.data.list[0].lastPrice);
        const availableBalance = parseFloat(balanceInfo.data[0].totalEquity);
        const previousOrder = ordersRef.rows[1];

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

            await Query.update({
                table: "orders",
                id: data.orderId,
                data: {
                    action: "exit",
                    entry_price: oppositeSidePosition.avgPrice,
                    exit_price: oppositeSidePosition.markPrice,
                    realized_pnl: formattedPnl,
                    leverage: data.leverage,
                    execution_time: executionTimeInSeconds,
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

        if (previousOrder?.action === "entry") {
            console.info("An active position was closed. Skip this false entry signal.");
            const executionTimeInSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

            await telegramChatsServices.sendMessage({
                message: {
                    title: `🚫Ignored Order: Active position was closed.`,
                    symbol: data.symbol,
                    side: data.side,
                    category: data.category,
                    orderType: data.orderType,
                    qty: data.qty,
                    entryPrice: previousOrder.current_price,
                    exitPrice: currentPrice,
                    realizedPnl: "LIQUIDATION",
                    executionTime: executionTimeInSeconds,
                },
            });

            await Query.update({
                table: "orders",
                id: data.orderId,
                data: {
                    action: "exit",
                    entry_price: previousOrder.current_price,
                    exit_price: currentPrice,
                    realized_pnl: 0,
                    leverage: previousOrder?.leverage || 1,
                    execution_time: executionTimeInSeconds,
                },
            });
            return { success: false, message: "Active position already exists" };
        }
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
                title: `✅ ${data.environment} Order Placed: Successfully placed a new order.`,
                symbol: data.symbol,
                side: data.side,
                category: data.category,
                orderType: data.orderType,
                qty: data.qty,
                currentPrice,
                executionTime: executionTimeInSeconds,
            },
        });

        await Query.update({
            table: "orders",
            id: data.orderId,
            data: {
                action: "entry",
                leverage: data.leverage,
                quantity: orderQty,
                current_price: currentPrice,
                environment: data.environment,
                execution_time: executionTimeInSeconds,
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

const checkForLiquidation = async ({ symbol, side }) => {
    const lastestOrderRef = await Query.find({
        table: "orders",
        criteria: { symbol },
        orderBy: "created_at DESC",
        limit: 1,
    });

    const lastestOrder = lastestOrderRef.rows[0];

    if (lastestOrder.action === "entry") return true;

    return false;
};
// checkForLiquidation({ symbol: "SOLUSDT" });

export const getOrders = async ({ openOnly = true, sandbox = false, symbol = "SOLUSDT" }) => {
    try {
        const orders = await bybitTradesServices.getOpenClosedOrders({ openOnly, symbol, sandbox });

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
