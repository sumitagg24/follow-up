import { Router } from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
const r = Router();
r.get("/", getAnalytics);
export default r;
