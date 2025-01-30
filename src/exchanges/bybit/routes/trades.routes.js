import express from "express";
import { bybitTradesControllers } from "../controllers/index.js";

const router = express.Router();

router.get("/", bybitTradesControllers.getOpenClosedOrders);
router.post("/", bybitTradesControllers.placeOrder);
router.put("/", bybitTradesControllers.cancelOrder);

export default router;
