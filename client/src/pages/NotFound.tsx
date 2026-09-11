import { Link } from "react-router-dom";
import { Compass, LayoutDashboard, Building2 } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "../components/Button";

export function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Slaky-style top bar */}
      <header className="bg-white/85 backdrop-blur-md border-b border-brand-200">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-[57px] flex items-center gap-2.5">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Go home">
            <div className="w-8 h-8 rounded-lg bg-brand-900 text-white grid place-items-center font-bold text-[13px] shrink-0">
              F
            </div>
            <div className="leading-none">
              <div className="font-bold text-[14px] text-brand-900 tracking-tight">Follow-Up</div>
              <div className="text-[11px] text-brand-400 mt-0.5">Venture Studio OS</div>
            </div>
          </Link>
          <div className="ml-auto">
            <Link
              to="/ventures"
              className="slaky-btn-secondary px-4 py-2 text-[13px]"
            >
              Directory
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-900 text-white grid place-items-center mb-5">
            <Compass size={26} strokeWidth={1.5} />
          </div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-brand-400 uppercase mb-2">Error 404</p>
          <h1 className="text-2xl font-bold text-brand-900 tracking-tightest mb-2">Page not found</h1>
          <p className="text-sm text-brand-500 mb-6">
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link to="/">
              <Button icon={<LayoutDashboard size={15} />}>
                Go to Dashboard
              </Button>
            </Link>
            <Link to="/ventures">
              <Button variant="secondary" icon={<Building2 size={15} />}>
                Browse Directory
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <footer className="border-t border-brand-200 bg-white">
        <p className="max-w-6xl mx-auto px-4 py-4 text-center text-[11px] text-brand-400">
          © {new Date().getFullYear()} Follow-Up — Directory · Leaderboard · Feed · Automation
        </p>
      </footer>
    </div>
  );
}
