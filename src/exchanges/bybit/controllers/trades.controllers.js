import { bybitTradesServices } from "../services/index.js";
import { createControllerWrapper } from "./common.js";

export const getOpenClosedOrders = createControllerWrapper(bybitTradesServices.getOpenClosedOrders, "TRADES.C-1");
export const placeOrder = createControllerWrapper(bybitTradesServices.processOrder, "TRADES.C-2");
export const cancelOrder = createControllerWrapper(bybitTradesServices.cancelOrder, "TRADES.C-3");
