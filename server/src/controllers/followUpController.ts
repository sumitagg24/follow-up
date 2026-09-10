import { Request, Response } from "express";
import { FollowUp } from "../models/FollowUp.js";
import { Venture } from "../models/Venture.js";
import { createActivity } from "../services/automationService.js";

export async function listFollowUps(req: Request, res: Response) {
  const { status } = req.query;
  const q:any={};
  if (status) q.status=status;
  const fus = await FollowUp.find(q).populate("ventureId").sort({ dueDate: 1 }).lean();
  res.json(fus);
}
export async function completeFollowUp(req: Request, res: Response) {
  const fu = await FollowUp.findById(req.params.id).populate("ventureId");
  if (!fu) return res.status(404).json({ error: "Not found" });
  fu.status="completed";
  fu.completedAt=new Date();
  await fu.save();
  const v:any = fu.ventureId;
  if (v) await createActivity(v._id, v.name, "followup_completed", `Follow-up completed for "${v.name}"`);
  res.json(fu);
}
export async function rescheduleFollowUp(req: Request, res: Response) {
  const { dueDate } = req.body;
  if (!dueDate) return res.status(400).json({ error: "dueDate required" });
  const fu = await FollowUp.findById(req.params.id).populate("ventureId");
  if (!fu) return res.status(404).json({ error: "Not found" });
  const d = new Date(dueDate);
  fu.dueDate=d;
  fu.status="pending";
  (fu as any).completedAt=null;
  await fu.save();
  // also sync venture followUpDate
  const v:any = fu.ventureId;
  if (v) {
    await Venture.findByIdAndUpdate(v._id, { followUpDate: d });
    await createActivity(v._id, v.name, "followup_rescheduled", `Follow-up rescheduled to ${d.toISOString().slice(0,10)} for "${v.name}"`);
  }
  res.json(fu);
}
export async function createFollowUp(req: Request, res: Response) {
  const { ventureId, dueDate } = req.body;
  if (!ventureId || !dueDate) return res.status(400).json({ error: "ventureId and dueDate required" });
  const fu = await FollowUp.create({ ventureId, dueDate: new Date(dueDate), status:"pending" });
  res.status(201).json(fu);
}
