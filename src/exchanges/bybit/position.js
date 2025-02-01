import axios from "axios";
import { commonUtils } from "../../utils/index.js";
import { configDetails, generateSignature, generateHeaders } from "./common.js";

export const getPositions = async ({ category = "linear", symbol, limit, cursor, sandbox = true }) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);

        const method = "GET";
        const timestamp = Date.now();
        const url = `${baseUrl}/v5/position/list`;

        const params = { category };

        if (limit) params.limit = limit;
        if (symbol) params.symbol = symbol;
        if (cursor) params.cursor = cursor;

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
// getPositions({ symbol: "SOLUSDT", sandbox: true }).then((res) => console.log(res.data));

export const getPosition = async ({ symbol, side, size, sandbox = true }) => {
    try {
        const positionsRef = await getPositions({ symbol, sandbox });
        const positions = positionsRef.data.list;
        const position = positions.find((position) => {
            if (side) return position.side === side;
            if (size) return position.size === size;

            return position;
        });

        const success = position ? true : false;

        return {
            success,
            data: position,
        };
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};
// getPosition({ symbol: "SOLUSDT", side: "Buy", sandbox: true }).then((res) => console.log(res));
// getPosition({ symbol: "SOLUSDT", side: "Sell", sandbox: true }).then((res) => console.log(res));

export const setTrailingStop = async ({
    category = "linear",
    symbol,
    trailingStop, // Price distance for trailing stop
    tpslMode = "Full", // Using full position mode
    positionIdx = 0, // signifies if making a one-way (0) or hedge position (1, 2)
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

// setTrailingStop({
//     symbol: "SOLUSDT",
//     trailingStop: 50,
//     sandbox: true,
// });
