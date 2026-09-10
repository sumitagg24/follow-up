import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Building2, ListTodo, Bot, Activity, BarChart3, Settings, Menu, X } from "lucide-react";

const sections = [
  {
    label: "Operations",
    links: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/ventures", label: "Ventures", icon: Building2 },
      { to: "/tasks", label: "Tasks", icon: ListTodo },
      { to: "/activity", label: "Activity Log", icon: Activity },
    ],
  },
  {
    label: "Intelligence",
    links: [
      { to: "/automation", label: "Automation", icon: Bot },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="app-sidebar"
        aria-label={open ? "Close navigation" : "Open navigation"}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 bg-white rounded-xl shadow border"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden animate-fade-in" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside
        id="app-sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r flex flex-col transition-transform lg:translate-x-0 overflow-y-auto ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-16 flex items-center gap-3 px-6 border-b shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white grid place-items-center font-bold text-sm relative">
            F<span className="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-none">Founder Follow-Up</div>
            <div className="text-xs text-slate-500">Venture Studio OS</div>
          </div>
        </div>
        <nav aria-label="Main navigation" className="flex-1 p-3 space-y-4">
          {sections.map((s) => (
            <div key={s.label}>
              <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</div>
              <div className="space-y-1">
                {s.links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`
                    }
                  >
                    <l.icon size={18} />
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t text-xs text-slate-400 shrink-0">
          Founder Follow-Up • v1.0
        </div>
      </aside>
    </>
  );
}
