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
        bg-white rounded-2xl border p-8 sm:p-10 text-center
        animate-fade-in
        ${className}
      `}
    >
      <div className="mx-auto w-12 h-12 rounded-xl bg-brand-50 text-brand-400 grid place-items-center mb-4">
        {Icon && <Icon size={22} strokeWidth={1.5} />}
      </div>
      <h3 className="text-base font-semibold text-brand-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-brand-500 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-5">{action}</div>
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
    <div className={`bg-white rounded-2xl border p-6 space-y-3 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg skeleton-shimmer"
          style={{ width: i === 0 ? "70%" : i === lines - 1 ? "40%" : "90%" }}
        />
      ))}
    </div>
  );
}