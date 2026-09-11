import type { VentureStatus, FollowUpStatus, TaskStatus } from "../types";

function Pill({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border tracking-tight ${className}`}
    >
      {children}
    </span>
  );
}

function Dot({ className = "" }: { className?: string }) {
  return <span className={`w-1.5 h-1.5 rounded-full ${className}`} aria-hidden="true" />;
}

export function VentureBadge({ status }: { status: VentureStatus }) {
  const colors: Record<string, string> = {
    New: "bg-white text-brand-600 border-brand-200",
    Evaluation: "bg-brand-100 text-brand-700 border-brand-200",
    Review: "bg-white text-brand-700 border-brand-300",
    Active: "bg-brand-900 text-white border-brand-900",
    Closed: "bg-brand-50 text-brand-400 border-brand-200",
  };
  const dots: Record<string, string> = {
    New: "bg-brand-300",
    Evaluation: "bg-brand-500",
    Review: "bg-blue-500",
    Active: "bg-emerald-400",
    Closed: "bg-brand-300",
  };
  return (
    <Pill className={colors[status] ?? "bg-brand-100 text-brand-600 border-brand-200"}>
      <Dot className={dots[status] ?? "bg-brand-300"} />
      {status}
    </Pill>
  );
}

export function FollowUpBadge({ status }: { status: FollowUpStatus }) {
  const colors: Record<string, string> = {
    pending: "bg-white text-brand-700 border-brand-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const dots: Record<string, string> = {
    pending: "bg-brand-400",
    overdue: "bg-red-500",
    completed: "bg-emerald-500",
  };
  return (
    <Pill className={`capitalize ${colors[status] ?? "bg-brand-100 text-brand-600 border-brand-200"}`}>
      <Dot className={dots[status] ?? "bg-brand-300"} />
      {status}
    </Pill>
  );
}

export function TaskBadge({ status }: { status: TaskStatus }) {
  const colors =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-white text-brand-600 border-brand-200";
  return (
    <Pill className={`capitalize ${colors}`}>
      <Dot className={status === "completed" ? "bg-emerald-500" : "bg-brand-400"} />
      {status}
    </Pill>
  );
}
