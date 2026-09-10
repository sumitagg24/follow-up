import type { LucideIcon } from "lucide-react";

export function EmptyState({ title, desc, action, icon: Icon }: { title: string; desc?: string; action?: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="bg-white rounded-2xl border p-12 text-center animate-fade-in">
      {Icon && (
        <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 grid place-items-center mb-4">
          <Icon size={22} />
        </div>
      )}
      <div className="text-sm font-semibold">{title}</div>
      {desc && <div className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{desc}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}