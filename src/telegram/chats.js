import axios from "axios";

import { getConfigDetails } from "./common.js";
import { config } from "../config.js";

export const sendMessage = async ({ message, formatStyle = "MarkdownV2" }) => {
    try {
        const { baseUrl, botToken } = getConfigDetails();

        const url = `${baseUrl}${botToken}/sendMessage`;

        const data = {
            chat_id: config.telegram.chatId,
            text: markDownFormatter(message),
            parse_mode: formatStyle,
        };

        // You can use either GET or POST; POST is common for sending data.
        const options = {
            method: "POST",
            url,
            data,
        };

        const response = await axios(options);
        return response.data;
    } catch (err) {
        console.error(err?.response?.data || err.message);
        throw new Error(err.message);
    }
};

// sendMessage({ "wagwan fn" });
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

    return formattedMessage;
};

const escapeMarkdownV2 = (text) => {
    return text.replace(/[_*[\]()~`>#\+\-=|{}.!]/g, "\\$&");
};
