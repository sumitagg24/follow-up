import type { LucideIcon } from "lucide-react";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
        bg-brand-100 text-brand-700 border-brand-200
        ${className}
      `}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: "New" | "Evaluation" | "Review" | "Active" | "Closed" | "pending" | "completed" | "overdue" | "pending" | "completed";
  className?: string;
  size?: "sm" | "md";
}

const ventureColorMap: Record<string, string> = {
  New: "bg-brand-100 text-brand-700 border-brand-200",
  Evaluation: "bg-accent-50 text-accent-700 border-accent-200",
  Review: "bg-blue-50 text-blue-700 border-blue-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

const followUpColorMap: Record<string, string> = {
  pending: "bg-accent-50 text-accent-700 border-accent-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const taskColorMap: Record<string, string> = {
  pending: "bg-brand-100 text-brand-600 border-brand-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function StatusBadge({ status, className = "", size = "md" }: StatusBadgeProps) {
  const isVenture = ["New", "Evaluation", "Review", "Active", "Closed"].includes(status);
  const colorMap = isVenture ? ventureColorMap : (status === "pending" || status === "completed" ? taskColorMap : followUpColorMap);
  const classes = colorMap[status] || "bg-brand-100 text-brand-600 border-brand-200";

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize
        ${classes}
        ${size === "sm" ? "px-1.5 py-0" : ""}
        ${className}
      `}
    >
      {status}
    </span>
  );
}

interface ActivityTypeBadgeProps {
  action: string;
  className?: string;
}

const activityMeta: Record<string, { label: string; className: string }> = {
  venture_created: { label: "Venture created", className: "bg-brand-100 text-brand-700" },
  venture_updated: { label: "Venture updated", className: "bg-blue-50 text-blue-700" },
  venture_deleted: { label: "Venture deleted", className: "bg-red-50 text-red-700" },
  task_created: { label: "Task created", className: "bg-violet-50 text-violet-700" },
  task_completed: { label: "Task completed", className: "bg-emerald-50 text-emerald-700" },
  followup_completed: { label: "Follow-up completed", className: "bg-emerald-50 text-emerald-700" },
  followup_rescheduled: { label: "Rescheduled", className: "bg-accent-50 text-accent-700" },
  followup_overdue: { label: "Overdue", className: "bg-red-50 text-red-700" },
  reminder_generated: { label: "Reminder", className: "bg-blue-50 text-blue-700" },
  reminder_email_sent: { label: "Email sent", className: "bg-emerald-50 text-emerald-700" },
  reminder_email_dev: { label: "Dev log", className: "bg-accent-50 text-accent-700" },
  reminder_email_failed: { label: "Failed", className: "bg-red-50 text-red-700" },
  automation_run: { label: "Automation", className: "bg-brand-900 text-white" },
};

export function ActivityTypeBadge({ action, className = "" }: ActivityTypeBadgeProps) {
  const meta = activityMeta[action];
  if (!meta) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-600 border-brand-200 ${className}`}>
        {action}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${meta.className} border-0 ${className}`}>
      {meta.label}
    </span>
  );
}
