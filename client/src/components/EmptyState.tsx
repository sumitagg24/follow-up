export function EmptyState({ title, desc, action }: { title:string; desc?:string; action?:React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border p-10 text-center">
      <div className="text-sm font-medium">{title}</div>
      {desc && <div className="text-sm text-slate-500 mt-1">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function LoadingState() {
  return <div className="bg-white rounded-2xl border p-10 text-center text-sm text-slate-500 animate-pulse">Loading…</div>;
}
