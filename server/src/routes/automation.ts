import { Router } from "express";
import { runCheck } from "../controllers/automationController.js";
const r = Router();
r.post("/check-followups", runCheck);
export default r;
