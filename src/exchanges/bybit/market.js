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

export const getCandles = async ({ category = "linear", symbol, interval = "240", start, end, sandbox = false }) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);

        const method = "GET";
        const timestamp = Date.now();
        const url = `${baseUrl}/v5/market/kline`;

        const params = {
            category,
            symbol,
            interval,
        };

        if (start) params.start = start;
        if (end) params.end = end;

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

        const data = response.data.result.list.map((item) => {
            return {
                timestamp: item[0],
                open: item[1],
                high: item[2],
                low: item[3],
                close: item[4],
                volume: item[5],
                turnover: item[6],
            };
        });

        return {
            success: true,
            data,
        };
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};
// getCandles({
//     symbol: "SOLUSDT",
// }).then((res) => console.log(JSON.stringify(res)));

export const getAllCandles = async ({ category = "linear", symbol, interval = "240", start, end, sandbox = false }) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);
        const method = "GET";
        const timestamp = Date.now();
        const url = `${baseUrl}/v5/market/kline`;

        // Date parsing and validation
        const parseDate = (dateInput) => {
            if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                const timestamp = Date.parse(dateInput + " UTC");
                if (isNaN(timestamp)) throw new Error(`Invalid date format: ${dateInput}`);
                return timestamp;
            }
            return Number(dateInput);
        };

        const parsedStart = start ? parseDate(start) : undefined;
        const parsedEnd = end ? parseDate(end) : undefined;

        // Interval to milliseconds conversion
        const intervalToMs = () => {
            const intervalStr = interval.toUpperCase();
            if (intervalStr === "D") return 86400000;
            if (intervalStr === "W") return 604800000;
            if (intervalStr === "M") return 2592000000; // 30 days approximation
            const minutes = parseInt(intervalStr) || 1;
            return minutes * 60000;
        };

        const intervalMs = intervalToMs();

        // Recursive data collection
        const fetchAllCandles = async (currentEnd, accumulatedData = []) => {
            const params = {
                category,
                symbol,
                interval,
                limit: 1000, // Max allowed by Bybit
            };

            if (parsedStart) params.start = parsedStart;
            if (currentEnd) params.end = currentEnd;

            const signature = generateSignature({
                data: params,
                timestamp,
                apiSecret,
                apiKey,
                sandbox,
                method,
            });

            const headers = generateHeaders({ sandbox, signature, timestamp, apiKey });

            const response = await axios({
                method: "GET",
                headers,
                url,
                params,
            });

            if (response.data.retCode !== 0) throw new Error(response.data.retMsg);

            const pageData = response.data.result.list.map((item) => ({
                timestamp: item[0],
                open: item[1],
                high: item[2],
                low: item[3],
                close: item[4],
                volume: item[5],
                turnover: item[6],
            }));

            const newData = [...accumulatedData, ...pageData];

            // Check if we need to fetch more data
            if (pageData.length === 1000) {
                const earliestTimestamp = Number(pageData[pageData.length - 1].timestamp);
                const nextEnd = earliestTimestamp - intervalMs;

                // Stop if we've reached the start time
                if (parsedStart && nextEnd < parsedStart) return newData;

                return fetchAllCandles(nextEnd, newData);
            }

            return newData;
        };

        // Initial fetch
        let allData = await fetchAllCandles(parsedEnd);

        // Filter final results by original time range
        if (parsedStart) {
            allData = allData.filter((c) => Number(c.timestamp) >= parsedStart);
        }
        if (parsedEnd) {
            allData = allData.filter((c) => Number(c.timestamp) <= parsedEnd);
        }

        return {
            success: true,
            data: allData,
        };
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};
