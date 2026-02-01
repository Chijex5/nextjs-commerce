import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { menuItems, menus, pages } from "lib/db/schema";
import { asc, desc, inArray } from "drizzle-orm";
import AdminNav from "components/admin/AdminNav";
import ContentManagement from "components/admin/ContentManagement";

export default async function AdminContentPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const [pageRows, menuRows] = await Promise.all([
    db.select().from(pages).orderBy(desc(pages.updatedAt)),
    db.select().from(menus).orderBy(asc(menus.title)),
  ]);

  const menuIds = menuRows.map((menu) => menu.id);
  const menuItemRows = menuIds.length
    ? await db
        .select()
        .from(menuItems)
        .where(inArray(menuItems.menuId, menuIds))
        .orderBy(asc(menuItems.position))
    : [];

  const itemsByMenu = menuItemRows.reduce<Record<string, typeof menuItemRows>>(
    (acc, item) => {
      const menuId = item.menuId;
      if (!menuId) {
        return acc;
      }
      if (!acc[menuId]) {
        acc[menuId] = [] as typeof menuItemRows;
      }
      acc[menuId].push(item);
      return acc;
    },
    {},
  );

  const menusWithItems = menuRows.map((menu) => ({
    ...menu,
    items: itemsByMenu[menu.id] || [],
  }));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="content" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Content & Navigation
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Manage pages and menus from one place.
            </p>
          </div>

          <ContentManagement pages={pageRows} menus={menusWithItems} />
        </div>
      </div>
    </div>
  );
}
