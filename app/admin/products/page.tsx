import GoogleMerchantSyncButton from "components/admin/GoogleMerchantSyncButton";
import {
  ProductsList,
  type ProductRow,
} from "components/admin/products/products-list";
import {
  FilterBar,
  Page,
  PageHeader,
  Pagination,
  Select,
  ViewTabs,
  type Tone,
} from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import {
  and,
  asc,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  not,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import {
  collections,
  productCollections,
  productImages,
  productVariants,
  products,
} from "lib/db/schema";
import { Plus, Upload } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

const hasImage = exists(
  db
    .select({ x: sql`1` })
    .from(productImages)
    .where(eq(productImages.productId, products.id)),
);
const hasVariant = exists(
  db
    .select({ x: sql`1` })
    .from(productVariants)
    .where(eq(productVariants.productId, products.id)),
);
const inCollection = exists(
  db
    .select({ x: sql`1` })
    .from(productCollections)
    .where(eq(productCollections.productId, products.id)),
);

const VIEWS: Array<{ key: string; label: string; where?: SQL; tone?: Tone }> = [
  { key: "all", label: "All" },
  {
    key: "active",
    label: "Active",
    where: eq(products.availableForSale, true),
  },
  {
    key: "hidden",
    label: "Hidden from shop",
    where: eq(products.availableForSale, false),
  },
  {
    key: "attention",
    label: "Needs attention",
    where: or(not(hasImage), not(hasVariant), not(inCollection)),
    tone: "warning",
  },
];

const SORTS = {
  newest: desc(products.createdAt),
  updated: desc(products.updatedAt),
  title: asc(products.title),
  "best-selling": sql`(select coalesce(sum(oi.quantity), 0) from order_items oi join orders o on o.id = oi.order_id
     where oi.product_id = ${products.id} and o.status <> 'cancelled'
       and o.created_at >= (now() at time zone 'UTC') - interval '30 days') desc`,
} as const;

type Params = {
  view?: string;
  q?: string;
  collection?: string;
  sort?: string;
  page?: string;
  search?: string;
  status?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const legacyView =
    params.status === "active"
      ? "active"
      : params.status === "inactive"
        ? "hidden"
        : undefined;
  const view =
    VIEWS.find((v) => v.key === (params.view ?? legacyView)) ?? VIEWS[0]!;
  const q = (params.q ?? params.search ?? "").trim();
  const collection = params.collection ?? "all";
  const sort = (
    params.sort && params.sort in SORTS ? params.sort : "newest"
  ) as keyof typeof SORTS;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const narrowing: SQL[] = [];
  if (q) {
    narrowing.push(
      or(
        ilike(products.title, `%${q}%`),
        ilike(products.handle, `%${q}%`),
        sql`${q} = any(${products.tags})`,
      )!,
    );
  }
  if (collection !== "all") {
    narrowing.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(productCollections)
          .where(
            and(
              eq(productCollections.productId, products.id),
              eq(productCollections.collectionId, collection),
            ),
          ),
      ),
    );
  }
  const where = and(...narrowing, ...(view.where ? [view.where] : []));

  const [rows, [totalRow], [countRow], allCollections] = await Promise.all([
    db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        availableForSale: products.availableForSale,
        updatedAt: products.updatedAt,
        hasImage: sql<boolean>`${hasImage}`,
        hasVariant: sql<boolean>`${hasVariant}`,
        inCollection: sql<boolean>`${inCollection}`,
      })
      .from(products)
      .where(where)
      .orderBy(SORTS[sort], desc(products.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(where),
    db
      .select(
        Object.fromEntries(
          VIEWS.map((v) => [
            v.key,
            sql<number>`count(*) filter (where ${v.where ?? sql`true`})`,
          ]),
        ),
      )
      .from(products)
      .where(narrowing.length ? and(...narrowing) : undefined),
    db
      .select({ id: collections.id, title: collections.title })
      .from(collections)
      .orderBy(asc(collections.title)),
  ]);

  const ids = rows.map((r) => r.id);
  const [images, prices, colls, sales] = ids.length
    ? await Promise.all([
        db
          .selectDistinctOn([productImages.productId], {
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(inArray(productImages.productId, ids))
          .orderBy(
            productImages.productId,
            desc(productImages.isFeatured),
            asc(productImages.position),
          ),
        db
          .select({
            productId: productVariants.productId,
            min: sql<string>`min(${productVariants.price})`,
            max: sql<string>`max(${productVariants.price})`,
            variants: sql<number>`count(*)`,
          })
          .from(productVariants)
          .where(inArray(productVariants.productId, ids))
          .groupBy(productVariants.productId),
        db
          .select({
            productId: productCollections.productId,
            title: collections.title,
          })
          .from(productCollections)
          .innerJoin(
            collections,
            eq(collections.id, productCollections.collectionId),
          )
          .where(inArray(productCollections.productId, ids)),
        db.execute(sql`
          select oi.product_id, coalesce(sum(oi.quantity), 0) as units, coalesce(sum(oi.total_amount), 0) as revenue
          from order_items oi join orders o on o.id = oi.order_id
          where o.status <> 'cancelled' and o.created_at >= (now() at time zone 'UTC') - interval '30 days'
            and oi.product_id in (${sql.join(
              ids.map((id) => sql`${id}::uuid`),
              sql`, `,
            )})
          group by oi.product_id
        `) as unknown as Promise<
          Array<{ product_id: string; units: unknown; revenue: unknown }>
        >,
      ])
    : [[], [], [], []];

  const imageBy = new Map(images.map((i) => [i.productId, i.url]));
  const priceBy = new Map(prices.map((p) => [p.productId, p]));
  const salesBy = new Map(sales.map((s) => [s.product_id, s]));
  const collBy = new Map<string, string[]>();
  for (const c of colls)
    collBy.set(c.productId, [...(collBy.get(c.productId) ?? []), c.title]);

  const data: ProductRow[] = rows.map((r) => {
    const price = priceBy.get(r.id);
    const sale = salesBy.get(r.id);
    const issues: string[] = [];
    if (!r.hasImage) issues.push("No photos");
    if (!r.hasVariant) issues.push("No sizes or price");
    if (!r.inCollection) issues.push("Not in a collection");
    return {
      id: r.id,
      title: r.title,
      handle: r.handle,
      active: r.availableForSale,
      image: imageBy.get(r.id) ?? null,
      minPrice: price ? Number(price.min) : null,
      maxPrice: price ? Number(price.max) : null,
      variants: Number(price?.variants ?? 0),
      collections: collBy.get(r.id) ?? [],
      sold30d: Number(sale?.units ?? 0),
      revenue30d: Number(sale?.revenue ?? 0),
      issues,
      updatedAt: r.updatedAt.toISOString(),
    };
  });

  const counts = (countRow ?? {}) as Record<string, unknown>;
  const total = Number(totalRow?.count ?? 0);

  const href = (
    o: Partial<Record<"view" | "q" | "collection" | "sort" | "page", string>>,
  ) => {
    const m = { view: view.key, q, collection, sort, ...o };
    const s = new URLSearchParams();
    if (m.view !== "all") s.set("view", m.view);
    if (m.q) s.set("q", m.q);
    if (m.collection !== "all") s.set("collection", m.collection);
    if (m.sort !== "newest") s.set("sort", m.sort);
    if (o.page && o.page !== "1") s.set("page", o.page);
    const str = s.toString();
    return str ? `/admin/products?${str}` : "/admin/products";
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Hidden products stay in your catalog but can't be bought. Sales figures cover the last 30 days."
        actions={
          <>
            <GoogleMerchantSyncButton />
            <Link
              href="/admin/products/bulk-import"
              className={buttonClass("outline", "md")}
            >
              <Upload className="size-4" /> Import
            </Link>
            <Link
              href="/admin/products/new"
              className={buttonClass("solid", "md")}
            >
              <Plus className="size-4" /> Add product
            </Link>
          </>
        }
      />

      <ViewTabs
        label="Product views"
        active={view.key}
        hrefFor={(key) => href({ view: key, page: "1" })}
        views={VIEWS.map((v) => ({
          key: v.key,
          label: v.label,
          count: Number(counts[v.key] ?? 0),
          tone: v.tone,
        }))}
      />

      <FilterBar
        action="/admin/products"
        search={q}
        placeholder="Search by name, handle or tag"
        hidden={{ view: view.key === "all" ? undefined : view.key }}
      >
        <Select
          name="collection"
          label="Collection"
          defaultValue={collection}
          options={[
            { value: "all", label: "All collections" },
            ...allCollections.map((c) => ({ value: c.id, label: c.title })),
          ]}
        />
        <Select
          name="sort"
          label="Sort"
          defaultValue={sort}
          options={[
            { value: "newest", label: "Newest" },
            { value: "updated", label: "Recently edited" },
            { value: "best-selling", label: "Best selling (30d)" },
            { value: "title", label: "A–Z" },
          ]}
        />
      </FilterBar>

      <ProductsList products={data} />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        hrefFor={(p) => href({ page: String(p) })}
      />
    </Page>
  );
}
