import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { VentureBadge, FollowUpBadge, TaskBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { fmtDate } from "../utils/format";
import { CheckCircle, Calendar, Mail, Building, User, Clock } from "lucide-react";

export function VentureDetails() {
  const { id } = useParams();
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [reschedOpen,setReschedOpen]=useState(false);
  const [newDate,setNewDate]=useState("");
  const toast=useToast();

  async function load(){
    try{ const d=await api.getVenture(id!); setData(d); }catch(e:any){ setError(e.message)}
    setLoading(false);
  }
  useEffect(()=>{ load(); },[id]);

  async function completeFollowUp(){
    try{ await api.completeFollowUp(data.followUp._id); toast.push("Follow-up completed","success"); load(); }catch(e:any){ toast.push(e.message,"error")}
  }
  async function saveReschedule(){
    try{ await api.rescheduleFollowUp(data.followUp._id, newDate); toast.push("Rescheduled","success"); setReschedOpen(false); load(); }catch(e:any){ toast.push(e.message,"error")}
  }
  async function completeTask(t:any){
    try{ await api.completeTask(t._id); toast.push(`Task "${t.title}" completed`,"success"); load(); }catch(e:any){ toast.push(e.message,"error")}
  }

  if(loading) return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  if(error) return <div className="p-6 text-sm text-red-600">{error}</div>;
  if(!data) return null;
  const { venture, followUp, tasks, activities } = data;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <Header title={venture.name} subtitle={`Founder: ${venture.founderName}`} action={
        <Link to={`/ventures/${venture._id}/edit`} className="px-4 py-2 rounded-xl border bg-white text-sm font-medium">Edit Venture</Link>
      }/>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="font-semibold mb-4">Venture Information</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex gap-2"><Building size={16} className="text-slate-400 mt-0.5"/><span><span className="text-slate-500">Industry:</span> {venture.industry}</span></div>
              <div className="flex gap-2"><User size={16} className="text-slate-400 mt-0.5"/><span><span className="text-slate-500">Founder:</span> {venture.founderName}</span></div>
              <div className="flex gap-2"><Mail size={16} className="text-slate-400 mt-0.5"/><span className="break-all"><span className="text-slate-500">Email:</span> {venture.founderEmail}</span></div>
              <div><span className="text-slate-500">Status:</span> <VentureBadge status={venture.status}/></div>
              <div className="flex gap-2"><Calendar size={16} className="text-slate-400 mt-0.5"/><span><span className="text-slate-500">Created:</span> {fmtDate(venture.createdAt)}</span></div>
              <div className="flex gap-2"><Clock size={16} className="text-slate-400 mt-0.5"/><span><span className="text-slate-500">Follow-up date:</span> {fmtDate(venture.followUpDate)}</span></div>
            </div>
            {venture.notes && <div className="mt-4 p-3 bg-slate-50 rounded-xl text-sm"><span className="font-medium">Notes:</span> {venture.notes}</div>}
          </div>

          <div className="bg-white rounded-2xl border p-6">
            <h3 className="font-semibold mb-4">Follow-up</h3>
            {!followUp ? <div className="text-sm text-slate-500">No follow-up found</div> : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="text-sm"><span className="text-slate-500">Due:</span> <b>{fmtDate(followUp.dueDate)}</b></div>
                  <div className="mt-2"><FollowUpBadge status={followUp.status}/></div>
                  {followUp.completedAt && <div className="text-xs text-slate-500 mt-1">Completed {fmtDate(followUp.completedAt)}</div>}
                </div>
                {followUp.status!=="completed" && (
                  <div className="flex gap-2">
                    <button onClick={completeFollowUp} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium">Complete</button>
                    <button onClick={()=>{ setNewDate(new Date(Date.now()+86400000).toISOString().slice(0,10)); setReschedOpen(true);}} className="px-4 py-2 rounded-xl bg-white border text-sm font-medium">Reschedule</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border p-6">
            <h3 className="font-semibold mb-4">Tasks ({tasks.length})</h3>
            <div className="space-y-3">
              {tasks.map((t:any)=>(
                <div key={t._id} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50">
                  <div>
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="text-xs text-slate-500">Due {t.dueDate? fmtDate(t.dueDate):"-"} • <TaskBadge status={t.status}/></div>
                  </div>
                  {t.status!=="completed" ? <button onClick={()=>completeTask(t)} className="p-2 rounded-lg bg-white border hover:bg-slate-100"><CheckCircle size={16} className="text-emerald-600"/></button> : <span className="text-xs text-emerald-600 font-medium">Done</span>}
                </div>
              ))}
              {tasks.length===0 && <div className="text-sm text-slate-500">No tasks</div>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 h-fit">
          <h3 className="font-semibold mb-4">Activity</h3>
          <div className="space-y-3 max-h-[600px] overflow-auto pr-1">
            {activities.map((a:any)=>(
              <div key={a._id} className="text-sm border-l-2 border-slate-200 pl-3 py-1">
                <div>{a.description}</div>
                <div className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {activities.length===0 && <div className="text-sm text-slate-500">No activity</div>}
          </div>
        </div>
      </div>

      <Modal open={reschedOpen} onClose={()=>setReschedOpen(false)} title="Reschedule follow-up">
        <label className="block text-sm font-medium">New follow-up date
          <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"/>
        </label>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={()=>setReschedOpen(false)} className="px-4 py-2 rounded-xl border text-sm">Cancel</button>
          <button onClick={saveReschedule} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Save</button>
        </div>
      </Modal>
    </div>
  );
}
