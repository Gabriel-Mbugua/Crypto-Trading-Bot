# Crypto Trading Bot API

A Node.js-based trading bot API that executes trades on Bybit based on signals from trading platforms like TradingView. The bot manages positions with specific rules and provides real-time notifications through Telegram.

## Features

-   Executes buy and sell orders on Bybit perpetual futures
-   Integrates with trading platforms like TradingView
-   Real-time position notifications via Telegram
-   Position management rules:
    -   Prevents opening multiple positions in the same direction
    -   Automatically closes opposite positions before opening new ones
    -   No support for pyramiding
-   Redis integration for handling multiple requests per second
-   Development and production environment support

## Prerequisites

-   Node.js
-   Redis (optional but recommended)
-   Bybit account with API credentials
-   Telegram bot and channel

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Bybit API Credentials
BYBIT_API_KEY=your_bybit_api_key
BYBIT_API_SECRET=your_bybit_api_secret
BYBIT_TESTNET_API_KEY=your_bybit_testnet_api_key
BYBIT_TESTNET_API_SECRET=your_bybit_testnet_api_secret

# Redis Configuration
REDIS_CONNECTION_URL=your_redis_connection_url

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

## Project Structure

.
├── index.js
├── src/
│ ├── api/
│ │ ├── controllers/
│ │ ├── routes/
│ │ └── services/
│ ├── exchanges/
│ │ └── bybit/
│ ├── middleware/
│ ├── redis/
│ ├── strategies/
│ ├── telegram/
│ └── utils/

## Installation

```bash
pnpm install
```

## Running the bot

```bash
pnpm start
```

## API Endpoints

The bot exposes endpoints to receive trading signals. Example order payload:

```json
{
    "category": "linear",
    "symbol": "SOLUSDT.P",
    "side": "Buy",
    "orderType": "Market",
    "qty": "0.4"
}
```

## Trading Rules

-   Only one position per direction is allowed (No pyramiding).
-   When receiving a signal in the opposite direction:
    -   Existing position will be closed
    -   New position will be opened
-   All position changes are reported to the configured Telegram channel
-   The bot supports market orders on perpetual futures

## Error Handling

-   Failed orders are reported to Telegram with detailed error messages
-   Redis lock mechanism prevents concurrent order processing for the same symbol
-   Comprehensive logging system for debugging
