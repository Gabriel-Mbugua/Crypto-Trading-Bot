import dotenv from "dotenv";

dotenv.config();

export const config = {
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
    port: process.env.PORT || 3000,
    redisConfig: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
    },
    strategyConfigs: {
        trailingStop: 10,
    },
    telegram: {
        chatId: "-1002396574718",
        baseUrl: "https://api.telegram.org/bot",
        botToken: process.env.TELEGRAM_BOT_TOKEN,
    },
};
