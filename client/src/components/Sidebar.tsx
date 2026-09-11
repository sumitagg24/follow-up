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
      { to: "/ventures", label: "Ventures", icon: Building2 },
      { to: "/tasks", label: "Tasks", icon: ListTodo },
      { to: "/activity", label: "Activity", icon: Bell },
    ],
  },
  {
    label: "Intelligence",
    links: [
      { to: "/automation", label: "Automation", icon: Bot },
      { to: "/analytics", label: "Analytics", icon: TrendingUp },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar({ onSignOut }: SidebarProps) {
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
    toast.push("Signed out — demo session ended", "info");
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-sm border border-brand-200 text-brand-700 transition-all"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-brand-900/40 z-40 lg:hidden animate-fade-in"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="app-sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64
          bg-white border-r border-brand-100
          flex flex-col
          transition-transform duration-200 ease-out
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-brand-100">
          <div className="w-9 h-9 rounded-xl bg-brand-900 text-white grid place-items-center font-semibold text-sm relative">
            <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-accent-400 ring-2 ring-white" />
            <span className="text-xs leading-none">F</span>
          </div>
          <div>
            <div className="font-semibold text-sm text-brand-900 leading-none">Founder Follow-Up</div>
            <div className="text-[10px] text-brand-400 leading-tight mt-0.5">Venture Studio OS</div>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-400">
                {section.label}
              </p>
              <div className="space-y-1">
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
                        ? "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group bg-brand-900 text-white"
                        : "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group text-brand-600 hover:bg-brand-50 hover:text-brand-900"
                    }
                  >
                    <span className="relative">
                      <link.icon size={17} />
                    </span>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* Demo user section */}
          <div className="pt-4 border-t border-brand-100 mt-2">
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-medium text-brand-900 truncate">Demo User</p>
              <p className="text-[10px] text-brand-400 truncate">demo@founderfollowup.demo</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-brand-500 hover:bg-brand-50 hover:text-red-600 transition-colors"
              aria-label="Sign out of demo session"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-brand-100">
          <p className="text-[10px] text-brand-400 text-center">
            Founder Follow-Up · v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
