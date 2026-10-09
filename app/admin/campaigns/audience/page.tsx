import { MarketingNav } from "components/admin/campaigns/marketing-nav";
import {
  BarList,
  Metric,
  MetricGrid,
  Page,
  PageHeader,
  Panel,
  StatusPill,
} from "components/admin/ui";
import { sql } from "drizzle-orm";
import { count, percent, timeAgo } from "lib/admin/format";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { SEGMENTS, countAudience } from "lib/marketing/segments";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  newsletter: "Newsletter form",
  popup: "Sign-up popup",
  footer: "Footer",
  checkout: "Checkout opt-in",
  account: "Account settings",
  restock: "Restock alert",
  import: "Imported",
};

export default async function AudiencePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [[totals], sources, recent, segmentCounts] = await Promise.all([
    db.execute(sql`
      select count(*) filter (where status = 'active') as active,
        count(*) filter (where status = 'active' and subscribed_at >= (now() at time zone 'UTC') - interval '30 days') as new_30d,
        count(*) filter (where status <> 'active' and unsubscribed_at >= (now() at time zone 'UTC') - interval '30 days') as lost_30d,
        count(*) filter (where status in ('bounced', 'complained')) as suppressed,
        (select count(distinct lower(email)) from orders where status <> 'cancelled') as buyers,
        (select count(distinct lower(o.email)) from orders o join newsletter_subscribers s
           on lower(s.email) = lower(o.email) and s.status = 'active' where o.status <> 'cancelled') as subscribed_buyers
      from newsletter_subscribers
    `) as unknown as Promise<Array<Record<string, unknown>>>,
    db.execute(sql`
      select source, count(*) as n from newsletter_subscribers where status = 'active' group by source order by n desc
    `) as unknown as Promise<Array<{ source: string; n: unknown }>>,
    db.execute(sql`
      select email, name, source, status, subscribed_at::text as subscribed_at
      from newsletter_subscribers order by subscribed_at desc limit 12
    `) as unknown as Promise<
      Array<{
        email: string;
        name: string | null;
        source: string;
        status: string;
        subscribed_at: string;
      }>
    >,
    Promise.all(
      SEGMENTS.filter((s) => s.key !== "collection").map(async (s) => ({
        ...s,
        ...(await countAudience({ segment: s.key }, 0)),
      })),
    ),
  ]);

  const active = Number(totals?.active ?? 0);
  const buyers = Number(totals?.buyers ?? 0);
  const subscribedBuyers = Number(totals?.subscribed_buyers ?? 0);

  return (
    <Page>
      <PageHeader
        eyebrow="Marketing"
        title="Audience"
        description="Only people who said yes to marketing emails can receive campaigns. Bounced and complaining addresses are removed automatically."
      />
      <MarketingNav active="audience" />

      <MetricGrid className="mb-8 grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Subscribers"
          value={count(active)}
          hint={`+${count(Number(totals?.new_30d ?? 0))} in 30 days`}
        />
        <Metric
          label="Unsubscribed · 30d"
          value={count(Number(totals?.lost_30d ?? 0))}
        />
        <Metric
          label="Buyers you can email"
          value={percent(buyers ? (subscribedBuyers / buyers) * 100 : null)}
          hint={`${count(subscribedBuyers)} of ${count(buyers)} customers`}
        />
        <Metric
          label="Auto-removed"
          value={count(Number(totals?.suppressed ?? 0))}
          hint="Hard bounces and spam complaints"
        />
      </MetricGrid>

      <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel
          title="Segments"
          description="Live sizes. Pick one when you set up a campaign."
          bodyClassName="p-0"
        >
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {segmentCounts.map((s) => (
                <tr key={s.key}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-fg">{s.label}</p>
                    <p className="text-xs text-fg-3">{s.description}</p>
                  </td>
                  <td className="w-24 px-5 py-3 text-right font-head text-xl font-extrabold tabular-nums [font-stretch:75%]">
                    {count(s.matched)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-6">
          <Panel title="Where subscribers come from">
            <BarList
              items={sources.map((s) => ({
                id: s.source,
                label: SOURCE_LABEL[s.source] ?? s.source,
                value: Number(s.n),
              }))}
              format={count}
              empty="No subscribers yet."
            />
            {buyers > 0 && subscribedBuyers / buyers < 0.5 ? (
              <p className="mt-4 text-xs text-fg-3">
                Most buyers aren&apos;t subscribed. The new checkout opt-in
                (&ldquo;Email me new drops and offers&rdquo;) is the easiest way
                to grow this.
              </p>
            ) : null}
          </Panel>

          <Panel title="Latest sign-ups" bodyClassName="p-0">
            <ul className="divide-y divide-line">
              {recent.map((r) => (
                <li
                  key={r.email}
                  className="flex items-center justify-between gap-3 px-5 py-2.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/users/${encodeURIComponent(r.email.toLowerCase())}`}
                      className="block truncate text-sm text-fg hover:underline"
                    >
                      {r.name || r.email}
                    </Link>
                    <p className="truncate text-xs text-fg-3">
                      {SOURCE_LABEL[r.source] ?? r.source} ·{" "}
                      {timeAgo(
                        new Date(r.subscribed_at.replace(" ", "T") + "Z"),
                      )}
                    </p>
                  </div>
                  {r.status !== "active" ? (
                    <StatusPill
                      tone={
                        r.status === "unsubscribed" ? "neutral" : "critical"
                      }
                    >
                      {r.status}
                    </StatusPill>
                  ) : null}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </Page>
  );
}
