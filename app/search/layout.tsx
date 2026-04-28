import Footer from "components/layout/footer";
import { Suspense } from "react";
import ChildrenWrapper from "./children-wrapper";

export default async function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`

        :root {
          --dp-ink:     #0A0704;
          --dp-charcoal:#191209;
          --dp-card:    #1E1510;
          --dp-cream:   #F2E8D5;
          --dp-sand:    #C9B99A;
          --dp-muted:   #6A5A48;
          --dp-ember:   #BF5A28;
          --dp-gold:    #C0892A;
          --dp-border:  rgba(242,232,213,0.09);
        }

        .dp-wordmark { font-family:'Bebas Neue',sans-serif; }
        .dp-serif    { font-family:'Cormorant Garamond',serif; }
        .dp-sans     { font-family:'DM Sans',sans-serif; }
        .dp-label    { font-family:'DM Sans',sans-serif;font-size:.62rem;font-weight:500;letter-spacing:.26em;text-transform:uppercase;color:var(--dp-ember); }

        .dp-grain::after {
          content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        }
      `}</style>

      <div
        className="dp-sans dp-grain"
        style={{
          minHeight: "100vh",
          background: "var(--dp-ink)",
          color: "var(--dp-cream)",
          position: "relative",
        }}
      >
        {/* Atmospheric glow */}
        <div
          aria-hidden
          style={{
            position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
            background: "radial-gradient(ellipse 45% 40% at 70% 10%, rgba(191,90,40,0.1) 0%, transparent 70%)",
          }}
        />

        <main
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: 1800,
            margin: "0 auto",
            padding: "3.5rem clamp(1.5rem,4vw,4rem) 5rem",
          }}
        >
          <Suspense fallback={null}>
            <ChildrenWrapper>{children}</ChildrenWrapper>
          </Suspense>
        </main>

        <Footer />
      </div>
    </>
  );
}