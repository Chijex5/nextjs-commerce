import type { Metadata } from "next";

import Prose from "components/prose";
import { getPage } from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = await getPage(params.page);

  if (!page) return notFound();

  const title = page.seo?.title || page.title;
  const description = page.seo?.description || page.bodySummary;
  const canonicalPath = `/${page.handle}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(canonicalPath),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl(canonicalPath),
      type: "website",
      images: [`${canonicalPath}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: [`${canonicalPath}/opengraph-image`],
    },
  };
}

export default async function Page(props: {
  params: Promise<{ page: string }>;
}) {
  const params = await props.params;
  const page = await getPage(params.page);

  if (!page) return notFound();

  return (
    <>
      <h1 className="mb-8 text-5xl font-bold">{page.title}</h1>
      <Prose className="mb-8" html={page.body} />
      <p className="text-sm italic">
        {`This document was last updated on ${new Intl.DateTimeFormat(
          undefined,
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        ).format(new Date(page.updatedAt))}.`}
      </p>
    </>
  );
}
