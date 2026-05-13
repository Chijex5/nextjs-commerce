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
    DRAFT:     "border-neutral-700 text-neutral-500",
    SCHEDULED: "border-neutral-600 text-neutral-400",
    SENT:      "border-neutral-500 text-neutral-200",
  };
  const dot: Record<Campaign["status"], string> = {
    DRAFT:     "bg-neutral-600",
    SCHEDULED: "bg-neutral-400",
    SENT:      "bg-white",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${map[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-neutral-800">
          <td className="px-5 py-4">
            <div className="space-y-2">
              <div className="h-3 w-36 rounded bg-neutral-800" />
              <div className="h-2.5 w-52 rounded bg-neutral-800" />
            </div>
          </td>
          <td className="hidden px-5 py-4 sm:table-cell">
            <div className="h-3 w-20 rounded bg-neutral-800" />
          </td>
          <td className="px-5 py-4">
            <div className="h-5 w-16 rounded-full bg-neutral-800" />
          </td>
          <td className="hidden px-5 py-4 md:table-cell">
            <div className="h-3 w-24 rounded bg-neutral-800" />
          </td>
          <td className="px-5 py-4" />
        </tr>
      ))}
    </>
  );
}

// ─── Campaign row (mobile card fallback) ──────────────────────────────────────

function CampaignRow({
  campaign,
  onDelete,
}: {
  campaign: Campaign;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      {/* ── Desktop row ── */}
      <tr className="group border-b border-neutral-800 transition-colors last:border-0 hover:bg-neutral-900">
        <td className="px-5 py-4">
          <Link
            href={`/admin/campaigns/${campaign.id}/edit`}
            className="font-medium text-white hover:underline underline-offset-2"
          >
            {campaign.name}
          </Link>
          <p className="mt-0.5 max-w-[260px] truncate text-[11px] text-neutral-600">
            {campaign.subject}
          </p>
        </td>

        <td className="hidden px-5 py-4 sm:table-cell">
          <span className="text-xs text-neutral-500">
            {TYPE_LABELS[campaign.type] ?? campaign.type.replace(/_/g, " ")}
          </span>
        </td>

        <td className="px-5 py-4">
          <StatusPill status={campaign.status} />
        </td>

        <td className="hidden px-5 py-4 md:table-cell">
          <span className="font-mono text-xs text-neutral-600">
            {campaign.sentAt
              ? `Sent ${fmtDate(campaign.sentAt)}`
              : campaign.scheduledAt
                ? `Scheduled ${fmtDate(campaign.scheduledAt)}`
                : `Created ${fmtDate(campaign.createdAt)}`}
          </span>
        </td>

        <td className="px-5 py-4 text-right">
          <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Link
              href={`/admin/campaigns/${campaign.id}/edit`}
              className="rounded-md border border-neutral-700 px-2.5 py-1.5 text-[11px] font-medium text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
            >
              {campaign.status === "DRAFT" ? "Edit" : "View"}
            </Link>
            {campaign.status === "SENT" && (
              <Link
                href={`/admin/campaigns/${campaign.id}/analytics`}
                className="rounded-md border border-neutral-700 px-2.5 py-1.5 text-[11px] font-medium text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
              >
                Analytics
              </Link>
            )}
            {campaign.status === "DRAFT" && (
              <button
                type="button"
                onClick={() => onDelete(campaign.id)}
                className="rounded-md px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:text-red-400"
              >
                Delete
              </button>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  onDelete,
}: {
  campaign: Campaign;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="border-b border-neutral-800 px-5 py-4 last:border-0">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/campaigns/${campaign.id}/edit`}
            className="block truncate font-medium text-white"
          >
            {campaign.name}
          </Link>
          <p className="mt-0.5 truncate text-[11px] text-neutral-600">
            {campaign.subject}
          </p>
        </div>
        <StatusPill status={campaign.status} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-600">
          <span>{TYPE_LABELS[campaign.type] ?? campaign.type.replace(/_/g, " ")}</span>
          <span>
            {campaign.sentAt
              ? `Sent ${fmtDate(campaign.sentAt)}`
              : campaign.scheduledAt
                ? `Scheduled ${fmtDate(campaign.scheduledAt)}`
                : `Created ${fmtDate(campaign.createdAt)}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/campaigns/${campaign.id}/edit`}
            className="rounded-md border border-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
          >
            {campaign.status === "DRAFT" ? "Edit" : "View"}
          </Link>
          {campaign.status === "SENT" && (
            <Link
              href={`/admin/campaigns/${campaign.id}/analytics`}
              className="rounded-md border border-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
            >
              Analytics
            </Link>
          )}
          {campaign.status === "DRAFT" && (
            <button
              type="button"
              onClick={() => onDelete(campaign.id)}
              className="rounded-md px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:text-red-400"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
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

  const stats = useMemo(() => {
    const all = campaigns;
    return {
      total:     all.length,
      draft:     all.filter((c) => c.status === "DRAFT").length,
      scheduled: all.filter((c) => c.status === "SCHEDULED").length,
      sent:      all.filter((c) => c.status === "SENT").length,
    };
  }, [campaigns]);

  const FILTER_TABS: Array<{ value: StatusFilter; label: string; count: number }> = [
    { value: "",          label: "All",       count: stats.total     },
    { value: "DRAFT",     label: "Draft",     count: stats.draft     },
    { value: "SCHEDULED", label: "Scheduled", count: stats.scheduled },
    { value: "SENT",      label: "Sent",      count: stats.sent      },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-4">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              Email Campaigns
            </h1>
            <p className="mt-0.5 text-xs text-neutral-600">
              Create and manage your marketing email campaigns
            </p>
          </div>
          <Link
            href="/admin/campaigns/new"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:border-neutral-500 hover:bg-neutral-800"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">New Campaign</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        {/* ── Stat strip ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total",     value: stats.total },
            { label: "Draft",     value: stats.draft },
            { label: "Scheduled", value: stats.scheduled },
            { label: "Sent",      value: stats.sent },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
                {s.label}
              </p>
              <p className="mt-1.5 font-mono text-2xl font-semibold text-white">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Table panel ── */}
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">

          {/* Filter tabs + count */}
          <div className="flex items-center justify-between border-b border-neutral-800 px-5">
            <div className="flex items-center gap-1">
              {FILTER_TABS.map((tab) => {
                const active = statusFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                    className={`relative flex items-center gap-1.5 py-3.5 pr-4 text-xs font-medium transition-colors ${
                      active
                        ? "text-white"
                        : "text-neutral-600 hover:text-neutral-400"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        active ? "bg-neutral-700 text-neutral-300" : "bg-neutral-800 text-neutral-600"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-4 h-[2px] rounded-t-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Empty state */}
          {!loading && campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-neutral-600">No campaigns yet</p>
              <Link
                href="/admin/campaigns/new"
                className="mt-3 text-xs font-medium text-neutral-500 underline-offset-2 hover:text-white hover:underline"
              >
                Create your first campaign →
              </Link>
            </div>
          ) : (
            <>
              {/* ── Desktop table (md+) ── */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      {["Campaign", "Type", "Status", "Date", ""].map((col) => (
                        <th
                          key={col}
                          className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-neutral-600 last:text-right"
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
                        <CampaignRow
                          key={campaign.id}
                          campaign={campaign}
                          onDelete={deleteCampaign}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards (< md) ── */}
              <div className="md:hidden">
                {loading ? (
                  <div className="space-y-0 divide-y divide-neutral-800 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="px-5 py-4 space-y-2">
                        <div className="h-3 w-36 rounded bg-neutral-800" />
                        <div className="h-2.5 w-52 rounded bg-neutral-800" />
                        <div className="h-2.5 w-28 rounded bg-neutral-800" />
                      </div>
                    ))}
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onDelete={deleteCampaign}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && campaigns.length === 20 && (
          <div className="flex justify-center gap-2">
            {page > 1 && (
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-600 hover:text-white"
              >
                ← Previous
              </button>
            )}
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-600 hover:text-white"
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}