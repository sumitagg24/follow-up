import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { VentureBadge } from "../components/StatusBadge";
import { EmptyState, LoadingState } from "../components/EmptyState";
import { fmtDate } from "../utils/format";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { Search, Plus, Trash2, Eye, Pencil } from "lucide-react";

export function Ventures() {
  const [data,setData]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState("");
  const [sort,setSort]=useState("newest");
  const [toDelete,setToDelete]=useState<any>(null);
  const toast = useToast();

  async function load(){
    setLoading(true); setError(null);
    try{
      const res = await api.getVentures({
        ...(search?{search}:{}),
        ...(status?{status}:{}),
        sort
      });
      setData(res);
    }catch(e:any){ setError(e.message)}
    setLoading(false);
  }
  useEffect(()=>{ load(); },[status,sort]);
  // debounce search
  useEffect(()=>{
    const t=setTimeout(()=>load(), 400);
    return ()=>clearTimeout(t);
  },[search]);

  async function confirmDelete(){
    try{ await api.deleteVenture(toDelete._id); toast.push("Venture deleted","success"); setToDelete(null); load(); }catch(e:any){ toast.push(e.message,"error")}
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <Header title="Ventures" subtitle={`${data.length} ventures`} action={
        <Link to="/ventures/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium"><Plus size={16}/> Add Venture</Link>
      }/>
      <div className="bg-white rounded-2xl border p-3 flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ventures..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-slate-50 text-sm focus:bg-white outline-none"/>
        </div>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border bg-white text-sm">
          <option value="">All statuses</option>
          <option>New</option><option>Evaluation</option><option>Review</option><option>Active</option><option>Closed</option>
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="px-3 py-2.5 rounded-xl border bg-white text-sm">
          <option value="newest">Newest</option><option value="oldest">Oldest</option>
        </select>
      </div>

      {loading ? <LoadingState/> : error ? <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div> : data.length===0 ? <EmptyState title="No ventures found" desc="Create your first venture to get started." action={<Link to="/ventures/new" className="inline-flex px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Add Venture</Link>}/> : (
        <>
        {/* desktop table */}
        <div className="hidden md:block bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Venture</th>
                  <th className="text-left px-4 py-3 font-medium">Founder</th>
                  <th className="text-left px-4 py-3 font-medium">Industry</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Follow-up</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map(v=>(
                  <tr key={v._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{v.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{v.founderName}<div className="text-xs text-slate-500">{v.founderEmail}</div></td>
                    <td className="px-4 py-3 whitespace-nowrap">{v.industry}</td>
                    <td className="px-4 py-3"><VentureBadge status={v.status}/></td>
                    <td className="px-4 py-3 whitespace-nowrap">{v.followUp ? fmtDate(v.followUp.dueDate) : fmtDate(v.followUpDate)}<div className="text-xs"><span className={`inline-block w-2 h-2 rounded-full mr-1 ${v.followUp?.status==="overdue"?"bg-red-500":v.followUp?.status==="completed"?"bg-emerald-500":"bg-amber-500"}`}/>{v.followUp?.status||"-"}</div></td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">{fmtDate(v.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/ventures/${v._id}`} className="p-2 hover:bg-white rounded-lg border bg-slate-50"><Eye size={14}/></Link>
                        <Link to={`/ventures/${v._id}/edit`} className="p-2 hover:bg-white rounded-lg border bg-slate-50"><Pencil size={14}/></Link>
                        <button onClick={()=>setToDelete(v)} className="p-2 hover:bg-red-50 rounded-lg border bg-slate-50 text-red-600"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* mobile cards */}
        <div className="md:hidden space-y-3">
          {data.map(v=>(
            <div key={v._id} className="bg-white rounded-2xl border p-4">
              <div className="flex justify-between items-start gap-2">
                <div><div className="font-medium">{v.name}</div><div className="text-xs text-slate-500">{v.founderName} • {v.industry}</div></div>
                <VentureBadge status={v.status}/>
              </div>
              <div className="text-xs text-slate-500 mt-2">Follow-up: {v.followUp? fmtDate(v.followUp.dueDate): fmtDate(v.followUpDate)} ({v.followUp?.status})</div>
              <div className="flex gap-2 mt-3">
                <Link to={`/ventures/${v._id}`} className="flex-1 py-2 rounded-xl border text-center text-sm font-medium">View</Link>
                <Link to={`/ventures/${v._id}/edit`} className="flex-1 py-2 rounded-xl border text-center text-sm font-medium">Edit</Link>
                <button onClick={()=>setToDelete(v)} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      <Modal open={!!toDelete} onClose={()=>setToDelete(null)} title="Delete Venture?">
        <p className="text-sm text-slate-600">Are you sure you want to delete <b>{toDelete?.name}</b>? This will also delete its follow-ups, tasks and activity. This action cannot be undone.</p>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={()=>setToDelete(null)} className="px-4 py-2 rounded-xl border text-sm">Cancel</button>
          <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
