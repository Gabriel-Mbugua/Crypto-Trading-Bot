import express from "express";

import accountsRoutes from "./accounts.routes.js";
import tradesRoutes from "./trades.routes.js";

const router = express.Router();

router.use("/accounts", accountsRoutes);
router.use("/trades", tradesRoutes);

export default router;
