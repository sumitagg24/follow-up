import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { StatCard } from "../components/StatCard";
import { FollowUpBadge } from "../components/StatusBadge";
import { EmptyState, LoadingState } from "../components/EmptyState";
import { fmtDate } from "../utils/format";
import { useToast } from "../components/Toast";
import { Building2, Clock, AlertTriangle, CheckCircle, Calendar, Play, Plus, ArrowRight } from "lucide-react";
import { Modal } from "../components/Modal";

export function Dashboard() {
  const [stats,setStats]=useState<any>(null);
  const [todays,setTodays]=useState<any[]>([]);
  const [activities,setActivities]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [resched,setResched]=useState<any>(null);
  const [newDate,setNewDate]=useState("");
  const [automationResult,setAutomationResult]=useState<any>(null);
  const toast=useToast();

  async function load(){
    setLoading(true); setError(null);
    try{
      const d = await api.getDashboard();
      setStats(d.stats);
      setTodays(d.todaysFollowUps);
      setActivities(d.recentActivity);
    }catch(e:any){ setError(e.message) }
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function runAutomation(){
    try{
      const r = await api.runAutomation();
      setAutomationResult(r);
      toast.push(`Checked ${r.checked} follow-ups • ${r.remindersGenerated} reminders`, "success");
      load();
    }catch(e:any){ toast.push(e.message,"error")}
  }
  async function complete(fu:any){
    try{ await api.completeFollowUp(fu._id); toast.push("Follow-up completed","success"); load(); }catch(e:any){ toast.push(e.message,"error")}
  }
  async function saveReschedule(){
    if(!newDate) return;
    try{ await api.rescheduleFollowUp(resched._id, newDate); toast.push("Rescheduled","success"); setResched(null); load(); }catch(e:any){ toast.push(e.message,"error")}
  }

  if(loading) return <div className="p-6"><LoadingState/></div>;
  if(error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div></div>;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <Header title="Dashboard" subtitle="Overview of ventures and follow-ups" action={
        <div className="flex gap-2">
          <button onClick={runAutomation} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border text-sm font-medium hover:bg-slate-50">
            <Play size={16}/> Run Reminder Check
          </button>
          <Link to="/ventures/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-black">
            <Plus size={16}/> Add Venture
          </Link>
        </div>
      }/>

      {automationResult && (
        <div className="mb-4 bg-white border rounded-2xl p-4 flex flex-wrap gap-6 text-sm">
          <div><span className="text-slate-500">Checked:</span> <b>{automationResult.checked}</b></div>
          <div><span className="text-slate-500">Reminders:</span> <b>{automationResult.remindersGenerated}</b></div>
          <div><span className="text-slate-500">Emails sent:</span> <b>{automationResult.emailsSent}</b></div>
          <div><span className="text-slate-500">Overdue:</span> <b>{automationResult.overdueFound}</b></div>
          <button onClick={()=>setAutomationResult(null)} className="ml-auto text-xs text-slate-500 hover:text-slate-700">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
        <StatCard label="Total Ventures" value={stats.totalVentures} icon={Building2} tone="bg-slate-50"/>
        <StatCard label="Pending" value={stats.pendingFollowUps} icon={Clock} tone="bg-amber-50"/>
        <StatCard label="Today" value={stats.todaysFollowUps} icon={Calendar} tone="bg-blue-50"/>
        <StatCard label="Overdue" value={stats.overdueFollowUps} icon={AlertTriangle} tone="bg-red-50"/>
        <StatCard label="Completed" value={stats.completedFollowUps} icon={CheckCircle} tone="bg-emerald-50"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Today's Follow-ups</h2>
            <Link to="/ventures" className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">View all <ArrowRight size={14}/></Link>
          </div>
          {todays.length===0 ? <EmptyState title="No follow-ups due today" desc="All caught up. Use 'Run Reminder Check' to scan for overdue items."/> : (
            <div className="space-y-3">
              {todays.map(fu=>{
                const v:any = fu.ventureId;
                if(!v || typeof v==="string") return null;
                return (
                  <div key={fu._id} className="bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{v.name}</div>
                      <div className="text-sm text-slate-500 truncate">{v.founderName} • {fmtDate(fu.dueDate)}</div>
                      <div className="mt-2"><FollowUpBadge status={fu.status}/></div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={()=>complete(fu)} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700">Complete</button>
                      <button onClick={()=>{ setResched(fu); setNewDate(new Date(Date.now()+86400000).toISOString().slice(0,10));}} className="px-3 py-2 rounded-xl bg-white border text-xs font-medium hover:bg-slate-50">Reschedule</button>
                      <Link to={`/ventures/${v._id}`} className="px-3 py-2 rounded-xl bg-white border text-xs font-medium hover:bg-slate-50">View</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-3">Recent Activity</h2>
          <div className="bg-white rounded-2xl border divide-y">
            {activities.length===0 ? <div className="p-6 text-sm text-slate-500">No activity yet</div> : activities.slice(0,8).map(a=>(
              <div key={a._id} className="p-4">
                <div className="text-sm leading-snug">{a.description}</div>
                <div className="text-xs text-slate-500 mt-1">{new Date(a.createdAt).toLocaleString()} • {a.action}</div>
              </div>
            ))}
            <Link to="/activity" className="block p-3 text-center text-sm text-slate-600 hover:bg-slate-50 rounded-b-2xl">View all activity</Link>
          </div>
        </div>
      </div>

      <Modal open={!!resched} onClose={()=>setResched(null)} title="Reschedule follow-up">
        <div className="space-y-4">
          <label className="block text-sm font-medium">New follow-up date
            <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"/>
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setResched(null)} className="px-4 py-2 rounded-xl border text-sm">Cancel</button>
            <button onClick={saveReschedule} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
