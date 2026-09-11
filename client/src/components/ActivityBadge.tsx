import { Building2, CheckCircle2, CalendarClock, BellRing, Mail, MailWarning, ListTodo, RefreshCw, Bot, AlertTriangle, UserRoundPen, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ACTIVITY_META: Record<string, { label: string; icon: LucideIcon; cls: string; dot: string }> = {
  venture_created:        { label: "Venture created",      icon: Building2,      cls: "bg-brand-100 text-brand-700 border-brand-200", dot: "bg-brand-500" },
  venture_updated:        { label: "Venture updated",      icon: UserRoundPen,   cls: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  venture_deleted:        { label: "Venture deleted",      icon: Trash2,         cls: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  task_created:           { label: "Task created",         icon: ListTodo,       cls: "bg-violet-50 text-violet-700 border-violet-100", dot: "bg-violet-500" },
  task_completed:         { label: "Task completed",       icon: CheckCircle2,   cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  followup_completed:     { label: "Follow-up completed",  icon: CheckCircle2,   cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  followup_rescheduled:   { label: "Rescheduled",          icon: CalendarClock,  cls: "bg-brand-100 text-brand-700 border-brand-200", dot: "bg-brand-500" },
  followup_overdue:       { label: "Overdue",              icon: AlertTriangle,  cls: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  reminder_generated:     { label: "Reminder",             icon: BellRing,       cls: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  reminder_email_sent:    { label: "Email sent",           icon: Mail,           cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  reminder_email_dev:     { label: "Dev log",              icon: MailWarning,    cls: "bg-brand-100 text-brand-600 border-brand-200", dot: "bg-brand-400" },
  reminder_email_failed:  { label: "Failed",              icon: MailWarning,    cls: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  automation_run:         { label: "Automation",           icon: Bot,            cls: "bg-brand-900 text-white border-brand-900", dot: "bg-emerald-400" },
};

export function ActivityBadge({ action }: { action: string }) {
  const meta = ACTIVITY_META[action] ?? { label: action, icon: RefreshCw, cls: "bg-brand-100 text-brand-600 border-brand-200", dot: "bg-brand-300" };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border tracking-tight ${meta.cls}`}>
      <Icon size={11} /> {meta.label}
    </span>
  );
}
