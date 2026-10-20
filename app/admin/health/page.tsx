import {
  Page,
  PageHeader,
  Panel,
  StatusPill,
  type Tone,
} from "components/admin/ui";
import { count, timeAgo } from "lib/admin/format";
import { getStoreHealth } from "lib/admin/health";
import {
  HEALTH_GROUPS,
  scoreVerdict,
  type HealthCheck,
  type HealthStatus,
} from "lib/admin/health-checks";
import { authOptions } from "lib/auth";
import { ArrowUpRight } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS: Record<HealthStatus, { label: string; tone: Tone }> = {
  fail: { label: "Broken", tone: "critical" },
  warn: { label: "Needs attention", tone: "warning" },
  unknown: { label: "Waiting for data", tone: "neutral" },
  ok: { label: "Good", tone: "positive" },
};

export default async function StoreHealthPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const health = await getStoreHealth();

  return (
    <Page>
      <PageHeader
        eyebrow={`Checked ${timeAgo(health.checkedAt)}`}
        title="Store health"
        description="Things quietly costing sales or trust: catalog gaps, payment trouble, customers waiting and background jobs. Fix the red ones first."
      />

      <section
        aria-label="Score"
        className="mb-10 flex flex-col gap-6 border border-line p-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="label text-fg-3">Score</p>
          <p className="mt-2 font-head text-[clamp(3.5rem,8vw,5.5rem)] font-extrabold leading-none tabular-nums [font-stretch:75%]">
            {health.score}
            <span className="text-fg-3 text-[0.4em]">/100</span>
          </p>
          <p className="mt-2 text-sm text-fg-2">{scoreVerdict(health.score)}</p>
        </div>
        <dl className="flex gap-10">
          <Tally label="Broken" value={health.failing} tone="bg-red-600" />
          <Tally
            label="Need attention"
            value={health.warnings}
            tone="bg-amber-500"
          />
        </dl>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {HEALTH_GROUPS.map((group) => {
          const checks = health.checks.filter((c) => c.group === group.key);
          if (!checks.length) return null;
          const open = checks.filter(
            (c) => c.status === "fail" || c.status === "warn",
          ).length;
          return (
            <Panel
              key={group.key}
              title={group.label}
              description={
                open ? `${open} of ${checks.length} need a look` : "All good"
              }
              bodyClassName="p-0"
            >
              <ul className="divide-y divide-line">
                {checks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            </Panel>
          );
        })}
      </div>
    </Page>
  );
}

function Tally({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div>
      <dt className="label flex items-center gap-2 text-fg-3">
        <span className={`size-2 rounded-full ${tone}`} aria-hidden />
        {label}
      </dt>
      <dd className="mt-2 font-head text-4xl font-extrabold leading-none tabular-nums [font-stretch:75%]">
        {value}
      </dd>
    </div>
  );
}

function CheckRow({ check }: { check: HealthCheck }) {
  const s = STATUS[check.status];
  const actionable =
    (check.status === "fail" || check.status === "warn") && check.href;
  const body = (
    <>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
          {check.label}
          <StatusPill tone={s.tone}>{s.label}</StatusPill>
        </p>
        <p className="mt-1 text-xs text-fg-3">{check.detail}</p>
      </div>
      {actionable ? (
        <span className="flex shrink-0 items-center gap-3">
          {check.count ? (
            <span className="font-head text-2xl font-extrabold leading-none tabular-nums [font-stretch:75%]">
              {count(check.count)}
            </span>
          ) : null}
          <span className="label inline-flex items-center gap-1 text-fg-3 group-hover:text-fg">
            Fix
            <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </span>
      ) : null}
    </>
  );
  return (
    <li>
      {actionable ? (
        <Link
          href={check.href!}
          className="group flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-plate/60"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          {body}
        </div>
      )}
    </li>
  );
}
