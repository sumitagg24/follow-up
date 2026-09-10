import { Request, Response } from "express";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { Venture } from "../models/Venture.js";
import { createActivity } from "../services/automationService.js";
import { asyncHandler, badRequest, isValidObjectId, notFound } from "../utils/http.js";
import { validateTaskPayload } from "../utils/validate.js";

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const { ventureId } = req.query;
  const q: any = {};
  if (ventureId) {
    if (!isValidObjectId(ventureId)) throw badRequest("Invalid ventureId filter");
    q.ventureId = ventureId;
  }
  const tasks = await Task.find(q).sort({ dueDate: 1, createdAt: 1 }).populate("ventureId", "name status founderName").lean();
  res.json(tasks);
});

export const completeTask = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) throw badRequest("Invalid task id");
  const t = await Task.findById(req.params.id);
  if (!t) throw notFound("Task");

  // Idempotent: completing twice keeps one activity, returns current state
  if (t.status !== "completed") {
    t.status = "completed";
    t.completedAt = new Date();
    await t.save();
    const v = await Venture.findById(t.ventureId);
    if (v) await createActivity(v._id, v.name, "task_completed", `Task "${t.title}" completed for "${v.name}"`);
  }
  res.json(t);
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { ventureId } = req.body ?? {};
  if (!isValidObjectId(ventureId)) throw badRequest("ventureId must be a valid venture id");
  const errors = validateTaskPayload(req.body);
  if (errors.length) throw badRequest("Validation failed", errors);

  const v = await Venture.findById(ventureId);
  if (!v) throw notFound("Venture");

  const t = await Task.create({
    ventureId,
    title: req.body.title.trim(),
    status: req.body.status ?? "pending",
    dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
  });
  await createActivity(v._id, v.name, "task_created", `${t.title} task created for "${v.name}"`);
  res.status(201).json(t);
});
