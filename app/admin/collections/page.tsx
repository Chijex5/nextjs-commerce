import {
  CollectionsGrid,
  type CollectionCard,
} from "components/admin/collections/collections-grid";
import { Page, PageHeader } from "components/admin/ui";
import { asc, sql } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { collections } from "lib/db/schema";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [rows, stats] = await Promise.all([
    db.select().from(collections).orderBy(asc(collections.title)),
    db.execute(sql`
      select pc.collection_id,
        count(distinct pc.product_id) as products,
        count(distinct pc.product_id) filter (where p.available_for_sale) as active,
        (select i.url from product_images i join product_collections pc2 on pc2.product_id = i.product_id
          where pc2.collection_id = pc.collection_id order by i.is_featured desc, i.position asc limit 1) as cover,
        coalesce((select sum(oi.total_amount) from order_items oi join orders o on o.id = oi.order_id
          join product_collections pc3 on pc3.product_id = oi.product_id
          where pc3.collection_id = pc.collection_id and o.status <> 'cancelled'
            and o.created_at >= (now() at time zone 'UTC') - interval '30 days'), 0) as sales
      from product_collections pc join products p on p.id = pc.product_id
      group by pc.collection_id
    `) as unknown as Promise<
      Array<{
        collection_id: string;
        products: unknown;
        active: unknown;
        cover: string | null;
        sales: unknown;
      }>
    >,
  ]);

  const statBy = new Map(stats.map((s) => [s.collection_id, s]));
  const data: CollectionCard[] = rows.map((c) => {
    const s = statBy.get(c.id);
    return {
      id: c.id,
      handle: c.handle,
      title: c.title,
      description: c.description ?? "",
      seoTitle: c.seoTitle ?? "",
      seoDescription: c.seoDescription ?? "",
      products: Number(s?.products ?? 0),
      active: Number(s?.active ?? 0),
      cover: s?.cover ?? null,
      sales30d: Number(s?.sales ?? 0),
    };
  });

  return (
    <Page>
      <PageHeader
        eyebrow="Catalog"
        title="Collections"
        description="Groups of products customers can browse, like “Slides” or “New in”. Add products to a collection from the product's page."
      />
      <CollectionsGrid collections={data} />
    </Page>
  );
}
