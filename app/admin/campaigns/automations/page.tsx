import { FlowCard } from "components/admin/campaigns/flow-card";
import { MarketingNav } from "components/admin/campaigns/marketing-nav";
import { Metric, MetricGrid, Page, PageHeader } from "components/admin/ui";
import { sql } from "drizzle-orm";
import { count, money } from "lib/admin/format";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { FLOWS, getFlowConfig, getFlowStats } from "lib/marketing/flows";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [stats, configs, [carts]] = await Promise.all([
    getFlowStats(),
    Promise.all(FLOWS.map((f) => getFlowConfig(f.key))),
    // Abandoned carts predate flow logging; read their recovery stats directly.
    db.execute(sql`
      select count(*) filter (where email_sent) as emailed,
        count(*) filter (where recovered and email_sent) as recovered,
        coalesce(sum(cart_total) filter (where recovered and email_sent), 0) as recovered_value
      from abandoned_carts
    `) as unknown as Promise<Array<Record<string, unknown>>>,
  ]);

  const totals = [...stats.values()].reduce(
    (a, s) => ({ sent: a.sent + s.sent30d, sales: a.sales + s.sales }),
    { sent: 0, sales: 0 },
  );

  return (
    <Page>
      <PageHeader
        eyebrow="Marketing"
        title="Automations"
        description="Emails that send themselves when something happens, checked every morning at 08:00 Lagos time. Automated emails earn many times more per send than one-off campaigns."
      />
      <MarketingNav active="automations" />

      <MetricGrid className="mb-8 grid-cols-2 lg:grid-cols-3">
        <Metric
          label="Running"
          value={`${configs.filter((c) => c.enabled).length} of ${FLOWS.length}`}
        />
        <Metric label="Sent · 30d" value={count(totals.sent)} />
        <Metric
          label="Sales from automations"
          value={money(totals.sales + Number(carts?.recovered_value ?? 0))}
          hint="Orders within 7 days of an email"
        />
      </MetricGrid>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {FLOWS.map((flow, i) => {
          const s = stats.get(flow.key) ?? {
            sent: 0,
            sent30d: 0,
            clicked: 0,
            orders: 0,
            sales: 0,
          };
          const cart =
            flow.key === "abandoned_cart"
              ? {
                  sent: Number(carts?.emailed ?? 0),
                  orders: Number(carts?.recovered ?? 0),
                  sales: Number(carts?.recovered_value ?? 0),
                }
              : null;
          return (
            <FlowCard
              key={flow.key}
              flow={{
                key: flow.key,
                name: flow.name,
                trigger: flow.trigger,
                goal: flow.goal,
              }}
              enabled={configs[i]!.enabled}
              settings={configs[i]!.settings}
              stats={{
                sent: cart?.sent ?? s.sent,
                clicked: s.clicked,
                orders: cart?.orders ?? s.orders,
                sales: cart?.sales ?? s.sales,
              }}
            />
          );
        })}
      </div>
    </Page>
  );
}
