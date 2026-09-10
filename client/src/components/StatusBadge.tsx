import type { VentureStatus, FollowUpStatus, TaskStatus } from "../types";

const ventureColors: Record<string,string> = {
  New:"bg-slate-100 text-slate-700 border-slate-200",
  Evaluation:"bg-amber-50 text-amber-700 border-amber-200",
  Review:"bg-blue-50 text-blue-700 border-blue-200",
  Active:"bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed:"bg-zinc-100 text-zinc-600 border-zinc-200",
};
const fuColors: Record<string,string> = {
  pending:"bg-amber-50 text-amber-700 border-amber-200",
  overdue:"bg-red-50 text-red-700 border-red-200",
  completed:"bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function VentureBadge({ status }: { status: VentureStatus }) {
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${ventureColors[status]||"bg-slate-100"}`}>{status}</span>;
}
export function FollowUpBadge({ status }: { status: FollowUpStatus }) {
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${fuColors[status]}`}>{status}</span>;
}
export function TaskBadge({ status }: { status: TaskStatus }) {
  return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${status==="completed"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-slate-50 text-slate-600 border-slate-200"}`}>{status}</span>;
}
