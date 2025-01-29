import express from "express";
import { bybitAccountsControllers } from "../controllers/index.js";

const router = express.Router();

router.get("/balance", bybitAccountsControllers.getBalance);

export default router;
