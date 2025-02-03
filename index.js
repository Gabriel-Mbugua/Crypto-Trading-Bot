import express from "express";
import cors from "cors";
import helmet from "helmet";

import apiRouter from "./src/api/routes/index.js";
import { config } from "./src/config.js";

const port = config.port;

const app = express();

app.use(cors({ origin: true }));

app.use(express.json({ limit: "1mb" }));

app.use(helmet());

app.use("/api", apiRouter);

app.get("/", (req, res) => {
    res.json({ message: "Hello World" });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});
