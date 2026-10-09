import { ContentEditor } from "components/admin/content/content-editor";
import { Page, PageHeader, ViewTabs } from "components/admin/ui";
import { asc, desc, inArray } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { menuItems, menus, pages } from "lib/db/schema";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const tab = (await searchParams).tab === "menus" ? "menus" : "pages";
  const [pageRows, menuRows] = await Promise.all([
    db.select().from(pages).orderBy(desc(pages.updatedAt)),
    db.select().from(menus).orderBy(asc(menus.title)),
  ]);
  const items = menuRows.length
    ? await db
        .select()
        .from(menuItems)
        .where(
          inArray(
            menuItems.menuId,
            menuRows.map((m) => m.id),
          ),
        )
        .orderBy(asc(menuItems.position))
    : [];

  return (
    <Page>
      <PageHeader
        eyebrow="Catalog"
        title="Content"
        description="Information pages (shipping, returns, about) and the menus in your site's header and footer."
      />
      <ViewTabs
        label="Content sections"
        active={tab}
        hrefFor={(k) =>
          k === "pages" ? "/admin/content" : "/admin/content?tab=menus"
        }
        views={[
          { key: "pages", label: "Pages", count: pageRows.length },
          { key: "menus", label: "Menus", count: menuRows.length },
        ]}
      />
      <div className="mt-6">
        <ContentEditor
          tab={tab}
          pages={pageRows.map((p) => ({
            id: p.id,
            handle: p.handle,
            title: p.title,
            body: p.body ?? "",
            bodySummary: p.bodySummary ?? "",
            seoTitle: p.seoTitle ?? "",
            seoDescription: p.seoDescription ?? "",
            updatedAt: p.updatedAt.toISOString(),
          }))}
          menus={menuRows.map((m) => ({
            id: m.id,
            handle: m.handle,
            title: m.title,
            items: items
              .filter((i) => i.menuId === m.id)
              .map((i) => ({ id: i.id, title: i.title, url: i.url })),
          }))}
        />
      </div>
    </Page>
  );
}
