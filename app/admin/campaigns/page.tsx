import { DeleteCampaignButton } from "components/admin/campaigns/delete-campaign-button";
import { MarketingNav } from "components/admin/campaigns/marketing-nav";
import {
  EmptyState,
  Metric,
  MetricGrid,
  Page,
  PageHeader,
  StatusPill,
  ViewTabs,
  type Tone,
} from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { ATTRIBUTION_DAYS, getCampaigns, rate } from "lib/admin/campaigns";
import { count, money, percent, shortDate } from "lib/admin/format";
import { describeAudience, normaliseAudience } from "lib/marketing/segments";
import { authOptions } from "lib/auth";
import { Plus } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SCHEDULED: { label: "Scheduled", tone: "info" },
  SENDING: { label: "Sending", tone: "warning" },
  SENT: { label: "Sent", tone: "positive" },
};

const TYPE_LABEL: Record<string, string> = {
  JUST_ARRIVED: "New arrivals",
  SALE: "Sale",
  COLLECTION: "Collection",
};

const VIEWS = [
  { key: "all", label: "All" },
  { key: "SENT", label: "Sent" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "DRAFT", label: "Drafts" },
];

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const view = VIEWS.find((v) => v.key === params.view)?.key ?? "all";
  const campaigns = await getCampaigns();
  const visible =
    view === "all" ? campaigns : campaigns.filter((c) => c.status === view);

  const sent = campaigns.filter((c) => c.status === "SENT");
  const totals = sent.reduce(
    (a, c) => ({
      delivered: a.delivered + c.stats.delivered,
      opened: a.opened + c.stats.opened,
      clicked: a.clicked + c.stats.clicked,
      sales: a.sales + c.stats.sales,
    }),
    { delivered: 0, opened: 0, clicked: 0, sales: 0 },
  );

  return (
    <Page>
      <PageHeader
        eyebrow="Marketing"
        title="Campaigns"
        description={`One-off emails to a segment of your subscribers. Sales count paid orders placed within ${ATTRIBUTION_DAYS} days of someone clicking.`}
        actions={
          <Link
            href="/admin/campaigns/new/edit"
            className={buttonClass("solid", "md")}
          >
            <Plus className="size-4" /> New campaign
          </Link>
        }
      />

      <MarketingNav active="campaigns" />

      <MetricGrid className="mb-8 grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Campaigns sent"
          value={count(sent.length)}
          hint={`${count(totals.delivered)} emails delivered`}
        />
        <Metric
          label="Revenue per email"
          value={
            totals.delivered ? money(totals.sales / totals.delivered) : "—"
          }
          hint="Sales ÷ emails delivered"
        />
        <Metric
          label="Avg. click rate"
          value={percent(rate(totals.clicked, totals.delivered), 1)}
        />
        <Metric label="Sales from email" value={money(totals.sales)} />
      </MetricGrid>

      <ViewTabs
        label="Campaign views"
        active={view}
        hrefFor={(k) =>
          k === "all" ? "/admin/campaigns" : `/admin/campaigns?view=${k}`
        }
        views={VIEWS.map((v) => ({
          key: v.key,
          label: v.label,
          count:
            v.key === "all"
              ? campaigns.length
              : campaigns.filter((c) => c.status === v.key).length,
        }))}
      />

      <div className="mt-4">
        {visible.length === 0 ? (
          <div className="border border-line px-5">
            <EmptyState title="No campaigns here">
              <Link href="/admin/campaigns/new/edit" className="underline">
                Write a campaign
              </Link>{" "}
              to announce new arrivals or a sale.
            </EmptyState>
          </div>
        ) : (
          <div className="border border-line">
            <table className="w-full text-sm">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-line text-left text-fg-3">
                  <th className="px-4 py-2.5 font-normal">Campaign</th>
                  <th className="px-3 py-2.5 font-normal">Status</th>
                  <th className="px-3 py-2.5 text-right font-normal">
                    Delivered
                  </th>
                  <th className="px-3 py-2.5 font-normal">Audience</th>
                  <th className="px-3 py-2.5 text-right font-normal">
                    Clicked
                  </th>
                  <th className="px-3 py-2.5 text-right font-normal">Sales</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((c) => {
                  const s = STATUS[c.status]!;
                  const isSent = c.status === "SENT" || c.status === "SENDING";
                  const href = isSent
                    ? `/admin/campaigns/${c.id}/analytics`
                    : `/admin/campaigns/${c.id}/edit`;
                  return (
                    <tr
                      key={c.id}
                      className="group relative transition-colors hover:bg-plate/60"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={href}
                          className="block max-w-[38ch] truncate font-medium text-fg after:absolute after:inset-0"
                        >
                          {c.name}
                        </Link>
                        <p className="max-w-[46ch] truncate text-xs text-fg-3">
                          {TYPE_LABEL[c.type] ?? c.type} · {c.subject}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill tone={s.tone}>{s.label}</StatusPill>
                        <p className="mt-1 text-xs text-fg-3">
                          {c.sentAt
                            ? shortDate(c.sentAt)
                            : c.scheduledAt
                              ? `For ${shortDate(c.scheduledAt)}`
                              : `Edited ${shortDate(c.createdAt)}`}
                        </p>
                      </td>
                      <td className="hidden px-3 py-3 text-right tabular-nums md:table-cell">
                        {isSent ? count(c.stats.delivered) : "—"}
                      </td>
                      <td className="hidden px-3 py-3 text-xs text-fg-2 md:table-cell">
                        {describeAudience(normaliseAudience(c.audience))}
                      </td>
                      <td className="hidden px-3 py-3 text-right tabular-nums md:table-cell">
                        {isSent
                          ? percent(rate(c.stats.clicked, c.stats.delivered), 1)
                          : "—"}
                      </td>
                      <td className="hidden px-3 py-3 text-right font-medium tabular-nums md:table-cell">
                        {isSent
                          ? c.stats.sales
                            ? money(c.stats.sales)
                            : "—"
                          : ""}
                      </td>
                      <td className="relative z-10 pr-2 text-right">
                        {c.status === "DRAFT" || c.status === "SCHEDULED" ? (
                          <DeleteCampaignButton id={c.id} name={c.name} />
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}
