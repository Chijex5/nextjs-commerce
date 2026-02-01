import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import ProductForm from "@/components/admin/ProductForm";
import { db } from "@/lib/db";
import {
  collections,
  productCollections,
  productImages,
  productOptions,
  productVariants,
  products,
} from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

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

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    notFound();
  }

  const [images, variants, options, collectionLinks, collectionRows] =
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
      db
        .select()
        .from(productOptions)
        .where(eq(productOptions.productId, id)),
      db
        .select({
          id: productCollections.id,
          productId: productCollections.productId,
          collectionId: productCollections.collectionId,
          position: productCollections.position,
          createdAt: productCollections.createdAt,
          collection: collections,
        })
        .from(productCollections)
        .innerJoin(
          collections,
          eq(productCollections.collectionId, collections.id),
        )
        .where(eq(productCollections.productId, id)),
      db.select().from(collections).orderBy(asc(collections.title)),
    ]);

  const productWithRelations = {
    ...product,
    images,
    variants,
    options,
    productCollections: collectionLinks.map((link) => ({
      id: link.id,
      productId: link.productId,
      collectionId: link.collectionId,
      position: link.position,
      createdAt: link.createdAt,
      collection: link.collection,
    })),
  };

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

          <ProductForm collections={collectionRows} product={productWithRelations} />
        </div>
      </div>
    </div>
  );
}
