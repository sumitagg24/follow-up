import { NavLink } from "react-router-dom";
import { LayoutDashboard, Building2, Activity, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { to:"/", label:"Dashboard", icon: LayoutDashboard },
  { to:"/ventures", label:"Ventures", icon: Building2 },
  { to:"/activity", label:"Activity Log", icon: Activity },
];

export function Sidebar() {
  const [open,setOpen]=useState(false);
  return (
    <>
      <button onClick={()=>setOpen(!open)} className="lg:hidden fixed top-3 left-3 z-40 p-2 bg-white rounded-xl shadow border">
        {open? <X size={20}/>: <Menu size={20}/>}
      </button>
      {/* mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={()=>setOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r flex flex-col transition-transform lg:translate-x-0 ${open?"translate-x-0":"-translate-x-full"}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white grid place-items-center font-bold text-sm">HF</div>
          <div>
            <div className="font-semibold text-sm leading-none">Founder Follow-Up</div>
            <div className="text-xs text-slate-500">Venture Studio</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map(l=>(
            <NavLink key={l.to} to={l.to} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive?"bg-slate-900 text-white":"text-slate-600 hover:bg-slate-50"}`}>
              <l.icon size={18}/>{l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t text-xs text-slate-400">
          MVP • Internal Prototype
        </div>
      </aside>
    </>
  );
}
