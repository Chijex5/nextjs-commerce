// app/auth/layout.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

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

        @keyframes dp-rise {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .dp-rise-1 { animation:dp-rise 1s cubic-bezier(.16,1,.3,1) .05s both; }
        .dp-rise-2 { animation:dp-rise 1s cubic-bezier(.16,1,.3,1) .2s both; }
        .dp-rise-3 { animation:dp-rise 1s cubic-bezier(.16,1,.3,1) .35s both; }

        .dp-wordmark { font-family:'Bebas Neue',sans-serif; }
        .dp-serif    { font-family:'Cormorant Garamond',serif; }
        .dp-sans     { font-family:'DM Sans',sans-serif; }
        .dp-label    { font-family:'DM Sans',sans-serif;font-size:.62rem;font-weight:500;letter-spacing:.26em;text-transform:uppercase;color:var(--dp-ember); }

        .dp-grain::after {
          content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        }

        .auth-top-link {
          color: var(--dp-muted);
          text-decoration: none;
          transition: color .2s;
        }

        .auth-top-link:hover {
          color: var(--dp-cream);
        }
      `}</style>

      <div
        className="dp-sans dp-grain"
        style={{
          minHeight: "100vh",
          background: "var(--dp-ink)",
          color: "var(--dp-cream)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Atmospheric glows */}
        <div
          aria-hidden
          style={{
            position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
            background: "radial-gradient(ellipse 60% 50% at 15% 20%, rgba(191,90,40,0.13) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 85% 80%, rgba(192,137,42,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Top nav bar */}
        <header
          className="dp-rise-1"
          style={{
            position: "relative", zIndex: 10,
            padding: "1.5rem clamp(1.5rem,4vw,4rem)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid var(--dp-border)",
          }}
        >
          <Link
            href="/"
            className="dp-wordmark"
            style={{ fontSize: "1.6rem", letterSpacing: "0.02em", color: "var(--dp-cream)", textDecoration: "none" }}
          >
            D&apos;FOOTPRINT
          </Link>
          <Link
            href="/products"
            className="auth-top-link"
            style={{
              fontFamily: "DM Sans, sans-serif", fontSize: ".68rem", fontWeight: 500,
              letterSpacing: ".14em", textTransform: "uppercase",
            }}
          >
            Continue shopping →
          </Link>
        </header>

        {/* Main content */}
        <main
          style={{
            flex: 1, position: "relative", zIndex: 10,
            display: "grid", placeItems: "start center",
            padding: "3rem clamp(1.5rem,4vw,4rem) 5rem",
          }}
        >
          <div
            style={{
              width: "100%", maxWidth: 1100,
              display: "grid", gap: "3rem",
              gridTemplateColumns: "1fr",
            }}
            className="lg:grid-cols-[1fr_420px] lg:items-start"
          >
            {/* Left: brand copy */}
            <div className="dp-rise-2" style={{ paddingTop: ".5rem" }}>
              <p className="dp-label" style={{ marginBottom: "1.25rem" }}>Your Account</p>

              <h1
                className="dp-wordmark"
                style={{
                  fontSize: "clamp(3.5rem,9vw,8rem)",
                  lineHeight: .88,
                  letterSpacing: "-.01em",
                  marginBottom: "2rem",
                }}
              >
                <span style={{ color: "var(--dp-cream)", display: "block" }}>SIGN</span>
                <span
                  style={{
                    WebkitTextStroke: "1.5px rgba(242,232,213,0.22)",
                    color: "transparent",
                    display: "block",
                  }}
                >
                  IN
                </span>
              </h1>

              <p
                className="dp-serif"
                style={{
                  fontSize: "clamp(1.1rem,2vw,1.5rem)",
                  fontWeight: 300,
                  fontStyle: "italic",
                  color: "var(--dp-sand)",
                  lineHeight: 1.55,
                  maxWidth: 420,
                  marginBottom: "2.5rem",
                }}
              >
                Manage your orders, saved addresses, and custom requests — all in one place.
              </p>

              {/* Feature list */}
              <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                {[
                  { icon: "✦", text: "Track every order in real time" },
                  { icon: "◈", text: "Save delivery addresses for faster checkout" },
                  { icon: "⟡", text: "Manage your custom order requests" },
                  { icon: "⊛", text: "Secure across all your devices" },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                    <span style={{ color: "var(--dp-ember)", fontSize: ".9rem", flexShrink: 0 }}>{icon}</span>
                    <p style={{ fontSize: ".78rem", color: "var(--dp-muted)", fontFamily: "DM Sans, sans-serif" }}>{text}</p>
                  </div>
                ))}
              </div>

              {/* Decorative wordmark */}
              <div
                aria-hidden
                className="dp-wordmark"
                style={{
                  marginTop: "3rem",
                  fontSize: "clamp(3rem,8vw,7rem)",
                  color: "rgba(242,232,213,0.03)",
                  lineHeight: 1,
                  userSelect: "none",
                  letterSpacing: ".02em",
                }}
              >
                D&apos;FOOTPRINT
              </div>
            </div>

            {/* Right: auth form slot */}
            <div className="dp-rise-3">{children}</div>
          </div>
        </main>
      </div>
    </>
  );
}