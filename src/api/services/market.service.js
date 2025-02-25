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
    const tokenInfo = marketInfo.data.list.find((item) => item.symbol === symbol);

    const qtyStep = parseFloat(tokenInfo.lotSizeFilter.qtyStep);
    const minOrderQty = parseFloat(tokenInfo.lotSizeFilter.minOrderQty);
    const maxOrderQty = parseFloat(tokenInfo.lotSizeFilter.maxOrderQty);

    // Convert desiredQty to number if it's a string
    const qty = typeof desiredQty === "string" ? parseFloat(desiredQty) : desiredQty;

    // Use toFixed to handle decimal precision based on qtyStep
    const precision = qtyStep.toString().includes(".") ? qtyStep.toString().split(".")[1].length : 0;

    // Calculate the adjusted quantity with proper precision
    const adjustedQty = Math.floor(qty / qtyStep) * qtyStep;
    const formattedQty = parseFloat(adjustedQty.toFixed(precision));

    // Ensure the adjusted quantity is within the allowed range
    if (formattedQty < minOrderQty) {
        return minOrderQty;
    } else if (formattedQty > maxOrderQty) {
        return maxOrderQty;
    } else {
        return formattedQty;
    }
};
// adjustQuantity({ desiredQty: "0.466", symbol: "SOLUSDT" }).then((res) => console.log(res));
// adjustQuantity({ desiredQty: "0.3124536778", symbol: "SOLUSDT" }).then((res) => console.log(res));
