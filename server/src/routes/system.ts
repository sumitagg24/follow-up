import { Router } from "express";
import { getSystemStatus } from "../controllers/systemController.js";
const r = Router();
r.get("/", getSystemStatus);
export default r;
