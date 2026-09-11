import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  icon?: "danger" | "warning" | "info";
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, size = "md", icon, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((
    e: KeyboardEvent
  ) => {
    if (e.key === "Escape") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    const focusable = panelRef.current?.querySelector<HTMLElement>(
      "input, select, textarea, button:not([disabled])"
    );
    focusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  const iconStyles = {
    danger: { bg: "bg-red-50", color: "text-red-600", accent: "border-red-200" },
    warning: { bg: "bg-brand-100", color: "text-brand-700", accent: "border-brand-200" },
    info: { bg: "bg-blue-50", color: "text-blue-700", accent: "border-blue-200" },
  };

  const currentIconStyle = icon ? iconStyles[icon] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`
          relative bg-white rounded-2xl border border-brand-200 shadow-pop
          w-full ${sizeClasses[size]}
          animate-scale-in
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-brand-100">
          <div className="flex items-center gap-3">
            {currentIconStyle && (
              <div className={`w-8 h-8 rounded-lg ${currentIconStyle.bg} ${currentIconStyle.color} grid place-items-center shrink-0`}>
                {icon === "danger" && <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7 4.5h2v7H7V4.5zm0 8h2v2H7v-2z"/></svg>}
                {icon === "warning" && <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.5 4.5l-.5.5L4.5 6l.5.5L7.5 8l.5-.5L9.5 6l-.5-.5L7.5 4.5zm0 7.5h1v-2h-1v2z"/></svg>}
                {icon === "info" && <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.5 4.5a.5.5 0 01.5.5v5a.5.5 0 01-1 0V5a.5.5 0 01.5-.5zm-.5 2a.5.5 0 01.5.5v3a.5.5 0 01-1 0V6.5a.5.5 0 01.5-.5z"/></svg>}
              </div>
            )}
            <h2 id="modal-title" className={`text-[15px] font-bold tracking-tight ${currentIconStyle?.color || "text-brand-900"}`}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-full text-brand-400 hover:text-brand-900 hover:bg-brand-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 pb-5 pt-4 border-t border-brand-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
