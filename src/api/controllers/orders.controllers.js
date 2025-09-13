import { controllerUtils } from "../../utils/index.js";
import { ordersService } from "../services/index.js";

export const processOrder = controllerUtils.createControllerWrapper(ordersService.receiveOrder, "ORDERS.C-1");
export const getOrders = controllerUtils.createControllerWrapper(ordersService.getOrders, "ORDERS.C-2");
