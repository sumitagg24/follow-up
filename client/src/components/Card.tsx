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
  md: "p-4",
  lg: "p-6",
};

export function Card({ children, className = "", hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl border
        ${paddingMap[padding]}
        ${hover ? "transition-colors duration-150 hover:border-brand-200 hover:shadow-sm-border hover:bg-brand-50/30" : "border-brand-100"}
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
}

export function StatCard({ label, value, icon, trend, className = "" }: StatCardProps) {
  const formattedValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div className={`bg-white rounded-2xl border p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-brand-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold text-brand-900 mt-1.5 tracking-tight">
            {formattedValue}
          </p>
          {trend && (
            <p className={`text-xs mt-1.5 ${trend.positive ? "text-emerald-600" : "text-red-600"}`}>
              {trend.positive ? "+" : ""}{trend.value} {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 grid place-items-center shrink-0">
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
    <div className={`flex flex-col gap-3 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-brand-300" aria-hidden="true">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="text-brand-500 hover:text-brand-700 transition-colors">
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
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold text-brand-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-brand-500">{subtitle}</p>}
      </div>
      {action && (
        <div className="flex items-center gap-3 mt-1">
          {action}
        </div>
      )}
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
    <div className={`flex items-center justify-between gap-4 mb-4 ${className}`}>
      <div>
        <h2 className="text-base font-semibold text-brand-900">{title}</h2>
        {description && <p className="text-sm text-brand-500 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
