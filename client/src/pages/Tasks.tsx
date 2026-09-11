import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { PageHeader } from "../components/Card";
import { TaskBadge } from "../components/StatusBadge";
import { EmptyState } from "../components/EmptyState";
import { SkeletonRow } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { CheckCircle2, ListTodo, Calendar } from "lucide-react";
import { fmtDate } from "../utils/format";
import { Button } from "../components/Button";

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
  const doneCount = tasks.length - pendingCount;

  const tabs: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: tasks.length },
    { key: "pending", label: "Open", count: pendingCount },
    { key: "completed", label: "Done", count: doneCount },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Tasks"
        subtitle={`${pendingCount} open · ${doneCount} completed`}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Task filter">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150
              ${filter === tab.key
                ? "bg-brand-900 text-white shadow-sm"
                : "bg-white border border-brand-200 text-brand-600 hover:bg-brand-50"
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`
                  ml-1.5 px-1.5 py-0.5 rounded-full text-xs
                  ${filter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-brand-100 text-brand-600"
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
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
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
                bg-white rounded-2xl border p-4
                flex flex-col sm:flex-row sm:items-center justify-between gap-3
                transition-all duration-150
                ${t.status === "completed"
                  ? "border-emerald-100 bg-emerald-50/30 opacity-75"
                  : "border-brand-100 hover:border-brand-200 hover:shadow-sm-border"
                }
              `}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`
                      text-sm font-medium truncate
                      ${t.status === "completed" ? "line-through text-brand-400" : "text-brand-900"}
                    `}
                  >
                    {t.title}
                  </span>
                  <TaskBadge status={t.status} />
                </div>
                <div className="flex items-center gap-2 text-sm text-brand-500 mt-1 flex-wrap">
                  {t.ventureId ? (
                    <Link
                      to={`/ventures/${t.ventureId._id}`}
                      className="text-brand-700 hover:text-brand-900 hover:underline font-medium"
                    >
                      {t.ventureId.name}
                    </Link>
                  ) : (
                    <span>Unknown venture</span>
                  )}
                  <span className="text-brand-300">·</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {t.dueDate ? fmtDate(t.dueDate) : "—"}
                  </span>
                  {t.status === "completed" && t.completedAt && (
                    <>
                      <span className="text-brand-300">·</span>
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
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors min-h-[40px]"
                >
                  <CheckCircle2 size={14} />
                  Complete
                </button>
              ) : (
                <span className="shrink-0 text-emerald-600 text-sm font-medium">Done</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
