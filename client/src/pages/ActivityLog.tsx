import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { Link } from "react-router-dom";

export function ActivityLog() {
  const [data,setData]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ api.getActivity().then(setData).finally(()=>setLoading(false)); },[]);
  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <Header title="Activity Log" subtitle="Chronological feed of all system events"/>
      {loading ? <div className="bg-white rounded-2xl border p-10 text-center text-sm text-slate-500">Loading…</div> : data.length===0 ? <div className="bg-white rounded-2xl border p-10 text-center text-sm text-slate-500">No activity yet</div> : (
        <div className="bg-white rounded-2xl border divide-y">
          {data.map(a=>(
            <div key={a._id} className="p-4 flex gap-4">
              <div className="w-2 h-2 rounded-full bg-slate-900 mt-2 shrink-0"/>
              <div className="flex-1 min-w-0">
                <div className="text-sm">{a.description}</div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                  <span>{new Date(a.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 border text-xs">{a.action}</span>
                  {a.ventureName && <span>• {a.ventureName}</span>}
                  {a.ventureId && <Link to={`/ventures/${a.ventureId}`} className="text-blue-600 hover:underline">View venture</Link>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
