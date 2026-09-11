interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border
        bg-brand-100 text-brand-600 border-brand-200
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

// Slaky directory pills: quiet gray by default, solid black for Active,
// green dot for completed, red dot for overdue.
const ventureColorMap: Record<string, string> = {
  New: "bg-white text-brand-600 border-brand-200",
  Evaluation: "bg-brand-100 text-brand-700 border-brand-200",
  Review: "bg-white text-brand-700 border-brand-300",
  Active: "bg-brand-900 text-white border-brand-900",
  Closed: "bg-brand-50 text-brand-400 border-brand-200",
};

const ventureDotMap: Record<string, string> = {
  New: "bg-brand-300",
  Evaluation: "bg-brand-500",
  Review: "bg-blue-500",
  Active: "bg-emerald-400",
  Closed: "bg-brand-300",
};

const followUpColorMap: Record<string, string> = {
  pending: "bg-white text-brand-700 border-brand-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const followUpDotMap: Record<string, string> = {
  pending: "bg-brand-400",
  overdue: "bg-red-500",
  completed: "bg-emerald-500",
};

const taskColorMap: Record<string, string> = {
  pending: "bg-white text-brand-600 border-brand-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function StatusBadge({ status, className = "", size = "md" }: StatusBadgeProps) {
  const isVenture = ["New", "Evaluation", "Review", "Active", "Closed"].includes(status);
  const isFollowUp = ["pending", "overdue", "completed"].includes(status) && !isVenture;
  const colorMap = isVenture ? ventureColorMap : (status === "pending" || status === "completed" ? { ...taskColorMap, ...followUpColorMap } : followUpColorMap);
  const dotMap = isVenture ? ventureDotMap : isFollowUp ? followUpDotMap : { pending: "bg-brand-400", completed: "bg-emerald-500" };
  const classes = colorMap[status] || "bg-brand-100 text-brand-600 border-brand-200";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize tracking-tight
        ${classes}
        ${size === "sm" ? "px-2 py-0.5 text-[10px]" : ""}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotMap[status] ?? "bg-brand-300"}`} aria-hidden="true" />
      {status}
    </span>
  );
}

interface ActivityTypeBadgeProps {
  action: string;
  className?: string;
}

const activityMeta: Record<string, { label: string; className: string; dot: string }> = {
  venture_created: { label: "Venture created", className: "bg-brand-100 text-brand-700 border-brand-200", dot: "bg-brand-500" },
  venture_updated: { label: "Venture updated", className: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  venture_deleted: { label: "Venture deleted", className: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  task_created: { label: "Task created", className: "bg-violet-50 text-violet-700 border-violet-100", dot: "bg-violet-500" },
  task_completed: { label: "Task completed", className: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  followup_completed: { label: "Follow-up completed", className: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  followup_rescheduled: { label: "Rescheduled", className: "bg-brand-100 text-brand-700 border-brand-200", dot: "bg-brand-500" },
  followup_overdue: { label: "Overdue", className: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  reminder_generated: { label: "Reminder", className: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  reminder_email_sent: { label: "Email sent", className: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  reminder_email_dev: { label: "Dev log", className: "bg-brand-100 text-brand-600 border-brand-200", dot: "bg-brand-400" },
  reminder_email_failed: { label: "Failed", className: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  automation_run: { label: "Automation", className: "bg-brand-900 text-white border-brand-900", dot: "bg-emerald-400" },
};

export function ActivityTypeBadge({ action, className = "" }: ActivityTypeBadgeProps) {
  const meta = activityMeta[action];
  if (!meta) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-100 text-brand-600 border border-brand-200 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-brand-300" aria-hidden="true" />
        {action}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.className} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
