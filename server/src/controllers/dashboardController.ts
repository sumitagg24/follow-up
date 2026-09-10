import { Request, Response } from "express";
import { Venture } from "../models/Venture.js";
import { FollowUp } from "../models/FollowUp.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { asyncHandler } from "../utils/http.js";

async function computeStats() {
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
  const [totalVentures, activeVentures, pendingFollowUps, overdueFollowUps, completedFollowUps, todaysFollowUps, openTasks, completedTasks] =
    await Promise.all([
      Venture.countDocuments(),
      Venture.countDocuments({ status: { $in: ["Evaluation", "Review", "Active"] } }),
      FollowUp.countDocuments({ status: "pending" }),
      FollowUp.countDocuments({ status: "overdue" }),
      FollowUp.countDocuments({ status: "completed" }),
      FollowUp.countDocuments({
        dueDate: { $gte: startOfToday, $lte: endOfToday },
        status: { $in: ["pending", "overdue"] },
      }),
      Task.countDocuments({ status: "pending" }),
      Task.countDocuments({ status: "completed" }),
    ]);
  return { totalVentures, activeVentures, pendingFollowUps, todaysFollowUps, overdueFollowUps, completedFollowUps, openTasks, completedTasks };
}

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  res.json(await computeStats());
});

/** Next follow-ups due within the next N days (pending only, future dates). */
async function upcomingFollowUps(days = 7) {
  const startOfTomorrow = new Date(); startOfTomorrow.setHours(0, 0, 0, 0);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const endOfWindow = new Date(startOfTomorrow);
  endOfWindow.setDate(endOfWindow.getDate() + days - 1);
  endOfWindow.setHours(23, 59, 59, 999);
  return FollowUp.find({ dueDate: { $gte: startOfTomorrow, $lte: endOfWindow }, status: "pending" })
    .populate("ventureId")
    .sort({ dueDate: 1 })
    .limit(10)
    .lean();
}

async function lastAutomationRun() {
  const last = await Activity.findOne({ action: "automation_run" }).sort({ createdAt: -1 }).lean();
  if (!last) return null;
  return {
    at: last.createdAt,
    ...(last.meta as any),
    description: last.description,
  };
}

export const getDashboardData = asyncHandler(async (req: Request, res: Response) => {
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

  const [stats, todays, overdue, upcoming, activities, automation] = await Promise.all([
    computeStats(),
    FollowUp.find({ dueDate: { $gte: startOfToday, $lte: endOfToday }, status: { $in: ["pending", "overdue"] } })
      .populate("ventureId").sort({ dueDate: 1 }).limit(10).lean(),
    FollowUp.find({ status: "overdue" })
      .populate("ventureId").sort({ dueDate: 1 }).limit(10).lean(),
    upcomingFollowUps(7),
    Activity.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    lastAutomationRun(),
  ]);

  res.json({ stats, todaysFollowUps: todays, overdueFollowUps: overdue, upcomingFollowUps: upcoming, recentActivity: activities, lastAutomationRun: automation });
});
