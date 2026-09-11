import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({ title, description, action, icon: Icon, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`
        slaky-card border-dashed !border-brand-300 bg-brand-50/60 p-8 sm:p-10 text-center
        animate-fade-in
        ${className}
      `}
    >
      <div className="mx-auto w-11 h-11 rounded-2xl bg-white border border-brand-200 text-brand-400 grid place-items-center mb-4 shadow-card">
        {Icon && <Icon size={20} strokeWidth={1.75} />}
      </div>
      <h3 className="text-[15px] font-bold text-brand-900 tracking-tight mb-1">{title}</h3>
      {description && (
        <p className="text-[13px] text-brand-500 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-5 flex justify-center">{action}</div>
      )}
    </div>
  );
}

interface LoadingStateProps {
  lines?: number;
  className?: string;
}

export function LoadingState({ lines = 3, className = "" }: LoadingStateProps) {
  return (
    <div className={`slaky-card p-6 space-y-3 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-full skeleton-shimmer"
          style={{ width: i === 0 ? "70%" : i === lines - 1 ? "40%" : "90%" }}
        />
      ))}
    </div>
  );
}
