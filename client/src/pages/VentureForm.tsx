import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { useToast } from "../components/Toast";
import { fmtDateInput } from "../utils/format";

const industries = ["AI & Machine Learning","FinTech","HealthTech","SaaS","ClimateTech","Developer Tools","Other"];
const statuses = ["New","Evaluation","Review","Active","Closed"];

export function VentureForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const nav = useNavigate();
  const toast = useToast();
  const [form,setForm]=useState<any>({ name:"", founderName:"", founderEmail:"", industry:"AI & Machine Learning", status:"New", followUpDate: new Date(Date.now()+86400000).toISOString().slice(0,10), notes:"" });
  const [loading,setLoading]=useState(false);
  const [initLoading,setInitLoading]=useState(isEdit);

  useEffect(()=>{
    if(!isEdit) return;
    api.getVenture(id!).then(d=>{
      const v=d.venture;
      setForm({ name:v.name, founderName:v.founderName, founderEmail:v.founderEmail, industry:v.industry, status:v.status, followUpDate: fmtDateInput(v.followUpDate), notes: v.notes||""});
      setInitLoading(false);
    }).catch(()=>setInitLoading(false));
  },[id]);

  function update(k:string,val:string){ setForm((s:any)=>({...s,[k]:val})) }

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!form.name.trim()||!form.founderName.trim()||!form.industry||!form.status||!form.followUpDate) { toast.push("Please fill all required fields","error"); return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.founderEmail)) { toast.push("Valid email required","error"); return; }
    setLoading(true);
    try{
      if(isEdit){ await api.updateVenture(id!, form); toast.push("Venture updated","success"); nav(`/ventures/${id}`); }
      else { const res=await api.createVenture(form); toast.push("Venture created • tasks auto-generated","success"); nav(`/ventures/${res.venture._id}`); }
    }catch(err:any){ toast.push(err.message,"error")}
    setLoading(false);
  }

  if(initLoading) return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <Header title={isEdit?"Edit Venture":"Add Venture"} subtitle={isEdit?"Update venture details":"Create a new venture - tasks will be auto-created"} />
      <form onSubmit={submit} className="bg-white rounded-2xl border p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm font-medium">Venture Name *
            <input value={form.name} onChange={e=>update("name",e.target.value)} placeholder="Nova AI" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"/>
          </label>
          <label className="text-sm font-medium">Founder Name *
            <input value={form.founderName} onChange={e=>update("founderName",e.target.value)} placeholder="Rahul Sharma" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"/>
          </label>
          <label className="text-sm font-medium">Founder Email *
            <input type="email" value={form.founderEmail} onChange={e=>update("founderEmail",e.target.value)} placeholder="rahul@example.com" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"/>
          </label>
          <label className="text-sm font-medium">Industry *
            <select value={form.industry} onChange={e=>update("industry",e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm bg-white">
              {industries.map(i=><option key={i}>{i}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Status *
            <select value={form.status} onChange={e=>update("status",e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm bg-white">
              {statuses.map(s=><option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Follow-up Date *
            <input type="date" value={form.followUpDate} onChange={e=>update("followUpDate",e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"/>
          </label>
        </div>
        <label className="text-sm font-medium block">Notes
          <textarea value={form.notes} onChange={e=>update("notes",e.target.value)} rows={3} placeholder="Optional notes..." className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"/>
        </label>
        <div className="flex gap-2 justify-end pt-2">
          <Link to={isEdit?`/ventures/${id}`:"/ventures"} className="px-5 py-2.5 rounded-xl border text-sm font-medium">Cancel</Link>
          <button disabled={loading} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50">{loading?"Saving…": isEdit?"Save Changes":"Create Venture"}</button>
        </div>
      </form>
    </div>
  );
}
