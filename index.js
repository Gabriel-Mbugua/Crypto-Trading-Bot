import express from "express";
import cors from "cors";
import helmet from "helmet";

import apiRouter from "./src/api/routes/index.js";
import { bybitWebsocketServices } from "./src/exchanges/bybit/index.js";
import { ordersService } from "./src/api/services/index.js";
import { commonUtils } from "./src/utils/index.js";

const app = express();

app.use(
    cors({
        origin: true,
    })
);

app.use(express.json({ limit: "1mb" }));

app.use(helmet());

app.use("/api", apiRouter);

app.get("/", (req, res) => {
    res.json({ message: "Hello World" });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
