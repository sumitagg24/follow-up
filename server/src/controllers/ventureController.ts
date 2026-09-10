import { Request, Response } from "express";
import { Venture } from "../models/Venture.js";
import { FollowUp } from "../models/FollowUp.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { createActivity } from "../services/automationService.js";

function validateVenture(body: any) {
  const errors: string[] = [];
  if (!body.name?.trim()) errors.push("Venture name required");
  if (!body.founderName?.trim()) errors.push("Founder name required");
  if (!body.founderEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.founderEmail)) errors.push("Valid founder email required");
  if (!body.industry?.trim()) errors.push("Industry required");
  if (!body.status) errors.push("Status required");
  if (!body.followUpDate) errors.push("Follow-up date required");
  return errors;
}

export async function listVentures(req: Request, res: Response) {
  const { search, status, sort } = req.query;
  let q: any = {};
  if (search) q.name = { $regex: String(search), $options: "i" };
  if (status) q.status = status;
  let query = Venture.find(q);
  if (sort === "oldest") query = query.sort({ createdAt: 1 });
  else query = query.sort({ createdAt: -1 });
  const ventures = await query.lean();
  // attach followup for list
  const ids = ventures.map(v=>v._id);
  const fus = await FollowUp.find({ ventureId: { $in: ids } }).lean();
  const map = new Map(fus.map((f:any)=>[String(f.ventureId), f]));
  const out = ventures.map(v=>({...v, followUp: map.get(String(v._id)) || null}));
  res.json(out);
}

export async function getVenture(req: Request, res: Response) {
  const v = await Venture.findById(req.params.id).lean();
  if (!v) return res.status(404).json({ error: "Not found" });
  const followUp = await FollowUp.findOne({ ventureId: v._id }).lean();
  const tasks = await Task.find({ ventureId: v._id }).sort({ createdAt: 1 }).lean();
  const activities = await Activity.find({ ventureId: v._id }).sort({ createdAt: -1 }).limit(20).lean();
  res.json({ venture: v, followUp, tasks, activities });
}

export async function createVenture(req: Request, res: Response) {
  const errors = validateVenture(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });
  const venture = await Venture.create({
    name: req.body.name.trim(),
    founderName: req.body.founderName.trim(),
    founderEmail: req.body.founderEmail.trim(),
    industry: req.body.industry,
    status: req.body.status,
    followUpDate: new Date(req.body.followUpDate),
    notes: req.body.notes || "",
  });
  const dueDate = new Date(req.body.followUpDate);
  const fu = await FollowUp.create({ ventureId: venture._id, dueDate, status: "pending" });

  const tasksToCreate = [
    { title: "Initial Review", dueDate: new Date(Date.now()+ 2*24*3600*1000) },
    { title: "Founder Follow-up", dueDate },
    { title: "Internal Discussion", dueDate: new Date(Date.now()+ 5*24*3600*1000) },
  ];
  const createdTasks = await Task.insertMany(tasksToCreate.map(t=>({ ventureId: venture._id, title: t.title, dueDate: t.dueDate, status: "pending" })));

  await createActivity(venture._id, venture.name, "venture_created", `Venture "${venture.name}" created`);
  for (const t of createdTasks) {
    await createActivity(venture._id, venture.name, "task_created", `${t.title} task created for "${venture.name}"`);
  }

  res.status(201).json({ venture, followUp: fu, tasks: createdTasks });
}

export async function updateVenture(req: Request, res: Response) {
  const errors = validateVenture(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });
  const v = await Venture.findById(req.params.id);
  if (!v) return res.status(404).json({ error: "Not found" });
  v.name = req.body.name.trim();
  v.founderName = req.body.founderName.trim();
  v.founderEmail = req.body.founderEmail.trim();
  v.industry = req.body.industry;
  v.status = req.body.status;
  v.followUpDate = new Date(req.body.followUpDate);
  v.notes = req.body.notes || "";
  await v.save();
  // also update followup dueDate if pending/overdue
  const fu = await FollowUp.findOne({ ventureId: v._id, status: { $in: ["pending","overdue"] } });
  if (fu) { fu.dueDate = new Date(req.body.followUpDate); if (fu.status==="overdue") { const today=new Date(); today.setHours(0,0,0,0); const due=new Date(fu.dueDate); due.setHours(0,0,0,0); if(due>=today) fu.status="pending"; } await fu.save(); }
  await createActivity(v._id, v.name, "venture_updated", `Venture "${v.name}" updated`);
  res.json(v);
}

export async function deleteVenture(req: Request, res: Response) {
  const v = await Venture.findById(req.params.id);
  if (!v) return res.status(404).json({ error: "Not found" });
  const vid = v._id;
  await Promise.all([
    FollowUp.deleteMany({ ventureId: vid }),
    Task.deleteMany({ ventureId: vid }),
    Activity.deleteMany({ ventureId: vid }),
    Venture.findByIdAndDelete(vid),
  ]);
  res.json({ ok: true });
}

export async function getVentureActivity(req: Request, res: Response) {
  const acts = await Activity.find({ ventureId: req.params.id }).sort({ createdAt: -1 }).lean();
  res.json(acts);
}
