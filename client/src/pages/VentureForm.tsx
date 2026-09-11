import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { PageHeader } from "../components/Card";
import { useToast } from "../components/Toast";
import { fmtDateInput } from "../utils/format";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Textarea } from "../components/Textarea";

export function VentureForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = !!id;
  usePageTitle(isEdit ? "Edit Venture" : "Add Venture");

  const [form, setForm] = useState({
    name: "",
    founderName: "",
    founderEmail: "",
    industry: "AI & Machine Learning",
    status: "New",
    followUpDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(isEdit);
  const [initError, setInitError] = useState<string | null>(null);

  const industries = [
    "AI & Machine Learning",
    "FinTech",
    "HealthTech",
    "SaaS",
    "ClimateTech",
    "Developer Tools",
    "Other",
  ];
  const statuses = ["New", "Evaluation", "Review", "Active", "Closed"];

  useEffect(() => {
    if (!isEdit || !id) return;
    api.getVenture(id).then((d) => {
      const v = d.venture;
      setForm({
        name: v.name,
        founderName: v.founderName,
        founderEmail: v.founderEmail,
        industry: industries.includes(v.industry) ? v.industry : "Other",
        status: v.status,
        followUpDate: fmtDateInput(v.followUpDate),
        notes: v.notes || "",
      });
      setInitLoading(false);
    }).catch((e: any) => {
      setInitError(e.message || "Couldn't load this venture");
      setInitLoading(false);
    });
  }, [id, isEdit]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = "Venture name is required";
    if (!form.founderName.trim()) newErrors.founderName = "Founder name is required";
    if (!form.founderEmail.trim()) newErrors.founderEmail = "Founder email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.founderEmail.trim()))
      newErrors.founderEmail = "Enter a valid email address";
    if (!form.industry) newErrors.industry = "Industry is required";
    if (!form.status) newErrors.status = "Status is required";
    if (!form.followUpDate) newErrors.followUpDate = "Follow-up date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.push("Please fix the highlighted fields", "error");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && id) {
        await api.updateVenture(id, form);
        toast.push("Venture updated", "success");
        navigate(`/ventures/${id}`);
      } else {
        const res = await api.createVenture(form);
        toast.push("Venture created · tasks auto-generated", "success");
        navigate(`/ventures/${res.venture._id}`);
      }
    } catch (err: any) {
      toast.push(err.message, "error");
    }
    setLoading(false);
  }

  if (initLoading) {
  if (initError) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <div className="slaky-card p-6 text-center">
          <p className="text-sm font-semibold text-red-700 mb-1">Couldn't load this venture</p>
          <p className="text-[13px] text-brand-500 mb-4">{initError}</p>
          <div className="flex items-center justify-center gap-2.5">
            <Link to="/ventures">
              <Button variant="secondary">Back to Directory</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <div className="slaky-card p-8 text-center">
          <div className="w-9 h-9 rounded-xl bg-brand-900 text-white grid place-items-center mx-auto mb-3 animate-pulse-subtle">
            <span className="text-sm font-bold">F</span>
          </div>
          <p className="text-[13px] font-medium text-brand-500">Loading venture data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <PageHeader
        title={isEdit ? "Edit venture" : "List your startup"}
        subtitle={isEdit ? "Update venture details — changes go live instantly" : "Each venture gets 3 verified tasks + a follow-up schedule, automatically"}
        breadcrumbs={
          isEdit
            ? [
                { label: "Directory", href: "/ventures" },
                { label: "Edit venture" },
              ]
            : [
                { label: "Directory", href: "/ventures" },
                { label: "Add venture" },
              ]
        }
        action={
          <Link to={isEdit ? `/ventures/${id}` : "/ventures"}>
            <Button variant="secondary">Cancel</Button>
          </Link>
        }
      />

      <form
        onSubmit={submit}
        noValidate
        className="slaky-card p-5 sm:p-6 space-y-5"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Venture name"
            placeholder="Nova AI"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            error={errors.name}
            required
          />
          <Input
            label="Founder name"
            placeholder="Rahul Sharma"
            value={form.founderName}
            onChange={(e) => update("founderName", e.target.value)}
            error={errors.founderName}
            required
          />
          <Input
            label="Founder email"
            type="email"
            placeholder="rahul@example.com"
            value={form.founderEmail}
            onChange={(e) => update("founderEmail", e.target.value)}
            error={errors.founderEmail}
            required
          />
          <Select
            label="Industry"
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
            error={errors.industry}
            options={industries.map((i) => ({ value: i, label: i }))}
            required
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            error={errors.status}
            options={statuses.map((s) => ({ value: s, label: s }))}
            required
          />
          <Input
            label="Follow-up date"
            type="date"
            value={form.followUpDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("followUpDate", e.target.value)}
            error={errors.followUpDate}
            required
          />
        </div>

        <Textarea
          label="Notes"
          placeholder="Optional notes…"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          error={errors.notes}
        />

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-brand-100">
          <Link to={isEdit ? `/ventures/${id}` : "/ventures"}>
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button
            type="submit"
            loading={loading}
          >
            {loading ? "Saving…" : isEdit ? "Save changes" : "List startup"}
          </Button>
        </div>
      </form>
    </div>
  );
}
