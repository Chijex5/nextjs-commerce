import {
  ReviewQueue,
  type ReviewRow,
} from "components/admin/reviews/review-queue";
import {
  Metric,
  MetricGrid,
  Page,
  PageHeader,
  Pagination,
  SegmentedLinks,
  ViewTabs,
} from "components/admin/ui";
import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { count, percent } from "lib/admin/format";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { productImages, products, reviews, users } from "lib/db/schema";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const VIEWS = [
  { key: "pending", label: "To moderate", tone: "warning" as const },
  { key: "approved", label: "Published" },
  { key: "rejected", label: "Hidden" },
  { key: "all", label: "All" },
];

const RATINGS = [
  { key: "all", label: "All stars" },
  { key: "low", label: "1–2★" },
  { key: "3", label: "3★" },
  { key: "high", label: "4–5★" },
];

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; rating?: string; page?: string }>;
}) {
  const session = await requireAdminSession();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const view = VIEWS.find((v) => v.key === params.view)?.key ?? "pending";
  const rating = RATINGS.find((r) => r.key === params.rating)?.key ?? "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const ratingWhere: SQL | undefined =
    rating === "low"
      ? sql`${reviews.rating} <= 2`
      : rating === "high"
        ? sql`${reviews.rating} >= 4`
        : rating === "3"
          ? eq(reviews.rating, 3)
          : undefined;
  const where = and(
    view === "all" ? undefined : eq(reviews.status, view),
    ratingWhere,
  );

  const [rows, [totalRow], [stats]] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        images: reviews.images,
        isVerified: reviews.isVerified,
        helpfulCount: reviews.helpfulCount,
        status: reviews.status,
        createdAt: reviews.createdAt,
        productId: products.id,
        productTitle: products.title,
        productHandle: products.handle,
        userName: users.name,
        userEmail: users.email,
      })
      .from(reviews)
      .leftJoin(products, eq(products.id, reviews.productId))
      .leftJoin(users, eq(users.id, reviews.userId))
      .where(where)
      // Oldest first when moderating (fair queue), newest first otherwise.
      .orderBy(view === "pending" ? reviews.createdAt : desc(reviews.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(where),
    db
      .select({
        pending: sql<number>`count(*) filter (where ${reviews.status} = 'pending')`,
        approved: sql<number>`count(*) filter (where ${reviews.status} = 'approved')`,
        rejected: sql<number>`count(*) filter (where ${reviews.status} = 'rejected')`,
        all: sql<number>`count(*)`,
        avg: sql<
          string | null
        >`avg(${reviews.rating}) filter (where ${reviews.status} = 'approved')`,
        verified: sql<number>`count(*) filter (where ${reviews.isVerified} and ${reviews.status} = 'approved')`,
        low: sql<number>`count(*) filter (where ${reviews.rating} <= 2 and ${reviews.status} = 'approved')`,
      })
      .from(reviews),
  ]);

  const productIds = [
    ...new Set(rows.map((r) => r.productId).filter(Boolean)),
  ] as string[];
  const thumbs = productIds.length
    ? await db
        .selectDistinctOn([productImages.productId], {
          productId: productImages.productId,
          url: productImages.url,
        })
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(
          productImages.productId,
          desc(productImages.isFeatured),
          productImages.position,
        )
    : [];
  const thumbBy = new Map(thumbs.map((t) => [t.productId, t.url]));

  const data: ReviewRow[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    images: r.images ?? [],
    verified: r.isVerified,
    helpful: r.helpfulCount,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    product: r.productId
      ? {
          id: r.productId,
          title: r.productTitle ?? "",
          handle: r.productHandle ?? "",
          image: thumbBy.get(r.productId) ?? null,
        }
      : null,
    author: r.userName || r.userEmail?.split("@")[0] || "Customer",
    email: r.userEmail,
  }));

  const s = stats ?? {
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0,
    avg: null,
    verified: 0,
    low: 0,
  };
  const approved = Number(s.approved);
  const href = (o: Partial<Record<"view" | "rating" | "page", string>>) => {
    const m = { view, rating, ...o };
    const q = new URLSearchParams();
    if (m.view !== "pending") q.set("view", m.view);
    if (m.rating !== "all") q.set("rating", m.rating);
    if (o.page && o.page !== "1") q.set("page", o.page);
    const str = q.toString();
    return str ? `/admin/reviews?${str}` : "/admin/reviews";
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Customers"
        title="Reviews"
        description="New reviews wait here until you publish them. Published reviews show on product pages; hidden ones don't."
      />

      <MetricGrid className="mb-8 grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Average rating"
          value={s.avg ? `${Number(s.avg).toFixed(1)}★` : "—"}
          hint={`From ${count(approved)} published`}
        />
        <Metric
          label="To moderate"
          value={count(Number(s.pending))}
          href={
            Number(s.pending) ? href({ view: "pending", page: "1" }) : undefined
          }
        />
        <Metric
          label="Verified buyers"
          value={percent(
            approved ? (Number(s.verified) / approved) * 100 : null,
          )}
          hint="Of published reviews"
        />
        <Metric
          label="1–2★ published"
          value={count(Number(s.low))}
          hint="Worth a reply or a call"
          href={
            Number(s.low)
              ? href({ view: "approved", rating: "low", page: "1" })
              : undefined
          }
        />
      </MetricGrid>

      <ViewTabs
        label="Review views"
        active={view}
        hrefFor={(key) => href({ view: key, page: "1" })}
        views={VIEWS.map((v) => ({
          key: v.key,
          label: v.label,
          tone: v.tone,
          count: Number(s[v.key as keyof typeof s] ?? 0),
        }))}
      />
      <div className="py-4">
        <SegmentedLinks
          label="Filter by rating"
          options={RATINGS}
          active={rating}
          hrefFor={(key) => href({ rating: key, page: "1" })}
        />
      </div>

      <ReviewQueue reviews={data} view={view} />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={Number(totalRow?.count ?? 0)}
        hrefFor={(p) => href({ page: String(p) })}
      />
    </Page>
  );
}
