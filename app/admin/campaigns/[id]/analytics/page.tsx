"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface CampaignAnalytics {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  openRate: string;
  clickRate: string;
  bounceRate: string;
  failureRate: string;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  subject: string;
  status: string;
  sentAt: string;
  createdAt: string;
}

/* ─── Bar ─────────────────────────────────────────────────────────────────── */

function MetricBar({
  label,
  rate,
  count,
}: {
  label: string;
  rate: string;
  count: number;
}) {
  const pct = Math.min(parseFloat(rate), 100);
  return (
    <div className="group">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
          {label}
        </span>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs text-neutral-500">{count}</span>
          <span className="font-mono text-sm font-semibold text-white">
            {rate}%
          </span>
        </div>
      </div>
      <div className="relative h-px w-full bg-neutral-800">
        <div
          className="absolute left-0 top-0 h-px bg-white transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Stat ────────────────────────────────────────────────────────────────── */

function StatCell({
  label,
  value,
  rate,
  index,
}: {
  label: string;
  value: number;
  rate?: string;
  index: number;
}) {
  return (
    <div className="border-r border-neutral-800 px-8 py-7 last:border-r-0">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
        {String(index + 1).padStart(2, "0")} — {label}
      </p>
      <p className="font-mono text-4xl font-bold tracking-tight text-white">
        {value.toLocaleString()}
      </p>
      {rate !== undefined && (
        <p className="mt-1 font-mono text-xs text-neutral-500">{rate}%</p>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function CampaignAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = typeof params.id === "string" ? params.id : "";

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isFirstLoad = useRef(true);

  async function fetchData() {
    try {
      const [campaignRes, analyticsRes] = await Promise.all([
        fetch(`/api/admin/campaigns/${campaignId}`),
        fetch(`/api/admin/campaigns/${campaignId}/analytics`),
      ]);

      if (!campaignRes.ok) throw new Error("Failed to fetch campaign");
      const campaignData = await campaignRes.json();
      setCampaign(campaignData.campaign);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (isFirstLoad.current) {
        setInitialLoading(false);
        isFirstLoad.current = false;
      }
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  /* ── Initial skeleton ── */
  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-px w-16 animate-pulse bg-white" />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600">
            Loading
          </p>
        </div>
      </div>
    );
  }

  if (!campaign || !analytics) return null;

  const stats: { label: string; value: number; rate?: string }[] = [
    { label: "Sent", value: analytics.sent },
    { label: "Opened", value: analytics.opened, rate: analytics.openRate },
    { label: "Clicked", value: analytics.clicked, rate: analytics.clickRate },
    { label: "Bounced", value: analytics.bounced, rate: analytics.bounceRate },
    { label: "Failed", value: analytics.failed, rate: analytics.failureRate },
  ];

  const metrics = [
    { label: "Open Rate", rate: analytics.openRate, count: analytics.opened },
    { label: "Click Rate", rate: analytics.clickRate, count: analytics.clicked },
    { label: "Bounce Rate", rate: analytics.bounceRate, count: analytics.bounced },
    { label: "Failure Rate", rate: analytics.failureRate, count: analytics.failed },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">

        {/* ── Nav ── */}
        <div className="mb-12 flex items-center justify-between">
          <button
            onClick={() => router.push("/admin/campaigns")}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Campaigns
          </button>

          {lastUpdated && (
            <span className="font-mono text-[10px] text-neutral-600">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* ── Header ── */}
        <div className="mb-10 border-b border-neutral-800 pb-10">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
            Campaign Analytics
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {campaign.name}
          </h1>

          <div className="mt-6 flex flex-wrap gap-8">
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600">Subject</p>
              <p className="text-sm text-neutral-300">{campaign.subject}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600">Type</p>
              <p className="text-sm capitalize text-neutral-300">
                {campaign.type.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600">Sent</p>
              <p className="text-sm text-neutral-300">
                {new Date(campaign.sentAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600">Total Recipients</p>
              <p className="font-mono text-sm text-neutral-300">{analytics.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="mb-10 grid grid-cols-2 border border-neutral-800 md:grid-cols-5">
          {stats.map((s, i) => (
            <StatCell key={s.label} label={s.label} value={s.value} rate={s.rate} index={i} />
          ))}
        </div>

        {/* ── Bottom grid ── */}
        <div className="grid gap-px bg-neutral-800 md:grid-cols-2">

          {/* Engagement */}
          <div className="bg-neutral-950 p-8">
            <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
              Engagement
            </p>
            <div className="space-y-7">
              {metrics.map((m) => (
                <MetricBar key={m.label} label={m.label} rate={m.rate} count={m.count} />
              ))}
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-neutral-950 p-8">
            <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
              Delivery
            </p>
            <div className="space-y-px">
              {[
                { label: "Total Recipients", value: analytics.total },
                { label: "Successfully Sent", value: analytics.sent },
                { label: "Failed & Bounced", value: analytics.failed + analytics.bounced },
                { label: "Clicked Through", value: analytics.clicked },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between border-b border-neutral-900 py-4 last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-5 font-mono text-[10px] text-neutral-700">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-neutral-400">{row.label}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-white">
                    {row.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Delivery rate visual */}
            <div className="mt-8">
              <div className="mb-2 flex justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600">
                  Delivery Rate
                </span>
                <span className="font-mono text-xs text-neutral-400">
                  {analytics.total > 0
                    ? ((analytics.sent / analytics.total) * 100).toFixed(1)
                    : "0"}%
                </span>
              </div>
              <div className="relative h-px w-full bg-neutral-800">
                <div
                  className="absolute left-0 top-0 h-px bg-white transition-all duration-700 ease-out"
                  style={{
                    width: `${analytics.total > 0 ? Math.min((analytics.sent / analytics.total) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Tips ── */}
        <div className="mt-px bg-neutral-900 p-8">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
            Recommendations
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { metric: "Open Rate", tip: "Improve subject line and optimise send time for your audience timezone." },
              { metric: "Click Rate", tip: "Use a single, clear call-to-action and ensure links are contextually relevant." },
              { metric: "Bounce Rate", tip: "Clean your mailing list regularly — remove invalid or inactive addresses." },
              { metric: "List Health", tip: "Consistent metrics over time are the strongest indicator of list quality." },
            ].map((r) => (
              <div key={r.metric} className="flex gap-3">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 bg-neutral-600" />
                <p className="text-xs leading-relaxed text-neutral-500">
                  <span className="font-semibold text-neutral-400">{r.metric}: </span>
                  {r.tip}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}