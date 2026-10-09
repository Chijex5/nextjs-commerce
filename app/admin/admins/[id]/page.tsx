import {
  EmptyState,
  Metric,
  MetricGrid,
  Page,
  Panel,
  StatusPill,
} from "components/admin/ui";
import { eq, sql } from "drizzle-orm";
import { count, money, shortDate, timeAgo } from "lib/admin/format";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { adminUsers } from "lib/db/schema";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [member] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);
  if (!member) notFound();

  const [[stats], recent] = await Promise.all([
    db.execute(sql`
      select count(*) as total,
        count(*) filter (where acknowledged_at >= (now() at time zone 'UTC') - interval '30 days') as recent,
        avg(extract(epoch from (acknowledged_at - created_at)) / 3600)
          filter (where acknowledged_at >= (now() at time zone 'UTC') - interval '30 days') as hours_to_confirm
      from orders where lower(acknowledged_by) = lower(${member.email})
    `) as unknown as Promise<Array<Record<string, unknown>>>,
    db.execute(sql`
      select id, order_number, customer_name, total_amount, acknowledged_at::text as acknowledged_at
      from orders where lower(acknowledged_by) = lower(${member.email})
      order by acknowledged_at desc limit 12
    `) as unknown as Promise<Array<Record<string, unknown>>>,
  ]);

  const hours = stats?.hours_to_confirm ? Number(stats.hours_to_confirm) : null;

  return (
    <Page>
      <header className="mb-8 border-b border-line pb-6">
        <Link
          href="/admin/admins"
          className="label mb-4 inline-flex items-center gap-1.5 text-fg-3 hover:text-fg"
        >
          <ArrowLeft className="size-3.5" /> Team
        </Link>
        <h1 className="display text-[clamp(2.4rem,6vw,4.25rem)]">
          {member.name || member.email.split("@")[0]}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-fg-3">
          <StatusPill tone={member.role === "super_admin" ? "info" : "neutral"}>
            {member.role === "super_admin" ? "Owner" : "Staff"}
          </StatusPill>
          {!member.isActive ? (
            <StatusPill tone="critical">Deactivated</StatusPill>
          ) : null}
          <span>{member.email}</span>
          <span>· joined {shortDate(member.createdAt)}</span>
        </div>
      </header>

      <MetricGrid className="mb-6 grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Last sign-in"
          value={member.lastLoginAt ? timeAgo(member.lastLoginAt) : "Never"}
        />
        <Metric
          label="Orders confirmed · 30d"
          value={count(Number(stats?.recent ?? 0))}
        />
        <Metric
          label="Orders confirmed · all time"
          value={count(Number(stats?.total ?? 0))}
        />
        <Metric
          label="Avg. time to confirm"
          value={
            hours === null
              ? "—"
              : hours < 1
                ? `${Math.round(hours * 60)}m`
                : `${hours.toFixed(1)}h`
          }
          hint="From payment to confirmation, last 30 days"
        />
      </MetricGrid>

      <Panel title="Recently confirmed" bodyClassName="p-0">
        {recent.length === 0 ? (
          <div className="px-5">
            <EmptyState title="No orders confirmed yet" />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((o) => (
              <li key={String(o.id)}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-plate/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-fg">
                      {String(o.customer_name)}
                    </p>
                    <p className="text-xs text-fg-3">
                      <span className="font-mono">
                        {String(o.order_number)}
                      </span>{" "}
                      · confirmed{" "}
                      {timeAgo(
                        new Date(
                          String(o.acknowledged_at).replace(" ", "T") + "Z",
                        ),
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {money(Number(o.total_amount))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Page>
  );
}
