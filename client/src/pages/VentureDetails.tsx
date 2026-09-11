import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Header } from "../components/Header";
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
  ArrowRight,
  ChevronRight,
  MapPin,
  FileText,
} from "lucide-react";
import { fmtDate } from "../utils/format";

export function VentureDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  usePageTitle("Venture Details");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const toast = useToast();

  async function load() {
    if (!id) return;
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
      load();
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
      load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
  }

  async function completeTask(t: any) {
    try {
      await api.completeTask(t._id);
      toast.push(`"${t.title}" completed`, "success");
      load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
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
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { venture, followUp, tasks, activities } = data;
  const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
  const progressPct = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title={venture.name}
        subtitle={`Founder: ${venture.founderName}`}
        action={
          <Link to={`/ventures/${venture._id}/edit`}>
            <Button variant="outline" icon={<ChevronRight size={14} />} iconRight={<ArrowRight size={14} />}>
              Edit Venture
            </Button>
          </Link>
        }
      />

      {/* Venture overview card */}
      <div className="bg-white rounded-2xl border border-brand-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <VentureBadge status={venture.status} />
          <span className="text-sm text-brand-500">Created {fmtDate(venture.createdAt)}</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                <Building size={15} />
              </div>
              <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">Industry</span>
            </div>
            <p className="text-sm text-brand-900">{venture.industry}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                <User size={15} />
              </div>
              <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">Founder</span>
            </div>
            <p className="text-sm text-brand-900 font-medium">{venture.founderName}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                <Mail size={15} />
              </div>
              <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">Email</span>
            </div>
            <a
              href={`mailto:${venture.founderEmail}`}
              className="text-sm text-brand-600 hover:text-brand-900 truncate block"
            >
              {venture.founderEmail}
            </a>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                <Calendar size={15} />
              </div>
              <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">Follow-up date</span>
            </div>
            <p className="text-sm text-brand-900">{fmtDate(venture.followUpDate)}</p>
          </div>

          {venture.notes && (
            <div className="sm:col-span-2 mt-4 pt-4 border-t border-brand-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                  <FileText size={15} />
                </div>
                <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">Notes</span>
              </div>
              <p className="text-sm text-brand-700">{venture.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Follow-up card */}
          <div className="bg-white rounded-2xl border border-brand-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-brand-900">Follow-up</h3>
              {!followUp && (
                <span className="text-sm text-brand-500">No follow-up scheduled</span>
              )}
            </div>

            {!followUp ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-400 grid place-items-center mx-auto mb-3">
                  <Calendar size={22} />
                </div>
                <p className="text-sm text-brand-500 mb-3">No follow-up found</p>
                <Link to={`/ventures/${venture._id}/edit`}>
                  <Button variant="outline" size="sm">
                    Schedule Follow-up
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          followUp.status === "overdue"
                            ? "bg-red-500"
                            : followUp.status === "completed"
                            ? "bg-emerald-500"
                            : "bg-accent-500"
                        }`}
                      />
                      <FollowUpBadge status={followUp.status} />
                    </div>
                    <p className="text-sm text-brand-600">
                      Due <span className="font-medium text-brand-900">{fmtDate(followUp.dueDate)}</span>
                    </p>
                    {followUp.completedAt && (
                      <p className="text-xs text-brand-500 mt-1">
                        Completed {fmtDate(followUp.completedAt)}
                      </p>
                    )}
                  </div>
                  {followUp.status !== "completed" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setRescheduleOpen(true)}
                        className="px-3 py-2 rounded-xl border border-brand-200 text-sm text-brand-700 hover:bg-brand-50 transition-colors min-h-[36px]"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={completeFollowUp}
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors min-h-[36px]"
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
          <div className="bg-white rounded-2xl border border-brand-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-brand-900">Tasks</h3>
              <span className="text-sm text-brand-500">
                {completedTasks}/{tasks.length} completed
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-brand-100 mb-4 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="space-y-2">
              {tasks.map((t: any) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-brand-100 bg-brand-50/50 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-brand-900">{t.title}</span>
                      <TaskBadge status={t.status} />
                    </div>
                    <div className="text-xs text-brand-500 mt-1 flex items-center gap-2">
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
                      className="p-2 rounded-lg bg-white border border-brand-200 text-brand-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100 min-w-[36px] min-h-[36px]"
                      title="Complete task"
                    >
                      <CheckCircle size={16} />
                    </button>
                  ) : (
                    <span className="text-emerald-600 text-sm font-medium">Done</span>
                  )}
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-brand-500 text-center py-4">No tasks</p>
              )}
            </div>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="bg-white rounded-2xl border border-brand-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-brand-900">Activity</h3>
            <span className="text-sm text-brand-500">
              {activities.length} event{activities.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-0">
            {activities.map((a: any, i: number) => (
              <div key={a._id} className="relative pl-6 pb-4">
                {/* Timeline line */}
                {i < activities.length - 1 && (
                  <div className="absolute left-2.5 top-4 bottom-0 w-px bg-brand-100" />
                )}
                {/* Dot */}
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-brand-200 border-2 border-white" />
                <div>
                  <p className="text-sm text-brand-900">{a.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <ActivityBadge action={a.action} />
                    <span className="text-xs text-brand-400">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-brand-500 text-center py-4">No activity</p>
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
