import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { useToast } from "../components/Toast";
import { fmtDateInput } from "../utils/format";
import { usePageTitle } from "../hooks/usePageTitle";
import { AlertCircle } from "lucide-react";

const industries = ["AI & Machine Learning", "FinTech", "HealthTech", "SaaS", "ClimateTech", "Developer Tools", "Other"];
const statuses = ["New", "Evaluation", "Review", "Active", "Closed"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<"name" | "founderName" | "founderEmail" | "industry" | "status" | "followUpDate", string>>;

function validate(form: any): Errors {
  const e: Errors = {};
  if (!form.name.trim()) e.name = "Venture name is required";
  if (!form.founderName.trim()) e.founderName = "Founder name is required";
  if (!form.founderEmail.trim()) e.founderEmail = "Founder email is required";
  else if (!EMAIL_RE.test(form.founderEmail.trim())) e.founderEmail = "Enter a valid email address";
  if (!form.industry) e.industry = "Industry is required";
  if (!form.status) e.status = "Status is required";
  if (!form.followUpDate) e.followUpDate = "Follow-up date is required";
  return e;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle size={12} /> {msg}
    </p>
  );
}

export function VentureForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const nav = useNavigate();
  const toast = useToast();
  usePageTitle(isEdit ? "Edit Venture" : "Add Venture");
  const [form, setForm] = useState<any>({ name: "", founderName: "", founderEmail: "", industry: "AI & Machine Learning", status: "New", followUpDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), notes: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    api.getVenture(id!).then(d => {
      const v = d.venture;
      setForm({ name: v.name, founderName: v.founderName, founderEmail: v.founderEmail, industry: v.industry, status: v.status, followUpDate: fmtDateInput(v.followUpDate), notes: v.notes || "" });
      setInitLoading(false);
    }).catch(() => setInitLoading(false));
  }, [id]);

  function update(k: string, val: string) {
    setForm((s: any) => ({ ...s, [k]: val }));
    setErrors((e) => (e[k as keyof Errors] ? { ...e, [k]: undefined } : e));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.push("Fix the highlighted fields to continue", "error");
      return;
    }
    setLoading(true);
    try {
      if (isEdit) { await api.updateVenture(id!, form); toast.push("Venture updated", "success"); nav(`/ventures/${id}`); }
      else { const res = await api.createVenture(form); toast.push("Venture created • tasks auto-generated", "success"); nav(`/ventures/${res.venture._id}`); }
    } catch (err: any) { toast.push(err.message, "error"); }
    setLoading(false);
  }

  const inputCls = (k: keyof Errors) =>
    `mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${errors[k] ? "border-red-400 focus:border-red-500" : "focus:ring-2 focus:ring-slate-900"}`;

  if (initLoading) return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <Header title={isEdit ? "Edit Venture" : "Add Venture"} subtitle={isEdit ? "Update venture details" : "Create a new venture — tasks will be auto-created"} />
      <form onSubmit={submit} noValidate className="bg-white rounded-2xl border p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="vf-name" className="text-sm font-medium">Venture Name *</label>
            <input id="vf-name" value={form.name} onChange={e => update("name", e.target.value)} aria-invalid={!!errors.name} placeholder="Nova AI" className={inputCls("name")} />
            <FieldError msg={errors.name} />
          </div>
          <div>
            <label htmlFor="vf-founder" className="text-sm font-medium">Founder Name *</label>
            <input id="vf-founder" value={form.founderName} onChange={e => update("founderName", e.target.value)} aria-invalid={!!errors.founderName} placeholder="Rahul Sharma" className={inputCls("founderName")} />
            <FieldError msg={errors.founderName} />
          </div>
          <div>
            <label htmlFor="vf-email" className="text-sm font-medium">Founder Email *</label>
            <input id="vf-email" type="email" value={form.founderEmail} onChange={e => update("founderEmail", e.target.value)} aria-invalid={!!errors.founderEmail} placeholder="rahul@example.com" className={inputCls("founderEmail")} />
            <FieldError msg={errors.founderEmail} />
          </div>
          <div>
            <label htmlFor="vf-industry" className="text-sm font-medium">Industry *</label>
            <select id="vf-industry" value={form.industry} onChange={e => update("industry", e.target.value)} className={`${inputCls("industry")} bg-white`}>
              {industries.map(i => <option key={i}>{i}</option>)}
            </select>
            <FieldError msg={errors.industry} />
          </div>
          <div>
            <label htmlFor="vf-status" className="text-sm font-medium">Status *</label>
            <select id="vf-status" value={form.status} onChange={e => update("status", e.target.value)} className={`${inputCls("status")} bg-white`}>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
            <FieldError msg={errors.status} />
          </div>
          <div>
            <label htmlFor="vf-date" className="text-sm font-medium">Follow-up Date *</label>
            <input id="vf-date" type="date" value={form.followUpDate} onChange={e => update("followUpDate", e.target.value)} aria-invalid={!!errors.followUpDate} className={inputCls("followUpDate")} />
            <FieldError msg={errors.followUpDate} />
          </div>
        </div>
        <label htmlFor="vf-notes" className="text-sm font-medium block">Notes
          <textarea id="vf-notes" value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} placeholder="Optional notes…" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
        </label>
        <div className="flex gap-2 justify-end pt-2">
          <Link to={isEdit ? `/ventures/${id}` : "/ventures"} className="px-5 py-2.5 rounded-xl border text-sm font-medium">Cancel</Link>
          <button disabled={loading} aria-busy={loading} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50">
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Venture"}
          </button>
        </div>
      </form>
    </div>
  );
}
