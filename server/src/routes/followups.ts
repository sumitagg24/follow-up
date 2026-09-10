import { Router } from "express";
import { listFollowUps, completeFollowUp, rescheduleFollowUp, createFollowUp } from "../controllers/followUpController.js";
const r = Router();
r.get("/", listFollowUps);
r.post("/", createFollowUp);
r.put("/:id/complete", completeFollowUp);
r.put("/:id/reschedule", rescheduleFollowUp);
export default r;
