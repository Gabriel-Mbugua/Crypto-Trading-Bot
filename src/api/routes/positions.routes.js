import express from "express";
import { positionsControllers } from "../controllers/index.js";

const router = express.Router();

router.get("/:symbol", positionsControllers.getPositions);

export default router;
