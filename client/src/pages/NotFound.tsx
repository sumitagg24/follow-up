import { Link } from "react-router-dom";
import { Compass, LayoutDashboard, Building2 } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "../components/Button";

export function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-900 text-white grid place-items-center mb-5">
          <Compass size={26} strokeWidth={1.5} />
        </div>
        <p className="text-xs font-semibold tracking-widest text-brand-400 uppercase mb-2">Error 404</p>
        <h1 className="text-2xl font-semibold text-brand-900 tracking-tight mb-2">Page not found</h1>
        <p className="text-sm text-brand-500 mb-6">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button icon={<LayoutDashboard size={15} />} className="bg-brand-900 hover:bg-brand-800">
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/ventures">
            <Button variant="outline" icon={<Building2 size={15} />}>
              Browse Ventures
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
