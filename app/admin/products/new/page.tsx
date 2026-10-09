import { ProductEditor } from "components/admin/products/product-editor";
import { Page } from "components/admin/ui";
import { asc } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { collections } from "lib/db/schema";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const collectionRows = await db
    .select({ id: collections.id, title: collections.title })
    .from(collections)
    .orderBy(asc(collections.title));

  return (
    <Page className="pt-0 lg:pt-0">
      <ProductEditor
        collections={collectionRows}
        initial={{
          title: "",
          handle: "",
          descriptionHtml: "",
          availableForSale: true,
          seoTitle: "",
          seoDescription: "",
          tags: [],
          images: [],
          collectionIds: [],
          pricing: {
            sizes: ["38", "39", "40", "41", "42", "43", "44"],
            colors: [],
            basePrice: 0,
            sizeRules: [],
            colorPrices: {},
          },
          pricingExact: true,
        }}
      />
    </Page>
  );
}
