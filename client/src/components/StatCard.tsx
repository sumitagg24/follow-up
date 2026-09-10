import { LucideIcon } from "lucide-react";

export function StatCard({ label, value, icon: Icon, tone }: { label:string; value:number|string; icon:LucideIcon; tone?:string }) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex items-center justify-between">
      <div>
        <div className="text-xs font-medium text-slate-500 tracking-wide uppercase">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </div>
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${tone||"bg-slate-50"}`}>
        <Icon size={18} className="text-slate-700"/>
      </div>
    </div>
  );
}
