import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; msg: string; type: ToastType };

const Ctx = createContext<{ push: (msg: string, type?: ToastType) => void }>(null as any);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((s) => [...s, { id, msg, type }]);
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
    success: {
      bg: "bg-emerald-50",
      border: "border-l-4 border-l-emerald-500",
      icon: <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />,
    },
    error: {
      bg: "bg-red-50",
      border: "border-l-4 border-l-red-500",
      icon: <AlertCircle size={16} className="text-red-600 shrink-0" />,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-l-4 border-l-blue-500",
      icon: <Info size={16} className="text-blue-600 shrink-0" />,
    },
  };

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 max-w-md"
      >
        {toasts.map((t) => {
          const styles = toastStyles[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className={`
                animate-slide-in-right
                flex items-start gap-3 px-4 py-3 rounded-xl shadow-sm
                ${styles.bg} ${styles.border}
              `}
            >
              {styles.icon}
              <p className="text-sm text-brand-800 leading-relaxed flex-1">{t.msg}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="p-0.5 rounded-md text-brand-400 hover:text-brand-600 hover:bg-brand-100 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
