import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ListTodo,
  Bell,
  Bot,
  TrendingUp,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useToast } from "./Toast";

interface SidebarProps {
  onSignOut?: () => void;
  user?: { name: string; email: string } | null;
}

interface NavSection {
  label: string;
  links: { to: string; label: string; icon: React.ElementType; end?: boolean }[];
}

const navSections: NavSection[] = [
  {
    label: "Operations",
    links: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/ventures", label: "Directory", icon: Building2 },
      { to: "/tasks", label: "Tasks", icon: ListTodo },
      { to: "/activity", label: "Feed", icon: Bell },
    ],
  },
  {
    label: "Intelligence",
    links: [
      { to: "/automation", label: "Automation", icon: Bot },
      { to: "/analytics", label: "Leaderboard", icon: TrendingUp },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar({ onSignOut, user }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleLogout() {
    setOpen(false);
    onSignOut?.();
    toast.push("Signed out", "info");
    navigate("/login");
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="app-sidebar"
        aria-label={open ? "Close navigation" : "Open navigation"}
        className="lg:hidden fixed top-3.5 left-4 z-50 p-2 bg-white rounded-full shadow-card border border-brand-200 text-brand-700"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden animate-fade-in"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="app-sidebar"
        className={`
          fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-[248px] h-screen
          bg-white border-r border-brand-200
          flex flex-col shrink-0
          transition-transform duration-200 ease-out
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand — Slaky-style wordmark */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-brand-100">
          <div className="w-8 h-8 rounded-lg bg-brand-900 text-white grid place-items-center font-bold text-[13px] tracking-tight shrink-0">
            F
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[14px] text-brand-900 leading-none tracking-tight">Follow-Up</div>
            <div className="text-[11px] text-brand-400 leading-tight mt-1">Venture Studio OS</div>
          </div>
          <span className="ml-auto slaky-pill !py-0 hidden xl:inline-flex">v1.0</span>
        </div>

        {/* Navigation */}
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-400">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => {
                      if (typeof window !== "undefined" && window.innerWidth < 1024) {
                        setOpen(false);
                      }
                    }}
                    className={({ isActive }) =>
                      isActive
                        ? "flex items-center gap-2.5 px-3 py-2 rounded-full text-[13px] font-semibold bg-brand-900 text-white"
                        : "flex items-center gap-2.5 px-3 py-2 rounded-full text-[13px] font-medium text-brand-500 hover:bg-brand-100 hover:text-brand-900 transition-colors"
                    }
                  >
                    <link.icon size={16} strokeWidth={2} />
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* User section */}
          <div className="pt-3 mt-1">
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-3">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-900 text-white grid place-items-center text-xs font-bold shrink-0" aria-hidden="true">
                  {(user?.name || "U").trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-brand-900 truncate tracking-tight">{user?.name || "Signed in"}</p>
                  <p className="text-[11px] text-brand-400 truncate">{user?.email || ""}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-full text-[13px] font-semibold bg-white border border-brand-200 text-brand-600 hover:border-brand-400 hover:text-brand-900 transition-colors"
                aria-label="Sign out"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        </nav>

        {/* Footer — Slaky trust line */}
        <div className="px-4 py-3 border-t border-brand-100">
          <p className="text-[11px] text-brand-400 text-center flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            All systems verified · live
          </p>
        </div>
      </aside>
    </>
  );
}
