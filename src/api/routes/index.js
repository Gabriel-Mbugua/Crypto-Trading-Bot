import express from "express";

import ordersRoutes from "./orders.routes.js";

const router = express.Router();

router.use("/orders", ordersRoutes);

export default router;
