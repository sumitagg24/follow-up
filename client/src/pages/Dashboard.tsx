import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { FollowUpBadge } from "../components/StatusBadge";
import { EmptyState } from "../components/EmptyState";
import { SkeletonCard, SkeletonRow, SkeletonStat } from "../components/Skeleton";
import { fmtDate } from "../utils/format";
import { useToast } from "../components/Toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { Building2, AlertTriangle, CheckCircle, Calendar, Play, Plus, ArrowRight, Bot, ListTodo, Flame } from "lucide-react";
import { Modal } from "../components/Modal";

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resched, setResched] = useState<any>(null);
  const [newDate, setNewDate] = useState("");
  const [running, setRunning] = useState(false);
  const toast = useToast();
  usePageTitle("Dashboard");

  async function load() {
    setLoading(true); setError(null);
    try { setData(await api.getDashboard()); }
    catch (e: any) { setError(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function runAutomation() {
    setRunning(true);
    try {
      const r = await api.runAutomation();
      toast.push(`Checked ${r.checked} follow-ups • ${r.remindersGenerated} reminders`, "success");
      await load();
    } catch (e: any) { toast.push(e.message, "error"); }
    setRunning(false);
  }
  async function complete(fu: any) {
    try { await api.completeFollowUp(fu._id); toast.push("Follow-up completed", "success"); load(); }
    catch (e: any) { toast.push(e.message, "error"); }
  }
  async function saveReschedule() {
    if (!newDate) return;
    try { await api.rescheduleFollowUp(resched._id, newDate); toast.push("Rescheduled", "success"); setResched(null); load(); }
    catch (e: any) { toast.push(e.message, "error"); }
  }

  if (loading) return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
        <div><SkeletonCard lines={3} /><div className="h-3" /><SkeletonCard lines={3} /></div>
      </div>
    </div>
  );
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div></div>;

  const { stats, todaysFollowUps, overdueFollowUps, upcomingFollowUps, recentActivity, lastAutomationRun } = data;

  function FollowUpRow({ fu, tone }: { fu: any; tone?: "overdue" }) {
    const v = fu.ventureId;
    if (!v || typeof v === "string") return null;
    return (
      <div className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${tone === "overdue" ? "border-red-200" : ""}`}>
        <div className="min-w-0">
          <div className="font-medium truncate flex items-center gap-2">
            {tone === "overdue" && <Flame size={14} className="text-red-500 shrink-0" aria-hidden="true" />}
            {v.name}
          </div>
          <div className="text-sm text-slate-500 truncate">{v.founderName} • {fmtDate(fu.dueDate)}</div>
          <div className="mt-2"><FollowUpBadge status={fu.status} /></div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button onClick={() => complete(fu)} className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700">Complete</button>
          <button onClick={() => { setResched(fu); setNewDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10)); }} className="min-h-[44px] px-3 py-2 rounded-xl bg-white border text-xs font-medium hover:bg-slate-50">Reschedule</button>
          <Link to={`/ventures/${v._id}`} className="min-h-[44px] px-3 py-2 rounded-xl bg-white border text-xs font-medium hover:bg-slate-50">View</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <Header title="Dashboard" subtitle="Live view of your venture pipeline and follow-ups"      action={
        <div className="flex flex-wrap gap-2">
          <button onClick={runAutomation} disabled={running} aria-busy={running} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border text-sm font-medium hover:bg-slate-50 disabled:opacity-50 min-h-[44px]">
            <Play size={16} /> {running ? "Running…" : "Run Reminder Check"}
          </button>
          <Link to="/ventures/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-black min-h-[44px]">
            <Plus size={16} /> Add Venture
          </Link>
        </div>
      } />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Link to="/ventures" className="bg-white rounded-2xl border p-4 flex items-center justify-between hover:border-slate-300">
          <div><div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Ventures</div><div className="text-xl font-semibold mt-1">{stats.totalVentures}</div></div>
          <Building2 size={16} className="text-slate-400" />
        </Link>
        <Link to="/ventures" className="bg-white rounded-2xl border p-4 flex items-center justify-between hover:border-slate-300">
          <div><div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Active</div><div className="text-xl font-semibold mt-1">{stats.activeVentures}</div></div>
          <CheckCircle size={16} className="text-emerald-500" />
        </Link>
        <div className="bg-white rounded-2xl border p-4 flex items-center justify-between">
          <div><div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Due Today</div><div className="text-xl font-semibold mt-1">{stats.todaysFollowUps}</div></div>
          <Calendar size={16} className="text-blue-500" />
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center justify-between">
          <div><div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Overdue</div><div className="text-xl font-semibold mt-1">{stats.overdueFollowUps}</div></div>
          <AlertTriangle size={16} className="text-red-500" />
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center justify-between">
          <div><div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Open Tasks</div><div className="text-xl font-semibold mt-1">{stats.openTasks}</div></div>
          <ListTodo size={16} className="text-violet-500" />
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center justify-between">
          <div><div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Tasks Done</div><div className="text-xl font-semibold mt-1">{stats.completedTasks}</div></div>
          <CheckCircle size={16} className="text-emerald-500" />
        </div>
      </div>

      {/* Automation summary strip */}
      <div className="bg-white rounded-2xl border p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center shrink-0"><Bot size={16} /></div>
        <div className="flex-1 min-w-0 text-sm">
          <b>Automation</b> — {lastAutomationRun
            ? <>last run {new Date(lastAutomationRun.at).toLocaleString()} ({lastAutomationRun.triggeredBy}): {lastAutomationRun.checked} checked, {lastAutomationRun.overdueFound} overdue, {lastAutomationRun.remindersGenerated} reminders, {lastAutomationRun.emailsSent} emails</>
            : <>never run yet — the daily schedule fires at 09:00, or trigger it now</>}
        </div>
        <Link to="/automation" className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 shrink-0">Automation Center <ArrowRight size={14} /></Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's follow-ups */}
          <section aria-labelledby="h-today">
            <div className="flex items-center justify-between mb-3">
              <h2 id="h-today" className="font-semibold">Today's Follow-ups</h2>
            </div>
            {todaysFollowUps.length === 0
              ? <EmptyState icon={CheckCircle} title="No follow-ups due today" desc="All caught up. Run a reminder check to scan for overdue items." />
              : <div className="space-y-3">{todaysFollowUps.map((fu: any) => <FollowUpRow key={fu._id} fu={fu} />)}</div>}
          </section>

          {/* Overdue */}
          <section aria-labelledby="h-overdue">
            <div className="flex items-center justify-between mb-3">
              <h2 id="h-overdue" className="font-semibold flex items-center gap-2">
                Overdue Follow-ups
                {overdueFollowUps.length > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">{overdueFollowUps.length}</span>}
              </h2>
            </div>
            {overdueFollowUps.length === 0
              ? <EmptyState icon={CheckCircle} title="Nothing overdue" desc="Every follow-up is on schedule." />
              : <div className="space-y-3">{overdueFollowUps.map((fu: any) => <FollowUpRow key={fu._id} fu={fu} tone="overdue" />)}</div>}
          </section>

          {/* Upcoming */}
          <section aria-labelledby="h-upcoming">
            <div className="flex items-center justify-between mb-3">
              <h2 id="h-upcoming" className="font-semibold">Upcoming (next 7 days)</h2>
            </div>
            {upcomingFollowUps.length === 0
              ? <EmptyState icon={Calendar} title="No upcoming follow-ups" desc="Reschedule a completed follow-up or add a new venture." />
              : <div className="space-y-3">{upcomingFollowUps.map((fu: any) => {
                  const v = fu.ventureId;
                  if (!v || typeof v === "string") return null;
                  return (
                    <div key={fu._id} className="bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{v.name}</div>
                        <div className="text-sm text-slate-500 truncate">{v.founderName} • due {fmtDate(fu.dueDate)}</div>
                      </div>
                      <Link to={`/ventures/${v._id}`} className="min-h-[44px] px-3 py-2 rounded-xl bg-white border text-xs font-medium hover:bg-slate-50 flex items-center shrink-0">View</Link>
                    </div>
                  );
                })}</div>}
          </section>
        </div>

        {/* Recent activity */}
        <div>
          <h2 className="font-semibold mb-3">Recent Activity</h2>
          <div className="bg-white rounded-2xl border divide-y">
            {recentActivity.length === 0 ? <div className="p-6 text-sm text-slate-500">No activity yet</div> : recentActivity.slice(0, 8).map((a: any) => (
              <div key={a._id} className="p-4">
                <div className="text-sm leading-snug">{a.description}</div>
                <div className="text-xs text-slate-500 mt-1">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
            ))}
            <Link to="/activity" className="block p-3 text-center text-sm text-slate-600 hover:bg-slate-50 rounded-b-2xl">View all activity</Link>
          </div>
        </div>
      </div>

      <Modal open={!!resched} onClose={() => setResched(null)} title="Reschedule follow-up">
        <div className="space-y-4">
          <label htmlFor="dash-resched-date" className="block text-sm font-medium">New follow-up date
            <input id="dash-resched-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setResched(null)} className="px-4 py-2 rounded-xl border text-sm">Cancel</button>
            <button onClick={saveReschedule} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
