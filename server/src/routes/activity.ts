import { Router } from "express";
import { listActivity } from "../controllers/activityController.js";
const r = Router();
r.get("/", listActivity);
export default r;
