import { controllerUtils } from "../../utils/index.js";
import { positionsService } from "../services/index.js";

export const getPositions = controllerUtils.createControllerWrapper(positionsService.getPositions, "POSITIONS.C-1");
