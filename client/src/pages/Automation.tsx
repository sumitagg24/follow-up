import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { EmptyState } from "../components/EmptyState";
import { SkeletonCard } from "../components/Skeleton";
import { ActivityBadge } from "../components/ActivityBadge";
import { useToast } from "../components/Toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { Bot, Play, CheckCircle2, AlertTriangle, BellRing, Mail, Clock } from "lucide-react";

type RunSummary = {
  at?: string; triggeredBy?: string; checked?: number; overdueFound?: number;
  remindersGenerated?: number; emailsSent?: number; description?: string;
};

export function Automation() {
  usePageTitle("Automation Center");
  const [last, setLast] = useState<RunSummary | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunSummary | null>(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const [dash, acts] = await Promise.all([
        api.getDashboard(),
        api.getActivity({ action: "automation_run", limit: "20" }),
      ]);
      setLast(dash.lastAutomationRun);
      setHistory(acts);
    } catch (e: any) { toast.push(e.message, "error"); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function runNow() {
    setRunning(true);
    try {
      const r = await api.runAutomation();
      setResult(r);
      toast.push(`Checked ${r.checked} follow-ups • ${r.remindersGenerated} reminders`, "success");
      await load();
    } catch (e: any) { toast.push(e.message, "error"); }
    setRunning(false);
  }

  const summary = result ?? last;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <Header
        title="Automation Center"
        subtitle="Daily 09:00 scheduled check with duplicate-reminder prevention"
        action={
          <button
            onClick={runNow}
            disabled={running}
            aria-busy={running}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50 min-h-[44px]"
          >
            <Play size={16} /> {running ? "Running…" : "Run Automation Now"}
          </button>
        }
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Run result banner */}
          {result && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-800 animate-fade-in flex items-start gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <div>
                <b>Last run complete</b> — checked {result.checked}, overdue found {result.overdueFound}, reminders generated {result.remindersGenerated}, emails sent {result.emailsSent}.
                {!result.emailsSent && <span className="block mt-1 text-emerald-700">Emails were recorded as development logs (SMTP not configured — see Settings).</span>}
              </div>
            </div>
          )}

          {/* Last run summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Ventures checked", value: summary?.checked ?? 0, icon: Bot, tone: "bg-slate-50" },
              { label: "Overdue found", value: summary?.overdueFound ?? 0, icon: AlertTriangle, tone: "bg-red-50" },
              { label: "Reminders", value: summary?.remindersGenerated ?? 0, icon: BellRing, tone: "bg-blue-50" },
              { label: "Emails sent", value: summary?.emailsSent ?? 0, icon: Mail, tone: "bg-emerald-50" },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="bg-white rounded-2xl border p-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
                  <div className={`w-8 h-8 rounded-lg grid place-items-center ${tone}`}><Icon size={15} className="text-slate-700" /></div>
                </div>
                <div className="text-2xl font-semibold mt-2">{value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border p-4 mb-6 text-sm flex flex-wrap gap-x-6 gap-y-2">
            <span className="text-slate-500">Last run: <b className="text-slate-900">{last?.at ? new Date(last.at).toLocaleString() : "Never"}</b></span>
            {last?.triggeredBy && <span className="text-slate-500">Trigger: <b className="text-slate-900 capitalize">{last.triggeredBy}</b></span>}
            <span className="text-slate-500 inline-flex items-center gap-1"><Clock size={13} /> Schedule: daily at 09:00</span>
          </div>

          {/* History */}
          <h2 className="font-semibold mb-3">Run History</h2>
          {history.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No automation runs recorded yet"
              desc="Run the check now, or wait for the daily 09:00 schedule. Every run is recorded here with its results."
              action={
                <button onClick={runNow} disabled={running} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-50">
                  <Play size={16} /> Run Automation Now
                </button>
              }
            />
          ) : (
            <div className="bg-white rounded-2xl border divide-y">
              {history.map((a) => (
                <div key={a._id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="sm:w-40 shrink-0 text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                  <div className="flex-1 min-w-0 text-sm">{a.description}</div>
                  <ActivityBadge action={a.action} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
