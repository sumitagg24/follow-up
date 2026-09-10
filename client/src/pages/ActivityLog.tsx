import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { SkeletonRow } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { ActivityBadge, ACTIVITY_META } from "../components/ActivityBadge";
import { Activity as ActivityIcon } from "lucide-react";

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  ...Object.entries(ACTIVITY_META)
    .filter(([k]) => k !== "automation_run")
    .map(([k, m]) => ({ key: k, label: m.label })),
];

export function ActivityLog() {
  usePageTitle("Activity Log");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState("");

  useEffect(() => {
    setLoading(true);
    api.getActivity(action ? { action } : undefined)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [action]);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <Header title="Activity Log" subtitle="Chronological feed of all system events" />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" role="group" aria-label="Filter by activity type">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setAction(f.key)}
            aria-pressed={action === f.key}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${action === f.key ? "bg-slate-900 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title={action ? `No "${FILTERS.find((f) => f.key === action)?.label}" events` : "No activity yet"}
          desc={action ? "Try a different filter." : "Actions like creating ventures, completing tasks and running reminder checks will appear here."}
        />
      ) : (
        <div className="bg-white rounded-2xl border divide-y">
          {data.map((a) => (
            <div key={a._id} className="p-4 flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm">{a.description}</div>
                <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-2">
                  <ActivityBadge action={a.action} />
                  <span>{new Date(a.createdAt).toLocaleString()}</span>
                  {a.ventureName && <span>• {a.ventureName}</span>}
                  {a.ventureId && <Link to={`/ventures/${a.ventureId}`} className="text-blue-600 hover:underline">View venture</Link>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
