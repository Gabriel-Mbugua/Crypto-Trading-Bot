import { bybitAccountsServices } from "../services/index.js";
import { createControllerWrapper } from "./common.js";

export const getBalance = createControllerWrapper(bybitAccountsServices.getBalance, "ACCOUNTS.C-1");
