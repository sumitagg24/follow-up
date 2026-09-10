import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  icon,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: "danger";
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base font-semibold ${icon === "danger" ? "text-red-700" : ""}`}>{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="p-1 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
