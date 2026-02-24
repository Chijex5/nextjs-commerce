import Prose from "components/prose";
import { getPage } from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
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
    <article className="space-y-8">
      <header className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800 md:pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
          Information
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-5xl dark:text-neutral-100">
          {page.title}
        </h1>
        {page.bodySummary ? (
          <p className="max-w-3xl text-sm leading-7 text-neutral-600 md:text-base dark:text-neutral-400">
            {page.bodySummary}
          </p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 dark:border-neutral-800 dark:bg-neutral-950">
        <Prose className="max-w-none" html={page.body} />
      </section>

      <p className="text-xs uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
        Last updated{" "}
        {new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(page.updatedAt))}
      </p>
    </article>
  );
}
