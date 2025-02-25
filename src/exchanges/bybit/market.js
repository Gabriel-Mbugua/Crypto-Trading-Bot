import axios from "axios";
import { configDetails, generateHeaders, generateSignature } from "./common.js";

export const getTickers = async ({ category = "linear", symbol, sandbox = true }) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);

        const method = "GET";
        const timestamp = Date.now();
        const url = `${baseUrl}/v5/market/tickers`;

        const params = { category };

        if (symbol) params.symbol = symbol;

        const signature = generateSignature({
            data: params,
            timestamp,
            apiSecret,
            apiKey,
            sandbox,
            method,
        });
        const headers = generateHeaders({ sandbox, signature, timestamp, apiKey });

        const options = {
            method: "GET",
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

// getTickers({ symbol: "SOLUSDT", sandbox: true }).then((res) => console.log(JSON.stringify(res)));
