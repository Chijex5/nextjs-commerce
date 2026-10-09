import {
  ShowcaseManager,
  type ShowcaseItem,
} from "components/admin/showcase/showcase-manager";
import { Page, PageHeader } from "components/admin/ui";
import { asc, desc } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { customOrders } from "lib/db/schema";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const rows = await db
    .select()
    .from(customOrders)
    .orderBy(asc(customOrders.position), desc(customOrders.updatedAt));
  const items: ShowcaseItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    customerStory: r.customerStory ?? "",
    beforeImage: r.beforeImage ?? "",
    afterImage: r.afterImage ?? "",
    details: Array.isArray(r.details)
      ? (r.details as unknown[]).filter(
          (d): d is string => typeof d === "string",
        )
      : [],
    completionTime: r.completionTime ?? "",
    position: r.position,
    isPublished: r.isPublished,
  }));

  return (
    <Page>
      <PageHeader
        eyebrow="Catalog"
        title="Custom showcase"
        description="Before-and-after stories on the Custom orders page. The first six published entries show, in this order."
      />
      <ShowcaseManager items={items} />
    </Page>
  );
}
