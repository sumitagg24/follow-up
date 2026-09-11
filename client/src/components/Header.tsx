interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function Header({ title, subtitle, action, className = "" }: HeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 ${className}`}>
      <div>
        <h1 className="text-xl font-semibold text-brand-900 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-brand-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
