import dotenv from "dotenv";

dotenv.config();

export const config = {
    bybit: {
        prodBaseUrl: "https://api.bybit.com",
        sandboxBaseUrl: "https://api-testnet.bybit.com",
        demoBaseUrl: "https://api-demo.bybit.com",
        prodApiKey: process.env.BYBIT_PROD_API_KEY,
        sandboxApiKey: process.env.BYBIT_SANDBOX_API_KEY,
        demoApiKey: process.env.BYBIT_DEMO_API_KEY,
        demoApiSecret: process.env.BYBIT_DEMO_API_SECRET,
    },
};
