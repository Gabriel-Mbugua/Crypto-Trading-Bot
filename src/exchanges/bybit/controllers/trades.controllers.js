import { bybitTradesServices } from "../services/index.js";
import { createControllerWrapper } from "./common.js";

export const getOpenClosedOrders = createControllerWrapper(bybitTradesServices.getOpenClosedOrders, "TRADES.C-1");
