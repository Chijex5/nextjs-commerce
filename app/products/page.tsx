import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";
import { getProducts } from "lib/database";

export const metadata = {
  title: "All Products",
  description: "Browse all products in our store.",
};

export default async function AllProductsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const products = await getProducts({ sortKey, reverse });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Products</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Showing {products.length} products
        </p>
      </div>
      {products.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : (
        <p className="py-8 text-center text-neutral-500 dark:text-neutral-400">
          No products available at the moment.
        </p>
      )}
    </>
  );
}
