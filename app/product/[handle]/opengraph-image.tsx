import OpengraphImage from "components/opengraph-image";
import { getProduct } from "lib/database";

type Props = {
  params: Promise<{ handle: string }>;
};

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image(props: Props) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) {
    return new Response("Product not found", { status: 404 });
  }

  const price = product.priceRange?.minVariantPrice
    ? `₦${Number(product.priceRange.minVariantPrice).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      })}`
    : undefined;

  return OpengraphImage({
    title: product.title,
    description: product.description || "Handcrafted with excellence",
    badge: "D'FOOTPRINT",
    price,
    showLogo: true,
  });
}
