import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { redirect, notFound } from "next/navigation";
import AdminNav from "../../../../../components/admin/AdminNav";
import ProductForm from "../../../../../components/admin/ProductForm";
import prisma from "../../../../../lib/prisma";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;

  // Get product with all relations
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { position: "asc" },
      },
      variants: {
        orderBy: { createdAt: "asc" },
      },
      options: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Get all collections for the form
  const collections = await prisma.collection.findMany({
    orderBy: { title: "asc" },
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="products" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Edit Product
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Update product details below.
            </p>
          </div>

          <ProductForm collections={collections} product={product} />
        </div>
      </div>
    </div>
  );
}
