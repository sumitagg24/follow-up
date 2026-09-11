interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function Header({ title, subtitle, action, className = "" }: HeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-[26px] sm:text-3xl font-bold text-brand-900 tracking-tightest leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-brand-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
    </div>
  );
}
