import OpengraphImage from "components/opengraph-image";
import { getCollection } from "lib/database";
import { notFound } from "next/navigation";

export const alt = "Collection preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: handle } = await params;
  const collectionData = await getCollection(handle);

  if (!collectionData) return notFound();

  const title = collectionData.seo?.title || collectionData.title;

  return OpengraphImage({ title });
}
