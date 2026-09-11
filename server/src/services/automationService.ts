import { FollowUp } from "../models/FollowUp.js";
import { Venture } from "../models/Venture.js";
import { Activity } from "../models/Activity.js";
import { sendReminderEmail } from "./emailService.js";

export async function createActivity(ventureId: any, ventureName: string, action: string, description: string, meta: any = null) {
  return Activity.create({ ventureId, ventureName, action, description, meta });
}

/** Store a structured automation run summary as activity history. */
async function recordRunHistory(summary: {
  triggeredBy: "cron" | "manual";
  checked: number;
  overdueFound: number;
  remindersGenerated: number;
  emailsSent: number;
  durationMs: number;
}) {
  const label = summary.triggeredBy === "cron" ? "scheduled run" : "manual run";
  await Activity.create({
    ventureId: null,
    ventureName: "",
    action: "automation_run",
    description: `Automation ${label}: checked ${summary.checked}, overdue ${summary.overdueFound}, reminders ${summary.remindersGenerated}, emails ${summary.emailsSent}`,
    meta: summary,
  });
}

/** Zeroed-out local midnight for a date (day-anchored comparisons). */
function dayFloor(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** YYYY-MM-DD of a date's local day — used as the dedupe key. */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function checkDueFollowUps(triggeredBy: "cron" | "manual" = "cron") {
  const started = Date.now();
  const now = new Date();
  const startOfToday = dayFloor(now);
  const todayKey = dayKey(now);

  const pending = await FollowUp.find({ status: { $in: ["pending", "overdue"] } }).populate("ventureId");

  let overdueCount = 0;
  let remindersGenerated = 0;
  let emailsSent = 0;
  const checked = pending.length;

  for (const fu of pending) {
    const v: any = fu.ventureId;
    if (!v?._id) continue;

    const dueDay = dayFloor(fu.dueDate);
    const isOverdue = dueDay < startOfToday;
    const isDueToday = dueDay.getTime() === startOfToday.getTime();
    if (!isOverdue && !isDueToday) continue;

    // Mark overdue if pending and past due
    if (isOverdue && fu.status === "pending") {
      fu.status = "overdue";
      await fu.save();
      await createActivity(v._id, v.name, "followup_overdue", `Follow-up for "${v.name}" is overdue (was due ${dayKey(fu.dueDate)})`);
      overdueCount++;
    }

    // Duplicate prevention: one reminder per venture per due-day.
    //
    // Known MVP limitation: the check-then-insert here is not atomic, so two
    // automation runs overlapping in time could both pass the findOne before
    // either inserts, producing a duplicate reminder. In practice the daily
    // cron and occasional manual runs never overlap, and same-process repeats
    // are fully suppressed (covered by tests). Accepted over adding a
    // queue/unique-index infrastructure for a single-instance backend.
    const key = dayKey(fu.dueDate);
    const existing = await Activity.findOne({
      ventureId: v._id,
      action: "reminder_generated",
      description: { $regex: `due ${key}\\b` },
    });
    if (existing) continue;

    await createActivity(
      v._id, v.name, "reminder_generated",
      `Reminder generated for "${v.name}" — due ${key} (${fu.status})`
    );
    remindersGenerated++;

    const emailResult = await sendReminderEmail({
      ventureName: v.name,
      founderName: v.founderName,
      founderEmail: v.founderEmail,
      followUpDate: fu.dueDate,
      status: fu.status,
    });
    if (emailResult.sent) {
      emailsSent++;
      await createActivity(v._id, v.name, "reminder_email_sent", `Reminder email sent for "${v.name}" to ${v.founderEmail}`);
    } else if (emailResult.devLogged) {
      await createActivity(v._id, v.name, "reminder_email_dev", `Reminder email (dev log) for "${v.name}" — due ${key}`);
    } else if ((emailResult as any).error) {
      await createActivity(v._id, v.name, "reminder_email_failed", `Reminder email failed for "${v.name}": ${(emailResult as any).error}`);
    }
  }

  const summary = { triggeredBy, checked, overdueFound: overdueCount, remindersGenerated, emailsSent, durationMs: Date.now() - started };

  // Automation history lives in the existing Activity collection (meta field)
  try {
    await recordRunHistory(summary);
  } catch (e) {
    console.error("[AUTOMATION] Failed to record run history", e);
  }

  return summary;
}
