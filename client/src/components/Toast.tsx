import { createContext, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; msg: string; type: ToastType };
const Ctx = createContext<{ push: (msg: string, type?: ToastType) => void }>(null as any);

let nextId = 1;

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="shrink-0" />,
  error: <AlertCircle size={16} className="shrink-0" />,
  info: <Info size={16} className="shrink-0" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function push(msg: string, type: ToastType = "info") {
    const t = { id: nextId++, msg, type };
    setToasts((s) => [...s, t]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== t.id)), 3200);
  }

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-slide-in-right flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : "bg-slate-800"}`}
          >
            {ICONS[t.type]}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useToast() {
  return useContext(Ctx);
}
