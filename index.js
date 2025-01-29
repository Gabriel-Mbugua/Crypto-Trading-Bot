import express from "express";
import cors from "cors";
import helmet from "helmet";

import bybitRouter from "./src/exchanges/bybit/routes/index.js";

const app = express();

app.use(
    cors({
        origin: true,
    })
);

app.use(express.json({ limit: "1mb" }));

app.use(helmet());

app.use("/bybit", bybitRouter);

app.get("/", (req, res) => {
    res.json({ message: "Hello World" });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
