import express from "express";
import { bybitTradesControllers } from "../controllers/index.js";

const router = express.Router();

router.get("/", bybitTradesControllers.getOpenClosedOrders);

export default router;
