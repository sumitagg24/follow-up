import { Link } from "react-router-dom";
import { Compass, LayoutDashboard, Building2 } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

export function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-900 text-white grid place-items-center mb-5">
          <Compass size={26} />
        </div>
        <div className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-2">Error 404</div>
        <h1 className="text-2xl font-semibold tracking-tight">This page doesn't exist</h1>
        <p className="text-sm text-slate-500 mt-2">
          The link may be outdated, or the venture you're looking for may have been deleted.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-black">
            <LayoutDashboard size={16} /> Go to Dashboard
          </Link>
          <Link to="/ventures" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white text-sm font-medium hover:bg-slate-50">
            <Building2 size={16} /> Browse Ventures
          </Link>
        </div>
      </div>
    </div>
  );
}
