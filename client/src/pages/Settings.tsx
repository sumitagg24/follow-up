import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { SkeletonCard } from "../components/Skeleton";
import { usePageTitle } from "../hooks/usePageTitle";
import { Database, Mail, Clock3, ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

type SystemStatus = {
  db: { mode: string; persistent: boolean; connected: boolean; name: string | null };
  email: { smtpConfigured: boolean; mode: string };
  automation: { cronScheduled: boolean; schedule: string };
  uptimeSeconds: number;
  version: string;
};

function StatusRow({ icon: Icon, label, value, ok, warn, note }: {
  icon: any; label: string; value: string; ok?: boolean; warn?: boolean; note?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4">
      <div className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${warn ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
          {label}
          {ok === true && <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 size={13} /> OK</span>}
          {warn && <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium"><AlertTriangle size={13} /> Dev mode</span>}
          {ok === false && <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium"><XCircle size={13} /> Down</span>}
        </div>
        <div className="text-sm text-slate-500 mt-0.5">{value}</div>
        {note && <div className="text-xs text-slate-400 mt-1">{note}</div>}
      </div>
    </div>
  );
}

export function Settings() {
  usePageTitle("Settings");
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSystemStatus().then(setStatus).catch((e) => setError(e.message));
  }, []);

  const fmtUptime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <Header title="Settings" subtitle="System status and configuration reference" />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}

      {!status && !error ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : status && (
        <>
          {status.db.mode === "in-memory" && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <b>Development fallback active.</b> The server is running on an in-memory database — data will be lost on restart.
                Set <code className="bg-amber-100 px-1 rounded">MONGODB_URI</code> in <code className="bg-amber-100 px-1 rounded">server/.env</code> for persistent storage.
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border divide-y mb-4">
            <StatusRow
              icon={Database}
              label="Database"
              value={status.db.mode === "mongodb"
                ? `MongoDB (persistent) — ${status.db.name ?? "connected"}`
                : status.db.mode === "in-memory" ? "In-memory MongoDB (development fallback)" : `State: ${status.db.mode}`}
              ok={status.db.persistent ? status.db.connected : undefined}
              warn={status.db.mode === "in-memory"}
              note="Configured via MONGODB_URI. The in-memory fallback exists for zero-setup demos only."
            />
            <StatusRow
              icon={Mail}
              label="Email"
              value={status.email.smtpConfigured ? "SMTP configured — reminder emails are delivered" : "Development mode — emails are logged and recorded as activity"}
              ok={status.email.smtpConfigured ? true : undefined}
              warn={!status.email.smtpConfigured}
              note="Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to enable real delivery."
            />
            <StatusRow
              icon={Clock3}
              label="Automation scheduler"
              value={`${status.automation.schedule} — ${status.automation.cronScheduled ? "active" : "not scheduled"}`}
              ok={status.automation.cronScheduled}
              note="Manual runs are available anytime from the Automation Center."
            />
            <StatusRow
              icon={ShieldCheck}
              label="Server"
              value={`v${status.version} • uptime ${fmtUptime(status.uptimeSeconds)}`}
              ok={true}
            />
          </div>

          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-2">Environment variables</h3>
            <p className="text-sm text-slate-500 mb-3">Set in <code className="bg-slate-100 px-1 rounded">server/.env</code> (see <code className="bg-slate-100 px-1 rounded">server/.env.example</code>).</p>
            <div className="text-sm space-y-2">
              {[
                ["MONGODB_URI", "Atlas or local MongoDB connection string for persistence"],
                ["PORT", "API port (default 4000)"],
                ["CLIENT_URL", "Allowed CORS origin (default http://localhost:5173)"],
                ["SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM", "Enable real reminder email delivery"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold shrink-0 w-fit">{k}</code>
                  <span className="text-slate-500 text-xs">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
