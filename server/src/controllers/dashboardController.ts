import { Request, Response } from "express";
import { Venture } from "../models/Venture.js";
import { FollowUp } from "../models/FollowUp.js";
import { Activity } from "../models/Activity.js";

export async function getStats(req: Request, res: Response) {
  const totalVentures = await Venture.countDocuments();
  const pendingFollowUps = await FollowUp.countDocuments({ status: "pending" });
  const overdueFollowUps = await FollowUp.countDocuments({ status: "overdue" });
  const completedFollowUps = await FollowUp.countDocuments({ status: "completed" });
  const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
  const endOfToday = new Date(); endOfToday.setHours(23,59,59,999);
  const todaysFollowUps = await FollowUp.countDocuments({ dueDate: { $gte: startOfToday, $lte: endOfToday }, status: { $in: ["pending","overdue"] } });
  res.json({ totalVentures, pendingFollowUps, todaysFollowUps, overdueFollowUps, completedFollowUps });
}

export async function getDashboardData(req: Request, res: Response) {
  const stats = await (async()=>{
    const totalVentures = await Venture.countDocuments();
    const pendingFollowUps = await FollowUp.countDocuments({ status: "pending" });
    const overdueFollowUps = await FollowUp.countDocuments({ status: "overdue" });
    const completedFollowUps = await FollowUp.countDocuments({ status: "completed" });
    const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
    const endOfToday = new Date(); endOfToday.setHours(23,59,59,999);
    const todaysFollowUps = await FollowUp.countDocuments({ dueDate: { $gte: startOfToday, $lte: endOfToday }, status: { $in: ["pending","overdue"] } });
    return { totalVentures, pendingFollowUps, todaysFollowUps, overdueFollowUps, completedFollowUps };
  })();
  const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
  const endOfToday = new Date(); endOfToday.setHours(23,59,59,999);
  const todays = await FollowUp.find({ dueDate: { $gte: startOfToday, $lte: endOfToday } }).populate("ventureId").sort({ dueDate:1 }).lean();
  // also include overdue for today's list ? spec says Today's Follow-ups: we show today's due only.
  // Let's include pending/overdue due today + overdue
  const activities = await Activity.find({}).sort({ createdAt:-1 }).limit(10).lean();
  res.json({ stats, todaysFollowUps: todays, recentActivity: activities });
}
