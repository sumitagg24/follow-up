import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { PageHeader } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { SkeletonRow } from "../components/Skeleton";
import { usePageTitle } from "../hooks/usePageTitle";
import { Activity as ActivityIcon } from "lucide-react";
import { ActivityTypeBadge } from "../components/Badge";

const FILTERS = [
  { key: "", label: "All events" },
  { key: "venture_created", label: "Ventures" },
  { key: "venture_updated", label: "Updates" },
  { key: "venture_deleted", label: "Deletions" },
  { key: "task_created", label: "Tasks" },
  { key: "task_completed", label: "Completions" },
  { key: "followup_completed", label: "Follow-ups" },
  { key: "followup_rescheduled", label: "Reschedules" },
  { key: "followup_overdue", label: "Overdue" },
  { key: "reminder_generated", label: "Reminders" },
  { key: "reminder_email_sent", label: "Emails" },
  { key: "reminder_email_dev", label: "Dev logs" },
  { key: "reminder_email_failed", label: "Failures" },
  { key: "automation_run", label: "Automation" },
];

export function ActivityLog() {
  usePageTitle("Feed");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .getActivity(action ? { action } : undefined)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [action]);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Feed"
        subtitle="Chronological feed of every verified event — never a spreadsheet"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter activity by type">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setAction(f.key)}
            aria-pressed={action === f.key}
            className={`
              px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors
              ${action === f.key
                ? "bg-brand-900 text-white"
                : "bg-white border border-brand-200 text-brand-500 hover:border-brand-400 hover:text-brand-900"
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title={action ? `No "${FILTERS.find((f) => f.key === action)?.label}" events` : "No activity yet"}
          description={
            action
              ? "Try a different filter to see more events."
              : "Actions like creating ventures, completing tasks, and running reminder checks will appear here."
          }
        />
      ) : (
        <div className="slaky-card overflow-hidden divide-y divide-brand-100">
          {data.map((a) => (
            <div key={a._id} className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-start gap-2.5 hover:bg-brand-50/70 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-brand-900 leading-relaxed mb-2">
                  {a.description}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <ActivityTypeBadge action={a.action} />
                  <span className="text-[11px] text-brand-400 tabular-nums">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                  {a.ventureName && (
                    <span className="text-[11px] text-brand-400">· {a.ventureName}</span>
                  )}
                  {a.ventureId && typeof a.ventureId === "string" && (
                    <Link
                      to={`/ventures/${a.ventureId}`}
                      className="text-[11px] font-semibold text-brand-900 hover:text-brand-500 transition-colors"
                    >
                      View venture →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
