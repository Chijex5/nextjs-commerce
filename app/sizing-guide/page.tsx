import Footer from "components/layout/footer";
import { getPublishedSizeGuides, type PublishedSizeGuide } from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Sizing Guide · ${siteName}`,
  description:
    "Find the right fit with D'FOOTPRINT's sizing guide, measurement tips, and product-specific size charts.",
  alternates: { canonical: canonicalUrl("/sizing-guide") },
  openGraph: {
    title: `Sizing Guide | ${siteName}`,
    description:
      "Find the right fit with D'FOOTPRINT's sizing guide, measurement tips, and product-specific size charts.",
    url: canonicalUrl("/sizing-guide"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Sizing Guide | ${siteName}`,
    description:
      "Find the right fit with D'FOOTPRINT's sizing guide, measurement tips, and product-specific size charts.",
    images: ["/opengraph-image"],
  },
};

type ChartRow = {
  size: string;
  footLength: string | undefined;
  notes: string | undefined;
};

type GuideViewModel = {
  id: string;
  productType: string;
  title: string;
  summary: string;
  measurements: { label: string; value: string }[];
  chartRows: ChartRow[];
};

const FALLBACK_GUIDES: GuideViewModel[] = [
  {
    id: "default-slides",
    productType: "slides",
    title: "Slides and open footwear",
    summary:
      "These fit best with a small amount of heel room for comfort and easy on-off wear.",
    measurements: [
      { label: "Primary fit", value: "True to size" },
      { label: "If between sizes", value: "Choose the larger size" },
      { label: "Best use", value: "Everyday wear and travel" },
    ],
    chartRows: [
      { size: "EU 35", footLength: "22.5 cm", notes: "Slim fit" },
      { size: "EU 36", footLength: "23.0 cm", notes: "Slim fit" },
      { size: "EU 37", footLength: "23.7 cm", notes: "Standard fit" },
      { size: "EU 38", footLength: "24.3 cm", notes: "Standard fit" },
      { size: "EU 39", footLength: "25.0 cm", notes: "Standard fit" },
      { size: "EU 40", footLength: "25.7 cm", notes: "Roomier fit" },
    ],
  },
  {
    id: "default-footwear",
    productType: "general",
    title: "Closed and structured styles",
    summary:
      "Use this chart if you want a slightly more secure hold through the upper.",
    measurements: [
      { label: "Primary fit", value: "Half-size up if wide-footed" },
      { label: "If between sizes", value: "Prefer the larger size" },
      { label: "Fit note", value: "Allow a thumb's width at the toe" },
    ],
    chartRows: [
      { size: "EU 41", footLength: "26.3 cm", notes: "Secure fit" },
      { size: "EU 42", footLength: "27.0 cm", notes: "Secure fit" },
      { size: "EU 43", footLength: "27.7 cm", notes: "Secure fit" },
      { size: "EU 44", footLength: "28.3 cm", notes: "Secure fit" },
    ],
  },
];

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key}: ${toText(item)}`)
      .filter(Boolean)
      .join(" · ");
  }

  return "";
}

function normalizeChartRows(value: unknown): ChartRow[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const row = item as Record<string, unknown>;
      const size = toText(row.size ?? row.label ?? row.eu ?? row.code);
      const footLength = toText(
        row.footLength ?? row.length ?? row.cm ?? row.measurement,
      );
      const notes = toText(row.notes ?? row.note ?? row.fit ?? row.comment);

      if (!size && !footLength && !notes) return null;

      return {
        size: size || "—",
        footLength: footLength || undefined,
        notes: notes || undefined,
      };
    })
    .filter(
      (
        row,
      ): row is {
        size: string;
        footLength: string | undefined;
        notes: string | undefined;
      } => row !== null,
    );
}

function normalizeGuide(guide: PublishedSizeGuide): GuideViewModel {
  const measurementsValue = guide.measurements as unknown;
  const chartRows = normalizeChartRows(guide.sizesChart);
  const measurementItems =
    Array.isArray(measurementsValue) && measurementsValue.length > 0
      ? measurementsValue
          .map((item) => {
            if (!item || typeof item !== "object") return null;

            const entry = item as Record<string, unknown>;
            const label = toText(entry.label ?? entry.title ?? entry.name);
            const value = toText(entry.value ?? entry.body ?? entry.text);

            if (!label && !value) return null;

            return {
              label: label || "Note",
              value: value || "",
            };
          })
          .filter(
            (item): item is { label: string; value: string } => item !== null,
          )
      : [];

  return {
    id: guide.id,
    productType: guide.productType,
    title: guide.title,
    summary: `${guide.title} for ${guide.productType}.`,
    measurements:
      measurementItems.length > 0
        ? measurementItems
        : [
            {
              label: "Fit note",
              value: "Use the chart below as the first reference.",
            },
            {
              label: "If unsure",
              value: "Choose the larger size and contact support.",
            },
          ],
    chartRows:
      chartRows.length > 0
        ? chartRows
        : [
            {
              size: "See guide",
              footLength: "Ask support",
              notes: "Chart data is being prepared.",
            },
          ],
  };
}

function buildGuides(guides: PublishedSizeGuide[]): GuideViewModel[] {
  if (!guides.length) return FALLBACK_GUIDES;

  return guides.map(normalizeGuide);
}

export default async function SizingGuidePage() {
  const guides = buildGuides(await getPublishedSizeGuides(6));

  return (
    <>
      <style>{`
        :root {
          --sg-ink: #0A0704;
          --sg-panel: #15100B;
          --sg-card: #1C150F;
          --sg-cream: #F2E8D5;
          --sg-sand: #C9B99A;
          --sg-muted: #6A5A48;
          --sg-ember: #BF5A28;
          --sg-gold: #C0892A;
          --sg-border: rgba(242,232,213,0.11);
          --sg-border-strong: rgba(242,232,213,0.2);
        }

        .sg-root {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(191,90,40,0.16), transparent 24%),
            radial-gradient(circle at top right, rgba(192,137,42,0.1), transparent 26%),
            var(--sg-ink);
          color: var(--sg-cream);
          font-family: var(--font-dm-sans), sans-serif;
        }

        .sg-wrap {
          max-width: 1240px;
          margin: 0 auto;
          padding: 28px clamp(16px, 3vw, 40px) 56px;
        }

        .sg-topline {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--sg-muted);
          margin-bottom: 20px;
        }

        .sg-topline a {
          color: inherit;
          text-decoration: none;
        }

        .sg-hero {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
          padding: 28px 0 34px;
          border-top: 1px solid var(--sg-border);
          border-bottom: 1px solid var(--sg-border);
        }

        .sg-label {
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--sg-ember);
          font-weight: 600;
        }

        .sg-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: clamp(42px, 7vw, 82px);
          line-height: 0.94;
          font-weight: 500;
          max-width: 10ch;
          margin-top: 12px;
        }

        .sg-copy {
          margin-top: 18px;
          font-size: 0.94rem;
          line-height: 1.8;
          max-width: 62ch;
          color: var(--sg-sand);
        }

        .sg-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 26px;
        }

        .sg-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 18px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 0.68rem;
          font-weight: 600;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .sg-btn:hover {
          transform: translateY(-1px);
        }

        .sg-btn-primary {
          background: var(--sg-cream);
          color: var(--sg-ink);
          border: 1px solid var(--sg-cream);
        }

        .sg-btn-secondary {
          background: transparent;
          color: var(--sg-cream);
          border: 1px solid var(--sg-border-strong);
        }

        .sg-side {
          align-self: end;
          border: 1px solid var(--sg-border);
          background: linear-gradient(180deg, rgba(242,232,213,0.04), rgba(242,232,213,0.01));
          padding: 18px;
        }

        .sg-side-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .sg-stat {
          padding: 14px;
          border: 1px solid var(--sg-border);
          background: rgba(0,0,0,0.12);
        }

        .sg-stat-value {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 1.4rem;
          line-height: 1;
          margin-top: 10px;
        }

        .sg-section {
          padding: 28px 0;
          border-bottom: 1px solid var(--sg-border);
        }

        .sg-section-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: end;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .sg-section-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1;
          font-weight: 500;
        }

        .sg-section-note {
          max-width: 54ch;
          color: var(--sg-muted);
          font-size: 0.84rem;
          line-height: 1.7;
        }

        .sg-grid {
          display: grid;
          gap: 16px;
        }

        .sg-grid-guides {
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }

        .sg-card {
          border: 1px solid var(--sg-border);
          background: var(--sg-panel);
          padding: 18px;
        }

        .sg-card-title {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--sg-ember);
          font-weight: 600;
        }

        .sg-card-headline {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 1.7rem;
          margin-top: 10px;
          line-height: 1.05;
        }

        .sg-card-copy {
          margin-top: 10px;
          color: var(--sg-sand);
          line-height: 1.7;
          font-size: 0.9rem;
        }

        .sg-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
          font-size: 0.9rem;
        }

        .sg-table th,
        .sg-table td {
          padding: 12px 10px;
          border-top: 1px solid var(--sg-border);
          text-align: left;
          vertical-align: top;
        }

        .sg-table th {
          font-size: 0.66rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--sg-muted);
          font-weight: 600;
        }

        .sg-steps {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .sg-step {
          border: 1px solid var(--sg-border);
          background: rgba(242,232,213,0.02);
          padding: 18px;
          min-height: 210px;
        }

        .sg-step-num {
          font-family: var(--font-bebas-neue), sans-serif;
          font-size: 3rem;
          line-height: 1;
          color: rgba(242,232,213,0.12);
        }

        .sg-step-title {
          margin-top: 12px;
          font-size: 0.86rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .sg-step-copy {
          margin-top: 10px;
          color: var(--sg-sand);
          line-height: 1.75;
          font-size: 0.9rem;
        }

        .sg-faq {
          display: grid;
          gap: 12px;
        }

        .sg-faq-item {
          border: 1px solid var(--sg-border);
          background: rgba(242,232,213,0.02);
          padding: 16px 18px;
        }

        .sg-faq-q {
          font-weight: 600;
          margin-bottom: 8px;
        }

        .sg-faq-a {
          color: var(--sg-sand);
          line-height: 1.75;
          font-size: 0.9rem;
        }

        .sg-footer-cta {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
          padding: 22px 0 0;
        }

        @media (max-width: 900px) {
          .sg-hero,
          .sg-steps {
            grid-template-columns: 1fr;
          }

          .sg-side-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .sg-wrap {
            padding-inline: 16px;
          }

          .sg-side-grid {
            grid-template-columns: 1fr;
          }

          .sg-table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
          }
        }
      `}</style>

      <div className="sg-root">
        <div className="sg-wrap">
          <div className="sg-topline">
            <Link href="/">D'FOOTPRINT</Link>
            <span>Fit reference</span>
          </div>

          <section className="sg-hero">
            <div>
              <p className="sg-label">Sizing guide</p>
              <h1 className="sg-title">Find the right fit before you order.</h1>
              <p className="sg-copy">
                Use these charts to check the closest size for your foot length,
                compare product-specific guidance, and reduce back-and-forth
                when choosing a pair.
              </p>
              <div className="sg-actions">
                <Link className="sg-btn sg-btn-primary" href="/contact">
                  Ask for help
                </Link>
                <Link className="sg-btn sg-btn-secondary" href="/custom-orders">
                  Custom sizing
                </Link>
              </div>
            </div>

            <aside className="sg-side">
              <div className="sg-side-grid">
                <div className="sg-stat">
                  <p className="sg-label">Primary rule</p>
                  <p className="sg-stat-value">Measure heel to toe</p>
                </div>
                <div className="sg-stat">
                  <p className="sg-label">If unsure</p>
                  <p className="sg-stat-value">Choose the larger size</p>
                </div>
                <div className="sg-stat">
                  <p className="sg-label">Best for</p>
                  <p className="sg-stat-value">Slides, sandals, slippers</p>
                </div>
                <div className="sg-stat">
                  <p className="sg-label">Support</p>
                  <p className="sg-stat-value">Sizing help within 1 day</p>
                </div>
              </div>
            </aside>
          </section>

          <section className="sg-section">
            <div className="sg-section-head">
              <div>
                <p className="sg-label">Product charts</p>
                <h2 className="sg-section-title">Charts by product type</h2>
              </div>
              <p className="sg-section-note">
                Product size charts are kept up to date so you can compare fits
                with confidence as more styles are added.
              </p>
            </div>

            <div className="sg-grid sg-grid-guides">
              {guides.map((guide) => (
                <article key={guide.id} className="sg-card">
                  <p className="sg-card-title">{guide.productType}</p>
                  <h3 className="sg-card-headline">{guide.title}</h3>
                  <p className="sg-card-copy">{guide.summary}</p>

                  <table
                    className="sg-table"
                    aria-label={`${guide.title} size chart`}
                  >
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Foot length</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guide.chartRows.map((row) => (
                        <tr
                          key={`${guide.id}-${row.size}-${row.footLength || row.notes || "row"}`}
                        >
                          <td>{row.size}</td>
                          <td>{row.footLength || "—"}</td>
                          <td>{row.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: 16 }}>
                    {guide.measurements.map((item) => (
                      <div
                        key={`${guide.id}-${item.label}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 14,
                          borderTop: "1px solid var(--sg-border)",
                          paddingTop: 10,
                          marginTop: 10,
                        }}
                      >
                        <span
                          className="sg-label"
                          style={{ color: "var(--sg-muted)" }}
                        >
                          {item.label}
                        </span>
                        <span
                          style={{
                            color: "var(--sg-cream)",
                            textAlign: "right",
                          }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="sg-section">
            <div className="sg-section-head">
              <div>
                <p className="sg-label">How to measure</p>
                <h2 className="sg-section-title">A simple measurement flow</h2>
              </div>
              <p className="sg-section-note">
                Keep this close to the chart so customers can check their size
                in a few seconds instead of guessing.
              </p>
            </div>

            <div className="sg-steps">
              {[
                {
                  num: "01",
                  title: "Stand on paper",
                  body: "Place your foot on a flat sheet of paper, weight evenly distributed, and keep the pencil straight when tracing the outline.",
                },
                {
                  num: "02",
                  title: "Measure heel to toe",
                  body: "Use a ruler to record the longest point from heel to toe in centimeters. Repeat for both feet and use the larger value.",
                },
                {
                  num: "03",
                  title: "Match the chart",
                  body: "Compare your number with the product chart above. If you are between two sizes, choose the larger one for comfort.",
                },
              ].map((step) => (
                <article key={step.num} className="sg-step">
                  <div className="sg-step-num">{step.num}</div>
                  <h3 className="sg-step-title">{step.title}</h3>
                  <p className="sg-step-copy">{step.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="sg-section">
            <div className="sg-section-head">
              <div>
                <p className="sg-label">Fit notes</p>
                <h2 className="sg-section-title">
                  Things to know before ordering
                </h2>
              </div>
            </div>

            <div className="sg-faq">
              {[
                {
                  q: "What if my foot is wider than average?",
                  a: "Choose the next size up, especially for structured pairs. A small amount of room is better than a tight fit.",
                },
                {
                  q: "Do you size differently for custom orders?",
                  a: "Yes. Custom orders can follow your exact foot measurement, which is why the custom-sizing path is the safest route for unusual fit needs.",
                },
                {
                  q: "Can I get help before placing an order?",
                  a: "Yes. Send your measurements through the contact page and we can confirm the best option before you buy.",
                },
              ].map((item) => (
                <article key={item.q} className="sg-faq-item">
                  <p className="sg-faq-q">{item.q}</p>
                  <p className="sg-faq-a">{item.a}</p>
                </article>
              ))}
            </div>

            <div className="sg-footer-cta">
              <p className="sg-section-note" style={{ margin: 0 }}>
                If the chart still feels uncertain, we’d rather help you size it
                correctly than have you guess.
              </p>
              <Link className="sg-btn sg-btn-primary" href="/contact">
                Contact support
              </Link>
            </div>
          </section>

          <Footer />
        </div>
      </div>
    </>
  );
}
