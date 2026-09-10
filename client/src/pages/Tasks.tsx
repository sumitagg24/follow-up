import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { TaskBadge } from "../components/StatusBadge";
import { EmptyState } from "../components/EmptyState";
import { SkeletonRow } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { fmtDate } from "../utils/format";
import { ListTodo, CheckCircle2 } from "lucide-react";

type TaskRow = {
  _id: string; title: string; status: "pending" | "completed"; dueDate: string | null;
  ventureId: { _id: string; name: string; status: string; founderName: string } | null;
};

export function Tasks() {
  usePageTitle("Tasks");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const toast = useToast();

  async function load() {
    setLoading(true); setError(null);
    try {
      setTasks(await api.getTasks());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function complete(t: TaskRow) {
    try { await api.completeTask(t._id); toast.push(`Task "${t.title}" completed`, "success"); load(); }
    catch (e: any) { toast.push(e.message, "error"); }
  }

  const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const doneCount = tasks.length - pendingCount;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <Header title="Tasks" subtitle={`${pendingCount} open • ${doneCount} completed`} />
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Task filter">
        {(["all", "pending", "completed"] as const).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${filter === f ? "bg-slate-900 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"}`}
          >
            {f} {f !== "all" && <span className="opacity-60">({f === "pending" ? pendingCount : doneCount})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
          desc={filter === "all"
            ? "Tasks are generated automatically when you create a venture — initial review, founder follow-up and internal discussion."
            : filter === "pending" ? "Everything is completed. New tasks will appear as ventures are created."
            : "Complete a task and it will show up here."}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <div key={t._id} className="bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="min-w-0">
                <div className="font-medium flex items-center gap-2 flex-wrap">
                  <span className="truncate">{t.title}</span>
                  <TaskBadge status={t.status} />
                </div>
                <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {t.ventureId ? (
                    <Link to={`/ventures/${t.ventureId._id}`} className="text-slate-900 hover:underline font-medium">{t.ventureId.name}</Link>
                  ) : <span>Unknown venture</span>}
                  <span aria-hidden="true">•</span>
                  <span>Due {t.dueDate ? fmtDate(t.dueDate) : "—"}</span>
                </div>
              </div>
              <div className="shrink-0">
                {t.status === "pending" ? (
                  <button
                    onClick={() => complete(t)}
                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={16} /> Complete
                  </button>
                ) : (
                  <span className="text-sm text-emerald-600 font-medium">Done</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
