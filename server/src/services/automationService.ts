import { FollowUp } from "../models/FollowUp.js";
import { Venture } from "../models/Venture.js";
import { Activity } from "../models/Activity.js";
import { sendReminderEmail } from "./emailService.js";

export async function createActivity(ventureId: any, ventureName: string, action: string, description: string) {
  return Activity.create({ ventureId, ventureName, action, description });
}

export async function checkDueFollowUps() {
  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
  const endOfToday = new Date(now); endOfToday.setHours(23,59,59,999);
  const startOfTodayISO = startOfToday.toISOString().slice(0,10);

  const pending = await FollowUp.find({ status: { $in: ["pending","overdue"] } }).populate("ventureId");

  let overdueCount = 0;
  let remindersGenerated = 0;
  let emailsSent = 0;
  let checked = pending.length;

  for (const fu of pending) {
    const v: any = fu.ventureId;
    if (!v) continue;

    const due = new Date(fu.dueDate);
    due.setHours(0,0,0,0);
    const isOverdue = due < startOfToday;
    const isDueToday = due.getTime() === startOfToday.getTime();

    // Mark overdue if pending and past due
    if (isOverdue && fu.status === "pending") {
      fu.status = "overdue";
      await fu.save();
      await createActivity(v._id, v.name, "followup_overdue", `Follow-up for "${v.name}" is overdue (was due ${fu.dueDate.toISOString().slice(0,10)})`);
      overdueCount++;
    }

    const shouldRemind = isOverdue || isDueToday;
    if (!shouldRemind) continue;

    // Duplicate prevention: same venture, same due-date-day, same action within today
    // We check if there is already a reminder activity for this venture today for this due date.
    // Simplest: check Activity where action=reminder_generated and description contains due date and createdAt >= startOfToday
    const dueStr = fu.dueDate.toISOString().slice(0,10);
    const existing = await Activity.findOne({
      ventureId: v._id,
      action: "reminder_generated",
      description: { $regex: dueStr },
      createdAt: { $gte: startOfToday }
    });
    if (existing) continue;

    // Generate reminder activity
    await createActivity(v._id, v.name, "reminder_generated", `Reminder generated for "${v.name}" — due ${dueStr} (${fu.status})`);
    remindersGenerated++;

    // Attempt email
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
      await createActivity(v._id, v.name, "reminder_email_dev", `Reminder email (dev log) for "${v.name}" — due ${dueStr}`);
    } else if ((emailResult as any).error) {
      await createActivity(v._id, v.name, "reminder_email_failed", `Reminder email failed for "${v.name}": ${(emailResult as any).error}`);
    }
  }

  return { checked, overdueFound: overdueCount, remindersGenerated, emailsSent };
}
