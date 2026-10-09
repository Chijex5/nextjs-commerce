import { ProductEditor } from "components/admin/products/product-editor";
import { Page } from "components/admin/ui";
import { asc, eq, sql } from "drizzle-orm";
import { deriveModel } from "lib/admin/product-pricing";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import {
  collections,
  productCollections,
  productImages,
  productOptions,
  productVariants,
  products,
} from "lib/db/schema";
import { PRODUCT_IMAGE_HEIGHT, PRODUCT_IMAGE_WIDTH } from "lib/image-constants";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!product) notFound();

  const [images, variants, options, links, collectionRows, [stats]] =
    await Promise.all([
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, id))
        .orderBy(asc(productImages.position)),
      db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, id))
        .orderBy(asc(productVariants.createdAt)),
      db.select().from(productOptions).where(eq(productOptions.productId, id)),
      db
        .select({ collectionId: productCollections.collectionId })
        .from(productCollections)
        .where(eq(productCollections.productId, id)),
      db
        .select({ id: collections.id, title: collections.title })
        .from(collections)
        .orderBy(asc(collections.title)),
      db.execute(sql`
      select
        coalesce(sum(oi.quantity) filter (where o.created_at >= (now() at time zone 'UTC') - interval '30 days'), 0) as units,
        coalesce(sum(oi.total_amount) filter (where o.created_at >= (now() at time zone 'UTC') - interval '30 days'), 0) as revenue,
        count(distinct o.id) as orders,
        max(o.created_at)::text as last_sold
      from order_items oi join orders o on o.id = oi.order_id
      where oi.product_id = ${id}::uuid and o.status <> 'cancelled'
    `) as unknown as Promise<Array<Record<string, unknown>>>,
    ]);

  // Featured image first: the shop treats the first image as the main one.
  const ordered = [...images].sort(
    (a, b) =>
      Number(b.isFeatured) - Number(a.isFeatured) || a.position - b.position,
  );
  const { model, exact } = deriveModel(
    options.map((o) => ({ name: o.name, values: o.values })),
    variants.map((v) => ({
      price: Number(v.price),
      selectedOptions:
        (v.selectedOptions as Array<{ name: string; value: string }>) ?? [],
    })),
  );

  return (
    <Page className="pt-0 lg:pt-0">
      <ProductEditor
        key={product.updatedAt.toISOString()}
        collections={collectionRows}
        stats={{
          units30d: Number(stats?.units ?? 0),
          revenue30d: Number(stats?.revenue ?? 0),
          orders: Number(stats?.orders ?? 0),
          lastSoldAt: stats?.last_sold
            ? new Date(
                String(stats.last_sold).replace(" ", "T") + "Z",
              ).toISOString()
            : null,
        }}
        initial={{
          id: product.id,
          title: product.title,
          handle: product.handle,
          descriptionHtml:
            product.descriptionHtml ||
            (product.description ? `<p>${product.description}</p>` : ""),
          availableForSale: product.availableForSale,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          tags: product.tags ?? [],
          images: ordered.map((i) => ({
            url: i.url,
            width: i.width ?? PRODUCT_IMAGE_WIDTH,
            height: i.height ?? PRODUCT_IMAGE_HEIGHT,
          })),
          collectionIds: links.map((l) => l.collectionId),
          pricing: model,
          pricingExact: exact,
        }}
      />
    </Page>
  );
}
