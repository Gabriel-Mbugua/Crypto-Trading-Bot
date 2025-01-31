import { bybitTradesServices, bybitPositionServices } from "../../exchanges/bybit/index.js";

export const processOrder = async (alertMessage) => {
    try {
        console.log("L-ORDERS-5", alertMessage);
        const data = JSON.parse(alertMessage);

        // Place the order
        const result = await bybitTradesServices.placeTrade({
            category: data.category,
            symbol: data.symbol,
            side: data.side,
            orderType: data.orderType,
            qty: data.qty,
            sandbox: true,
        });
        console.log("Order placed successfully:", result);

        await waitForPositionOpen({ symbol: data.symbol, side: data.side });

        await bybitPositionServices.setTrailingStop({
            category: data.category,
            symbol: data.symbol,
            trailingStop: 20,
            tpslMode: "Full",
            positionIdx: 0,
            sandbox: true,
        });

        // return result;
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};

const waitForPositionOpen = async ({ symbol, side, maxRetries = 10, delay = 1000 }) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            // Fetch the current position
            const position = await bybitPositionServices.getPosition({
                symbol,
                side,
                sandbox: true,
            });

            // Check if the position is open
            if (position.success && position.data.size > 0) {
                console.log("Position opened successfully.");
                return true;
            }
        } catch (err) {
            console.error("Error fetching position:", err);
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    console.error("Position did not open after maximum retries.");
    return false;
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

// processOrder(`{
//     "category": "linear",
//     "symbol": "SOLUSDT",
//     "side": "Buy",
//     "orderType": "Market",
//     "qty": "0.1"
// }`);
