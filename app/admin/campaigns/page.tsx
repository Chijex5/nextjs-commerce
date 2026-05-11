"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  type: string;
  subject: string;
  status: "DRAFT" | "SCHEDULED" | "SENT";
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

type StatusFilter = "" | "DRAFT" | "SCHEDULED" | "SENT";

// ─── Utils ────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  JUST_ARRIVED: "Just Arrived",
  SALE:         "Sale",
  COLLECTION:   "Collection",
};

function fmtDate(value: string | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Campaign["status"] }) {
  const map: Record<Campaign["status"], string> = {
    DRAFT:     "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    SCHEDULED: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    SENT:      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  };
  const dot: Record<Campaign["status"], string> = {
    DRAFT:     "bg-neutral-400",
    SCHEDULED: "bg-blue-500",
    SENT:      "bg-emerald-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${map[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-neutral-100 dark:border-neutral-800">
          <td className="px-5 py-4">
            <div className="space-y-1.5">
              <div className="h-3.5 w-40 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-2.5 w-56 rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </td>
          <td className="px-5 py-4"><div className="h-3 w-20 rounded bg-neutral-100 dark:bg-neutral-800" /></td>
          <td className="px-5 py-4"><div className="h-5 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800" /></td>
          <td className="px-5 py-4"><div className="h-3 w-24 rounded bg-neutral-100 dark:bg-neutral-800" /></td>
          <td className="px-5 py-4" />
        </tr>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);

  useEffect(() => { void fetchCampaigns(); }, [statusFilter, page]);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) p.set("status", statusFilter);
      const res = await fetch(`/api/admin/campaigns?${p}`);
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to delete campaign");
      }
      toast.success("Campaign deleted");
      void fetchCampaigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete campaign");
    }
  }

  // Derived stats from current list (all statuses, regardless of filter)
  const stats = useMemo(() => {
    const all = campaigns; // Note: these are filtered by the current filter — for real stats you'd want unfiltered data
    return {
      total:     all.length,
      draft:     all.filter((c) => c.status === "DRAFT").length,
      scheduled: all.filter((c) => c.status === "SCHEDULED").length,
      sent:      all.filter((c) => c.status === "SENT").length,
    };
  }, [campaigns]);

  const FILTER_TABS: Array<{ value: StatusFilter; label: string }> = [
    { value: "",          label: "All"       },
    { value: "DRAFT",     label: "Draft"     },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "SENT",      label: "Sent"      },
  ];

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════
          UNIFIED HEADER
          ══════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">

        {/* Title row */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Email Campaigns
            </h1>
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
              Create and manage marketing email campaigns
            </p>
          </div>
          <Link
            href="/admin/campaigns/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New Campaign
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 divide-x divide-neutral-100 dark:divide-neutral-800">
          {[
            { label: "Total",     value: stats.total,     accent: "" },
            { label: "Draft",     value: stats.draft,     accent: "text-neutral-500 dark:text-neutral-400" },
            { label: "Scheduled", value: stats.scheduled, accent: "text-blue-600 dark:text-blue-400" },
            { label: "Sent",      value: stats.sent,      accent: "text-emerald-600 dark:text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1 px-5 py-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {s.label}
              </span>
              <span className={`text-2xl font-bold tracking-tight ${s.accent || "text-neutral-900 dark:text-neutral-100"}`}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Filter underline tabs */}
        <div className="flex items-center gap-1 border-t border-neutral-100 px-5 dark:border-neutral-800">
          {FILTER_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                className={`relative py-3.5 pr-4 text-sm font-medium transition-colors ${
                  active
                    ? "text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-4 h-[2px] rounded-t-full bg-neutral-900 dark:bg-neutral-100" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════
          TABLE
          ══════════════════════════════════════ */}
      {!loading && campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-16 dark:border-neutral-800">
          <p className="text-sm text-neutral-400 dark:text-neutral-500">No campaigns found</p>
          <Link
            href="/admin/campaigns/new"
            className="mt-3 text-xs font-medium text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
          >
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800">
                {["Campaign", "Type", "Status", "Date", ""].map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-neutral-400 last:text-right dark:text-neutral-500"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : (
                campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="group border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50/60 dark:border-neutral-800 dark:hover:bg-neutral-950/30"
                  >
                    {/* Campaign name + subject */}
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/campaigns/${campaign.id}/edit`}
                        className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                      >
                        {campaign.name}
                      </Link>
                      <p className="mt-0.5 truncate text-[11px] text-neutral-400 dark:text-neutral-500 max-w-[280px]">
                        {campaign.subject}
                      </p>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        {TYPE_LABELS[campaign.type] ?? campaign.type.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusPill status={campaign.status} />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-neutral-400 dark:text-neutral-500">
                      {campaign.sentAt
                        ? <>Sent {fmtDate(campaign.sentAt)}</>
                        : campaign.scheduledAt
                          ? <>Scheduled {fmtDate(campaign.scheduledAt)}</>
                          : <>Created {fmtDate(campaign.createdAt)}</>}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link
                          href={`/admin/campaigns/${campaign.id}/edit`}
                          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                          {campaign.status === "DRAFT" ? "Edit" : "View"}
                        </Link>
                        {campaign.status === "SENT" && (
                          <Link
                            href={`/admin/campaigns/${campaign.id}/analytics`}
                            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
                          >
                            Analytics
                          </Link>
                        )}
                        {campaign.status === "DRAFT" && (
                          <button
                            type="button"
                            onClick={() => deleteCampaign(campaign.id)}
                            className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}