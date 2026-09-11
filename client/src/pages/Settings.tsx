import { useEffect, useState } from "react";
import { api } from "../api/client";
import { PageHeader } from "../components/Card";
import { Card } from "../components/Card";
import { SkeletonCard } from "../components/Skeleton";
import { usePageTitle } from "../hooks/usePageTitle";
import { Database, Mail, Clock3, ShieldCheck, AlertTriangle } from "lucide-react";

type SystemStatus = {
  db: { mode: string; persistent: boolean; connected: boolean; name: string | null };
  email: { smtpConfigured: boolean; mode: string };
  automation: { cronScheduled: boolean; schedule: string };
  uptimeSeconds: number;
  version: string;
};

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "ok" | "warning" | "error" | "neutral";
  note?: string;
}

function StatusCard({ icon, label, value, status, note }: StatusCardProps) {
  const statusStyles = {
    ok: { tile: "bg-emerald-50 border-emerald-100 text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    warning: { tile: "bg-brand-100 border-brand-200 text-brand-600", badge: "bg-brand-100 text-brand-700 border-brand-200" },
    error: { tile: "bg-red-50 border-red-100 text-red-600", badge: "bg-red-50 text-red-700 border-red-200" },
    neutral: { tile: "bg-brand-100 border-brand-200 text-brand-500", badge: "bg-brand-100 text-brand-600 border-brand-200" },
  };

  const s = statusStyles[status];

  return (
    <div className="slaky-card flex items-start gap-3 p-4">
      <div className={`w-9 h-9 rounded-xl border grid place-items-center shrink-0 ${s.tile}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-brand-900 tracking-tight">{label}</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "ok" ? "bg-emerald-500" : status === "error" ? "bg-red-500" : "bg-brand-400"}`} aria-hidden="true" />
            {status === "ok" && "Active"}
            {status === "warning" && "Dev mode"}
            {status === "error" && "Down"}
            {status === "neutral" && "—"}
          </span>
        </div>
        <p className="text-[13px] text-brand-600 mt-1">{value}</p>
        {note && (
          <p className="text-xs text-brand-400 mt-1.5 leading-relaxed">{note}</p>
        )}
      </div>
    </div>
  );
}

const fmtUptime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export function Settings() {
  usePageTitle("Settings");
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSystemStatus()
      .then(setStatus)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="System status and configuration reference"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {!status && !error ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      ) : status && (
        <>
          {/* In-memory warning */}
          {status.db.mode === "in-memory" && (
            <div className="mb-4 bg-white border border-brand-300 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-xl bg-brand-900 text-white grid place-items-center shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-900 tracking-tight">
                  Development fallback active
                </p>
                <p className="text-[13px] text-brand-500 mt-1 leading-relaxed">
                  The server is using an in-memory database — data will be lost on restart.
                  Set <code className="bg-brand-100 px-1.5 py-0.5 rounded-md text-xs font-mono text-brand-900">MONGODB_URI</code> in{" "}
                  <code className="bg-brand-100 px-1.5 py-0.5 rounded-md text-xs font-mono text-brand-900">server/.env</code> for persistent storage.
                </p>
              </div>
            </div>
          )}

          {/* Status cards */}
          <div className="space-y-3 mb-6">
            <StatusCard
              icon={<Database size={16} />}
              label="Database"
              value={
                status.db.mode === "mongodb"
                  ? `MongoDB (persistent) — ${status.db.name ?? "connected"}`
                  : status.db.mode === "in-memory"
                  ? "In-memory MongoDB (development fallback)"
                  : `State: ${status.db.mode}`
              }
              status={
                status.db.mode === "in-memory"
                  ? "warning"
                  : status.db.connected
                  ? "ok"
                  : "error"
              }                note="Configured via MONGODB_URI. Ensure a persistent MongoDB instance is connected before relying on stored data."
            />
            <StatusCard
              icon={<Mail size={16} />}
              label="Email"
              value={
                status.email.smtpConfigured
                  ? "SMTP configured — reminder emails are delivered"
                  : "Development mode — emails are logged and recorded as activity"
              }
              status={status.email.smtpConfigured ? "ok" : "warning"}
              note="Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to enable real delivery."
            />
            <StatusCard
              icon={<Clock3 size={16} />}
              label="Automation"
              value={`${status.automation.schedule} — ${status.automation.cronScheduled ? "active" : "not scheduled"}`}
              status={status.automation.cronScheduled ? "ok" : "warning"}
              note="Manual runs are available anytime from the Automation Center."
            />
            <StatusCard
              icon={<ShieldCheck size={16} />}
              label="Server"
              value={`v${status.version} · Uptime ${fmtUptime(status.uptimeSeconds)}`}
              status="ok"
            />
          </div>

          {/* Environment variables reference */}
          <Card padding="md">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-600 grid place-items-center shrink-0">
                <Database size={15} />
              </div>
              <h3 className="text-[15px] font-bold text-brand-900 tracking-tight">Environment variables</h3>
            </div>
            <p className="text-[13px] text-brand-500 mb-4">
              Set in <code className="bg-brand-100 px-1.5 py-0.5 rounded-md text-xs font-mono text-brand-900">server/.env</code> (see{" "}
              <code className="bg-brand-100 px-1.5 py-0.5 rounded-md text-xs font-mono text-brand-900">server/.env.example</code>).
            </p>
            <div className="space-y-3">
              {[
                ["MONGODB_URI", "Atlas or local MongoDB connection string for persistence"],
                ["PORT", "API port (default 4000)"],
                ["CLIENT_URL", "Allowed CORS origin (default http://localhost:5173)"],
                ["SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM", "Enable real reminder email delivery"],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-start gap-2.5">
                  <code className="bg-brand-900 text-white px-2 py-1 rounded-lg text-[11px] font-mono w-fit shrink-0">
                    {key}
                  </code>
                  <span className="text-xs text-brand-500 leading-relaxed pt-0.5">{desc}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
