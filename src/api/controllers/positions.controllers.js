import { positionsService } from "../services/index.js";
import { createControllerWrapper } from "./common.js";

export const getPositions = createControllerWrapper(positionsService.getPositions, "POSITIONS.C-1");
