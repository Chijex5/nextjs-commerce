import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Manage your newsletter preferences.",
  robots: { index: false, follow: false },
};

type Status = "success" | "already" | "invalid" | "error";

const copy: Record<Status, { eyebrow: string; title: string; sub: string; cta?: string }> = {
  success: {
    eyebrow: "All done",
    title: "You've been\nunsubscribed.",
    sub: "You won't receive any more newsletter emails from us. If you ever change your mind, you're always welcome back.",
    cta: "Back to shop",
  },
  already: {
    eyebrow: "No action needed",
    title: "Already\nunsubscribed.",
    sub: "This email address is not on our active list. Nothing has changed.",
    cta: "Back to shop",
  },
  invalid: {
    eyebrow: "Invalid link",
    title: "This link has\nexpired.",
    sub: "The unsubscribe link is invalid or has already been used. If you still want to unsubscribe, reply to any of our emails and we'll sort it out immediately.",
    cta: "Contact us",
  },
  error: {
    eyebrow: "Something went wrong",
    title: "We hit a\nsnag.",
    sub: "We couldn't process your request. Please try again or contact us directly and we'll remove you manually.",
    cta: "Contact us",
  },
};

export default async function UnsubscribePage(props: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const rawStatus = searchParams?.status ?? "";
  const status: Status = (["success", "already", "invalid", "error"] as Status[]).includes(
    rawStatus as Status,
  )
    ? (rawStatus as Status)
    : "invalid";

  const c = copy[status];
  const ctaHref = c.cta === "Contact us" ? "/contact" : "/products";
  const isSuccess = status === "success" || status === "already";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        :root {
          --espresso:   #0A0704;
          --cream:      #F2E8D5;
          --sand:       #C9B99A;
          --muted:      #6A5A48;
          --terra:      #BF5A28;
          --gold:       #C0892A;
          --border:     rgba(242,232,213,0.09);
          --border-mid: rgba(242,232,213,0.18);
        }

        .us-wrap {
          min-height: 100vh;
          background: var(--espresso);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          font-family: 'DM Sans', sans-serif;
        }

        .us-card {
          width: 100%;
          max-width: 520px;
          border: 1px solid var(--border);
          background: rgba(16,12,6,0.96);
          position: relative;
          overflow: hidden;
        }
        .us-card::before {
          content: '';
          position: absolute;
          right: -50px; top: -50px;
          width: 220px; height: 220px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .us-card::after {
          content: '';
          position: absolute;
          right: 36px; top: 36px;
          width: 100px; height: 100px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }

        /* accent top line */
        .us-accent {
          height: 2px;
          background: linear-gradient(90deg, var(--terra) 0%, var(--gold) 60%, transparent 100%);
        }

        .us-body {
          padding: 44px 44px 36px;
          position: relative;
          z-index: 1;
        }

        .us-icon {
          width: 44px; height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          font-size: 18px;
        }
        .us-icon-ok  { background: rgba(191,90,40,0.12); border: 1px solid rgba(191,90,40,0.3); color: var(--terra); }
        .us-icon-err { background: rgba(192,137,42,0.08); border: 1px solid rgba(192,137,42,0.25); color: var(--gold); }

        .us-eyebrow {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--terra);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .us-eyebrow::before {
          content: '';
          display: block;
          width: 20px; height: 1px;
          background: var(--terra);
        }

        .us-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(30px, 5vw, 44px);
          font-weight: 300;
          line-height: 1.05;
          color: var(--cream);
          white-space: pre-line;
          margin-bottom: 16px;
        }

        .us-sub {
          font-size: 14px;
          line-height: 1.75;
          color: var(--muted);
          margin-bottom: 32px;
        }

        .us-footer {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 20px 44px;
          border-top: 1px solid var(--border);
          background: rgba(242,232,213,0.015);
          position: relative;
          z-index: 1;
        }

        .us-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--terra);
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 12px 22px;
          text-decoration: none;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .us-cta:hover { background: #a34d22; }

        .us-home-link {
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .us-home-link:hover { color: var(--cream); }

        @media (max-width: 480px) {
          .us-body { padding: 32px 24px 28px; }
          .us-footer { padding: 16px 24px; }
        }
      `}</style>

      <div className="us-wrap">
        <div className="us-card">
          <div className="us-accent" />

          <div className="us-body">
            <div className={`us-icon ${isSuccess ? "us-icon-ok" : "us-icon-err"}`}>
              {isSuccess ? "✓" : "!"}
            </div>

            <div className="us-eyebrow">{c.eyebrow}</div>
            <h1 className="us-title">{c.title}</h1>
            <p className="us-sub">{c.sub}</p>
          </div>

          <div className="us-footer">
            <Link href={ctaHref} className="us-cta">
              {c.cta} →
            </Link>
            {ctaHref !== "/contact" && ctaHref !== "/products" && (
              <Link href="/" className="us-home-link">
                Home
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}