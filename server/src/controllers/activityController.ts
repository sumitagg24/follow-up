import { Request, Response } from "express";
import { Activity } from "../models/Activity.js";
import { asyncHandler, badRequest } from "../utils/http.js";

const KNOWN_ACTIONS = [
  "venture_created", "venture_updated", "venture_deleted", "task_created", "task_completed",
  "followup_completed", "followup_rescheduled", "followup_overdue",
  "reminder_generated", "reminder_email_sent", "reminder_email_dev", "reminder_email_failed", "automation_run",
];

export const listActivity = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "100"), 10) || 100, 1), 200);
  const q: any = {};
  const { action, ventureId } = req.query;
  if (action) {
    if (!KNOWN_ACTIONS.includes(String(action))) throw badRequest(`Unknown action filter. Valid: ${KNOWN_ACTIONS.join(", ")}`);
    q.action = action;
  }
  if (ventureId) q.ventureId = ventureId;
  const acts = await Activity.find(q).sort({ createdAt: -1 }).limit(limit).lean();
  res.json(acts);
});
