import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { EmptyState } from "../components/EmptyState";
import { SkeletonCard } from "../components/Skeleton";
import { usePageTitle } from "../hooks/usePageTitle";
import { BarChart3 } from "lucide-react";

type Analytics = {
  venturesByStatus: { _id: string; count: number }[];
  followUpOutcomes: { _id: string; count: number }[];
  taskStats: { _id: string; count: number }[];
  activityVolume: { date: string; count: number }[];
};

function BarList({ title, data, colors }: { title: string; data: { _id: string; count: number }[]; colors: Record<string, string> }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="bg-white rounded-2xl border p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {total === 0 ? (
        <p className="text-sm text-slate-500">No data yet — this chart fills in as ventures are created.</p>
      ) : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d._id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="capitalize">{d._id}</span>
                <span className="text-slate-500">{d.count}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`${d._id}: ${d.count}`}>
                <div className={`h-full rounded-full ${colors[d._id] ?? "bg-slate-400"}`} style={{ width: `${(d.count / total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Analytics() {
  usePageTitle("Analytics");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAnalytics().then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const maxDaily = data ? Math.max(...data.activityVolume.map((d) => d.count), 1) : 1;
  const totalActivity = data ? data.activityVolume.reduce((s, d) => s + d.count, 0) : 0;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <Header title="Analytics" subtitle="Live aggregates from your operational data" />

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : !data || totalActivity === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Analytics will populate as activity accumulates"
          desc="Charts here are computed from real venture, follow-up, task and activity records. Create a venture or run the automation to see data appear."
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <BarList
            title="Ventures by Status"
            data={data.venturesByStatus}
            colors={{ New: "bg-slate-400", Evaluation: "bg-amber-400", Review: "bg-blue-400", Active: "bg-emerald-500", Closed: "bg-zinc-300" }}
          />
          <BarList
            title="Follow-up Outcomes"
            data={data.followUpOutcomes}
            colors={{ pending: "bg-amber-400", overdue: "bg-red-500", completed: "bg-emerald-500" }}
          />

          {/* Activity volume — 14-day bar chart */}
          <div className="bg-white rounded-2xl border p-5 lg:col-span-2">
            <h3 className="font-semibold mb-1">Activity Volume</h3>
            <p className="text-xs text-slate-500 mb-4">Last 14 days • {totalActivity} events</p>
            {totalActivity === 0 ? (
              <p className="text-sm text-slate-500">No activity in the last two weeks.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-32" role="img" aria-label={`Activity over the last 14 days, ${totalActivity} total events`}>
                {data.activityVolume.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.date}: ${d.count} events`}>
                    <div
                      className={`w-full rounded-t-md ${d.count > 0 ? "bg-slate-900" : "bg-slate-100"}`}
                      style={{ height: `${Math.max((d.count / maxDaily) * 100, 4)}%` }}
                    />
                    <span className="text-[9px] text-slate-400 truncate w-full text-center">{d.date.slice(8)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <BarList
              title="Task Completion"
              data={data.taskStats}
              colors={{ pending: "bg-amber-400", completed: "bg-emerald-500" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
