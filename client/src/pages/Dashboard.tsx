import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Card, StatCard, SectionHeader, PageHeader } from "../components/Card";
import { FollowUpBadge } from "../components/StatusBadge";
import { EmptyState } from "../components/EmptyState";
import { SkeletonCard, SkeletonStat, SkeletonRow } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  Building2,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Calendar,
  Play,
  Plus,
  ArrowRight,
  Bot,
  ListTodo,
  Flame,
  Clock,
  Users,
  BadgeCheck,
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

function initials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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
      await load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
  }

  async function saveReschedule() {
    if (!newDate || !resched) return;
    const dueDate = newDate;
    try {
      await api.rescheduleFollowUp(resched._id, dueDate);
      toast.push("Follow-up rescheduled", "success");
      setResched(null);
      setNewDate("");
      await load();
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
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="h-7 w-48 rounded-full skeleton-shimmer mb-3" />
          <div className="h-4 w-64 rounded-full skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
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
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        <div className="slaky-card p-6 text-center">
          <p className="text-sm font-semibold text-red-700 mb-1">Couldn't load the dashboard</p>
          <p className="text-[13px] text-brand-500 mb-4">{error}</p>
          <Button variant="secondary" onClick={load}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // An overdue follow-up due today is returned in BOTH server lists —
  // show it once (under Today's) so the board never double-counts.
  const todayIds = new Set((data.todaysFollowUps ?? []).map((fu: any) => fu._id));
  const overdueOnly = (data.overdueFollowUps ?? []).filter((fu: any) => !todayIds.has(fu._id));

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Slaky-style hero */}
      <div className="text-center sm:text-left mb-6">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1 text-[11px] font-semibold text-brand-600 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Verified ops · never a spreadsheet
        </p>
        <PageHeader
          title="The database of verified founder follow-ups"
          subtitle={`${greeting} — ${dateStr}. Every follow-up confirmed live across ${data.stats.totalVentures} ${data.stats.totalVentures === 1 ? "venture" : "ventures"}.`}
          action={
            <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
              <Button
                variant="secondary"
                onClick={runAutomation}
                disabled={running}
                icon={<Play size={14} />}
              >
                {running ? "Running..." : "Run check"}
              </Button>
              <Link to="/ventures/new">
                <Button icon={<Plus size={15} />}>
                  New Venture
                </Button>
              </Link>
            </div>
          }
        />
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[13px] text-brand-500 -mt-3 mb-1">
          <Link to="/ventures" className="hover:text-brand-900 font-medium transition-colors">Directory</Link>
          <span aria-hidden="true" className="text-brand-300">·</span>
          <Link to="/analytics" className="hover:text-brand-900 font-medium transition-colors">Leaderboard</Link>
          <span aria-hidden="true" className="text-brand-300">·</span>
          <Link to="/activity" className="hover:text-brand-900 font-medium transition-colors">Feed</Link>
          <span aria-hidden="true" className="text-brand-300">·</span>
          <Link to="/automation" className="hover:text-brand-900 font-medium transition-colors">How we verify</Link>
        </div>
      </div>

      {/* Alert banner */}
      {overdueOnly.length > 0 && (
        <div className="mb-5 bg-white border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 text-red-600 grid place-items-center shrink-0">
            <Flame size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-900 tracking-tight">
              {overdueOnly.length} follow-up{overdueOnly.length !== 1 ? "s" : ""} overdue
            </p>
            <p className="text-[13px] text-brand-500 mt-0.5">
              Reach out to founders as soon as possible — overdue items sit at the top of the board.
            </p>
          </div>
          <span className="ml-auto slaky-pill !border-red-200 !bg-red-50 !text-red-700 shrink-0">
            △ {overdueOnly.length}
          </span>
        </div>
      )}

      {/* KPI cards — Slaky metric blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <StatCard
          label="Total Ventures"
          value={data.stats.totalVentures}
          icon={<Building2 size={17} />}
          hint="In the directory"
        />
        <StatCard
          label="Active Ventures"
          value={data.stats.activeVentures}
          icon={<Users size={17} />}
          hint="Currently engaged"
        />
        <StatCard
          label="Due Today"
          value={data.stats.todaysFollowUps}
          icon={<Calendar size={17} />}
          trend={data.stats.todaysFollowUps > 0 ? { value: data.stats.todaysFollowUps, label: "due today", positive: false } : undefined}
        />
        <StatCard
          label="Overdue"
          value={data.stats.overdueFollowUps}
          icon={<AlertTriangle size={17} className={data.stats.overdueFollowUps > 0 ? "text-red-500" : undefined} />}
          className={data.stats.overdueFollowUps > 0 ? "!border-red-200" : ""}
          hint={data.stats.overdueFollowUps > 0 ? "Needs action now" : "All clear"}
        />
        <StatCard
          label="Open Tasks"
          value={data.stats.openTasks}
          icon={<ListTodo size={17} />}
          hint="Across all ventures"
        />
        <StatCard
          label="Completed Tasks"
          value={data.stats.completedTasks}
          icon={<CheckCircle size={17} className="text-emerald-600" />}
          hint="Verified done"
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's and Overdue follow-ups — span 2 cols */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Today's Follow-ups */}
          <section>
            <SectionHeader
              title="Today's follow-ups"
              description={data?.todaysFollowUps.length ? `${data.todaysFollowUps.length} follow-up${data.todaysFollowUps.length !== 1 ? "s" : ""} due today` : "Nothing due today"}
              action={data?.todaysFollowUps.length ? (
                <Link to="/tasks" className="text-xs font-semibold text-brand-500 hover:text-brand-900 inline-flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </Link>
              ) : undefined}
            />
            {(!data?.todaysFollowUps || data.todaysFollowUps.length === 0) ? (
              <EmptyState
                icon={CheckCircle2}
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
          </section>

          {/* Overdue */}
          {overdueOnly.length > 0 && (
            <section>
              <SectionHeader
                title="Overdue — claim the top spot"
                description={`${overdueOnly.length} overdue follow-up${overdueOnly.length !== 1 ? "s" : ""} · oldest first`}
              />
              <div className="space-y-3">
                {overdueOnly.map((fu: any, i: number) => (
                  <FollowUpRow key={fu._id} fu={fu} rank={i + 1} tone="overdue" onReschedule={setResched} onComplete={completeFollowUp} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {data?.upcomingFollowUps && data.upcomingFollowUps.length > 0 && (
            <section>
              <SectionHeader
                title="Upcoming · next 7 days"
                description="Future follow-ups on the board"
              />
              <div className="slaky-card overflow-hidden">
                <div className="divide-y divide-brand-100">
                  {data.upcomingFollowUps.map((fu: any) => (
                    <UpcomingRow key={fu._id} fu={fu} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* How we verify — Slaky trust strip */}
          <section className="slaky-card p-5">
            <h3 className="text-[15px] font-bold text-brand-900 tracking-tight mb-1">How we verify</h3>
            <p className="text-[13px] text-brand-500 mb-4">A green check you can actually trust.</p>
            <ol className="grid sm:grid-cols-4 gap-4">
              {[
                { n: "01", t: "Venture created", d: "Profile + founder captured once." },
                { n: "02", t: "Tasks generated", d: "Review, follow-up and discussion auto-made." },
                { n: "03", t: "Daily check", d: "Automation scans for overdue every 09:00." },
                { n: "04", t: "Verified live", d: "Completion lands on the feed instantly." },
              ].map((s) => (
                <li key={s.n} className="min-w-0">
                  <p className="text-[11px] font-bold text-brand-300 tabular-nums">{s.n}</p>
                  <p className="text-[13px] font-bold text-brand-900 tracking-tight mt-1">{s.t}</p>
                  <p className="text-xs text-brand-500 mt-0.5 leading-relaxed">{s.d}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Right column — activity + automation */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Automation summary */}
          <Card padding="md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-900 text-white grid place-items-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-brand-900 tracking-tight">Automation</h3>
                <p className="text-xs text-brand-500">Daily reminder check</p>
              </div>
              <span className="ml-auto slaky-pill">09:00</span>
            </div>
            {data?.lastAutomationRun ? (
              <dl className="text-[13px] space-y-2.5">
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-400">Last run</dt>
                  <dd className="text-brand-900 font-medium text-right">{new Date(data.lastAutomationRun.at).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-400">Triggered by</dt>
                  <dd className="text-brand-900 font-medium capitalize">{data.lastAutomationRun.triggeredBy}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-400">Checked</dt>
                  <dd className="text-brand-900 font-bold tabular-nums">{data.lastAutomationRun.checked}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-400">Reminders</dt>
                  <dd className="text-brand-900 font-bold tabular-nums">{data.lastAutomationRun.remindersGenerated}</dd>
                </div>
                {data.lastAutomationRun.emailsSent > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-brand-400">Emails sent</dt>
                    <dd className="font-bold text-emerald-600 tabular-nums">{data.lastAutomationRun.emailsSent}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-[13px] text-brand-500">Never run yet — the daily schedule fires at 09:00.</p>
            )}
            <div className="mt-4 pt-3 border-t border-brand-100 flex items-center justify-between">
              <span className="text-xs text-brand-400 inline-flex items-center gap-1.5"><Clock size={12} /> Daily 09:00</span>
              <Link to="/automation" className="text-xs text-brand-900 hover:text-brand-600 font-semibold flex items-center gap-1 transition-colors">
                Automation Center <ArrowRight size={12} />
              </Link>
            </div>
          </Card>

          {/* Recent activity — Slaky feed */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-brand-900 tracking-tight">Latest from the feed</h3>
              <Link to="/activity" className="text-xs text-brand-900 hover:text-brand-600 font-semibold inline-flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {(!data?.recentActivity || data.recentActivity.length === 0) ? (
              <p className="text-[13px] text-brand-500 py-4 text-center">No activity yet</p>
            ) : (
              <div className="space-y-2.5">
                {data.recentActivity.slice(0, 8).map((a: any) => (
                  <div key={a._id} className="rounded-xl bg-brand-50 border border-brand-100 px-3 py-2.5">
                    <p className="text-[13px] text-brand-900 leading-snug font-medium">{a.description}</p>
                    <p className="text-[11px] text-brand-400 mt-1 tabular-nums">
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
        onClose={() => { setResched(null); setNewDate(""); }}
        title="Reschedule follow-up"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setResched(null); setNewDate(""); }}>
              Cancel
            </Button>
            <Button onClick={saveReschedule} disabled={!newDate}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-500">
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

function FollowUpRow({ fu, tone, rank, onReschedule, onComplete }: { fu: any; tone?: "overdue"; rank?: number; onReschedule: (fu: any) => void; onComplete: (fu: any) => void }) {
  const v = fu.ventureId;
  if (!v || typeof v === "string") return null;

  return (
    <article
      className={`
        slaky-card slaky-card-hover p-4
        ${tone === "overdue" ? "!border-red-200" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {typeof rank === "number" && (
          <span className="w-6 shrink-0 pt-1 text-xs font-bold text-brand-300 tabular-nums text-center">{String(rank).padStart(2, "0")}</span>
        )}
        <div className="slaky-avatar w-10 h-10 text-[13px]" aria-hidden="true">
          {initials(v.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[14px] text-brand-900 tracking-tight truncate">{v.name}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <BadgeCheck size={11} /> Verified
            </span>
            <FollowUpBadge status={fu.status} />
          </div>
          <p className="text-[13px] text-brand-500 truncate mt-0.5">
            {v.founderName} · Due {formatDate(fu.dueDate)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              to={`/ventures/${v._id}`}
              className="slaky-btn-secondary px-3.5 py-1.5 text-xs"
            >
              View <ArrowRight size={12} />
            </Link>
            {fu.status !== "completed" && (
              <>
                <button
                  onClick={() => onReschedule(fu)}
                  className="slaky-btn-secondary px-3.5 py-1.5 text-xs"
                >
                  <Calendar size={13} />
                  Reschedule
                </button>
                <button
                  onClick={() => onComplete(fu)}
                  className="slaky-btn-primary px-3.5 py-1.5 text-xs"
                >
                  <CheckCircle size={13} />
                  Complete
                </button>
              </>
            )}
          </div>
        </div>
        {tone === "overdue" && (
          <span className="shrink-0 rounded-full bg-red-50 border border-red-200 text-red-600 p-1.5" title="Overdue">
            <Flame size={13} />
          </span>
        )}
      </div>
    </article>
  );
}

function UpcomingRow({ fu }: { fu: any }) {
  const v = fu.ventureId;
  if (!v || typeof v === "string") return null;

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-brand-50/70 transition-colors">
      <div className="slaky-avatar w-8 h-8 text-[11px]" aria-hidden="true">
        {initials(v.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[13px] text-brand-900 tracking-tight truncate">{v.name}</p>
        <p className="text-xs text-brand-500 truncate">
          {v.founderName} · Due {formatDate(fu.dueDate)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <FollowUpBadge status={fu.status} />
        <Link
          to={`/ventures/${v._id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-brand-200 text-xs font-semibold text-brand-700 hover:border-brand-900 hover:text-brand-900 transition-colors"
        >
          View <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
