import { useEffect, useState } from "react";
import { api } from "../api/client";
import { PageHeader, SectionHeader } from "../components/Card";
import { Card, StatCard } from "../components/Card";
import { ActivityBadge } from "../components/ActivityBadge";
import { EmptyState } from "../components/EmptyState";
import { SkeletonCard } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "../components/Button";
import { Bot, Play, CheckCircle2, AlertTriangle, BellRing, Mail, Clock } from "lucide-react";

type RunSummary = {
  at?: string;
  triggeredBy?: string;
  checked?: number;
  overdueFound?: number;
  remindersGenerated?: number;
  emailsSent?: number;
  description?: string;
};

export function Automation() {
  usePageTitle("Automation Center");
  const [last, setLast] = useState<RunSummary | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [cronScheduled, setCronScheduled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunSummary | null>(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [dash, acts, sys] = await Promise.all([
        api.getDashboard(),
        api.getActivity({ action: "automation_run", limit: "20" }),
        api.getSystemStatus().catch(() => null),
      ]);
      setLast(dash.lastAutomationRun);
      setHistory(acts);
      if (sys) setCronScheduled(sys.automation?.cronScheduled ?? null);
    } catch (e: any) {
      setLoadError(e.message || "Couldn't load automation data");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function runNow() {
    setRunning(true);
    try {
      const r = await api.runAutomation();
      setResult(r);
      toast.push(`Checked ${r.checked} follow-ups · ${r.remindersGenerated} reminders generated`, "success");
      await load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
    setRunning(false);
  }

  // `last` is refetched after every manual run, so it is always the
  // freshest record; `result` only backs the just-finished banner.
  const summary = last ?? result;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Automation Center"
        subtitle="Daily 09:00 scheduled check · every run verified — never a spreadsheet"
        action={
          <Button
            onClick={runNow}
            disabled={running}
            icon={<Play size={15} />}
          >
            {running ? "Running..." : "Run Automation Now"}
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      ) : loadError ? (
        <div className="slaky-card p-6 text-center mb-6">
          <p className="text-sm font-semibold text-red-700 mb-1">Couldn't load automation data</p>
          <p className="text-[13px] text-brand-500 mb-4">{loadError}</p>
          <Button variant="secondary" onClick={load}>
            Try again
          </Button>
        </div>
      ) : (
        <>
      {/* Last run result banner */}
      {result && (
        <div className="mb-5 bg-white border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 grid place-items-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-900 tracking-tight">
              Last run complete
            </p>
            <p className="text-[13px] text-brand-600 mt-1 tabular-nums">
              Checked {result.checked} ventures · {result.overdueFound} overdue found ·{" "}
              {result.remindersGenerated} reminders generated
            </p>
            {!result.emailsSent && (
              <p className="text-xs text-brand-500 mt-1.5">
                Emails were recorded as development logs (SMTP not configured — see Settings).
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard
          label="Ventures Checked"
          value={summary?.checked ?? 0}
          icon={<Bot size={17} />}
          hint="Last run"
        />
        <StatCard
          label="Overdue Found"
          value={summary?.overdueFound ?? 0}
          icon={<AlertTriangle size={17} className="text-red-500" />}
          className={summary?.overdueFound ? "!border-red-200" : ""}
          hint={summary?.overdueFound ? "Needs action" : "All clear"}
        />
        <StatCard
          label="Reminders Generated"
          value={summary?.remindersGenerated ?? 0}
          icon={<BellRing size={17} className="text-blue-500" />}
          hint="Duplicate-proof"
        />
        <StatCard
          label="Emails Sent"
          value={summary?.emailsSent ?? 0}
          icon={<Mail size={17} className="text-emerald-500" />}
          className={summary?.emailsSent ? "!border-emerald-200" : ""}
          hint={summary?.emailsSent ? "Delivered" : "Dev-log mode"}
        />
      </div>

      {/* Status info */}
      <Card padding="md">
        <div className="flex flex-wrap gap-x-6 gap-y-2.5 text-[13px]">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-brand-400" />
            <span className="text-brand-400">Schedule</span>
            <span className="slaky-pill">Daily 09:00</span>
          </div>
          {last?.at && (
            <div className="flex items-center gap-2">
              <span className="text-brand-400">Last run</span>
              <span className="text-brand-900 font-semibold tabular-nums">
                {new Date(last.at).toLocaleString()}
              </span>
            </div>
          )}
          {summary?.triggeredBy && (
            <div className="flex items-center gap-2">
              <span className="text-brand-400">Trigger</span>
              <span className="text-brand-900 font-semibold capitalize">
                {summary.triggeredBy}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-brand-400">Status</span>
            {cronScheduled === false ? (
              <span className="inline-flex items-center gap-1.5 text-brand-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                Manual only
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* History */}
      <div className="mt-6">
        <SectionHeader
          title="Run history"
          description={history.length ? `${history.length} recorded ${history.length === 1 ? "run" : "runs"}` : "Every run is recorded here"}
        />
        {history.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No automation runs recorded yet"
            description="Run the check now, or wait for the daily 09:00 schedule. Every run is recorded here with its results."
            action={
              <Button
                onClick={runNow}
                disabled={running}
                icon={<Play size={14} />}
                variant="secondary"
              >
                Run Automation Now
              </Button>
            }
          />
        ) : (
          <div className="slaky-card overflow-hidden divide-y divide-brand-100">
            {history.map((a) => (
              <div
                key={a._id}
                className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-brand-50/70 transition-colors"
              >
                <div className="sm:w-44 shrink-0 text-xs text-brand-400 tabular-nums">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
                <div className="flex-1 min-w-0 text-[13px] font-medium text-brand-800">
                  {a.description}
                </div>
                <ActivityBadge action={a.action} />
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
