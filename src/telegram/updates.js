import axios from "axios";
import { getConfigDetails } from "./common.js";

export const getUpdates = async () => {
    try {
        const { baseUrl, botToken } = getConfigDetails();
        const url = `${baseUrl}${botToken}/getUpdates`;

        const options = {
            method: "GET",
            url,
        };

        const response = await axios(options);

        return response.data;
    } catch (err) {
        console.error("Error fetching updates:", err);
    }
};
// getUpdates();
