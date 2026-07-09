import { escapeHtml } from "./email-utils";
import {
  CAMPAIGN_BLOCK_TYPES,
  CampaignBlock,
  MarketingCampaign,
  MarketingSubscriber,
  formatSaleDate,
  normalizeUrl,
  renderCouponBox,
  renderProductGrid,
  renderVariables,
} from "./marketing-campaign-base";

// ─── Server-side validation ─────────────────────────────────────────────────────

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Coerce untrusted input (from the campaign editor) into a safe, well-formed
 * array of campaign blocks. Unknown block types and non-object entries are
 * dropped; every field is narrowed to its expected type. Output HTML is still
 * escaped at render time — this is a structural guard, not the only defence.
 */
export function sanitizeCampaignBlocks(input: unknown): CampaignBlock[] {
  if (!Array.isArray(input)) return [];
  const blocks: CampaignBlock[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const b = raw as Record<string, unknown>;
    const type = b.type;
    if (
      typeof type !== "string" ||
      !CAMPAIGN_BLOCK_TYPES.includes(type as CampaignBlock["type"])
    ) {
      continue;
    }

    switch (type) {
      case "heading":
        blocks.push({
          type,
          text: str(b.text),
          eyebrow: str(b.eyebrow) || undefined,
          align: b.align === "center" ? "center" : "left",
        });
        break;
      case "text":
        blocks.push({
          type,
          text: str(b.text),
          style: b.style === "quote" ? "quote" : "normal",
        });
        break;
      case "image":
        blocks.push({
          type,
          url: str(b.url),
          href: str(b.href) || undefined,
          alt: str(b.alt) || undefined,
        });
        break;
      case "button":
        blocks.push({
          type,
          text: str(b.text),
          url: str(b.url),
          variant: b.variant === "secondary" ? "secondary" : "primary",
        });
        break;
      case "coupon":
        blocks.push({
          type,
          code: str(b.code),
          label: str(b.label) || undefined,
          deadline: str(b.deadline) || null,
        });
        break;
      case "products":
        blocks.push({ type });
        break;
      case "divider":
        blocks.push({ type });
        break;
      case "spacer":
        blocks.push({
          type,
          size:
            b.size === "sm" || b.size === "lg" ? (b.size as "sm" | "lg") : "md",
        });
        break;
    }
  }

  return blocks;
}

type BlockContext = {
  campaign: MarketingCampaign;
  subscriber: MarketingSubscriber;
  siteUrl: string;
};

const SPACER_HEIGHT: Record<"sm" | "md" | "lg", number> = {
  sm: 12,
  md: 24,
  lg: 40,
};

function renderHeadingBlock(
  block: Extract<CampaignBlock, { type: "heading" }>,
  ctx: BlockContext,
): string {
  const text = renderVariables(block.text, ctx);
  if (!text.trim()) return "";
  const align = block.align === "center" ? "center" : "left";
  const eyebrow = block.eyebrow
    ? renderVariables(block.eyebrow, ctx).trim()
    : "";
  return `
    ${
      eyebrow
        ? `<p style="margin:0 0 10px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#9ca3af;font-weight:700;text-align:${align};font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">${escapeHtml(eyebrow)}</p>`
        : ""
    }
    <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;font-size:26px;line-height:1.3;font-weight:400;color:#111111;letter-spacing:-0.01em;text-align:${align};">${escapeHtml(text)}</h2>`;
}

function renderTextBlock(
  block: Extract<CampaignBlock, { type: "text" }>,
  ctx: BlockContext,
): string {
  const text = renderVariables(block.text, ctx);
  if (!text.trim()) return "";
  if (block.style === "quote") {
    return `<p style="font-size:15px;color:#1a1a1a;line-height:1.8;font-family:Georgia,'Times New Roman',Times,serif;font-style:italic;margin:0 0 20px;border-left:3px solid #111111;padding-left:16px;">${escapeHtml(text)}</p>`;
  }
  return `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.75;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">${escapeHtml(text)}</p>`;
}

function renderImageBlock(
  block: Extract<CampaignBlock, { type: "image" }>,
  ctx: BlockContext,
): string {
  if (!block.url?.trim()) return "";
  const url = normalizeUrl(block.url, ctx.siteUrl);
  const alt = block.alt ? renderVariables(block.alt, ctx) : "";
  const img = `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:2px;" />`;
  const wrapped = block.href?.trim()
    ? `<a href="${escapeHtml(normalizeUrl(block.href, ctx.siteUrl))}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;line-height:0;">${img}</a>`
    : img;
  return `<div style="margin:0 0 20px;line-height:0;">${wrapped}</div>`;
}

function renderButtonBlock(
  block: Extract<CampaignBlock, { type: "button" }>,
  ctx: BlockContext,
): string {
  const text = renderVariables(block.text, ctx).trim();
  if (!text) return "";
  const url = normalizeUrl(renderVariables(block.url, ctx), ctx.siteUrl);
  const cls = block.variant === "secondary" ? "button-secondary" : "button";
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:8px 0 20px;">
      <tr>
        <td style="padding:0;text-align:left;">
          <a href="${escapeHtml(url)}" class="${cls}">${escapeHtml(text)}</a>
        </td>
      </tr>
    </table>`;
}

function renderCouponBlock(
  block: Extract<CampaignBlock, { type: "coupon" }>,
): string {
  return renderCouponBox(block.code, {
    label: block.label || undefined,
    deadline: formatSaleDate(block.deadline),
  });
}

/**
 * Render a single CUSTOM campaign block to email-safe HTML.
 */
export function renderCampaignBlock(
  block: CampaignBlock,
  ctx: BlockContext,
): string {
  switch (block.type) {
    case "heading":
      return renderHeadingBlock(block, ctx);
    case "text":
      return renderTextBlock(block, ctx);
    case "image":
      return renderImageBlock(block, ctx);
    case "button":
      return renderButtonBlock(block, ctx);
    case "products":
      return renderProductGrid(ctx.campaign.products || [], ctx.siteUrl, {
        discountPercentage: ctx.campaign.discountPercentage,
      });
    case "coupon":
      return renderCouponBlock(block);
    case "divider":
      return `<hr class="divider" />`;
    case "spacer": {
      const h = SPACER_HEIGHT[block.size ?? "md"];
      return `<div style="height:${h}px;line-height:${h}px;font-size:0;">&nbsp;</div>`;
    }
    default:
      return "";
  }
}

/**
 * Build the body of a CUSTOM campaign from its ordered list of blocks.
 * Falls back to the campaign products grid when no blocks are configured so a
 * half-finished custom campaign still renders something meaningful.
 */
export function buildCustomContent(
  campaign: MarketingCampaign,
  subscriber: MarketingSubscriber,
  siteUrl: string,
): string {
  const ctx = { campaign, subscriber, siteUrl };
  const blocks = Array.isArray(campaign.blocks) ? campaign.blocks : [];

  if (blocks.length === 0) {
    return renderProductGrid(campaign.products || [], siteUrl, {
      discountPercentage: campaign.discountPercentage,
    });
  }

  return blocks.map((block) => renderCampaignBlock(block, ctx)).join("\n");
}
