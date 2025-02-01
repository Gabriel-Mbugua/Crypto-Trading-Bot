import { bybitTradesServices, bybitPositionServices, bybitWebsocketServices } from "../../exchanges/bybit/index.js";
import { commonUtils } from "../../utils/index.js";

export const processOrder = async (data) => {
    try {
        console.log("L-ORDERS-5", JSON.stringify(data));

        const sandbox = data.sandbox === "true";

        const positionsRef = await bybitPositionServices.getPositions({
            symbol: data.symbol,
            sandbox,
        });

        const positions = positionsRef.data.list;

        const sameSidePosition = positions.find(
            (position) =>
                position.side === data.side && Number(position.size) > 0 && ["Buy", "Sell"].includes(position.side)
        );
        const oppositeSidePosition = positions.find(
            (position) =>
                position.side !== data.side && Number(position.size) > 0 && ["Buy", "Sell"].includes(position.side)
        );

        if (sameSidePosition) {
            console.log("An active position already exists in the same direction. Ignoring the new order.");
            return { success: false, message: "Active position in the same direction" };
        }

        // Check if there's an active position in the opposite direction
        // if so, close it before placing the new order
        if (oppositeSidePosition) {
            console.log(
                "An active position exists in the opposite direction. Closing it before placing the new order."
            );

            const closingSide = oppositeSidePosition.side === "Sell" ? "Buy" : "Sell";

            const closePositionResult = await bybitPositionServices.closePosition({
                category: data.category,
                symbol: data.symbol,
                side: closingSide,
                sandbox,
            });

            console.log("Position closed successfully:", closePositionResult);
        }

        // Initialize WebSocket
        await bybitWebsocketServices.initializeWebsocket(sandbox);

        // Wait for WebSocket to be ready
        await bybitWebsocketServices.waitForWebsocketReady();

        // Place the order
        const result = await bybitTradesServices.placeTrade({
            category: data.category,
            symbol: data.symbol,
            side: data.side,
            orderType: data.orderType,
            qty: data.qty,
            sandbox,
        });
        console.log("Order placed successfully:", result);

        return result;
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};
// processOrder({ category: "linear", symbol: "SOLUSDT", side: "sell", orderType: "Market", qty: "0.106" });

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
//     side: "Sell",
//     orderType: "Market",
//     qty: "0.1",
//     sandbox: "true",
// });
