import dotenv from "dotenv";

dotenv.config();

export const config = {
    strategyConfigs: {
        trailingStop: 10,
    },
    bybit: {
        prodBaseUrl: "https://api.bybit.com",
        testnetBaseUrl: "https://api-testnet.bybit.com",
        demoBaseUrl: "https://api-demo.bybit.com",
        prodApiKey: process.env.BYBIT_PROD_API_KEY,
        demoApiKey: process.env.BYBIT_DEMO_API_KEY,
        testnetApiKey: process.env.BYBIT_TESTNET_API_KEY,
        prodApiSecret: process.env.BYBIT_PROD_API_SECRET,
        demoApiSecret: process.env.BYBIT_DEMO_API_SECRET,
        testnetApiSecret: process.env.BYBIT_TESTNET_API_SECRET,
        prodTradeWebsocketUrl: "wss://stream.bybit.com/v5/trade",
        prodPrivateWebsocketUrl: "wss://stream.bybit.com/v5/private",
        testnetTradeWebsocketUrl: "wss://stream-testnet.bybit.com/v5/trade",
        testnetPrivateWebsocketUrl: "wss://stream-testnet.bybit.com/v5/private",
    },
};
