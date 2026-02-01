import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "../../../../components/admin/AdminNav";
import ProductForm from "../../../../components/admin/ProductForm";
import { db } from "lib/db";
import { collections } from "lib/db/schema";
import { asc } from "drizzle-orm";

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const collectionRows = await db
    .select()
    .from(collections)
    .orderBy(asc(collections.title));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="products" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Add New Product
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Fill in the product details below. Fields with * are required.
            </p>
          </div>

          <ProductForm collections={collectionRows} />
        </div>
      </div>
    </div>
  );
}
