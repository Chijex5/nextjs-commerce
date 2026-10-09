import {
  EmptyState,
  FilterBar,
  Metric,
  MetricGrid,
  Page,
  PageHeader,
  Pagination,
  Select,
  ViewTabs,
} from "components/admin/ui";
import { CUSTOMER_SORTS, SEGMENTS, listCustomers } from "lib/admin/customers";
import { count, money, percent, shortDate, timeAgo } from "lib/admin/format";
import { authOptions } from "lib/auth";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    segment?: string;
    q?: string;
    sort?: string;
    page?: string;
    search?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const segment = SEGMENTS.find((s) => s.key === params.segment) ?? SEGMENTS[0];
  const q = (params.q ?? params.search ?? "").trim();
  const sort = (
    params.sort && params.sort in CUSTOMER_SORTS ? params.sort : "recent"
  ) as keyof typeof CUSTOMER_SORTS;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const { rows, counts, summary } = await listCustomers({
    segment,
    q,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const href = (
    o: Partial<Record<"segment" | "q" | "sort" | "page", string>>,
  ) => {
    const m = { segment: segment.key, q, sort, ...o };
    const s = new URLSearchParams();
    if (m.segment !== "all") s.set("segment", m.segment);
    if (m.q) s.set("q", m.q);
    if (m.sort !== "recent") s.set("sort", m.sort);
    if (o.page && o.page !== "1") s.set("page", o.page);
    const str = s.toString();
    return str ? `/admin/users?${str}` : "/admin/users";
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Customers"
        title="Customers"
        description="Everyone who has bought from you, guest checkout included, plus people who made an account. Matched by email."
      />

      <MetricGrid className="mb-8 grid-cols-2 lg:grid-cols-4">
        <Metric label="Customers who bought" value={count(summary.buyers)} />
        <Metric
          label="Repeat rate"
          value={percent(summary.repeatRate)}
          hint="Bought more than once"
        />
        <Metric label="Avg. lifetime spend" value={money(summary.avgSpend)} />
        <Metric
          label="Orders per customer"
          value={summary.avgOrders.toFixed(1)}
        />
      </MetricGrid>

      <ViewTabs
        label="Customer segments"
        active={segment.key}
        hrefFor={(key) => href({ segment: key, page: "1" })}
        views={SEGMENTS.map((s) => ({
          key: s.key,
          label: s.label,
          count: counts[s.key],
        }))}
      />

      <FilterBar
        action="/admin/users"
        search={q}
        placeholder="Search name, email or phone"
        hidden={{ segment: segment.key === "all" ? undefined : segment.key }}
      >
        <Select
          name="sort"
          label="Sort"
          defaultValue={sort}
          options={[
            { value: "recent", label: "Last order" },
            { value: "spent", label: "Most spent" },
            { value: "orders", label: "Most orders" },
            { value: "newest", label: "Newest customers" },
            { value: "name", label: "Name A–Z" },
          ]}
        />
      </FilterBar>

      {rows.length === 0 ? (
        <div className="border border-line px-5">
          <EmptyState title="No customers here">
            Try another segment or search.
          </EmptyState>
        </div>
      ) : (
        <div className="border border-line">
          <table className="w-full text-sm">
            <thead className="hidden md:table-header-group">
              <tr className="border-b border-line text-left text-fg-3">
                <th className="px-4 py-2.5 font-normal">Customer</th>
                <th className="hidden px-3 py-2.5 font-normal lg:table-cell">
                  Location
                </th>
                <th className="px-3 py-2.5 text-right font-normal">Orders</th>
                <th className="px-3 py-2.5 text-right font-normal">Spent</th>
                <th className="px-4 py-2.5 text-right font-normal">
                  Last order
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr
                  key={c.key}
                  className="group relative transition-colors hover:bg-plate/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center bg-plate font-mono text-[11px] uppercase text-fg-2">
                        {(c.name || c.email).slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/users/${c.key}`}
                          className="block truncate font-medium text-fg after:absolute after:inset-0"
                        >
                          {c.name || c.email.split("@")[0]}
                        </Link>
                        <p className="truncate text-xs text-fg-3">
                          {c.email}
                          {c.userId ? " · Account" : ""}
                          {c.subscribed ? " · Subscribed" : ""}
                        </p>
                        <p className="text-xs text-fg-3 md:hidden">
                          {c.orders
                            ? `${c.orders} orders · ${money(c.spent)}`
                            : "No orders yet"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 text-fg-2 lg:table-cell">
                    {c.state ?? "—"}
                  </td>
                  <td className="hidden px-3 py-3 text-right tabular-nums md:table-cell">
                    {c.orders || "—"}
                  </td>
                  <td className="hidden px-3 py-3 text-right font-medium tabular-nums md:table-cell">
                    {c.spent ? money(c.spent) : "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-xs text-fg-3 md:table-cell">
                    {c.lastOrder ? (
                      <span title={shortDate(c.lastOrder)}>
                        {timeAgo(c.lastOrder)}
                      </span>
                    ) : c.signedUp ? (
                      `Joined ${shortDate(c.signedUp)}`
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={counts[segment.key] ?? 0}
        hrefFor={(p) => href({ page: String(p) })}
      />
    </Page>
  );
}
