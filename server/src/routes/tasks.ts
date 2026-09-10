import { Router } from "express";
import { listTasks, completeTask, createTask } from "../controllers/taskController.js";
const r = Router();
r.get("/", listTasks);
r.post("/", createTask);
r.put("/:id/complete", completeTask);
export default r;
