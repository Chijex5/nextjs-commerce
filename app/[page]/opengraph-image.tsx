import OpengraphImage from "components/opengraph-image";
import { getPage } from "lib/database";
import { notFound } from "next/navigation";

export const alt = "Page preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: handle } = await params;
  const pageData = await getPage(handle);

  if (!pageData) return notFound();

  const title = pageData.seo?.title || pageData.title;

  return OpengraphImage({ title });
}
