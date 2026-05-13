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

/* ─── Arc Gauge ───────────────────────────────────────────────────────────── */

function ArcGauge({
  pct,
  label,
  value,
  count,
}: {
  pct: number;
  label: string;
  value: string;
  count: number;
}) {
  const r = 72;
  const cx = 90;
  const cy = 90;
  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle;
  const filledArc = (pct / 100) * totalArc;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (from: number, to: number) => {
    const x1 = cx + r * Math.cos(toRad(from));
    const y1 = cy + r * Math.sin(toRad(from));
    const x2 = cx + r * Math.cos(toRad(to));
    const y2 = cy + r * Math.sin(toRad(to));
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="155" viewBox="0 0 180 155">
        {/* Track */}
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke="#1f1f1f"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={arcPath(startAngle, startAngle + filledArc)}
          fill="none"
          stroke="white"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="white"
          fontSize="28"
          fontWeight="600"
          fontFamily="ui-monospace, monospace"
        >
          {value}%
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fill="#525252"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
        >
          {count.toLocaleString()} people
        </text>
      </svg>
      <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        {label}
      </span>
    </div>
  );
}

/* ─── Funnel Bar ──────────────────────────────────────────────────────────── */

function FunnelBar({
  label,
  count,
  total,
  rate,
  isLast,
}: {
  label: string;
  count: number;
  total: number;
  rate?: string;
  isLast?: boolean;
}) {
  const width = total > 0 ? Math.max((count / total) * 100, 2) : 0;

  return (
    <div className={`py-4 ${!isLast ? "border-b border-neutral-800/60" : ""}`}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-neutral-400">{label}</span>
        <div className="flex items-baseline gap-3">
          {rate && (
            <span className="font-mono text-xs text-neutral-600">{rate}%</span>
          )}
          <span className="font-mono text-sm font-semibold text-white">
            {count.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-white transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Stat Pill ───────────────────────────────────────────────────────────── */

function StatPill({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg border px-5 py-4 ${
        danger
          ? "border-neutral-800 bg-neutral-900"
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-neutral-600">
        {label}
      </span>
      <span
        className={`font-mono text-2xl font-semibold ${
          danger ? "text-neutral-300" : "text-white"
        }`}
      >
        {value}%
      </span>
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

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <span className="text-xs font-medium uppercase tracking-widest text-neutral-700">
          Loading…
        </span>
      </div>
    );
  }

  if (!campaign || !analytics) return null;

  const deliveryRate =
    analytics.total > 0
      ? ((analytics.sent / analytics.total) * 100).toFixed(1)
      : "0";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">

        {/* ── Nav bar ── */}
        <div className="mb-12 flex items-center justify-between">
          <button
            onClick={() => router.push("/admin/campaigns")}
            className="flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Campaigns
          </button>

          {lastUpdated && (
            <span className="font-mono text-xs text-neutral-700">
              Live · {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* ── Hero header ── */}
        <div className="mb-10">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-neutral-600">
            {campaign.type.replace("_", " ")} Campaign
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {campaign.name}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {campaign.subject}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-700">
            <span>
              Sent{" "}
              <span className="text-neutral-400">
                {new Date(campaign.sentAt).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
            <span className="h-1 w-1 rounded-full bg-neutral-800" />
            <span>
              <span className="text-neutral-400">
                {analytics.total.toLocaleString()}
              </span>{" "}
              recipients
            </span>
            <span className="h-1 w-1 rounded-full bg-neutral-800" />
            <span
              className={`font-medium ${
                campaign.status === "sent"
                  ? "text-neutral-300"
                  : "text-neutral-500"
              }`}
            >
              {campaign.status}
            </span>
          </div>
        </div>

        {/* ── Primary gauge row ── */}
        <div className="mb-6 grid grid-cols-1 gap-px bg-neutral-800 rounded-xl overflow-hidden sm:grid-cols-3">
          <div className="flex items-center justify-center bg-neutral-950 py-8">
            <ArcGauge
              pct={parseFloat(analytics.openRate)}
              label="Open rate"
              value={analytics.openRate}
              count={analytics.opened}
            />
          </div>
          <div className="flex items-center justify-center bg-neutral-950 py-8">
            <ArcGauge
              pct={parseFloat(analytics.clickRate)}
              label="Click rate"
              value={analytics.clickRate}
              count={analytics.clicked}
            />
          </div>
          <div className="flex items-center justify-center bg-neutral-950 py-8">
            <ArcGauge
              pct={parseFloat(deliveryRate)}
              label="Delivery rate"
              value={deliveryRate}
              count={analytics.sent}
            />
          </div>
        </div>

        {/* ── Funnel + secondary stats ── */}
        <div className="mb-6 grid gap-4 md:grid-cols-5">

          {/* Funnel — takes 3 cols */}
          <div className="md:col-span-3 rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-600">
              Audience funnel
            </p>
            <p className="mb-5 text-xs text-neutral-700">
              How your audience moved through the campaign
            </p>

            <FunnelBar
              label="Total recipients"
              count={analytics.total}
              total={analytics.total}
            />
            <FunnelBar
              label="Successfully sent"
              count={analytics.sent}
              total={analytics.total}
              rate={deliveryRate}
            />
            <FunnelBar
              label="Opened"
              count={analytics.opened}
              total={analytics.total}
              rate={analytics.openRate}
            />
            <FunnelBar
              label="Clicked"
              count={analytics.clicked}
              total={analytics.total}
              rate={analytics.clickRate}
            />
            <FunnelBar
              label="Bounced"
              count={analytics.bounced}
              total={analytics.total}
              rate={analytics.bounceRate}
            />
            <FunnelBar
              label="Failed"
              count={analytics.failed}
              total={analytics.total}
              rate={analytics.failureRate}
              isLast
            />
          </div>

          {/* Secondary stats — takes 2 cols */}
          <div className="md:col-span-2 flex flex-col gap-4">

            {/* Raw counts */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-600">
                Totals
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Sent", val: analytics.sent },
                  { label: "Opened", val: analytics.opened },
                  { label: "Clicked", val: analytics.clicked },
                  { label: "Bounced + Failed", val: analytics.bounced + analytics.failed },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col gap-1">
                    <span className="text-xs text-neutral-600">{s.label}</span>
                    <span className="font-mono text-xl font-semibold text-white">
                      {s.val.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Problem rates */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-600">
                Issues to watch
              </p>
              <div className="flex flex-col gap-3">
                <StatPill label="Bounce rate" value={analytics.bounceRate} danger />
                <StatPill label="Failure rate" value={analytics.failureRate} danger />
              </div>
            </div>
          </div>
        </div>

        {/* ── Recommendations ── */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Recommendations
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Open rate",
                body: "Improve your subject line and optimise send time for your audience's timezone.",
              },
              {
                title: "Click rate",
                body: "Use one clear call-to-action per email and ensure every link is contextually relevant.",
              },
              {
                title: "Bounce rate",
                body: "Clean your list regularly — remove addresses that have bounced more than once.",
              },
              {
                title: "List health",
                body: "Consistent metrics over multiple campaigns are the strongest signal of list quality.",
              },
            ].map((r) => (
              <div
                key={r.title}
                className="rounded-lg border border-neutral-800 bg-neutral-950 p-4"
              >
                <p className="mb-1 text-xs font-semibold text-neutral-300">
                  {r.title}
                </p>
                <p className="text-xs leading-relaxed text-neutral-600">
                  {r.body}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}