import { Request, Response } from "express";
import { Venture } from "../models/Venture.js";
import { FollowUp } from "../models/FollowUp.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { createActivity } from "../services/automationService.js";
import { asyncHandler, badRequest, isValidObjectId, notFound } from "../utils/http.js";
import { parseDate, validateVenturePayload } from "../utils/validate.js";

export const listVentures = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, sort } = req.query;
  const q: any = {};
  if (search) q.name = { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (status) q.status = status;
  let query = Venture.find(q);
  query = sort === "oldest" ? query.sort({ createdAt: 1 }) : query.sort({ createdAt: -1 });
  const ventures = await query.lean();

  const ids = ventures.map((v) => v._id);
  const [fus, tasks, lastActivities] = await Promise.all([
    FollowUp.find({ ventureId: { $in: ids } }).lean(),
    Task.aggregate([
      { $match: { ventureId: { $in: ids } } },
      { $group: { _id: "$ventureId", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
    ]),
    Activity.aggregate([
      { $match: { ventureId: { $in: ids }, action: { $ne: "automation_run" } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$ventureId", lastAt: { $first: "$createdAt" }, lastDescription: { $first: "$description" } } },
    ]),
  ]);

  const fuMap = new Map(fus.map((f: any) => [String(f.ventureId), f]));
  const taskMap = new Map(tasks.map((t: any) => [String(t._id), t]));
  const actMap = new Map(lastActivities.map((a: any) => [String(a._id), a]));

  const out = ventures.map((v) => {
    const key = String(v._id);
    return {
      ...v,
      followUp: fuMap.get(key) || null,
      taskCounts: taskMap.get(key) || { total: 0, completed: 0 },
      lastActivity: actMap.get(key) || null,
    };
  });
  res.json(out);
});

export const getVenture = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) throw badRequest("Invalid venture id");
  const v = await Venture.findById(req.params.id).lean();
  if (!v) throw notFound("Venture");

  const [followUp, tasks, activities] = await Promise.all([
    FollowUp.findOne({ ventureId: v._id }).lean(),
    Task.find({ ventureId: v._id }).sort({ createdAt: 1 }).lean(),
    Activity.find({ ventureId: v._id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);
  res.json({ venture: v, followUp, tasks, activities });
});

export const createVenture = asyncHandler(async (req: Request, res: Response) => {
  const errors = validateVenturePayload(req.body);
  if (errors.length) throw badRequest("Validation failed", errors);

  const followUpDate = parseDate(req.body.followUpDate)!;
  const venture = await Venture.create({
    name: req.body.name.trim(),
    founderName: req.body.founderName.trim(),
    founderEmail: req.body.founderEmail.trim(),
    industry: req.body.industry.trim(),
    status: req.body.status,
    followUpDate,
    notes: typeof req.body.notes === "string" ? req.body.notes : "",
  });
  const fu = await FollowUp.create({ ventureId: venture._id, dueDate: followUpDate, status: "pending" });

  const tasksToCreate = [
    { title: "Initial Review", dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000) },
    { title: "Founder Follow-up", dueDate: followUpDate },
    { title: "Internal Discussion", dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000) },
  ];
  const createdTasks = await Task.insertMany(
    tasksToCreate.map((t) => ({ ventureId: venture._id, title: t.title, dueDate: t.dueDate, status: "pending" }))
  );

  await createActivity(venture._id, venture.name, "venture_created", `Venture "${venture.name}" created`);
  for (const t of createdTasks) {
    await createActivity(venture._id, venture.name, "task_created", `${t.title} task created for "${venture.name}"`);
  }

  res.status(201).json({ venture, followUp: fu, tasks: createdTasks });
});

export const updateVenture = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) throw badRequest("Invalid venture id");
  const errors = validateVenturePayload(req.body);
  if (errors.length) throw badRequest("Validation failed", errors);

  const followUpDate = parseDate(req.body.followUpDate)!;
  const v = await Venture.findById(req.params.id);
  if (!v) throw notFound("Venture");

  v.name = req.body.name.trim();
  v.founderName = req.body.founderName.trim();
  v.founderEmail = req.body.founderEmail.trim();
  v.industry = req.body.industry.trim();
  v.status = req.body.status;
  v.followUpDate = followUpDate;
  v.notes = typeof req.body.notes === "string" ? req.body.notes : "";
  await v.save();

  // keep an open follow-up in sync with the venture's follow-up date
  const fu = await FollowUp.findOne({ ventureId: v._id, status: { $in: ["pending", "overdue"] } });
  if (fu) {
    fu.dueDate = followUpDate;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(followUpDate); due.setHours(0, 0, 0, 0);
    if (fu.status === "overdue" && due >= today) fu.status = "pending";
    await fu.save();
  }

  await createActivity(v._id, v.name, "venture_updated", `Venture "${v.name}" updated`);
  res.json(v);
});

export const deleteVenture = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) throw badRequest("Invalid venture id");
  const v = await Venture.findById(req.params.id);
  if (!v) throw notFound("Venture");

  const vid = v._id;
  await Promise.all([
    FollowUp.deleteMany({ ventureId: vid }),
    Task.deleteMany({ ventureId: vid }),
    Activity.deleteMany({ ventureId: vid }),
    Venture.findByIdAndDelete(vid),
  ]);
  res.json({ ok: true });
});

export const getVentureActivity = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) throw badRequest("Invalid venture id");
  const v = await Venture.findById(req.params.id).lean();
  if (!v) throw notFound("Venture");
  const acts = await Activity.find({ ventureId: v._id }).sort({ createdAt: -1 }).lean();
  res.json(acts);
});
