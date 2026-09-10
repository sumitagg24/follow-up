import { Request, Response } from "express";
import { Venture } from "../models/Venture.js";
import { FollowUp } from "../models/FollowUp.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { asyncHandler } from "../utils/http.js";

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const [venturesByStatus, followUpOutcomes, taskStats, activityByDay] = await Promise.all([
    Venture.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    FollowUp.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 13);
      since.setHours(0, 0, 0, 0);
      return Activity.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    })(),
  ]);

  // Fill all 14 days so the chart has a continuous axis (0 for quiet days)
  const activityVolume: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const hit = activityByDay.find((a: any) => a._id === key);
    activityVolume.push({ date: key, count: hit?.count ?? 0 });
  }

  res.json({
    venturesByStatus,
    followUpOutcomes,
    taskStats,
    activityVolume,
  });
});
