import axios from "axios";

import { configDetails, generateHeaders, generateSignature } from "./common.js";
import { commonUtils } from "../../utils/index.js";

export const getBalance = async (sandbox = true) => {
    try {
        const { baseUrl, apiKey, apiSecret } = configDetails(sandbox);

        const method = "GET";
        const url = `${baseUrl}/v5/account/wallet-balance`;

        const params = { accountType: "UNIFIED" };

        const timestamp = Date.now();

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
            params: cleanOrderParams,
        };

        const response = await axios(options);

        if (response.data.retCode !== 0) throw new Error(response.data.retMsg);

        return {
            success: true,
            data: response.data.result.list,
        };
    } catch (err) {
        console.log(err?.response?.data || err.message);
        if (err instanceof Error) throw err;
        throw new Error(err.message);
    }
};
// getBalance().then((res) => console.log(res));
