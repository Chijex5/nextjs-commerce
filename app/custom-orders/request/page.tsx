import {
  RequestWizard,
  type PickerProduct,
} from "components/custom-orders/request-wizard";
import { buttonClass } from "components/ui/button";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  hashCustomOrderPublicToken,
  isCustomOrderFeatureEnabled,
  requestPagePath,
} from "lib/custom-order-utils";
import { listEditOptions } from "lib/custom-orders/edits";
import { getCustomOrderSettings } from "lib/custom-orders/settings";
import { getProducts } from "lib/database";
import { db } from "lib/db";
import {
  customOrderQuoteTokens,
  customOrderQuotes,
  customOrderRequests,
} from "lib/db/schema";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Start a Custom Order",
  description:
    "Change one of our designs, send a photo, or describe your idea — we'll confirm the price before anything is made.",
  alternates: { canonical: canonicalUrl("/custom-orders/request") },
  openGraph: {
    title: `Start a Custom Order | ${siteName}`,
    description:
      "Change one of our designs, send a photo, or describe your idea — we'll confirm the price before anything is made.",
    url: canonicalUrl("/custom-orders/request"),
    type: "website",
    images: ["/opengraph-image"],
  },
};

const WHATSAPP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/2348121993874";

/** Quote links emailed before request pages existed: send them to the request page. */
async function legacyQuoteRedirect(quoteId: string, token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(quoteId)) return null;
  const [row] = await db
    .select({ requestNumber: customOrderRequests.requestNumber })
    .from(customOrderQuoteTokens)
    .innerJoin(customOrderQuotes, eq(customOrderQuotes.id, customOrderQuoteTokens.quoteId))
    .innerJoin(customOrderRequests, eq(customOrderRequests.id, customOrderQuotes.requestId))
    .where(
      and(
        eq(customOrderQuoteTokens.quoteId, quoteId),
        eq(customOrderQuoteTokens.tokenHash, hashCustomOrderPublicToken(token)),
        isNull(customOrderQuoteTokens.usedAt),
        gt(customOrderQuoteTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ? requestPagePath(row.requestNumber) : null;
}

/** The whole catalogue for the design picker (the query returns 100 at a time). */
async function allProducts() {
  const all = [];
  for (let page = 0; page < 10; page++) {
    const batch = await getProducts({
      sortKey: "CREATED_AT",
      reverse: true,
      limit: 100,
      offset: page * 100,
    });
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

export default async function CustomOrderRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; quoteId?: string; token?: string }>;
}) {
  if (!isCustomOrderFeatureEnabled()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <p className="label mb-4 text-fg-3">Custom orders</p>
        <h1 className="display text-[clamp(2.6rem,8vw,4rem)]">
          Paused for now
        </h1>
        <p className="mt-4 max-w-[46ch] text-fg-2">
          We&apos;re not taking new custom requests on the site at the moment.
          Message us on WhatsApp and we&apos;ll help you personally.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("solid")}>
            Message us on WhatsApp
          </a>
          <Link href="/search" className={buttonClass("outline")}>
            Shop ready-made
          </Link>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  if (params.quoteId && params.token) {
    const target = await legacyQuoteRedirect(params.quoteId, params.token);
    if (target) redirect(target);
  }

  const [products, editOptions, settings] = await Promise.all([
    allProducts(),
    listEditOptions(),
    getCustomOrderSettings(),
  ]);
  const picker: PickerProduct[] = products.map((p) => ({
    handle: p.handle,
    title: p.title,
    image: p.featuredImage?.url || p.images[0]?.url || null,
    price: Number(p.priceRange.minVariantPrice.amount),
  }));

  return (
    <RequestWizard
      products={picker}
      editOptions={editOptions}
      settings={settings}
      initialProduct={params.product}
    />
  );
}
