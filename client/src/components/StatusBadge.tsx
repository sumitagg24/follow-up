import type { VentureStatus, FollowUpStatus, TaskStatus } from "../types";

export function VentureBadge({ status }: { status: VentureStatus }) {
  const colors: Record<string, string> = {
    New: "bg-brand-100 text-brand-700 border-brand-200",
    Evaluation: "bg-accent-50 text-accent-700 border-accent-200",
    Review: "bg-blue-50 text-blue-700 border-blue-200",
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Closed: "bg-zinc-100 text-zinc-500 border-zinc-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] ?? "bg-brand-100 text-brand-600 border-brand-200"}`}
    >
      {status}
    </span>
  );
}

export function FollowUpBadge({ status }: { status: FollowUpStatus }) {
  const colors: Record<string, string> = {
    pending: "bg-accent-50 text-accent-700 border-accent-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${colors[status] ?? "bg-brand-100 text-brand-600 border-brand-200"}`}
    >
      {status}
    </span>
  );
}

export function TaskBadge({ status }: { status: TaskStatus }) {
  const colors = status === "completed"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-brand-100 text-brand-600 border-brand-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${colors}`}
    >
      {status}
    </span>
  );
}
