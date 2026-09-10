import { Request, Response } from "express";
import { Activity } from "../models/Activity.js";
export async function listActivity(req: Request, res: Response) {
  const acts = await Activity.find({}).sort({ createdAt: -1 }).limit(100).lean();
  res.json(acts);
}
