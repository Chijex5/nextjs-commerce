import { getCollectionsWithProducts } from "lib/database";
import { CollectionSectionsClient } from "./collection-section-client";

export async function CollectionSections() {
  const collectionsWithProducts = await getCollectionsWithProducts();

  if (!collectionsWithProducts.length) return null;

  return (
    <CollectionSectionsClient
      collectionsWithProducts={collectionsWithProducts}
    />
  );
}
