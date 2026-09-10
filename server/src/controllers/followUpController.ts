import { Request, Response } from "express";
import { FollowUp } from "../models/FollowUp.js";
import { Venture } from "../models/Venture.js";
import { createActivity } from "../services/automationService.js";
import { asyncHandler, badRequest, isValidObjectId, notFound } from "../utils/http.js";
import { parseDate, validateFollowUpPayload } from "../utils/validate.js";

export const listFollowUps = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const q: any = {};
  if (status) {
    if (!["pending", "completed", "overdue"].includes(String(status))) throw badRequest("Invalid status filter");
    q.status = status;
  }
  const fus = await FollowUp.find(q).populate("ventureId").sort({ dueDate: 1 }).lean();
  res.json(fus);
});

export const completeFollowUp = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) throw badRequest("Invalid follow-up id");
  const fu = await FollowUp.findById(req.params.id).populate("ventureId");
  if (!fu) throw notFound("Follow-up");

  // Idempotent: completing twice keeps one activity
  if (fu.status !== "completed") {
    fu.status = "completed";
    fu.completedAt = new Date();
    await fu.save();
    const v: any = fu.ventureId;
    if (v?._id) await createActivity(v._id, v.name, "followup_completed", `Follow-up completed for "${v.name}"`);
  }
  res.json(fu);
});

export const rescheduleFollowUp = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) throw badRequest("Invalid follow-up id");
  const { dueDate } = req.body ?? {};
  const d = parseDate(dueDate);
  if (!d) throw badRequest("dueDate must be a valid date");

  const fu = await FollowUp.findById(req.params.id).populate("ventureId");
  if (!fu) throw notFound("Follow-up");

  fu.dueDate = d;
  fu.status = "pending";
  fu.completedAt = null;
  await fu.save();

  const v: any = fu.ventureId;
  if (v?._id) {
    await Venture.findByIdAndUpdate(v._id, { followUpDate: d });
    await createActivity(
      v._id, v.name, "followup_rescheduled",
      `Follow-up rescheduled to ${d.toISOString().slice(0, 10)} for "${v.name}"`
    );
  }
  res.json(fu);
});

export const createFollowUp = asyncHandler(async (req: Request, res: Response) => {
  const errors = validateFollowUpPayload(req.body ?? {});
  if (errors.length) throw badRequest("Validation failed", errors);

  const v = await Venture.findById(String(req.body.ventureId).trim());
  if (!v) throw notFound("Venture");

  const fu = await FollowUp.create({
    ventureId: v._id,
    dueDate: parseDate(req.body.dueDate)!,
    status: "pending",
  });
  res.status(201).json(fu);
});
