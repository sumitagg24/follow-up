import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-6",
};

export function Card({ children, className = "", hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-brand-200
        ${paddingMap[padding]}
        ${hover ? "slaky-card-hover cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string; positive?: boolean };
  className?: string;
  hint?: string;
}

// Slaky metric block: big tight number, small gray label, quiet icon tile.
export function StatCard({ label, value, icon, trend, className = "", hint }: StatCardProps) {
  const formattedValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div className={`slaky-card slaky-card-hover p-4 sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-brand-400 uppercase tracking-[0.08em]">{label}</p>
          <p className="text-[28px] leading-none font-bold text-brand-900 mt-2 tracking-tightest tabular-nums">
            {formattedValue}
          </p>
          {trend ? (
            <p className="mt-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-brand-100 text-brand-600"}`}>
                {trend.positive ? "+" : ""}{trend.value} {trend.label}
              </span>
            </p>
          ) : hint ? (
            <p className="text-xs text-brand-400 mt-2">{hint}</p>
          ) : null}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 grid place-items-center shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function PageHeader({ title, subtitle, action, breadcrumbs, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-3 mb-6 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px]">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-brand-300" aria-hidden="true">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="text-brand-500 hover:text-brand-900 transition-colors font-medium">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-brand-400" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[26px] sm:text-3xl font-bold text-brand-900 tracking-tightest leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-brand-500 mt-1 max-w-2xl">{subtitle}</p>}
        </div>
        {action && (
          <div className="flex items-center gap-2.5 shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-4 mb-3 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold text-brand-900 tracking-tight">{title}</h2>
        {description && <p className="text-[13px] text-brand-500 mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
