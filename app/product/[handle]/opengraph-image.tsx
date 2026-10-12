import OpengraphImage from "components/opengraph-image";
import { getProduct } from "lib/database";

type Props = {
  params: Promise<{ handle: string }>;
};

export const alt = "Product preview";
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

  const amount = product.priceRange?.minVariantPrice?.amount;
  const price = amount
    ? `₦${Number(amount).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`
    : undefined;

  // next/og ImageResponse does not support WebP — rewrite Cloudinary URLs to JPEG
  const rawImage = product.images?.[0]?.url ?? product.featuredImage?.url;
  const imageUrl = rawImage
    ? rawImage.replace("/image/upload/", "/image/upload/f_jpg,q_auto,w_1040/")
    : null;

  return OpengraphImage({
    title: product.title,
    description: product.description || "Cut and stitched by hand in Lagos.",
    price,
    imageUrl,
  });
}
