import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { PageHeader } from "../components/Card";
import { TaskBadge } from "../components/StatusBadge";
import { EmptyState } from "../components/EmptyState";
import { SkeletonRow } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { CheckCircle2, ListTodo, Calendar } from "lucide-react";
import { fmtDate } from "../utils/format";

type Filter = "all" | "pending" | "completed";

export function Tasks() {
  usePageTitle("Tasks");
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const toast = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getTasks();
      setTasks(result);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function complete(t: any) {
    try {
      await api.completeTask(t._id);
      toast.push(`"${t.title}" completed`, "success");
      load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
  }

  const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const doneCount = tasks.filter((t) => t.status === "completed").length;

  const tabs: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: tasks.length },
    { key: "pending", label: "Open", count: pendingCount },
    { key: "completed", label: "Done", count: doneCount },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Tasks"
        subtitle={`${pendingCount} open · ${doneCount} completed · verified live`}
      />

      {/* Tabs — Slaky pills */}
      <div className="flex gap-2 mb-5" role="tablist" aria-label="Task filter">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              px-4 py-2 rounded-full text-[13px] font-semibold transition-colors
              ${filter === tab.key
                ? "bg-brand-900 text-white"
                : "bg-white border border-brand-200 text-brand-500 hover:border-brand-400 hover:text-brand-900"
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`
                  ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums
                  ${filter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-brand-100 text-brand-500"
                  }
                `}
              >
                {tab.count}
              </span>
            )}
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
        <div className="slaky-card p-6 text-center">
          <p className="text-sm font-semibold text-red-700 mb-1">Couldn't load tasks</p>
          <p className="text-[13px] text-brand-500 mb-4">{error}</p>
          <button onClick={load} className="slaky-btn-secondary px-4 py-2 text-[13px]">
            Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={
            filter === "all"
              ? "No tasks yet"
              : filter === "pending"
              ? "No open tasks"
              : "No completed tasks"
          }
          description={
            filter === "all"
              ? "Tasks are automatically created when you add a venture — initial review, founder follow-up, and internal discussion."
              : filter === "pending"
              ? "All tasks are completed. New tasks appear as ventures are created."
              : "Complete a task to see it here."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {visible.map((t) => (
            <div
              key={t._id}
              className={`
                slaky-card p-4
                flex flex-col sm:flex-row sm:items-center justify-between gap-3
                ${t.status === "completed"
                  ? "!border-emerald-200 !bg-emerald-50/40"
                  : "slaky-card-hover"
                }
              `}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`
                      text-sm font-bold tracking-tight truncate
                      ${t.status === "completed" ? "line-through text-brand-400" : "text-brand-900"}
                    `}
                  >
                    {t.title}
                  </span>
                  <TaskBadge status={t.status} />
                </div>
                <div className="flex items-center gap-2 text-[13px] text-brand-500 mt-1 flex-wrap">
                  {t.ventureId && typeof t.ventureId === "object" && t.ventureId._id ? (
                    <Link
                      to={`/ventures/${t.ventureId._id}`}
                      className="text-brand-900 hover:text-brand-500 font-semibold transition-colors"
                    >
                      {t.ventureId.name}
                    </Link>
                  ) : (
                    <span>Unknown venture</span>
                  )}
                  <span className="text-brand-300" aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 tabular-nums">
                    <Calendar size={11} />
                    {t.dueDate ? fmtDate(t.dueDate) : "—"}
                  </span>
                  {t.status === "completed" && t.completedAt && (
                    <>
                      <span className="text-brand-300" aria-hidden="true">·</span>
                      <span className="text-brand-400">
                        Completed {new Date(t.completedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {t.status === "pending" ? (
                <button
                  onClick={() => complete(t)}
                  className="slaky-btn-primary px-4 py-2 text-xs shrink-0"
                >
                  <CheckCircle2 size={14} />
                  Complete
                </button>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600">
                  <CheckCircle2 size={14} /> Done
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
