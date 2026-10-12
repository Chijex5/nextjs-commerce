import {
  KIND,
  VIEWS,
  needsReply,
  statusOf,
} from "components/admin/custom-requests/meta";
import {
  EmptyState,
  Page,
  PageHeader,
  StatusPill,
  ViewTabs,
} from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { money, timeAgo } from "lib/admin/format";
import { authOptions } from "lib/auth";
import { ChevronRight, Settings2 } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { loadRequests } from "./data";

export const dynamic = "force-dynamic";

export default async function CustomRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; id?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  if (process.env.CUSTOM_ORDER_REQUESTS_ENABLED !== "true") {
    return (
      <Page>
        <PageHeader
          eyebrow="Sales"
          title="Custom requests"
          description="Custom requests are switched off. Set CUSTOM_ORDER_REQUESTS_ENABLED=true in the Vercel project's environment variables to let customers request bespoke pairs."
        />
      </Page>
    );
  }

  const params = await searchParams;
  // Old email links pointed at ?id=…; each request has its own page now.
  if (params.id)
    redirect(`/admin/custom-order-requests/${encodeURIComponent(params.id)}`);

  const requests = await loadRequests();
  const counts = Object.fromEntries(
    VIEWS.map((v) => [
      v.key,
      v.match ? requests.filter(v.match).length : requests.length,
    ]),
  );
  const view = VIEWS.find((v) => v.key === params.view)
    ? params.view!
    : counts.todo
      ? "todo"
      : "all";
  const match = VIEWS.find((v) => v.key === view)!.match;
  const visible = match ? requests.filter(match) : requests;

  return (
    <Page>
      <PageHeader
        eyebrow="Sales"
        title="Custom requests"
        description="Bespoke pairs, from first message to paid order. Open a request to reply, send a price and move it through the workshop."
        actions={
          <Link
            href="/admin/custom-order-requests/settings"
            className={buttonClass("outline", "md")}
          >
            <Settings2 className="size-4" /> Edit menu &amp; settings
          </Link>
        }
      >
        <ViewTabs
          label="Request views"
          active={view}
          hrefFor={(key) =>
            key === "todo"
              ? "/admin/custom-order-requests"
              : `/admin/custom-order-requests?view=${key}`
          }
          views={VIEWS.map((v) => ({
            key: v.key,
            label: v.label,
            count: counts[v.key],
            tone: v.key === "todo" ? "warning" : undefined,
          }))}
        />
      </PageHeader>

      {visible.length === 0 ? (
        <EmptyState title="Nothing here">
          {view === "todo"
            ? "You're all caught up — no one is waiting for a reply."
            : "No requests in this view."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {visible.map((r) => {
            const s = statusOf(r.status);
            const waiting = needsReply(r);
            const price = r.quotes[0]?.amount ?? r.quotedAmount;
            const last = r.messages.at(-1);
            return (
              <li key={r.id}>
                <Link
                  href={`/admin/custom-order-requests/${r.id}`}
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 px-1 py-4 transition-colors hover:bg-plate/60 sm:px-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_120px_96px_16px]"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-fg">
                      {waiting ? (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-amber-500"
                          aria-label="Needs reply"
                        />
                      ) : null}
                      <span className="truncate">{r.customerName}</span>
                      <span className="shrink-0 font-mono text-[11px] font-normal text-fg-3">
                        {r.requestNumber}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-sm text-fg-2">{r.title}</p>
                    {last && last.author !== "system" ? (
                      <p className="mt-0.5 truncate text-xs text-fg-3">
                        {last.author === "admin" ? "You: " : ""}
                        {last.body}
                      </p>
                    ) : null}
                  </div>
                  <div className="order-3 col-span-2 flex flex-wrap items-center gap-2 md:order-none md:col-span-1">
                    <StatusPill tone={s.tone}>{s.label}</StatusPill>
                    <span className="text-xs text-fg-3">{KIND[r.kind] ?? "Custom"}</span>
                  </div>
                  <p className="text-right text-sm tabular-nums text-fg md:text-left">
                    {price ? (
                      money(price)
                    ) : r.estimateAmount ? (
                      <span className="text-fg-3">est. {money(r.estimateAmount)}</span>
                    ) : (
                      <span className="text-fg-3">—</span>
                    )}
                  </p>
                  <p className="hidden text-xs text-fg-3 md:block">
                    {timeAgo(new Date(last?.createdAt ?? r.updatedAt))}
                  </p>
                  <ChevronRight className="hidden size-4 text-fg-3 group-hover:text-fg md:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
