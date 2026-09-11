import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { PageHeader } from "../components/Card";
import { VentureBadge } from "../components/StatusBadge";
import { EmptyState } from "../components/EmptyState";
import { SkeletonRow } from "../components/Skeleton";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { useToast } from "../components/Toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { Search, Plus, Trash2, Eye, Pencil, BadgeCheck } from "lucide-react";
import { fmtDate } from "../utils/format";

function initials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Ventures() {
  usePageTitle("Ventures");
  const [ventures, setVentures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [toDelete, setToDelete] = useState<any>(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getVentures({
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        sort,
      });
      setVentures(res);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [status, sort]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await api.deleteVenture(toDelete._id);
      toast.push(`"${toDelete.name}" deleted`, "success");
      setToDelete(null);
      load();
    } catch (e: any) {
      toast.push(e.message, "error");
    }
  }

  const hasFilters = search.trim() || status;
  const filteredCount = ventures.length;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Directory"
        subtitle={`${filteredCount} ${filteredCount === 1 ? "venture" : "ventures"} · every profile verified live — never a spreadsheet`}
        action={
          <Link to="/ventures/new">
            <Button icon={<Plus size={15} />}>
              Add Venture
            </Button>
          </Link>
        }
      />

      {/* Filters — Slaky search bar */}
      <div className="slaky-card p-3 sm:p-4 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ventures by name..."
              aria-label="Search ventures by name"
              className={`
                w-full pl-10 pr-4 py-2.5 text-sm rounded-full border bg-brand-50 outline-none
                placeholder:text-brand-400 transition-colors
                ${hasFilters ? "border-brand-300 bg-white" : "border-brand-200 bg-brand-50"}
                focus:border-brand-900 focus:bg-white
              `}
            />
          </div>
          <div className="flex gap-2.5">
            <Select
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
              options={[
                { value: "", label: "All statuses" },
                { value: "New", label: "New" },
                { value: "Evaluation", label: "Evaluation" },
                { value: "Review", label: "Review" },
                { value: "Active", label: "Active" },
                { value: "Closed", label: "Closed" },
              ]}
              className="w-full lg:w-40 !rounded-full"
              aria-label="Filter by status"
            />
            <Select
              value={sort}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSort(e.target.value)}
              options={[
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" },
              ]}
              className="w-full lg:w-40 !rounded-full"
              aria-label="Sort ventures"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="slaky-card p-6 text-center">
          <p className="text-sm font-semibold text-red-700 mb-1">Couldn't load ventures</p>
          <p className="text-[13px] text-brand-500 mb-4">{error}</p>
          <button onClick={load} className="slaky-btn-secondary px-4 py-2 text-[13px]">
            Try again
          </button>
        </div>
      ) : filteredCount === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Search}
            title="No ventures match your filters"
            description={`Nothing found for "${search || status}". Try a different search term or clear the filters.`}
          />
        ) : (
          <EmptyState
            icon={Plus}
            title="No ventures yet"
            description="Create your first venture to start tracking founders, follow-ups, and operational tasks. Each venture automatically gets an initial review, founder follow-up, and internal discussion task."
            action={
              <Link to="/ventures/new">
                <Button icon={<Plus size={15} />}>
                  Create Venture
                </Button>
              </Link>
            }
          />
        )
      ) : (
        <>
          {/* Desktop leaderboard table */}
          <div className="hidden md:block slaky-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-200 bg-brand-50/60">
                    <th className="slaky-table-head w-10">#</th>
                    <th className="slaky-table-head">
                      Startup
                    </th>
                    <th className="slaky-table-head">
                      Founder
                    </th>
                    <th className="slaky-table-head">
                      Status
                    </th>
                    <th className="slaky-table-head">
                      Follow-up
                    </th>
                    <th className="slaky-table-head">
                      Tasks
                    </th>
                    <th className="slaky-table-head !text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {ventures.map((v, i) => (
                    <tr
                      key={v._id}
                      className="hover:bg-brand-50/70 transition-colors group"
                    >
                      <td className="px-4 py-3 text-xs font-bold text-brand-300 tabular-nums whitespace-nowrap">
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="slaky-avatar w-9 h-9 text-xs" aria-hidden="true">
                            {initials(v.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-brand-900 tracking-tight flex items-center gap-1.5">
                              <span className="truncate">{v.name}</span>
                              <BadgeCheck size={13} className="text-emerald-600 shrink-0" aria-label="Verified" />
                            </div>
                            {v.industry ? (
                              <div className="text-[11px] text-brand-400 truncate mt-0.5">
                                {v.industry}{v.notes ? ` · ${v.notes}` : ""}
                              </div>
                            ) : v.notes ? (
                              <div className="text-[11px] text-brand-400 truncate mt-0.5 max-w-[220px]">
                                {v.notes}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-brand-900 font-medium text-[13px]">{v.founderName}</div>
                          <div className="text-[11px] text-brand-400">{v.founderEmail}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <VentureBadge status={v.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {v.followUp ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  v.followUp.status === "overdue"
                                    ? "bg-red-500"
                                    : v.followUp.status === "completed"
                                    ? "bg-emerald-500"
                                    : "bg-brand-400"
                                }`}
                              />
                              <span className="text-xs font-semibold text-brand-700 capitalize">
                                {v.followUp.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-brand-400 mt-0.5 tabular-nums">
                              {fmtDate(v.followUp.dueDate)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-brand-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-900 tabular-nums">
                            {v.taskCounts?.completed ?? 0}
                            <span className="text-brand-300 font-medium">/{v.taskCounts?.total ?? 0}</span>
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-brand-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${((v.taskCounts?.total ?? 0) > 0 && v.taskCounts.completed === v.taskCounts.total) ? "bg-emerald-500" : "bg-brand-900"}`}
                              style={{
                                width: v.taskCounts?.total
                                  ? `${(v.taskCounts.completed / v.taskCounts.total) * 100}%`
                                  : "0%",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity">
                          <Link
                            to={`/ventures/${v._id}`}
                            className="p-2 rounded-full border border-brand-200 text-brand-500 hover:border-brand-900 hover:text-brand-900 transition-colors"
                            title="View venture"
                            aria-label={`View ${v.name}`}
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            to={`/ventures/${v._id}/edit`}
                            className="p-2 rounded-full border border-brand-200 text-brand-500 hover:border-brand-900 hover:text-brand-900 transition-colors"
                            title="Edit venture"
                            aria-label={`Edit ${v.name}`}
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => setToDelete(v)}
                            className="p-2 rounded-full border border-brand-200 text-brand-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete venture"
                            aria-label={`Delete ${v.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile directory cards */}
          <div className="md:hidden space-y-3">
            {ventures.map((v) => (
              <article
                key={v._id}
                className="slaky-card p-4"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="slaky-avatar w-10 h-10 text-[13px]" aria-hidden="true">
                    {initials(v.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-brand-900 tracking-tight flex items-center gap-1.5">
                      <span className="truncate">{v.name}</span>
                      <BadgeCheck size={13} className="text-emerald-600 shrink-0" aria-label="Verified" />
                    </div>
                    <div className="text-xs text-brand-500 mt-0.5 truncate">
                      {v.founderName} · {v.industry}
                    </div>
                  </div>
                  <VentureBadge status={v.status} />
                </div>

                {v.followUp ? (
                  <div className="flex items-center gap-2 mb-3 text-[13px]">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        v.followUp.status === "overdue"
                          ? "bg-red-500"
                          : v.followUp.status === "completed"
                          ? "bg-emerald-500"
                          : "bg-brand-400"
                      }`}
                    />
                    <span className="text-brand-700 font-semibold capitalize">{v.followUp.status}</span>
                    <span className="text-brand-400 tabular-nums">
                      Due {fmtDate(v.followUp.dueDate)}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-brand-300 mb-3">No follow-up set</div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-brand-900 tabular-nums">
                    {v.taskCounts?.completed ?? 0}<span className="text-brand-300 font-medium">/{v.taskCounts?.total ?? 0}</span>
                  </span>
                  <span className="text-xs text-brand-400">tasks done</span>
                  <div className="flex-1 max-w-[100px] h-1.5 rounded-full bg-brand-100 overflow-hidden ml-auto">
                    <div
                      className="h-full bg-brand-900 rounded-full"
                      style={{
                        width: v.taskCounts?.total
                          ? `${(v.taskCounts.completed / v.taskCounts.total) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-brand-100">
                  <Link
                    to={`/ventures/${v._id}`}
                    className="flex-1 py-2 rounded-full border border-brand-200 text-center text-[13px] font-semibold text-brand-700 hover:border-brand-900 hover:text-brand-900 transition-colors min-h-[40px] grid place-items-center"
                  >
                    View
                  </Link>
                  <Link
                    to={`/ventures/${v._id}/edit`}
                    className="flex-1 py-2 rounded-full border border-brand-200 text-center text-[13px] font-semibold text-brand-700 hover:border-brand-900 hover:text-brand-900 transition-colors min-h-[40px] grid place-items-center"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setToDelete(v)}
                    className="px-4 py-2 rounded-full bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors min-h-[40px]"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete venture"
        message={
          toDelete ? (
            <span>
              Are you sure you want to delete{" "}
              <strong className="text-brand-900">{toDelete.name}</strong>?
              <br />
              This will permanently remove the venture, its follow-ups, tasks, and activity history.
              <br />
              This action cannot be undone.
            </span>
          ) : undefined
        }
        confirmLabel="Delete venture"
        busyLabel="Deleting..."
      />
    </div>
  );
}
