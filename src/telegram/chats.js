import axios from "axios";

import { getConfigDetails } from "./common.js";
import { config } from "../config.js";

export const sendMessage = async ({ message, formatStyle = "MarkdownV2" }) => {
    try {
        const { baseUrl, botToken } = getConfigDetails();

        const url = `${baseUrl}${botToken}/sendMessage`;

        const formattedMessage = markDownFormatter(message);

        const data = {
            chat_id: config.telegram.chatId,
            text: formattedMessage,
            parse_mode: formatStyle,
        };

        const options = {
            method: "POST",
            url,
            data,
        };

        const response = await axios(options);
        return response.data;
    } catch (err) {
        console.error(`E-TG-28`, JSON.stringify(message), err?.response?.data || err.message);
        throw new Error(err.message);
    }
};

const markDownFormatter = (message) => {
    let formattedMessage = `*${escapeMarkdownV2(message.title)}*\n\n`;

    if (message.symbol) formattedMessage += `*Symbol*: \`${escapeMarkdownV2(message.symbol)}\`\n`;
    if (message.side) formattedMessage += `*Side*: \`${escapeMarkdownV2(message.side)}\`\n`;
    if (message.category) formattedMessage += `*Category*: \`${escapeMarkdownV2(message.category)}\`\n`;
    if (message.closingSide) formattedMessage += `*Closed Side*: \`${escapeMarkdownV2(message.closingSide)}\`\n`;
    if (message.orderType) formattedMessage += `*Order Type*: \`${escapeMarkdownV2(message.orderType)}\`\n`;
    if (message.qty) formattedMessage += `*Quantity*: \`${escapeMarkdownV2(message.qty)}\`\n`;
    if (message.error) formattedMessage += `*Error*: \`${escapeMarkdownV2(message.error.message)}\`\n`;
    if (message.rejectReason) formattedMessage += `*Reject Reason*: \`${escapeMarkdownV2(message.rejectReason)}\`\n`;
    if (message.currentPrice) formattedMessage += `*Current Price*: \`${escapeMarkdownV2(message.currentPrice)}\`\n`;
    if (message.avgEntryPrice) formattedMessage += `*Entry Price*: \`${escapeMarkdownV2(message.avgEntryPrice)}\`\n`;
    if (message.avgExitPrice) formattedMessage += `*Exit Price*: \`${escapeMarkdownV2(message.avgExitPrice)}\`\n`;
    if (message.realizedPnl)
        formattedMessage += `*Total ${message.symbol} PNL *: \`${escapeMarkdownV2(message.realizedPnl)}\`\n`;
    if (message.leverage) formattedMessage += `*Leverage*: \`${escapeMarkdownV2(message.leverage)}\`\n`;
    if (message.note) formattedMessage += `*Note*: \`${escapeMarkdownV2(message.note)}\`\n`;
    if (message.executionTime)
        formattedMessage += `*Execution Time*: \`${escapeMarkdownV2(message.executionTime)}s\`\n`;

    return formattedMessage;
};

const escapeMarkdownV2 = (text) => {
    if (typeof text !== "string") text = text.toString();

    const formattedText = text?.replace(/[_*[\]()~`>#\+\-=|{}.!]/g, "\\$&") || "Missing";

    return formattedText;
};
