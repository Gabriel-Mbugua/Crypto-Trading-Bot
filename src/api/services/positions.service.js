import { bybitPositionServices } from "../../exchanges/bybit/index.js";
import { commonUtils } from "../../utils/index.js";

export const getPositions = async ({ symbol, sandbox = true }) => {
    try {
        const positions = await bybitPositionServices.getPositions({ symbol, sandbox });

        return positions;
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};
