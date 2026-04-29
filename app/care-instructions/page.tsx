import Footer from "components/layout/footer";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Care Instructions · ${siteName}`,
  description:
    "Learn how to clean, maintain, and preserve your D'FOOTPRINT handmade footwear for years of wear.",
  alternates: { canonical: canonicalUrl("/care-instructions") },
  openGraph: {
    title: `Care Instructions | ${siteName}`,
    description:
      "Learn how to clean, maintain, and preserve your D'FOOTPRINT handmade footwear for years of wear.",
    url: canonicalUrl("/care-instructions"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Care Instructions | ${siteName}`,
    description:
      "Learn how to clean, maintain, and preserve your D'FOOTPRINT handmade footwear for years of wear.",
    images: ["/opengraph-image"],
  },
};

export default async function CareInstructionsPage() {
  return (
    <>
      <style>{`
        :root {
          --ci-ink: #0A0704;
          --ci-panel: #15100B;
          --ci-card: #1C150F;
          --ci-cream: #F2E8D5;
          --ci-sand: #C9B99A;
          --ci-muted: #6A5A48;
          --ci-ember: #BF5A28;
          --ci-gold: #C0892A;
          --ci-border: rgba(242,232,213,0.11);
          --ci-border-strong: rgba(242,232,213,0.2);
          --ci-accent: rgba(191,90,40,0.06);
        }

        .ci-root {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(191,90,40,0.14), transparent 28%),
            radial-gradient(circle at bottom right, rgba(192,137,42,0.08), transparent 32%),
            var(--ci-ink);
          color: var(--ci-cream);
          font-family: var(--font-dm-sans), sans-serif;
        }

        .ci-wrap {
          max-width: 1240px;
          margin: 0 auto;
          padding: 28px clamp(16px, 3vw, 40px) 56px;
        }

        .ci-topline {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ci-muted);
          margin-bottom: 20px;
        }

        .ci-topline a {
          color: inherit;
          text-decoration: none;
        }

        .ci-label {
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--ci-ember);
          font-weight: 600;
        }

        .ci-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: clamp(42px, 7vw, 82px);
          line-height: 0.94;
          font-weight: 500;
          max-width: 12ch;
          margin-top: 12px;
        }

        .ci-hero {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
          padding: 28px 0 34px;
          border-top: 1px solid var(--ci-border);
          border-bottom: 1px solid var(--ci-border);
        }

        .ci-copy {
          margin-top: 18px;
          font-size: 0.94rem;
          line-height: 1.8;
          max-width: 62ch;
          color: var(--ci-sand);
        }

        .ci-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 26px;
        }

        .ci-btn {
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

        .ci-btn:hover {
          transform: translateY(-1px);
        }

        .ci-btn-primary {
          background: var(--ci-cream);
          color: var(--ci-ink);
          border: 1px solid var(--ci-cream);
        }

        .ci-side {
          align-self: end;
          border: 1px solid var(--ci-border);
          background: linear-gradient(180deg, rgba(242,232,213,0.04), rgba(242,232,213,0.01));
          padding: 18px;
        }

        .ci-side-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .ci-stat {
          padding: 14px;
          border: 1px solid var(--ci-border);
          background: rgba(0,0,0,0.12);
        }

        .ci-stat-value {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 1.4rem;
          line-height: 1;
          margin-top: 10px;
        }

        .ci-section {
          padding: 28px 0;
          border-bottom: 1px solid var(--ci-border);
        }

        .ci-section-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: end;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .ci-section-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1;
          font-weight: 500;
        }

        .ci-section-note {
          max-width: 54ch;
          color: var(--ci-muted);
          font-size: 0.84rem;
          line-height: 1.7;
        }

        .ci-grid {
          display: grid;
          gap: 16px;
        }

        .ci-grid-materials {
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }

        .ci-card {
          border: 1px solid var(--ci-border);
          background: var(--ci-panel);
          padding: 20px;
        }

        .ci-card-title {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--ci-ember);
          font-weight: 600;
        }

        .ci-card-headline {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 1.7rem;
          margin-top: 10px;
          line-height: 1.05;
        }

        .ci-card-copy {
          margin-top: 14px;
          color: var(--ci-sand);
          line-height: 1.7;
          font-size: 0.9rem;
        }

        .ci-steps {
          display: grid;
          grid-auto-rows: auto;
          gap: 14px;
          margin-top: 14px;
        }

        .ci-step-item {
          display: grid;
          grid-template-columns: 20px 1fr;
          gap: 12px;
          padding: 10px 0;
          font-size: 0.9rem;
          line-height: 1.7;
          color: var(--ci-sand);
          border-top: 1px solid var(--ci-border);
        }

        .ci-step-item:first-child {
          border-top: none;
          padding-top: 0;
        }

        .ci-step-num {
          font-weight: 600;
          color: var(--ci-ember);
        }

        .ci-dos-donts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
        }

        .ci-dos,
        .ci-donts {
          border: 1px solid var(--ci-border);
          padding: 16px;
          background: rgba(0,0,0,0.08);
        }

        .ci-dos-title,
        .ci-donts-title {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .ci-dos-title {
          color: var(--ci-gold);
        }

        .ci-donts-title {
          color: var(--ci-ember);
        }

        .ci-list {
          display: grid;
          gap: 8px;
        }

        .ci-list-item {
          display: flex;
          gap: 8px;
          font-size: 0.9rem;
          line-height: 1.6;
          color: var(--ci-sand);
        }

        .ci-list-check {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }

        .ci-faq {
          display: grid;
          gap: 12px;
        }

        .ci-faq-item {
          border: 1px solid var(--ci-border);
          background: rgba(242,232,213,0.02);
          padding: 16px 18px;
        }

        .ci-faq-q {
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--ci-cream);
        }

        .ci-faq-a {
          color: var(--ci-sand);
          line-height: 1.75;
          font-size: 0.9rem;
        }

        .ci-footer-cta {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
          padding: 22px 0 0;
        }

        @media (max-width: 900px) {
          .ci-hero {
            grid-template-columns: 1fr;
          }

          .ci-side-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ci-dos-donts {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .ci-wrap {
            padding-inline: 16px;
          }

          .ci-side-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="ci-root">
        <div className="ci-wrap">
          <div className="ci-topline">
            <Link href="/">D'FOOTPRINT</Link>
            <span>Care guide</span>
          </div>

          <section className="ci-hero">
            <div>
              <p className="ci-label">Care instructions</p>
              <h1 className="ci-title">Keep your pair in perfect condition.</h1>
              <p className="ci-copy">
                Handmade footwear improves with age. Learn how to clean,
                protect, and store your D'FOOTPRINT so it lasts for years of
                everyday wear.
              </p>
              <div className="ci-actions">
                <Link className="ci-btn ci-btn-primary" href="/contact">
                  Ask for advice
                </Link>
              </div>
            </div>

            <aside className="ci-side">
              <div className="ci-side-grid">
                <div className="ci-stat">
                  <p className="ci-label">Golden rule</p>
                  <p className="ci-stat-value">Clean within hours</p>
                </div>
                <div className="ci-stat">
                  <p className="ci-label">Storage</p>
                  <p className="ci-stat-value">Cool &amp; dry place</p>
                </div>
                <div className="ci-stat">
                  <p className="ci-label">Conditioning</p>
                  <p className="ci-stat-value">Every 3–6 months</p>
                </div>
                <div className="ci-stat">
                  <p className="ci-label">Lifespan</p>
                  <p className="ci-stat-value">5+ years with care</p>
                </div>
              </div>
            </aside>
          </section>

          <section className="ci-section">
            <div className="ci-section-head">
              <div>
                <p className="ci-label">By material</p>
                <h2 className="ci-section-title">
                  Cleaning guides for each material
                </h2>
              </div>
              <p className="ci-section-note">
                Each material responds differently to moisture, oils, and light.
                Follow the guide for your pair to keep it looking and feeling
                fresh.
              </p>
            </div>

            <div className="ci-grid ci-grid-materials">
              {[
                {
                  material: "Full-grain leather",
                  description:
                    "Premium durable leather that develops a natural patina over time.",
                  steps: [
                    "Brush off dirt with a soft, dry cloth or soft-bristled brush after each wear.",
                    "For stains, mix equal parts white vinegar and water; dab gently with a clean cloth.",
                    "Let air-dry completely away from direct heat or sunlight.",
                    "Every 2–3 months, condition with leather conditioner to prevent cracking.",
                  ],
                },
                {
                  material: "Suede",
                  description:
                    "Soft, delicate finish that requires gentle care and protection.",
                  steps: [
                    "Brush with a dedicated suede brush to restore the nap (direction of the fibers).",
                    "For fresh stains, use a suede eraser or a pencil eraser gently.",
                    "For wet stains, let dry fully, then brush. Never rub while wet.",
                    "Apply suede protector spray every 6 months to repel water and dirt.",
                  ],
                },
                {
                  material: "Fabric &amp; textiles",
                  description:
                    "Ankara, adire, linen, and other woven fabrics used in custom pairs.",
                  steps: [
                    "Vacuum or brush gently to remove dust and loose dirt.",
                    "For stains, blot (don't rub) with a damp cloth and mild soap solution.",
                    "Rinse with distilled water on a cloth; press gently to remove excess moisture.",
                    "Air-dry completely away from heat. Steam or iron on low if needed after drying.",
                  ],
                },
                {
                  material: "Patent leather",
                  description:
                    "Glossy, waterproof finish that demands minimal care but shines with attention.",
                  steps: [
                    "Wipe with a soft, damp cloth immediately after wear to remove dust.",
                    "For shine, use a microfiber cloth or dedicated patent leather cleaner.",
                    "Avoid abrasive materials; they dull the finish quickly.",
                    "Store in a cool place; excessive heat can warp or crack the coating.",
                  ],
                },
              ].map((guide) => (
                <article key={guide.material} className="ci-card">
                  <p className="ci-card-title">{guide.material}</p>
                  <h3 className="ci-card-headline">{guide.material}</h3>
                  <p className="ci-card-copy">{guide.description}</p>
                  <div className="ci-steps">
                    {guide.steps.map((step, idx) => (
                      <div
                        key={`${guide.material}-${idx}`}
                        className="ci-step-item"
                      >
                        <div className="ci-step-num">{idx + 1}</div>
                        <div>{step}</div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ci-section">
            <div className="ci-section-head">
              <div>
                <p className="ci-label">Storage &amp; preservation</p>
                <h2 className="ci-section-title">
                  Long-term care between wears
                </h2>
              </div>
            </div>

            <div className="ci-grid">
              {[
                {
                  title: "Daily storage",
                  items: [
                    "Store in a cool, dry place away from direct sunlight.",
                    "Use shoe trees or stuff with tissue paper to maintain shape.",
                    "Keep in a dust bag or open container; plastic traps moisture.",
                    "Rotate between pairs to let each rest and breathe.",
                  ],
                },
                {
                  title: "Seasonal storage",
                  items: [
                    "Before long storage, clean and condition leather thoroughly.",
                    "Ensure fully dry before packing; trapped moisture causes mold.",
                    "Wrap in acid-free tissue paper, not newspaper (ink transfers).",
                    "Store at 60–75°F and 30–50% humidity for best preservation.",
                  ],
                },
                {
                  title: "Environment matters",
                  items: [
                    "Sunlight fades and cracks leather; keep pairs in shade.",
                    "High heat warps soles and degrades adhesives; avoid near radiators.",
                    "Humidity above 60% encourages mold; use desiccant packs if needed.",
                    "Temperature swings cause material expansion and contraction; keep stable.",
                  ],
                },
                {
                  title: "Travel care",
                  items: [
                    "Pack in a soft dust bag to avoid scuffs during transport.",
                    "Stuff with socks or tissue to retain shape while in luggage.",
                    "Bring a microfiber cloth for quick cleanups away from home.",
                    "Upon return, let air out and clean before storing again.",
                  ],
                },
              ].map((section) => (
                <div key={section.title} className="ci-card">
                  <h3 className="ci-card-headline">{section.title}</h3>
                  <ul className="ci-list">
                    {section.items.map((item) => (
                      <li key={item} className="ci-list-item">
                        <span className="ci-list-check">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="ci-section">
            <div className="ci-section-head">
              <div>
                <p className="ci-label">Best practices</p>
                <h2 className="ci-section-title">
                  Do's and don'ts by material
                </h2>
              </div>
            </div>

            <div className="ci-grid">
              {[
                {
                  material: "Leather",
                  dos: [
                    "Clean spills immediately with a soft cloth.",
                    "Use leather-specific conditioners and protectors.",
                    "Allow leather to breathe; avoid plastic bags.",
                    "Embrace the patina; it tells your story.",
                  ],
                  donts: [
                    "Don't soak leather or submerge in water.",
                    "Don't use harsh chemicals, bleach, or acetone.",
                    "Don't dry near heat sources; let air dry.",
                    "Don't apply conditioner too frequently (every 3–6 months is enough).",
                  ],
                },
                {
                  material: "Suede",
                  dos: [
                    "Use a suede brush in one direction to restore texture.",
                    "Apply suede protector spray regularly.",
                    "Blot wet stains with a soft cloth.",
                    "Use specialized suede erasers for marks.",
                  ],
                  donts: [
                    "Don't use water-based cleaners on suede.",
                    "Don't rub or scrub; suede is delicate.",
                    "Don't use a regular stiff brush.",
                    "Don't expose to rain without protective spray.",
                  ],
                },
                {
                  material: "Fabric &amp; Textile",
                  dos: [
                    "Vacuum gently or brush away dust regularly.",
                    "Blot liquid spills immediately.",
                    "Use mild soap and cool water for stains.",
                    "Air-dry completely before wearing again.",
                  ],
                  donts: [
                    "Don't rub or scrub fabric; you'll spread the stain.",
                    "Don't use bleach or strong detergents.",
                    "Don't machine wash or dry clean without checking care label.",
                    "Don't expose damp fabric to heat.",
                  ],
                },
              ].map((section) => (
                <div key={section.material} className="ci-card">
                  <h3 className="ci-card-headline">{section.material}</h3>
                  <div className="ci-dos-donts">
                    <div className="ci-dos">
                      <p className="ci-dos-title">✓ Do</p>
                      <ul className="ci-list">
                        {section.dos.map((item) => (
                          <li key={item} className="ci-list-item">
                            <span className="ci-list-check">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="ci-donts">
                      <p className="ci-donts-title">✗ Don't</p>
                      <ul className="ci-list">
                        {section.donts.map((item) => (
                          <li key={item} className="ci-list-item">
                            <span className="ci-list-check">✗</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ci-section">
            <div className="ci-section-head">
              <div>
                <p className="ci-label">Product-specific</p>
                <h2 className="ci-section-title">Care for different styles</h2>
              </div>
            </div>

            <div className="ci-faq">
              {[
                {
                  q: "Should I clean my slides differently than closed footwear?",
                  a: "Slides dry faster and accumulate less dirt inside, so weekly brushing is often enough. Closed styles need more attention to insoles; let them air out after each wear.",
                },
                {
                  q: "How do I care for custom-order pieces with mixed materials?",
                  a: "Treat each section according to its material. If your pair has leather and fabric, condition the leather separately and brush the fabric gently.",
                },
                {
                  q: "Can I wear my D'FOOTPRINT in the rain?",
                  a: "Leather and suede pairs should have protective spray applied before exposure. Fabric pairs with protective coating can handle light rain, but avoid puddles. Always dry thoroughly afterward.",
                },
                {
                  q: "What should I do if my pair gets wet?",
                  a: "Remove insoles and stuff with newspaper; change it every few hours. Let air-dry at room temperature away from heat. Never use a hairdryer or heater.",
                },
                {
                  q: "How often should I condition my leather pair?",
                  a: "Every 3–6 months with regular wear, or every 2–3 months if worn frequently. Conditioning prevents cracking and maintains suppleness.",
                },
                {
                  q: "My suede has lost its softness. Can I revive it?",
                  a: "Yes. Use a suede brush to restore the nap, then apply a suede protector. If that doesn't work, contact us—we can refresh the finish.",
                },
              ].map((item) => (
                <article key={item.q} className="ci-faq-item">
                  <p className="ci-faq-q">{item.q}</p>
                  <p className="ci-faq-a">{item.a}</p>
                </article>
              ))}
            </div>

            <div className="ci-footer-cta">
              <p className="ci-section-note" style={{ margin: 0 }}>
                Still have questions about care? Our team is happy to help you
                get the most out of your pair.
              </p>
              <Link className="ci-btn ci-btn-primary" href="/contact">
                Get in touch
              </Link>
            </div>
          </section>

          <Footer />
        </div>
      </div>
    </>
  );
}
