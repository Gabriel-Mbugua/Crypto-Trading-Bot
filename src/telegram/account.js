import axios from "axios";
import { getConfigDetails } from "./common.js";

export const getBot = async () => {
    try {
        const { baseUrl, botToken } = getConfigDetails();
        const url = `${baseUrl}${botToken}/getMe`;

        const options = {
            method: "GET",
            url,
        };

        const response = await axios(options);
        return response.data;
    } catch (err) {
        console.log(err);
    }
};
