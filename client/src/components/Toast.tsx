import { createContext, useContext, useState } from "react";

type Toast = { id:number; msg:string; type:"success"|"error"|"info" };
const Ctx = createContext<{ push:(msg:string,type?:Toast["type"])=>void }>(null as any);
let id=0;
export function ToastProvider({ children }: {children:React.ReactNode}) {
  const [toasts,setToasts]=useState<Toast[]>([]);
  function push(msg:string,type:Toast["type"]="info"){
    const t={id:++id,msg,type};
    setToasts(s=>[...s,t]);
    setTimeout(()=>setToasts(s=>s.filter(x=>x.id!==t.id)), 3000);
  }
  return (
    <Ctx.Provider value={{push}}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t=>(
          <div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white max-w-sm ${t.type==="success"?"bg-emerald-600":t.type==="error"?"bg-red-600":"bg-slate-800"}`}>{t.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useToast(){ return useContext(Ctx); }
