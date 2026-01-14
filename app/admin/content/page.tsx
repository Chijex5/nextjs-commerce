import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "lib/auth";
import prisma from "lib/prisma";
import AdminNav from "components/admin/AdminNav";
import ContentManagement from "components/admin/ContentManagement";

export default async function AdminContentPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const [pages, menus] = await Promise.all([
    prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
    }),
    prisma.menu.findMany({
      orderBy: { title: "asc" },
      include: {
        items: {
          orderBy: { position: "asc" },
        },
      },
    }),
  ]);

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

          <ContentManagement pages={pages} menus={menus} />
        </div>
      </div>
    </div>
  );
}
