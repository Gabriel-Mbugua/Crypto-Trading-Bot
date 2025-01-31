import express from "express";
import { ordersControllers } from "../controllers/index.js";

const router = express.Router();

router.post("/", ordersControllers.processOrder);
router.get("/", ordersControllers.getOrders);

export default router;
