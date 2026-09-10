import { Router } from "express";
import { getStats, getDashboardData } from "../controllers/dashboardController.js";
const r = Router();
r.get("/stats", getStats);
r.get("/", getDashboardData);
export default r;
