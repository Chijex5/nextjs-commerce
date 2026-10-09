import {
  CampaignComposer,
  type ComposerInitial,
} from "components/admin/campaigns/campaign-composer";
import { Page } from "components/admin/ui";
import { eq } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { emailCampaigns } from "lib/db/schema";
import { newBlock, parseBlocks, type EmailBlock } from "lib/email/blocks";
import { getCampaignWithProducts } from "lib/email/marketing-campaigns";
import { normaliseAudience } from "lib/marketing/segments";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Turn an old field-based campaign into blocks so it can be edited in the composer. */
async function legacyToBlocks(id: string): Promise<EmailBlock[]> {
  const c = await getCampaignWithProducts(id);
  const blocks: EmailBlock[] = [];
  if (c.headerTitle || (c as { heroImageUrl?: string }).heroImageUrl) {
    blocks.push({
      id: "hero",
      type: "hero",
      image: (c as { heroImageUrl?: string }).heroImageUrl ?? "",
      heading: c.headerTitle ?? "",
      text: c.headerSubtitle ?? "",
      buttonLabel: c.ctaButtonText ?? "Shop now",
      buttonUrl: c.ctaButtonUrl ?? "/products",
    });
  }
  if (c.couponCode) {
    blocks.push({
      id: "disc",
      type: "discount",
      code: c.couponCode,
      headline: c.discountNote ?? "",
      note: "Use this code at checkout.",
    });
  }
  if (c.products?.length) {
    blocks.push({
      id: "prod",
      type: "products",
      productIds: c.products.map((p) => p.id),
      columns: 2,
      showPrice: true,
      buttonLabel: "Shop",
    });
  }
  if (c.footerText)
    blocks.push({ id: "foot", type: "text", html: `<p>${c.footerText}</p>` });
  return blocks.length ? blocks : [newBlock("text")];
}

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  let initial: ComposerInitial;

  if (id === "new") {
    initial = {
      id: null,
      name: "",
      subject: "",
      preheader: "",
      blocks: null,
      audience: { segment: "all" },
      capHours: 48,
      status: "DRAFT",
      scheduledAt: null,
    };
  } else {
    const [c] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, id))
      .limit(1);
    if (!c) notFound();
    if (c.status === "SENT" || c.status === "SENDING")
      redirect(`/admin/campaigns/${id}/analytics`);
    const saved = parseBlocks(c.content);
    initial = {
      id: c.id,
      name: c.name,
      subject: c.subject,
      preheader: c.preheader ?? "",
      blocks: saved ?? (await legacyToBlocks(c.id)),
      audience: normaliseAudience(c.audience),
      capHours: c.frequencyCapHours,
      status: c.status,
      scheduledAt: c.scheduledAt?.toISOString() ?? null,
      convertedFromLegacy: !saved,
    };
  }

  return (
    <Page className="pt-0 lg:pt-0">
      <CampaignComposer initial={initial} />
    </Page>
  );
}
