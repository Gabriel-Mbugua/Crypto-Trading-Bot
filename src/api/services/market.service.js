import axios from "axios";
import { configDetails, generateHeaders, generateSignature } from "../../exchanges/bybit/common.js";
import { commonUtils } from "../../utils/index.js";

export const tokenMarketInfo = async ({ category = "linear", symbol, sandbox = true }) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);

        const method = "GET";
        const url = `${baseUrl}/v5/market/instruments-info`;
        const timestamp = Date.now();

        const params = { category };

        if (symbol) params.symbol = symbol;

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

// tokenMarketInfo({ symbol: "SOLUSDT" }).then((res) => console.log(JSON.stringify(res)));

export const adjustQuantity = async ({ desiredQty, symbol }) => {
    const marketInfo = await tokenMarketInfo({ symbol });

    const qtyStep = marketInfo.data.list.find((item) => item.symbol === symbol).lotSizeFilter.qtyStep;
    const minOrderQty = marketInfo.data.list.find((item) => item.symbol === symbol).lotSizeFilter.minOrderQty;
    const maxOrderQty = marketInfo.data.list.find((item) => item.symbol === symbol).lotSizeFilter.maxOrderQty;

    const adjustedQty = Math.floor(desiredQty / qtyStep) * qtyStep;

    // Ensure the adjusted quantity is within the allowed range
    if (adjustedQty < minOrderQty) {
        return minOrderQty;
    } else if (adjustedQty > maxOrderQty) {
        return maxOrderQty;
    } else {
        return adjustedQty;
    }
};
// adjustQuantity({ desiredQty: "0.466", symbol: "SOLUSDT" }).then((res) => console.log(res));
