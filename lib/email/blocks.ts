/**
 * Block-based marketing emails.
 *
 * A campaign's design is a list of blocks (hero, text, products, discount…).
 * Brand styling (logo, fonts, black & white palette, footer, unsubscribe) is
 * applied by the renderer, so whoever writes the email only chooses blocks and
 * fills in words and pictures — the same approach as Shopify Email and Klaviyo.
 *
 * Pure TypeScript with no server imports: the editor's live preview and the
 * real send use exactly the same renderer, so what you see is what's sent.
 */
import { baseTemplate } from "./templates/base";

export type HeroBlock = {
  id: string;
  type: "hero";
  image: string;
  heading: string;
  text: string;
  buttonLabel: string;
  buttonUrl: string;
};
export type TextBlock = { id: string; type: "text"; html: string };
export type ProductsBlock = {
  id: string;
  type: "products";
  productIds: string[];
  columns: 1 | 2;
  showPrice: boolean;
  buttonLabel: string;
};
export type DiscountBlock = {
  id: string;
  type: "discount";
  code: string;
  headline: string;
  note: string;
};
export type ButtonBlock = {
  id: string;
  type: "button";
  label: string;
  url: string;
};
export type ImageBlock = {
  id: string;
  type: "image";
  src: string;
  alt: string;
  url: string;
};
export type DividerBlock = { id: string; type: "divider" };

export type EmailBlock =
  | HeroBlock
  | TextBlock
  | ProductsBlock
  | DiscountBlock
  | ButtonBlock
  | ImageBlock
  | DividerBlock;
export type BlockType = EmailBlock["type"];

export type EmailProduct = {
  id: string;
  title: string;
  handle: string;
  price: number | null;
  image: string | null;
};

export type RenderContext = {
  products: Map<string, EmailProduct>;
  /** Recipient's first name; falls back to "there". */
  firstName?: string | null;
  siteUrl: string;
};

/** Personalisation token inserted by the "First name" button. */
export const FIRST_NAME_TOKEN = "{first_name}";

export const BLOCK_LABELS: Record<BlockType, { label: string; hint: string }> =
  {
    hero: { label: "Hero", hint: "Big photo, headline and a button" },
    text: { label: "Text", hint: "A paragraph or two" },
    products: { label: "Products", hint: "Pick from your catalogue" },
    discount: { label: "Discount code", hint: "Show a coupon to copy" },
    button: { label: "Button", hint: "One clear call to action" },
    image: { label: "Image", hint: "A single photo" },
    divider: { label: "Divider", hint: "A thin line between sections" },
  };

const uid = () => Math.random().toString(36).slice(2, 10);

export function newBlock(type: BlockType): EmailBlock {
  const id = uid();
  switch (type) {
    case "hero":
      return {
        id,
        type,
        image: "",
        heading: "New in the workshop",
        text: "Handmade in Nigeria, made to last.",
        buttonLabel: "Shop now",
        buttonUrl: "/products",
      };
    case "text":
      return {
        id,
        type,
        html: `<p>Hi ${FIRST_NAME_TOKEN},</p><p>Write your message here.</p>`,
      };
    case "products":
      return {
        id,
        type,
        productIds: [],
        columns: 2,
        showPrice: true,
        buttonLabel: "Shop",
      };
    case "discount":
      return {
        id,
        type,
        code: "",
        headline: "A little something for you",
        note: "Use this code at checkout.",
      };
    case "button":
      return { id, type, label: "Shop the collection", url: "/products" };
    case "image":
      return { id, type, src: "", alt: "", url: "" };
    case "divider":
      return { id, type };
  }
}

/** Starting points. Every block stays editable. */
export const STARTERS: Array<{
  key: string;
  name: string;
  description: string;
  subject: string;
  build: () => EmailBlock[];
}> = [
  {
    key: "new_arrivals",
    name: "New arrivals",
    description: "Show off what just came out of the workshop.",
    subject: "Just landed: new pairs from the workshop",
    build: () => [
      {
        ...(newBlock("hero") as HeroBlock),
        heading: "Just landed",
        text: "Fresh pairs, cut and stitched by hand.",
        buttonLabel: "See what's new",
      },
      {
        ...(newBlock("text") as TextBlock),
        html: `<p>Hi ${FIRST_NAME_TOKEN},</p><p>We've just finished a new batch and wanted you to see them first.</p>`,
      },
      newBlock("products"),
      { ...(newBlock("button") as ButtonBlock), label: "Shop new arrivals" },
    ],
  },
  {
    key: "sale",
    name: "Sale",
    description: "A discount with a deadline.",
    subject: "Our sale is on, for a few days only",
    build: () => [
      {
        ...(newBlock("hero") as HeroBlock),
        heading: "The sale is on",
        text: "For a few days only.",
        buttonLabel: "Shop the sale",
      },
      newBlock("discount"),
      newBlock("products"),
      {
        ...(newBlock("text") as TextBlock),
        html: "<p>Ends Sunday at midnight. Sizes go fast.</p>",
      },
    ],
  },
  {
    key: "collection",
    name: "Collection spotlight",
    description: "One collection, told well.",
    subject: "Meet the collection",
    build: () => [
      {
        ...(newBlock("hero") as HeroBlock),
        heading: "The collection",
        text: "A closer look at one of our favourite lines.",
        buttonLabel: "Explore",
      },
      {
        ...(newBlock("text") as TextBlock),
        html: "<p>Tell the story behind it: the leather, the shape, who it's for.</p>",
      },
      { ...(newBlock("products") as ProductsBlock), columns: 1 },
    ],
  },
  {
    key: "story",
    name: "Story or announcement",
    description: "News, behind the scenes, or a thank-you.",
    subject: "A note from the workshop",
    build: () => [
      { ...(newBlock("image") as ImageBlock) },
      {
        ...(newBlock("text") as TextBlock),
        html: `<p>Hi ${FIRST_NAME_TOKEN},</p><p>Share your news here.</p>`,
      },
      newBlock("button"),
    ],
  },
  {
    key: "blank",
    name: "Blank",
    description: "Start from nothing.",
    subject: "",
    build: () => [newBlock("text")],
  },
];

// ─── Rendering ────────────────────────────────────────────────────────────────

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function absolute(url: string, siteUrl: string) {
  if (!url) return siteUrl;
  if (/^https?:\/\//i.test(url) || url.startsWith("mailto:")) return url;
  return `${siteUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

function personalise(text: string, ctx: RenderContext) {
  const name = (ctx.firstName || "").trim().split(/\s+/)[0] || "there";
  return text.split(FIRST_NAME_TOKEN).join(esc(name));
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const button = (label: string, href: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0;"><tr><td style="background:#000;"><a href="${esc(href)}" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#fff;text-decoration:none;">${esc(label)}</a></td></tr></table>`;

const row = (inner: string, pad = "0 0 28px") =>
  `<tr><td style="padding:${pad};">${inner}</td></tr>`;

function renderBlock(b: EmailBlock, ctx: RenderContext): string {
  switch (b.type) {
    case "hero": {
      const img = b.image
        ? `<img src="${esc(b.image)}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;margin:0 0 24px;" />`
        : "";
      return row(
        `${img}<h1 style="margin:0 0 12px;font-family:${FONT};font-size:34px;line-height:1.05;font-weight:800;letter-spacing:-.01em;text-transform:uppercase;color:#000;">${personalise(esc(b.heading), ctx)}</h1>` +
          (b.text
            ? `<p style="margin:0 0 20px;font-family:${FONT};font-size:16px;line-height:1.6;color:#404040;">${personalise(esc(b.text), ctx)}</p>`
            : "") +
          (b.buttonLabel
            ? button(b.buttonLabel, absolute(b.buttonUrl, ctx.siteUrl))
            : ""),
      );
    }
    case "text":
      // HTML comes from the admin's rich-text editor (tiptap: p, h2/h3, lists, bold, italic).
      return row(
        `<div style="font-family:${FONT};font-size:16px;line-height:1.65;color:#262626;">${personalise(
          b.html
            .replace(/<p>/g, '<p style="margin:0 0 14px;">')
            .replace(
              /<h2>/g,
              '<h2 style="margin:0 0 12px;font-size:22px;line-height:1.2;color:#000;">',
            )
            .replace(
              /<h3>/g,
              '<h3 style="margin:0 0 10px;font-size:18px;line-height:1.3;color:#000;">',
            )
            .replace(/<ul>/g, '<ul style="margin:0 0 14px;padding-left:20px;">')
            .replace(
              /<ol>/g,
              '<ol style="margin:0 0 14px;padding-left:20px;">',
            ),
          ctx,
        )}</div>`,
      );
    case "products": {
      const items = b.productIds
        .map((id) => ctx.products.get(id))
        .filter(Boolean) as EmailProduct[];
      if (!items.length) return "";
      const cols = b.columns === 1 ? 1 : 2;
      const width = cols === 1 ? 600 : 290;
      const cell = (p: EmailProduct) => {
        const href = absolute(`/product/${p.handle}`, ctx.siteUrl);
        return `<td valign="top" width="${width}" style="padding:0 0 24px;">
          <a href="${esc(href)}" style="text-decoration:none;color:#000;">
            ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)}" width="${width}" style="display:block;width:100%;height:auto;border:0;background:#f5f5f5;" />` : ""}
            <p style="margin:12px 0 4px;font-family:${FONT};font-size:15px;font-weight:600;color:#000;">${esc(p.title)}</p>
            ${b.showPrice && p.price ? `<p style="margin:0 0 10px;font-family:${FONT};font-size:14px;color:#525252;">From ${naira(p.price)}</p>` : ""}
          </a>
          ${b.buttonLabel ? `<a href="${esc(href)}" style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#000;">${esc(b.buttonLabel)} &rarr;</a>` : ""}
        </td>`;
      };
      const rows: string[] = [];
      for (let i = 0; i < items.length; i += cols) {
        const pair = items.slice(i, i + cols);
        rows.push(
          `<tr>${pair.map(cell).join(cols === 2 ? '<td width="20" style="font-size:0;">&nbsp;</td>' : "")}${pair.length < cols ? `<td width="20"></td><td width="${width}"></td>` : ""}</tr>`,
        );
      }
      return row(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>`,
        "0 0 8px",
      );
    }
    case "discount":
      if (!b.code) return "";
      return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed #000;"><tr><td align="center" style="padding:26px 20px;">
        ${b.headline ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:14px;color:#404040;">${personalise(esc(b.headline), ctx)}</p>` : ""}
        <p style="margin:0;font-family:'Courier New',monospace;font-size:28px;font-weight:700;letter-spacing:.2em;color:#000;">${esc(b.code.toUpperCase())}</p>
        ${b.note ? `<p style="margin:10px 0 0;font-family:${FONT};font-size:13px;color:#737373;">${esc(b.note)}</p>` : ""}
      </td></tr></table>`);
    case "button":
      return b.label ? row(button(b.label, absolute(b.url, ctx.siteUrl))) : "";
    case "image":
      if (!b.src) return "";
      {
        const img = `<img src="${esc(b.src)}" alt="${esc(b.alt)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />`;
        return row(
          b.url
            ? `<a href="${esc(absolute(b.url, ctx.siteUrl))}">${img}</a>`
            : img,
        );
      }
    case "divider":
      return row(
        '<div style="border-top:1px solid #e5e5e5;line-height:0;font-size:0;">&nbsp;</div>',
      );
  }
}

export function renderBlocksBody(blocks: EmailBlock[], ctx: RenderContext) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${blocks.map((b) => renderBlock(b, ctx)).join("")}</table>`;
}

/** Full email: brand header + blocks + footer (with unsubscribe for marketing). */
export function renderBlocksEmail(
  blocks: EmailBlock[],
  ctx: RenderContext,
  unsubscribeUrl?: string,
) {
  return baseTemplate(renderBlocksBody(blocks, ctx), unsubscribeUrl);
}

export function personaliseSubject(subject: string, firstName?: string | null) {
  const name = (firstName || "").trim().split(/\s+/)[0] || "there";
  const out = subject.split(FIRST_NAME_TOKEN).join(name);
  // "{first_name}, new pairs" with no name should read "There, new pairs".
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** Validate unknown JSON from the database / API into blocks. */
export function parseBlocks(raw: unknown): EmailBlock[] | null {
  if (!Array.isArray(raw)) return null;
  const valid = raw.filter(
    (b): b is EmailBlock =>
      !!b &&
      typeof b === "object" &&
      typeof (b as EmailBlock).type === "string" &&
      (b as EmailBlock).type in BLOCK_LABELS,
  );
  return valid;
}

export function productIdsIn(blocks: EmailBlock[]) {
  return [
    ...new Set(
      blocks.flatMap((b) => (b.type === "products" ? b.productIds : [])),
    ),
  ];
}

/** Problems that should stop a send. */
export function blockProblems(blocks: EmailBlock[]) {
  const issues: string[] = [];
  if (!blocks.length) issues.push("The email is empty.");
  for (const b of blocks) {
    if (b.type === "products" && !b.productIds.length)
      issues.push("A products block has no products picked.");
    if (b.type === "discount" && !b.code.trim())
      issues.push("A discount block has no code.");
    if (b.type === "image" && !b.src)
      issues.push("An image block has no image.");
  }
  return issues;
}
