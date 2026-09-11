import { useEffect, useState } from "react";
import { api } from "../api/client";
import { PageHeader } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { SkeletonCard } from "../components/Skeleton";
import { usePageTitle } from "../hooks/usePageTitle";
import { Card } from "../components/Card";
import { BarChart3 } from "lucide-react";

type AnalyticsData = {
  venturesByStatus: { _id: string; count: number }[];
  followUpOutcomes: { _id: string; count: number }[];
  taskStats: { _id: string; count: number }[];
  activityVolume: { date: string; count: number }[];
};

function BarChart({
  title,
  data,
  colors,
  height = 200,
}: {
  title: string;
  data: { _id: string; count: number }[];
  colors: Record<string, string>;
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const max = Math.max(...data.map((d) => d.count), 0) || 1;

  return (
    <Card padding="md">
      <h3 className="text-[15px] font-bold text-brand-900 tracking-tight mb-0.5">{title}</h3>
      <p className="text-xs text-brand-400 mb-4 tabular-nums">
        {total === 0 ? "No data yet" : `${total} total`}
      </p>
      {total === 0 ? (
        <p className="text-[13px] text-brand-400 py-4">
          This chart fills in as data accumulates.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d._id}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[13px] font-medium text-brand-600 capitalize">{d._id}</span>
                <span className="text-[13px] font-bold text-brand-900 tabular-nums">{d.count}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-brand-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colors[d._id] ?? "bg-brand-400"}`}
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ActivityVolumeChart({
  data,
  total,
}: {
  data: { date: string; count: number }[];
  total: number;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card padding="md" className="lg:col-span-2">
      <div className="flex items-center justify-between mb-0.5">
        <h3 className="text-[15px] font-bold text-brand-900 tracking-tight">Activity volume</h3>
        <span className="slaky-pill tabular-nums">{total} events</span>
      </div>
      <p className="text-xs text-brand-400 mb-4">
        Last 14 days
      </p>
      {total === 0 ? (
        <p className="text-[13px] text-brand-400 py-4">
          No activity in the last two weeks.
        </p>
      ) : (
        <div className="flex items-end gap-1.5 h-40">
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={`
                  w-full rounded-t-full transition-all duration-300
                  ${d.count > 0 ? "bg-brand-900" : "bg-brand-100"}
                `}
                style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
                title={`${d.date}: ${d.count} events`}
                role="img"
                aria-label={`${d.date}: ${d.count} events`}
              />
              <span className="text-[9px] text-brand-400 truncate w-full text-center tabular-nums">
                {d.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function Analytics() {
  usePageTitle("Leaderboard");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAnalytics()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalActivity = data ? data.activityVolume.reduce((s, d) => s + d.count, 0) : 0;

  const ventureColors: Record<string, string> = {
    New: "bg-brand-300",
    Evaluation: "bg-brand-500",
    Review: "bg-blue-500",
    Active: "bg-brand-900",
    Closed: "bg-brand-200",
  };

  const fuColors: Record<string, string> = {
    pending: "bg-brand-400",
    overdue: "bg-red-500",
    completed: "bg-emerald-500",
  };

  const taskColors: Record<string, string> = {
    pending: "bg-brand-400",
    completed: "bg-emerald-500",
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Leaderboard"
        subtitle="Live rankings and aggregates — computed from real records, never a screenshot"
      />

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      ) : !data ? (
        <EmptyState
          icon={BarChart3}
          title="Leaderboard will populate as data accumulates"
          description="Charts are computed from real venture, follow-up, task, and activity records. Create a venture or run the automation to see data appear."
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
          <BarChart
            title="Ventures by status"
            data={data.venturesByStatus}
            colors={ventureColors}
          />
          <BarChart
            title="Follow-up outcomes"
            data={data.followUpOutcomes}
            colors={fuColors}
          />
          <ActivityVolumeChart data={data.activityVolume} total={totalActivity} />
          <BarChart
            title="Task completion"
            data={data.taskStats}
            colors={taskColors}
          />
        </div>
      )}
    </div>
  );
}
