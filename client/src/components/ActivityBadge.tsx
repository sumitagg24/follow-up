import { Building2, CheckCircle2, CalendarClock, BellRing, Mail, MailWarning, ListTodo, RefreshCw, Bot, AlertTriangle, UserRoundPen, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ACTIVITY_META: Record<string, { label: string; icon: LucideIcon; cls: string }> = {
  venture_created:        { label: "Venture created",      icon: Building2,      cls: "bg-slate-100 text-slate-700" },
  venture_updated:        { label: "Venture updated",      icon: UserRoundPen,   cls: "bg-blue-50 text-blue-700" },
  venture_deleted:        { label: "Venture deleted",      icon: Trash2,         cls: "bg-red-50 text-red-700" },
  task_created:           { label: "Task created",         icon: ListTodo,       cls: "bg-violet-50 text-violet-700" },
  task_completed:         { label: "Task completed",       icon: CheckCircle2,   cls: "bg-emerald-50 text-emerald-700" },
  followup_completed:     { label: "Follow-up completed",  icon: CheckCircle2,   cls: "bg-emerald-50 text-emerald-700" },
  followup_rescheduled:   { label: "Follow-up rescheduled",icon: CalendarClock,  cls: "bg-amber-50 text-amber-700" },
  followup_overdue:       { label: "Follow-up overdue",    icon: AlertTriangle,  cls: "bg-red-50 text-red-700" },
  reminder_generated:     { label: "Reminder generated",   icon: BellRing,       cls: "bg-blue-50 text-blue-700" },
  reminder_email_sent:    { label: "Email sent",           icon: Mail,           cls: "bg-emerald-50 text-emerald-700" },
  reminder_email_dev:     { label: "Dev email logged",     icon: MailWarning,    cls: "bg-amber-50 text-amber-700" },
  reminder_email_failed:  { label: "Email failed",         icon: MailWarning,    cls: "bg-red-50 text-red-700" },
  automation_run:         { label: "Automation run",       icon: Bot,            cls: "bg-slate-900 text-white" },
};

export function ActivityBadge({ action }: { action: string }) {
  const meta = ACTIVITY_META[action] ?? { label: action, icon: RefreshCw, cls: "bg-slate-100 text-slate-600" };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>
      <Icon size={11} /> {meta.label}
    </span>
  );
}
