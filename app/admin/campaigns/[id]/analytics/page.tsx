import { BarChart } from "components/admin/charts/bar-chart";
import {
  Delta,
  EmptyState,
  Metric,
  MetricGrid,
  Page,
  Panel,
  StatList,
  StatRow,
  StatusPill,
} from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import {
  ATTRIBUTION_DAYS,
  getCampaignReport,
  getCampaigns,
  rate,
} from "lib/admin/campaigns";
import { count, longDate, money, percent, timeAgo } from "lib/admin/format";
import { authOptions } from "lib/auth";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CampaignReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [report, all] = await Promise.all([
    getCampaignReport(id),
    getCampaigns(),
  ]);
  if (!report) notFound();

  const s = report.stats;
  const openRate = rate(s.opened, s.delivered);
  const clickRate = rate(s.clicked, s.delivered);

  // Benchmark against your other sent campaigns, not industry averages.
  const others = all.filter((c) => c.status === "SENT" && c.id !== id);
  const sum = others.reduce(
    (a, c) => ({
      d: a.d + c.stats.delivered,
      o: a.o + c.stats.opened,
      c: a.c + c.stats.clicked,
    }),
    { d: 0, o: 0, c: 0 },
  );
  const avgOpen = rate(sum.o, sum.d);
  const avgClick = rate(sum.c, sum.d);
  const vs = (cur: number | null, avg: number | null) =>
    cur !== null && avg !== null && avg > 0 ? ((cur - avg) / avg) * 100 : null;

  const hours = report.hourly;
  const firstDay = hours.slice(0, 24).reduce((a, h) => a + h.opens, 0);
  const totalOpensTracked = hours.reduce((a, h) => a + h.opens, 0);

  return (
    <Page>
      <header className="mb-8 border-b border-line pb-6">
        <Link
          href="/admin/campaigns"
          className="label mb-4 inline-flex items-center gap-1.5 text-fg-3 hover:text-fg"
        >
          <ArrowLeft className="size-3.5" /> Campaigns
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="display text-[clamp(2.2rem,5vw,3.75rem)]">
              {report.name}
            </h1>
            <p className="mt-3 text-sm text-fg-2">“{report.subject}”</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fg-3">
              <StatusPill
                tone={report.status === "SENT" ? "positive" : "neutral"}
              >
                {report.status === "SENT"
                  ? "Sent"
                  : report.status.toLowerCase()}
              </StatusPill>
              {report.sentAt ? <span>{longDate(report.sentAt)}</span> : null}
            </div>
          </div>
          <Link
            href={`/admin/campaigns/${id}/edit`}
            className={buttonClass("outline", "md")}
          >
            View email
          </Link>
        </div>
      </header>

      {s.recipients === 0 ? (
        <div className="border border-line px-5">
          <EmptyState title="No results yet">
            Results appear here once the campaign has been sent.
          </EmptyState>
        </div>
      ) : (
        <>
          <MetricGrid className="mb-6 grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Delivered"
              value={count(s.delivered)}
              hint={`of ${count(s.recipients)} sent`}
            />
            <Metric
              label="Open rate"
              value={percent(openRate, 1)}
              hint={`${count(s.opened)} people`}
            >
              {avgOpen !== null ? (
                <Delta value={vs(openRate, avgOpen)} suffix="vs your average" />
              ) : null}
            </Metric>
            <Metric
              label="Click rate"
              value={percent(clickRate, 1)}
              hint={`${count(s.clicked)} people · ${percent(rate(s.clicked, s.opened), 0)} of openers`}
            >
              {avgClick !== null ? (
                <Delta
                  value={vs(clickRate, avgClick)}
                  suffix="vs your average"
                />
              ) : null}
            </Metric>
            <Metric
              label="Sales"
              value={money(s.sales)}
              hint={`${count(s.orders)} orders within ${ATTRIBUTION_DAYS} days`}
            />
          </MetricGrid>

          <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel
              title="When people engaged"
              description={
                totalOpensTracked
                  ? `${percent(rate(firstDay, totalOpensTracked), 0)} of opens happened in the first 24 hours.`
                  : "Hourly opens and clicks in the 3 days after sending."
              }
            >
              <BarChart
                label="Opens and clicks by hour after sending"
                data={hours.map((h) => ({
                  label:
                    h.hour % 24 === 0 ? `Day ${h.hour / 24 + 1}` : `${h.hour}h`,
                  values: [h.opens, h.clicks],
                }))}
                series={[
                  { name: "Opens", className: "bg-fg/30" },
                  { name: "Clicks", className: "bg-fg" },
                ]}
                tickEvery={24}
              />
            </Panel>

            <Panel title="Funnel">
              {[
                { label: "Delivered", value: s.delivered },
                { label: "Opened", value: s.opened },
                { label: "Clicked", value: s.clicked },
                { label: "Bought", value: s.orders },
              ].map((step) => (
                <div key={step.label} className="mb-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-fg-2">{step.label}</span>
                    <span className="tabular-nums">
                      {count(step.value)}{" "}
                      <span className="text-fg-3">
                        · {percent(rate(step.value, s.delivered), 1)}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-plate">
                    <div
                      className="h-full bg-fg"
                      style={{
                        width: `${rate(step.value, s.delivered) ?? 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              <StatList>
                <StatRow
                  label="Bounced"
                  value={count(s.bounced)}
                  tone={s.bounced ? "warning" : undefined}
                />
                <StatRow
                  label="Failed to send"
                  value={count(s.failed)}
                  tone={s.failed ? "critical" : undefined}
                />
                {report.couponCode ? (
                  <StatRow
                    label={`Orders using ${report.couponCode}`}
                    value={`${count(report.couponOrders)} · ${money(report.couponSales)}`}
                  />
                ) : null}
              </StatList>
            </Panel>
          </div>

          <Panel
            title="Recipients"
            description="Buyers first, then the most engaged. Top 25."
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-fg-3">
                    <th className="px-5 py-2.5 font-normal">Email</th>
                    <th className="px-3 py-2.5 font-normal">Opened</th>
                    <th className="px-3 py-2.5 font-normal">Clicked</th>
                    <th className="px-5 py-2.5 text-right font-normal">
                      Bought
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {report.recipients.map((r) => (
                    <tr key={r.email}>
                      <td className="px-5 py-2.5">
                        <Link
                          href={`/admin/users/${encodeURIComponent(r.email.toLowerCase())}`}
                          className="text-fg hover:underline"
                        >
                          {r.email}
                        </Link>
                        {r.status === "BOUNCED" || r.status === "FAILED" ? (
                          <p className="text-xs text-red-700 dark:text-red-400">
                            {r.status === "BOUNCED"
                              ? `Bounced${r.bounceReason ? `: ${r.bounceReason}` : ""}`
                              : "Failed to send"}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-fg-2">
                        {r.openedAt ? timeAgo(r.openedAt) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-fg-2">
                        {r.clicks ? `${r.clicks}×` : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right font-medium tabular-nums">
                        {r.spent ? money(r.spent) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </Page>
  );
}
