import { configDetails, generateSignature, generateHeaders } from "./common.js";

export const getPositions = async ({ data, sandbox = true }) => {
    try {
        const { baseUrl } = configDetails(sandbox);
        const url = `${baseUrl}/v5/position/list`;

        const signature = generateSignature({ data, timeStamp, sandbox });
        const headers = generateHeaders({ sandbox, signature, timeStamp });

        const params = { category };

        if (limit) params.limit = limit;
        if (symbol) params.symbol = symbol;
        if (cursor) params.cursor = cursor;
        if (baseCoin) params.baseCoin = baseCoin;
        if (settleCoin) params.settleCoin = settleCoin;

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

const setTrailingStop = async ({
    category = "linear",
    symbol,
    trailingStop, // Price distance for trailing stop
    activePrice, // Trigger price for trailing stop
    tpslMode = "Full", // Using full position mode
    positionIdx = 0,
    sandbox = true,
}) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);
        const url = `${baseUrl}/v5/position/trading-stop`;
        const method = "POST";
        const timestamp = Date.now();

        const stopParams = {
            category,
            symbol,
            trailingStop: trailingStop.toString(),
            activePrice: activePrice.toString(),
            tpslMode,
            positionIdx,
        };

        const cleanStopParams = commonUtils.cleanAndSortData(stopParams);

        const signature = generateSignature({
            data: cleanStopParams,
            timestamp,
            apiSecret,
            apiKey,
            sandbox,
            method,
        });

        const headers = generateHeaders({ sandbox, signature, timestamp, apiKey });

        const response = await axios({
            method,
            headers,
            url,
            data: cleanStopParams,
        });

        if (response.data.retCode !== 0) throw new Error(response.data.retMsg);

        return {
            success: true,
            data: response.data.result,
        };
    } catch (err) {
        console.error("Error setting trailing stop:", err);
        throw err;
    }
};
