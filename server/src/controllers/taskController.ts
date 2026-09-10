import { Request, Response } from "express";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { Venture } from "../models/Venture.js";
import { createActivity } from "../services/automationService.js";

export async function listTasks(req: Request, res: Response) {
  const { ventureId } = req.query;
  const q:any={};
  if (ventureId) q.ventureId=ventureId;
  const tasks = await Task.find(q).sort({ dueDate:1 }).lean();
  res.json(tasks);
}
export async function completeTask(req: Request, res: Response) {
  const t = await Task.findById(req.params.id);
  if (!t) return res.status(404).json({ error:"Not found" });
  t.status="completed";
  t.completedAt=new Date() as any;
  await t.save();
  const v = await Venture.findById(t.ventureId);
  if (v) await createActivity(v._id, v.name, "task_completed", `Task "${t.title}" completed for "${v.name}"`);
  res.json(t);
}
