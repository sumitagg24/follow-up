import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { PageHeader } from "../components/Card";
import { VentureBadge, FollowUpBadge, TaskBadge } from "../components/StatusBadge";
import { ActivityBadge } from "../components/ActivityBadge";
import { EmptyState } from "../components/EmptyState";
import { SkeletonCard } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import {
  Building,
  User,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  Pencil,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { fmtDate } from "../utils/format";

function initials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function VentureDetails() {
  const { id } = useParams();
  usePageTitle("Venture Details");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const toast = useToast();

  async function load() {
    if (!id) {
      setError("Missing venture id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const d = await api.getVenture(id);
      setData(d);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function completeFollowUp() {
    if (!data?.followUp) return;
    try {
      await api.completeFollowUp(data.followUp._id);
      toast.push("Follow-up completed", "success");
      await load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
  }

  async function saveReschedule() {
    if (!data?.followUp || !newDate) return;
    try {
      await api.rescheduleFollowUp(data.followUp._id, newDate);
      toast.push("Follow-up rescheduled", "success");
      setRescheduleOpen(false);
      await load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
  }

  async function completeTask(t: any) {
    try {
      await api.completeTask(t._id);
      toast.push(`"${t.title}" completed`, "success");
      await load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
          <div>
            <SkeletonCard lines={5} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        <div className="slaky-card p-6 text-center">
          <p className="text-sm font-semibold text-red-700 mb-1">Couldn't load this venture</p>
          <p className="text-[13px] text-brand-500 mb-4">{error}</p>
          <div className="flex items-center justify-center gap-2.5">
            <Button variant="secondary" onClick={load}>
              Try again
            </Button>
            <Link to="/ventures">
              <Button variant="ghost">Back to Directory</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { venture, followUp, tasks, activities } = data;
  const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
  const progressPct = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <PageHeader
        title={venture.name}
        subtitle={`${venture.founderName} · ${venture.industry}`}
        breadcrumbs={[
          { label: "Directory", href: "/ventures" },
          { label: venture.name },
        ]}
        action={
          <Link to={`/ventures/${venture._id}/edit`}>
            <Button variant="secondary" icon={<Pencil size={14} />}>
              Edit Venture
            </Button>
          </Link>
        }
      />

      {/* Venture overview card — Slaky startup profile */}
      <div className="slaky-card p-5 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="slaky-avatar w-12 h-12 text-base" aria-hidden="true">
            {initials(venture.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <VentureBadge status={venture.status} />
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <BadgeCheck size={11} /> Verified
              </span>
            </div>
            <p className="text-xs text-brand-400 mt-1.5 tabular-nums">Created {fmtDate(venture.createdAt)}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-5 gap-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                <Building size={15} />
              </div>
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-[0.08em]">Industry</span>
            </div>
            <p className="text-sm font-medium text-brand-900 pl-10">{venture.industry}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                <User size={15} />
              </div>
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-[0.08em]">Founder</span>
            </div>
            <p className="text-sm text-brand-900 font-semibold pl-10">{venture.founderName}</p>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                <Mail size={15} />
              </div>
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-[0.08em]">Email</span>
            </div>
            <a
              href={`mailto:${venture.founderEmail}`}
              className="text-sm text-brand-900 font-medium hover:text-brand-500 truncate block pl-10 transition-colors"
            >
              {venture.founderEmail}
            </a>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                <Calendar size={15} />
              </div>
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-[0.08em]">Follow-up date</span>
            </div>
            <p className="text-sm font-medium text-brand-900 pl-10 tabular-nums">{fmtDate(venture.followUpDate)}</p>
          </div>

          {venture.notes && (
            <div className="sm:col-span-2 mt-1 pt-4 border-t border-brand-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                  <FileText size={15} />
                </div>
                <span className="text-[11px] font-bold text-brand-400 uppercase tracking-[0.08em]">Notes</span>
              </div>
              <p className="text-sm text-brand-600 leading-relaxed pl-10">{venture.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
          {/* Follow-up card */}
          <div className="slaky-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-brand-900 tracking-tight">Follow-up</h3>
              {!followUp && (
                <span className="text-[13px] text-brand-400">No follow-up scheduled</span>
              )}
            </div>

            {!followUp ? (
              <div className="text-center py-8">
                <div className="w-11 h-11 rounded-2xl bg-brand-50 border border-brand-200 text-brand-400 grid place-items-center mx-auto mb-3">
                  <Calendar size={20} />
                </div>
                <p className="text-[13px] text-brand-500 mb-3">No follow-up found</p>
                <Link to={`/ventures/${venture._id}/edit`}>
                  <Button variant="secondary" size="sm">
                    Schedule Follow-up
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          followUp.status === "overdue"
                            ? "bg-red-500"
                            : followUp.status === "completed"
                            ? "bg-emerald-500"
                            : "bg-brand-400"
                        }`}
                      />
                      <FollowUpBadge status={followUp.status} />
                    </div>
                    <p className="text-[13px] text-brand-500">
                      Due <span className="font-bold text-brand-900 tabular-nums">{fmtDate(followUp.dueDate)}</span>
                    </p>
                    {followUp.completedAt && (
                      <p className="text-xs text-brand-400 mt-1 tabular-nums">
                        Completed {fmtDate(followUp.completedAt)}
                      </p>
                    )}
                  </div>
                  {followUp.status !== "completed" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setRescheduleOpen(true)}
                        className="slaky-btn-secondary px-3.5 py-2 text-xs"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={completeFollowUp}
                        className="slaky-btn-primary px-3.5 py-2 text-xs"
                      >
                        <CheckCircle size={14} />
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tasks card */}
          <div className="slaky-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-brand-900 tracking-tight">Tasks</h3>
              <span className="slaky-pill tabular-nums">
                {completedTasks}/{tasks.length} done
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-brand-100 mb-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressPct === 100 ? "bg-emerald-500" : "bg-brand-900"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="space-y-2">
              {tasks.map((t: any) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-brand-100 bg-brand-50/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-brand-900 tracking-tight">{t.title}</span>
                      <TaskBadge status={t.status} />
                    </div>
                    <div className="text-xs text-brand-400 mt-1 flex items-center gap-1.5 tabular-nums">
                      {t.dueDate ? (
                        <>
                          <Calendar size={11} />
                          Due {fmtDate(t.dueDate)}
                        </>
                      ) : (
                        <>
                          <Clock size={11} />
                          No due date
                        </>
                      )}
                    </div>
                  </div>
                  {t.status !== "completed" ? (
                    <button
                      onClick={() => completeTask(t)}
                      className="slaky-btn-primary px-3.5 py-2 text-xs shrink-0"
                      title="Complete task"
                    >
                      <CheckCircle size={13} />
                      Done
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-600 shrink-0">
                      <CheckCircle size={14} /> Done
                    </span>
                  )}
                </div>
              ))}
              {tasks.length === 0 && (
                <EmptyState
                  icon={CheckCircle}
                  title="No tasks"
                  description="Tasks appear here once generated for this venture."
                />
              )}
            </div>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="slaky-card p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-brand-900 tracking-tight">Activity</h3>
            <span className="slaky-pill tabular-nums">
              {activities.length} event{activities.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-0">
            {activities.map((a: any, i: number) => (
              <div key={a._id} className="relative pl-6 pb-4 last:pb-0">
                {/* Timeline line */}
                {i < activities.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-brand-200" aria-hidden="true" />
                )}
                {/* Dot */}
                <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full bg-brand-900 ring-4 ring-brand-100" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-brand-900 leading-snug">{a.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <ActivityBadge action={a.action} />
                    <span className="text-[11px] text-brand-400 tabular-nums">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-[13px] text-brand-400 text-center py-4">No activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule modal */}
      <Modal
        open={rescheduleOpen}
        onClose={() => {
          setRescheduleOpen(false);
          setNewDate("");
        }}
        title="Reschedule Follow-up"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveReschedule} disabled={!newDate}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-600">
            Set a new date for this follow-up. The venture's follow-up date will also be updated.
          </p>
          <Input
            type="date"
            label="New date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
