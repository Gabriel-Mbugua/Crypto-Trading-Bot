import { ordersService } from "../services/index.js";
import { createControllerWrapper } from "./common.js";

export const processOrder = createControllerWrapper(ordersService.processOrder, "ORDERS.C-1");
export const getOrders = createControllerWrapper(ordersService.getOrders, "ORDERS.C-2");
