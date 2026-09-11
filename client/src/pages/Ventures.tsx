import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Header } from "../components/Header";
import { PageHeader, SectionHeader } from "../components/Card";
import { VentureBadge, FollowUpBadge, TaskBadge } from "../components/StatusBadge";
import { EmptyState } from "../components/EmptyState";
import { SkeletonRow } from "../components/Skeleton";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { useToast } from "../components/Toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { Search, Plus, Trash2, Eye, Pencil } from "lucide-react";
import { fmtDate } from "../utils/format";

export function Ventures() {
  usePageTitle("Ventures");
  const [ventures, setVentures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [toDelete, setToDelete] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const toast = useToast();
  const navigate = useNavigate();

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
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Ventures"
        subtitle={`${filteredCount} ${filteredCount === 1 ? "venture" : "ventures"}`}
        action={
          <Link to="/ventures/new">
            <Button icon={<Plus size={15} />} className="bg-brand-900 hover:bg-brand-800 px-4">
              Add Venture
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-brand-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ventures by name..."
              className={`
                w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-brand-50
                placeholder:text-brand-400
                transition-all duration-150
                ${hasFilters ? "border-brand-200 bg-white" : "border-brand-200 bg-brand-50"}
                focus:border-brand-400 focus:ring-brand-100 focus:bg-white
              `}
            />
          </div>
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
            className="w-full lg:w-40"
          />
          <Select
            value={sort}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSort(e.target.value)}
            options={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
            ]}
            className="w-full lg:w-40"
          />
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
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
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
                <Button icon={<Plus size={15} />} className="bg-brand-900 hover:bg-brand-800">
                  Create Venture
                </Button>
              </Link>
            }
          />
        )
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-brand-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-100 bg-brand-50/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-500 uppercase tracking-wide">
                      Venture
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-500 uppercase tracking-wide">
                      Founder
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-500 uppercase tracking-wide">
                      Industry
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-500 uppercase tracking-wide">
                      Follow-up
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-500 uppercase tracking-wide">
                      Tasks
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-brand-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {ventures.map((v) => (
                    <tr
                      key={v._id}
                      className="hover:bg-brand-50/50 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-brand-900">{v.name}</div>
                        {v.notes && (
                          <div className="text-xs text-brand-400 truncate mt-0.5 max-w-[200px]">
                            {v.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-brand-900">{v.founderName}</div>
                          <div className="text-xs text-brand-500">{v.founderEmail}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-brand-600">{v.industry}</td>
                      <td className="px-4 py-3">
                        <VentureBadge status={v.status} />
                      </td>
                      <td className="px-4 py-3">
                        {v.followUp ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  v.followUp.status === "overdue"
                                    ? "bg-red-500"
                                    : v.followUp.status === "completed"
                                    ? "bg-emerald-500"
                                    : "bg-accent-500"
                                }`}
                              />
                              <span className="text-xs text-brand-600">
                                {v.followUp.status}
                              </span>
                            </div>
                            <div className="text-xs text-brand-400 mt-0.5">
                              {fmtDate(v.followUp.dueDate)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-brand-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-brand-600">
                              {v.taskCounts?.completed ?? 0}
                            </span>
                            <span className="text-xs text-brand-400">/</span>
                            <span className="text-xs text-brand-500">
                              {v.taskCounts?.total ?? 0}
                            </span>
                          </div>
                          <div className="w-16 h-1.5 rounded-full bg-brand-100 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{
                                width: v.taskCounts?.total
                                  ? `${(v.taskCounts.completed / v.taskCounts.total) * 100}%`
                                  : "0%",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/ventures/${v._id}`}
                            className="p-2 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                            title="View venture"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            to={`/ventures/${v._id}/edit`}
                            className="p-2 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                            title="Edit venture"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => setToDelete(v)}
                            className="p-2 rounded-lg border border-brand-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                            title="Delete venture"
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

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {ventures.map((v) => (
              <div
                key={v._id}
                className="bg-white rounded-2xl border border-brand-100 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-semibold text-brand-900">{v.name}</div>
                    <div className="text-xs text-brand-500 mt-0.5">
                      {v.founderName} · {v.industry}
                    </div>
                  </div>
                  <VentureBadge status={v.status} />
                </div>

                {v.followUp ? (
                  <div className="flex items-center gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          v.followUp.status === "overdue"
                            ? "bg-red-500"
                            : v.followUp.status === "completed"
                            ? "bg-emerald-500"
                            : "bg-accent-500"
                        }`}
                      />
                      <span className="text-brand-600 capitalize">{v.followUp.status}</span>
                    </div>
                    <span className="text-brand-500">
                      Due {fmtDate(v.followUp.dueDate)}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-brand-400 mb-3">No follow-up set</div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-brand-600">
                      {v.taskCounts?.completed ?? 0}
                    </span>
                    <span className="text-xs text-brand-400">/</span>
                    <span className="text-xs text-brand-500">
                      {v.taskCounts?.total ?? 0}
                    </span>
                    <span className="text-xs text-brand-500"> tasks done</span>
                  </div>
                  <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-brand-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
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
                    className="flex-1 py-2.5 rounded-xl border border-brand-200 text-center text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors min-h-[44px]"
                  >
                    View
                  </Link>
                  <Link
                    to={`/ventures/${v._id}/edit`}
                    className="flex-1 py-2.5 rounded-xl border border-brand-200 text-center text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors min-h-[44px]"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setToDelete(v)}
                    className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors min-h-[44px] w-24"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Venture"
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
        confirmLabel="Delete Venture"
        busyLabel="Deleting..."
      />
    </div>
  );
}
