import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import { Dashboard } from "./pages/Dashboard";
import { Ventures } from "./pages/Ventures";
import { VentureForm } from "./pages/VentureForm";
import { VentureDetails } from "./pages/VentureDetails";
import { ActivityLog } from "./pages/ActivityLog";
import { Tasks } from "./pages/Tasks";
import { Automation } from "./pages/Automation";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import {
  getStoredToken,
  clearToken,
  onUnauthorized,
  api,
} from "./api/client";

type AuthState = "checking" | "authenticated" | "unauthenticated";

export interface SessionUser {
  name: string;
  email: string;
}

const topLinks = [
  { to: "/ventures", label: "Directory" },
  { to: "/analytics", label: "Leaderboard" },
  { to: "/activity", label: "Feed" },
  { to: "/automation", label: "Automation" },
];

function AuthChecking() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="text-center">
        <div className="w-9 h-9 rounded-xl bg-brand-900 text-white grid place-items-center mx-auto mb-4 animate-pulse-subtle">
          <span className="text-sm font-bold">F</span>
        </div>
        <p className="text-[13px] font-medium text-brand-500">Loading…</p>
      </div>
    </div>
  );
}

function AuthenticatedLayout({
  children,
  onSignOut,
  user,
}: {
  children: React.ReactNode;
  onSignOut: () => void;
  user: SessionUser | null;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-brand-900 flex">
      <Sidebar onSignOut={onSignOut} user={user} />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Slaky-style top utility bar */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-brand-200">
          <div className="max-w-6xl mx-auto px-4 lg:px-6 h-[57px] flex items-center gap-3">
            <div className="w-8 lg:hidden shrink-0" aria-hidden="true" />
            <nav aria-label="Quick sections" className="hidden md:flex items-center gap-1 text-[13px] font-medium">
              {topLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-3 py-1.5 rounded-full text-brand-500 hover:text-brand-900 hover:bg-brand-100 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2.5">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                Verified · live
              </span>
              <Link
                to="/ventures/new"
                className="slaky-btn-primary px-4 py-2 text-[13px]"
              >
                <Plus size={14} strokeWidth={2.5} />
                Add venture
              </Link>
              <div
                className="w-8 h-8 rounded-full bg-brand-900 text-white grid place-items-center text-xs font-bold shrink-0"
                title={user ? `${user.name} (${user.email})` : "Signed in"}
                aria-hidden="true"
              >
                {(user?.name || "U").trim().charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0">
          {/* Mobile header spacer for floating nav toggle */}
          <div className="h-2 lg:hidden" />
          {children}
        </main>

        <footer className="border-t border-brand-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-brand-400">
              <span className="font-bold text-brand-700">Follow-Up</span> — the database of verified founder follow-ups. Never a spreadsheet.
            </p>
            <p className="text-[11px] text-brand-400">Directory · Leaderboard · Feed · Automation</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [user, setUser] = useState<SessionUser | null>(null);

  // Restore an existing session from the stored token, if any.
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthState("unauthenticated");
      return;
    }
    api
      .me()
      .then(({ user: u }) => {
        setUser({ name: u.name, email: u.email });
        setAuthState("authenticated");
      })
      .catch(() => {
        clearToken();
        setAuthState("unauthenticated");
      });
  }, []);

  // Any 401 from the API (expired token, deleted account) drops us back to /login.
  useEffect(
    () =>
      onUnauthorized.subscribe(() => {
        setUser(null);
        setAuthState("unauthenticated");
      }),
    []
  );

  const handleSignIn = useCallback((token: string, u: SessionUser, remember: boolean) => {
    // Token persistence is handled by Login/Signup via storeToken;
    // the flag only documents intent here.
    void token;
    void remember;
    setUser(u);
    setAuthState("authenticated");
  }, []);

  const handleSignOut = useCallback(() => {
    clearToken();
    setUser(null);
    setAuthState("unauthenticated");
  }, []);

  const layout = (children: React.ReactNode) =>
    authState === "authenticated" ? (
      <AuthenticatedLayout onSignOut={handleSignOut} user={user}>
        {children}
      </AuthenticatedLayout>
    ) : (
      <Navigate to="/login" replace />
    );

  return (
    <BrowserRouter>
      <ToastProvider>
        {authState === "checking" ? (
          <AuthChecking />
        ) : (
          <Routes>
            {/* Auth routes */}
            <Route
              path="/login"
              element={authState === "unauthenticated" ? <Login onSignIn={handleSignIn} /> : <Navigate to="/" replace />}
            />
            <Route
              path="/signup"
              element={authState === "unauthenticated" ? <Signup onSignIn={handleSignIn} /> : <Navigate to="/" replace />}
            />

            {/* Authenticated routes */}
            <Route path="/" element={layout(<Dashboard />)} />
            <Route path="/ventures" element={layout(<Ventures />)} />
            <Route path="/ventures/new" element={layout(<VentureForm />)} />
            <Route path="/ventures/:id/edit" element={layout(<VentureForm />)} />
            <Route path="/ventures/:id" element={layout(<VentureDetails />)} />
            <Route path="/tasks" element={layout(<Tasks />)} />
            <Route path="/automation" element={layout(<Automation />)} />
            <Route path="/activity" element={layout(<ActivityLog />)} />
            <Route path="/analytics" element={layout(<Analytics />)} />
            <Route path="/settings" element={layout(<Settings />)} />
            <Route
              path="*"
              element={authState === "unauthenticated" ? <Navigate to="/login" replace /> : <NotFound />}
            />
          </Routes>
        )}
      </ToastProvider>
    </BrowserRouter>
  );
}
