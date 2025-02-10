import { createLogger, format, transports } from "winston";
const { combine, timestamp, json, colorize, printf } = format;

const consoleLogFormat = format.combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} ${level}: ${message}`;
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
    })
);

export const logger = createLogger({
    level: "http",
    format: combine(colorize(), timestamp(), json()),
    transports: [
        new transports.Console({
            format: consoleLogFormat,
        }),
    ],
});
