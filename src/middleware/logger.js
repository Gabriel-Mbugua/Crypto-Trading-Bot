import morgan from "morgan";
import { loggerUtils } from "../utils/index.js";

const logger = loggerUtils.logger;

export const createLogger = () => {
    return morgan((tokens, req, res) => {
        console.log("Morgan middleware is running!");

        const logObject = {
            timestamp: tokens.date(req, res, "iso"),
            method: tokens.method(req, res),
            url: tokens.url(req, res),
            status: Number(tokens.status(req, res)),
            responseTimeMs: Number(tokens["response-time"](req, res)),
            httpVersion: tokens["http-version"](req, res),
            remoteAddress: tokens["remote-addr"](req, res),
        };
        try {
            logger.http("http request", logObject);
        } catch (error) {
            console.error("Error logging request:", error);
        }
        return null;
    });
};
