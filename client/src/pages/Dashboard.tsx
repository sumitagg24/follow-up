import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { Card, StatCard, SectionHeader, PageHeader } from "../components/Card";
import { FollowUpBadge, VentureBadge, TaskBadge } from "../components/StatusBadge";
import { EmptyState } from "../components/EmptyState";
import { SkeletonCard, SkeletonStat, SkeletonRow } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  Building2,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Play,
  Plus,
  ArrowRight,
  Bot,
  ListTodo,
  Flame,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

interface DashboardData {
  stats: {
    totalVentures: number;
    activeVentures: number;
    todaysFollowUps: number;
    overdueFollowUps: number;
    openTasks: number;
    completedTasks: number;
  };
  todaysFollowUps: any[];
  overdueFollowUps: any[];
  upcomingFollowUps: any[];
  recentActivity: any[];
  lastAutomationRun: any;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resched, setResched] = useState<any>(null);
  const [newDate, setNewDate] = useState("");
  const [running, setRunning] = useState(false);
  const toast = useToast();
  usePageTitle("Dashboard");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getDashboard();
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function runAutomation() {
    setRunning(true);
    try {
      const r = await api.runAutomation();
      toast.push(`Checked ${r.checked} follow-ups · ${r.remindersGenerated} reminders`, "success");
      await load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
    setRunning(false);
  }

  async function completeFollowUp(fu: any) {
    try {
      await api.completeFollowUp(fu._id);
      toast.push("Follow-up completed", "success");
      load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
  }

  async function saveReschedule() {
    if (!newDate || !resched) return;
    try {
      await api.rescheduleFollowUp(resched._id, newDate);
      toast.push("Follow-up rescheduled", "success");
      setResched(null);
      load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
  }

  const greeting = new Date().getHours() < 12
    ? "Good morning"
    : new Date().getHours() < 17
    ? "Good afternoon"
    : "Good evening";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  if (loading) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="h-7 w-48 rounded-lg skeleton-shimmer mb-3" />
          <div className="h-4 w-64 rounded-lg skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
          <div className="space-y-4">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={3} />
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

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting} — ${dateStr}`}
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={runAutomation}
              disabled={running}
              icon={<Play size={15} />}
              iconRight={<Clock size={14} />}
            >
              {running ? "Running..." : "Run Reminder Check"}
            </Button>
            <Link to="/ventures/new">
              <Button icon={<Plus size={15} />} className="bg-brand-900 hover:bg-brand-800">
                New Venture
              </Button>
            </Link>
          </div>
        }
      />

      {/* Alert banner */}
      {data.overdueFollowUps.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 grid place-items-center shrink-0">
            <Flame size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">
              {data.overdueFollowUps.length} follow-up{data.overdueFollowUps.length !== 1 ? "s" : ""} overdue
            </p>
            <p className="text-sm text-red-700 mt-0.5">
              Reach out to founders as soon as possible.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Ventures"
          value={data.stats.totalVentures}
          icon={<Building2 size={18} />}
        />
        <StatCard
          label="Active Ventures"
          value={data.stats.activeVentures}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Due Today"
          value={data.stats.todaysFollowUps}
          icon={<Calendar size={18} />}
          trend={data.stats.todaysFollowUps > 0 ? { value: data.stats.todaysFollowUps, label: "due today" } : undefined}
        />
        <StatCard
          label="Overdue"
          value={data.stats.overdueFollowUps}
          icon={<AlertTriangle size={18} className="text-red-500" />}
          className={data.stats.overdueFollowUps > 0 ? "border-red-200" : ""}
        />
        <StatCard
          label="Open Tasks"
          value={data.stats.openTasks}
          icon={<ListTodo size={18} />}
        />
        <StatCard
          label="Completed Tasks"
          value={data.stats.completedTasks}
          icon={<CheckCircle size={18} className="text-emerald-500" />}
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's and Overdue follow-ups — span 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Follow-ups */}
          <SectionHeader
            title="Today's Follow-ups"
            description={data?.todaysFollowUps.length ? `${data.todaysFollowUps.length} follow-up${data.todaysFollowUps.length !== 1 ? "s" : ""} due today` : "Nothing due today"}
          />
          {(!data?.todaysFollowUps || data.todaysFollowUps.length === 0) ? (
            <EmptyState
              icon={CheckCircle}
              title="Nothing due today"
              description="All caught up. Run a reminder check to scan for overdue items."
            />
          ) : (
            <div className="space-y-3">
              {data.todaysFollowUps.map((fu: any) => (
                <FollowUpRow key={fu._id} fu={fu} onReschedule={setResched} onComplete={completeFollowUp} />
              ))}
            </div>
          )}

          {/* Overdue */}
          {data?.overdueFollowUps && data.overdueFollowUps.length > 0 && (
            <>
              <SectionHeader
                title="Overdue"
                description={`${data.overdueFollowUps.length} overdue follow-up${data.overdueFollowUps.length !== 1 ? "s" : ""}`}
              />
              <div className="space-y-3">
                {data.overdueFollowUps.map((fu: any) => (
                  <FollowUpRow key={fu._id} fu={fu} tone="overdue" onReschedule={setResched} onComplete={completeFollowUp} />
                ))}
              </div>
            </>
          )}

          {/* Upcoming */}
          {data?.upcomingFollowUps && data.upcomingFollowUps.length > 0 && (
            <>
              <SectionHeader
                title="Upcoming (next 7 days)"
                description="Future follow-ups scheduled"
              />
              <div className="space-y-3">
                {data.upcomingFollowUps.map((fu: any) => (
                  <UpcomingRow key={fu._id} fu={fu} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right column — activity + automation */}
        <div className="space-y-6">
          {/* Automation summary */}
          <Card padding="md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-900 text-white grid place-items-center shrink-0">
                <Bot size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-900">Automation</h3>
                <p className="text-xs text-brand-500">Daily reminder check</p>
              </div>
            </div>
            {data?.lastAutomationRun ? (
              <div className="text-sm text-brand-600 space-y-2">
                <div className="flex justify-between">
                  <span className="text-brand-500">Last run</span>
                  <span className="text-brand-900">{new Date(data.lastAutomationRun.at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-500">Triggered by</span>
                  <span className="text-brand-900 capitalize">{data.lastAutomationRun.triggeredBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-500">Checked</span>
                  <span className="text-brand-900 font-medium">{data.lastAutomationRun.checked} ventures</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-500">Reminders</span>
                  <span className="text-brand-900 font-medium">{data.lastAutomationRun.remindersGenerated}</span>
                </div>
                {data.lastAutomationRun.emailsSent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-brand-500">Emails sent</span>
                    <span className="text-brand-900 font-medium text-emerald-600">{data.lastAutomationRun.emailsSent}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-brand-500">Never run yet — the daily schedule fires at 09:00.</p>
            )}
            <div className="mt-4 pt-3 border-t border-brand-100 flex items-center justify-between">
              <span className="text-xs text-brand-500">Schedule: Daily 09:00</span>
              <Link to="/automation" className="text-xs text-accent-600 hover:text-accent-700 font-medium flex items-center gap-1">
                Automation Center <ArrowRight size={12} />
              </Link>
            </div>
          </Card>

          {/* Recent activity */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-brand-900">Recent Activity</h3>
              <Link to="/activity" className="text-xs text-accent-600 hover:text-accent-700 font-medium">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {(!data?.recentActivity || data.recentActivity.length === 0) ? (
              <p className="text-sm text-brand-500 py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.slice(0, 8).map((a: any) => (
                  <div key={a._id} className="p-3 rounded-xl bg-brand-50 border border-brand-100">
                    <p className="text-sm text-brand-900 leading-relaxed">{a.description}</p>
                    <p className="text-xs text-brand-500 mt-1.5">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Reschedule modal */}
      <Modal
        open={!!resched}
        onClose={() => setResched(null)}
        title="Reschedule Follow-up"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResched(null)}>
              Cancel
            </Button>
            <Button onClick={() => { setNewDate(""); saveReschedule(); }} disabled={!newDate}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-600">
            Set a new date for this follow-up.
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

function FollowUpRow({ fu, tone, onReschedule, onComplete }: { fu: any; tone?: "overdue"; onReschedule: (fu: any) => void; onComplete: (fu: any) => void }) {
  const v = fu.ventureId;
  if (!v || typeof v === "string") return null;

  return (
    <div
      className={`
        bg-white rounded-2xl border p-4
        ${tone === "overdue" ? "border-red-200 bg-red-50/30" : "border-brand-100"}
        transition-all duration-150
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {tone === "overdue" && (
              <span className="shrink-0">
                <Flame size={13} className="text-red-500" />
              </span>
            )}
            <span className="font-medium text-brand-900 truncate">{v.name}</span>
          </div>
          <p className="text-sm text-brand-500 truncate">
            {v.founderName} · Due {formatDate(fu.dueDate)}
          </p>
          <div className="mt-2">
            <FollowUpBadge status={fu.status} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/ventures/${v._id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-200 text-sm text-brand-700 hover:bg-brand-50 transition-colors min-h-[36px]"
          >
            View
            <ArrowRight size={12} />
          </Link>
          {fu.status !== "completed" && (
            <>
              <button
                onClick={() => onReschedule(fu)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-200 text-sm text-brand-700 hover:bg-brand-50 transition-colors min-h-[36px]"
              >
                <Calendar size={13} />
                Reschedule
              </button>
              <button
                onClick={() => onComplete(fu)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors min-h-[36px]"
              >
                <CheckCircle size={13} />
                Complete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UpcomingRow({ fu }: { fu: any }) {
  const v = fu.ventureId;
  if (!v || typeof v === "string") return null;

  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-4 transition-all duration-150">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-brand-900 truncate">{v.name}</p>
          <p className="text-sm text-brand-500 truncate">
            {v.founderName} · Due {formatDate(fu.dueDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FollowUpBadge status={fu.status} />
          <Link
            to={`/ventures/${v._id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-200 text-sm text-brand-700 hover:bg-brand-50 transition-colors min-h-[36px]"
          >
            View <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
