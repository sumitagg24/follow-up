import { Router } from "express";
import { listTasks, completeTask } from "../controllers/taskController.js";
const r = Router();
r.get("/", listTasks);
r.put("/:id/complete", completeTask);
export default r;
