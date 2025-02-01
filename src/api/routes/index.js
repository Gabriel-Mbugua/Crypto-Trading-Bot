import express from "express";

import ordersRoutes from "./orders.routes.js";
import positionsRoutes from "./positions.routes.js";
const router = express.Router();

router.use("/orders", ordersRoutes);
router.use("/positions", positionsRoutes);

export default router;
