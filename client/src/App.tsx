import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

type AuthState = "checking" | "authenticated" | "unauthenticated";

function AuthenticatedLayout({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-brand-50 text-brand-900 flex">
      <Sidebar onSignOut={onSignOut} />
      <main className="flex-1 min-w-0">
        {/* Mobile header spacer */}
        <div className="h-14 lg:hidden" />
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    const session = localStorage.getItem("ffu_demo_session");
    setAuthState(session === "demo_user" ? "authenticated" : "unauthenticated");
  }, []);

  const handleSignIn = useCallback(() => {
    localStorage.setItem("ffu_demo_session", "demo_user");
    setAuthState("authenticated");
  }, []);

  const handleSignOut = useCallback(() => {
    localStorage.removeItem("ffu_demo_session");
    setAuthState("unauthenticated");
  }, []);

  if (authState === "checking") {
    return (
      <BrowserRouter>
        <ToastProvider>
          <div className="min-h-screen bg-brand-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 rounded-xl bg-brand-900 text-white grid place-items-center mx-auto mb-4 animate-pulse-subtle">
                <span className="text-sm font-semibold">F</span>
              </div>
              <p className="text-sm text-brand-500">Loading…</p>
            </div>
          </div>
        </ToastProvider>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Auth routes */}
          <Route
            path="/login"
            element={authState === "unauthenticated" ? <Login onSignIn={handleSignIn} /> : <Navigate to="/" replace />}
          />

          {/* Authenticated routes */}
          <Route
            path="/"
            element={authState === "authenticated" ? <AuthenticatedLayout onSignOut={handleSignOut}><Dashboard /></AuthenticatedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/ventures"
            element={authState === "authenticated" ? <AuthenticatedLayout onSignOut={handleSignOut}><Ventures /></AuthenticatedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/ventures/new"
            element={authState === "authenticated" ? <AuthenticatedLayout onSignOut={handleSignOut}><VentureForm /></AuthenticatedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/ventures/:id/edit"
            element={authState === "authenticated" ? <AuthenticatedLayout onSignOut={handleSignOut}><VentureForm /></AuthenticatedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/ventures/:id"
            element={authState === "authenticated" ? <AuthenticatedLayout onSignOut={handleSignOut}><VentureDetails /></AuthenticatedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/tasks"
            element={authState === "authenticated" ? <AuthenticatedLayout onSignOut={handleSignOut}><Tasks /></AuthenticatedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/automation"
            element={authState === "authenticated" ? <AuthenticatedLayout onSignOut={handleSignOut}><Automation /></AuthenticatedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/activity"
            element={authState === "authenticated" ? <AuthenticatedLayout onSignOut={handleSignOut}><ActivityLog /></AuthenticatedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/analytics"
            element={authState === "authenticated" ? <AuthenticatedLayout onSignOut={handleSignOut}><Analytics /></AuthenticatedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/settings"
            element={authState === "authenticated" ? <AuthenticatedLayout onSignOut={handleSignOut}><Settings /></AuthenticatedLayout> : <Navigate to="/login" replace />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
