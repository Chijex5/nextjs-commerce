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
    alternates: { canonical: canonicalUrl(canonicalPath) },
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

  const updatedDate = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(page.updatedAt));

  return (
    <>
      <style>{`

        :root {
          --espresso:   #0A0704;
          --charcoal:   #100C06;
          --cream:      #F2E8D5;
          --sand:       #C9B99A;
          --muted:      #6A5A48;
          --terra:      #BF5A28;
          --gold:       #C0892A;
          --border:     rgba(242,232,213,0.09);
          --border-mid: rgba(242,232,213,0.18);
        }

        /* ── PAGE ROOT ── */
        .pg-root {
          font-family: 'DM Sans', sans-serif;
          color: var(--cream);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* ── HERO ── */
        .pg-hero {
          background: rgba(16,12,6,0.96);
          border: 1px solid var(--border);
          padding: 56px 56px 48px;
          position: relative;
          overflow: hidden;
        }
        .pg-hero::before {
          content: '';
          position: absolute;
          right: -60px; top: -60px;
          width: 280px; height: 280px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .pg-hero::after {
          content: '';
          position: absolute;
          right: 50px; top: 50px;
          width: 120px; height: 120px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .pg-eyebrow {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--terra);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          position: relative;
          z-index: 1;
        }
        .pg-eyebrow::before {
          content: '';
          display: block;
          width: 28px; height: 1px;
          background: var(--terra);
        }
        .pg-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px, 6vw, 72px);
          font-weight: 300;
          line-height: 1.0;
          color: var(--cream);
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        .pg-summary {
          font-size: 15px;
          line-height: 1.75;
          color: var(--sand);
          max-width: 600px;
          position: relative;
          z-index: 1;
          border-left: 2px solid var(--terra);
          padding-left: 20px;
          margin-top: 4px;
        }

        /* ── ACCENT LINE ── */
        .pg-accent {
          height: 1px;
          background: linear-gradient(90deg, var(--terra) 0%, var(--gold) 50%, transparent 100%);
        }

        /* ── BODY PANEL ── */
        .pg-body-panel {
          border: 1px solid var(--border);
          border-top: none;
          background: rgba(16,12,6,0.75);
          padding: 52px 56px;
        }

        /* ── FOOTER META ── */
        .pg-meta {
          border: 1px solid var(--border);
          border-top: none;
          background: rgba(242,232,213,0.02);
          padding: 16px 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pg-meta-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .pg-meta-date {
          font-size: 12px;
          color: var(--sand);
          letter-spacing: 0.06em;
        }

        /* ── TIPTAP / PROSE STYLING ── */
        .pg-body-panel .prose,
        .pg-body-panel [class*="prose"] {
          color: var(--sand);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          line-height: 1.85;
          max-width: none;
        }

        /* Headings */
        .pg-body-panel h1,
        .pg-body-panel h2,
        .pg-body-panel h3,
        .pg-body-panel h4,
        .pg-body-panel h5,
        .pg-body-panel h6,
        .pg-body-panel .prose h1,
        .pg-body-panel .prose h2,
        .pg-body-panel .prose h3,
        .pg-body-panel .prose h4 {
          font-family: 'Cormorant Garamond', serif !important;
          font-weight: 300 !important;
          color: var(--cream) !important;
          line-height: 1.1 !important;
          margin-top: 2.5rem !important;
          margin-bottom: 1rem !important;
        }
        .pg-body-panel h1, .pg-body-panel .prose h1 { font-size: clamp(28px, 3.5vw, 44px) !important; }
        .pg-body-panel h2, .pg-body-panel .prose h2 {
          font-size: clamp(22px, 2.8vw, 34px) !important;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border);
        }
        .pg-body-panel h3, .pg-body-panel .prose h3 { font-size: clamp(18px, 2.2vw, 26px) !important; }
        .pg-body-panel h4, .pg-body-panel .prose h4 {
          font-size: 16px !important;
          font-family: 'DM Sans', sans-serif !important;
          font-weight: 500 !important;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--terra) !important;
          font-size: 11px !important;
        }

        /* Paragraphs */
        .pg-body-panel p,
        .pg-body-panel .prose p {
          color: var(--sand);
          margin-bottom: 1.4rem;
          line-height: 1.85;
        }

        /* Strong / bold */
        .pg-body-panel strong,
        .pg-body-panel b,
        .pg-body-panel .prose strong {
          color: var(--cream) !important;
          font-weight: 500 !important;
        }

        /* Italic / em */
        .pg-body-panel em,
        .pg-body-panel .prose em {
          color: var(--terra) !important;
          font-style: italic !important;
          font-family: 'Cormorant Garamond', serif !important;
          font-size: 1.08em;
        }

        /* Links */
        .pg-body-panel a,
        .pg-body-panel .prose a {
          color: var(--gold) !important;
          text-decoration: none !important;
          border-bottom: 1px solid rgba(192,137,42,0.35);
          transition: border-color 0.2s, color 0.2s;
        }
        .pg-body-panel a:hover,
        .pg-body-panel .prose a:hover {
          color: var(--cream) !important;
          border-bottom-color: var(--cream);
        }

        /* Unordered lists */
        .pg-body-panel ul,
        .pg-body-panel .prose ul {
          list-style: none !important;
          padding-left: 0 !important;
          margin-bottom: 1.4rem;
        }
        .pg-body-panel ul li,
        .pg-body-panel .prose ul li {
          color: var(--sand);
          padding: 8px 0 8px 24px;
          position: relative;
          border-bottom: 1px solid rgba(242,232,213,0.05);
          line-height: 1.7;
        }
        .pg-body-panel ul li:last-child,
        .pg-body-panel .prose ul li:last-child { border-bottom: none; }
        .pg-body-panel ul li::before,
        .pg-body-panel .prose ul li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 17px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--terra);
        }

        /* Ordered lists */
        .pg-body-panel ol,
        .pg-body-panel .prose ol {
          list-style: none !important;
          padding-left: 0 !important;
          counter-reset: pg-counter;
          margin-bottom: 1.4rem;
        }
        .pg-body-panel ol li,
        .pg-body-panel .prose ol li {
          color: var(--sand);
          padding: 10px 0 10px 44px;
          position: relative;
          border-bottom: 1px solid rgba(242,232,213,0.05);
          line-height: 1.7;
          counter-increment: pg-counter;
        }
        .pg-body-panel ol li:last-child,
        .pg-body-panel .prose ol li:last-child { border-bottom: none; }
        .pg-body-panel ol li::before,
        .pg-body-panel .prose ol li::before {
          content: counter(pg-counter, decimal-leading-zero);
          position: absolute;
          left: 0;
          top: 10px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 400;
          color: var(--terra);
          width: 32px;
          line-height: 1.7;
        }

        /* Blockquote */
        .pg-body-panel blockquote,
        .pg-body-panel .prose blockquote {
          border-left: 2px solid var(--terra) !important;
          background: rgba(191,90,40,0.05) !important;
          margin: 2rem 0 !important;
          padding: 20px 28px !important;
          font-family: 'Cormorant Garamond', serif !important;
          font-size: clamp(18px, 2vw, 24px) !important;
          font-style: italic !important;
          color: var(--cream) !important;
          line-height: 1.5 !important;
          border-radius: 0 !important;
        }
        .pg-body-panel blockquote p,
        .pg-body-panel .prose blockquote p {
          color: var(--cream) !important;
          margin-bottom: 0 !important;
          font-family: 'Cormorant Garamond', serif !important;
          font-style: italic !important;
        }

        /* Horizontal rule */
        .pg-body-panel hr,
        .pg-body-panel .prose hr {
          border: none !important;
          height: 1px !important;
          background: linear-gradient(90deg, var(--terra) 0%, var(--gold) 50%, transparent 100%) !important;
          margin: 2.5rem 0 !important;
        }

        /* Code */
        .pg-body-panel code,
        .pg-body-panel .prose code {
          background: rgba(242,232,213,0.06) !important;
          border: 1px solid var(--border) !important;
          color: var(--gold) !important;
          font-size: 12px !important;
          padding: 2px 7px !important;
          font-family: 'Courier New', monospace !important;
          border-radius: 0 !important;
        }
        .pg-body-panel pre,
        .pg-body-panel .prose pre {
          background: rgba(242,232,213,0.04) !important;
          border: 1px solid var(--border) !important;
          padding: 20px 24px !important;
          overflow-x: auto !important;
          margin: 1.5rem 0 !important;
          border-radius: 0 !important;
        }
        .pg-body-panel pre code,
        .pg-body-panel .prose pre code {
          background: none !important;
          border: none !important;
          padding: 0 !important;
          font-size: 13px !important;
          color: var(--sand) !important;
        }

        /* Tables */
        .pg-body-panel table,
        .pg-body-panel .prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 13px;
        }
        .pg-body-panel th,
        .pg-body-panel .prose th {
          background: rgba(191,90,40,0.08) !important;
          border: 1px solid var(--border) !important;
          padding: 10px 16px !important;
          text-align: left !important;
          font-size: 9px !important;
          font-weight: 500 !important;
          letter-spacing: 0.2em !important;
          text-transform: uppercase !important;
          color: var(--terra) !important;
        }
        .pg-body-panel td,
        .pg-body-panel .prose td {
          border: 1px solid var(--border) !important;
          padding: 10px 16px !important;
          color: var(--sand) !important;
          vertical-align: top;
        }
        .pg-body-panel tr:nth-child(even) td,
        .pg-body-panel .prose tr:nth-child(even) td {
          background: rgba(242,232,213,0.02);
        }

        /* First child spacing */
        .pg-body-panel .prose > *:first-child,
        .pg-body-panel > *:first-child {
          margin-top: 0 !important;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .pg-hero { padding: 36px 28px 32px; }
          .pg-body-panel { padding: 32px 28px; }
          .pg-meta { padding: 14px 28px; }
        }
        @media (max-width: 480px) {
          .pg-hero { padding: 28px 20px 24px; }
          .pg-body-panel { padding: 24px 20px; }
          .pg-meta { padding: 12px 20px; }
        }
      `}</style>

      <article className="pg-root">
        {/* ── HERO ── */}
        <header className="pg-hero">
          <div className="pg-eyebrow">Information</div>
          <h1 className="pg-title">{page.title}</h1>
          {page.bodySummary && (
            <p className="pg-summary">{page.bodySummary}</p>
          )}
        </header>

        {/* ── ACCENT ── */}
        <div className="pg-accent" />

        {/* ── BODY ── */}
        <section className="pg-body-panel">
          <Prose className="max-w-none" html={page.body} />
        </section>

        {/* ── META FOOTER ── */}
        <footer className="pg-meta">
          <span className="pg-meta-label">Last updated</span>
          <span className="pg-meta-date">{updatedDate}</span>
        </footer>
      </article>
    </>
  );
}