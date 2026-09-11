import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { PageHeader } from "../components/Card";
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
    } catch (e: any) {
      toast.push(e.message, "error");
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

  const summary = result ?? last;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Automation Center"
        subtitle="Daily 09:00 scheduled check with duplicate-reminder prevention"
        action={
          <Button
            onClick={runNow}
            disabled={running}
            icon={<Play size={15} />}
            className="bg-brand-900 hover:bg-brand-800"
          >
            {running ? "Running..." : "Run Automation Now"}
          </Button>
        }
      />

      {/* Last run result banner */}
      {result && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 grid place-items-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Last run complete
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              Checked {result.checked} ventures · {result.overdueFound} overdue found ·{" "}
              {result.remindersGenerated} reminders generated
            </p>
            {!result.emailsSent && (
              <p className="text-xs text-emerald-700 mt-1.5">
                Emails were recorded as development logs (SMTP not configured — see Settings).
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Ventures Checked"
          value={summary?.checked ?? 0}
          icon={<Bot size={18} />}
        />
        <StatCard
          label="Overdue Found"
          value={summary?.overdueFound ?? 0}
          icon={<AlertTriangle size={18} className="text-red-500" />}
          className={summary?.overdueFound ? "border-red-200" : ""}
        />
        <StatCard
          label="Reminders Generated"
          value={summary?.remindersGenerated ?? 0}
          icon={<BellRing size={18} className="text-blue-500" />}
        />
        <StatCard
          label="Emails Sent"
          value={summary?.emailsSent ?? 0}
          icon={<Mail size={18} className="text-emerald-500" />}
          className={summary?.emailsSent ? "border-emerald-200" : ""}
        />
      </div>

      {/* Status info */}
      <Card padding="md">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-brand-400" />
            <span className="text-brand-500">Schedule:</span>
            <span className="text-brand-900 font-medium">Daily at 09:00</span>
          </div>
          {last?.at && (
            <div className="flex items-center gap-2">
              <span className="text-brand-500">Last run:</span>
              <span className="text-brand-900 font-medium">
                {new Date(last.at).toLocaleString()}
              </span>
            </div>
          )}
          {summary?.triggeredBy && (
            <div className="flex items-center gap-2">
              <span className="text-brand-500">Trigger:</span>
              <span className="text-brand-900 font-medium capitalize">
                {summary.triggeredBy}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-brand-500">Status:</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
        </div>
      </Card>

      {/* History */}
      <div className="mt-6">
        <h2 className="font-semibold text-brand-900 mb-3">Run History</h2>
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
          <div className="bg-white rounded-2xl border border-brand-100 divide-y divide-brand-50">
            {history.map((a) => (
              <div
                key={a._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              >
                <div className="sm:w-40 shrink-0 text-xs text-brand-500">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
                <div className="flex-1 min-w-0 text-sm text-brand-800">
                  {a.description}
                </div>
                <ActivityBadge action={a.action} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
