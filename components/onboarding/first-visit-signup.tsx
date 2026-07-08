"use client";

import { useUserSession } from "hooks/useUserSession";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const COOKIE_NAME = "first_visit_signup_shown";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const WELCOME_GIFT_COOKIE = "welcome_gift_signup";
const WELCOME_GIFT_MAX_AGE = 60 * 60 * 24;

// Engagement thresholds before we ever consider showing the invite.
const MIN_TIME_MS = 25_000; // 25s on page
const MIN_SCROLL = 0.4; // 40% down the page
const EXIT_INTENT_GRACE_MS = 6_000; // ignore accidental cursor flicks early on

// Routes where an invite would interrupt a deliberate task.
const EXCLUDED_PREFIXES = ["/auth", "/checkout", "/admin", "/account"];

function isExcludedPath(pathname: string | null) {
  if (!pathname) return false;
  return EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasSeenPopup() {
  if (typeof document === "undefined") return true;
  return document.cookie.includes(`${COOKIE_NAME}=true`);
}

function markPopupSeen() {
  document.cookie = `${COOKIE_NAME}=true; max-age=${COOKIE_MAX_AGE}; path=/`;
}

function markWelcomeGiftEligible() {
  document.cookie = `${WELCOME_GIFT_COOKIE}=true; max-age=${WELCOME_GIFT_MAX_AGE}; path=/`;
}

export default function FirstVisitSignupPopup() {
  const { status } = useUserSession();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // ── Intent-based trigger ──────────────────────────────────────────────
  // Desktop: exit-intent (cursor leaves toward the top of the viewport).
  // Everywhere (incl. mobile where mouseleave never fires): a soft
  // engagement signal — enough time on page AND enough scroll depth.
  useEffect(() => {
    if (status !== "unauthenticated") return;
    if (isExcludedPath(pathname)) return;
    if (hasSeenPopup()) return;

    let triggered = false;
    const armedAt = Date.now();

    const open = () => {
      if (triggered) return;
      triggered = true;
      markPopupSeen(); // dismiss or convert — either way, never nag again
      setIsOpen(true);
      cleanup();
    };

    const scrollProgress = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return 1; // short pages count as "read"
      return (window.scrollY || doc.scrollTop || 0) / scrollable;
    };

    const evaluateEngagement = () => {
      if (
        Date.now() - armedAt >= MIN_TIME_MS &&
        scrollProgress() >= MIN_SCROLL
      ) {
        open();
      }
    };

    const handleExitIntent = (event: MouseEvent) => {
      if (Date.now() - armedAt < EXIT_INTENT_GRACE_MS) return;
      // relatedTarget null + cursor at/above the top edge = leaving upward
      if (event.clientY <= 0) open();
    };

    const supportsHover =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover)").matches;

    window.addEventListener("scroll", evaluateEngagement, { passive: true });
    const intervalId = window.setInterval(evaluateEngagement, 5_000);
    if (supportsHover) {
      document.addEventListener("mouseleave", handleExitIntent);
    }

    function cleanup() {
      window.removeEventListener("scroll", evaluateEngagement);
      window.clearInterval(intervalId);
      document.removeEventListener("mouseleave", handleExitIntent);
    }

    return cleanup;
  }, [status, pathname]);

  // ── Escape to close + body scroll lock + initial focus ────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the email field so keyboard users land inside the dialog.
    const focusTimer = window.setTimeout(() => emailRef.current?.focus(), 60);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [isOpen]);

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setMagicLoading(true);
    markWelcomeGiftEligible();

    try {
      const response = await fetch("/api/user-auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          callbackUrl: "/account?welcome=1",
          purpose: "signup",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send magic link");
      } else {
        toast.success(
          data.message || "Check your email to finish setting up your account.",
        );
        setSent(true);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  };

  const handlePasswordSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    markWelcomeGiftEligible();
    setLoading(true);
    try {
      const registerResponse = await fetch("/api/user-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim() || undefined,
          email: formData.email,
          password: formData.password,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        toast.error(registerData.error || "Registration failed");
        return;
      }

      const loginResponse = await fetch("/api/user-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        toast.error(loginData.error || "Login failed");
        return;
      }

      router.push("/account?welcome=1");
      router.refresh();
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const submitting = usePassword ? loading : magicLoading;

  return (
    <div
      className="dfp-invite-overlay"
      onMouseDown={(event) => {
        // click on the backdrop (not the card) dismisses
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
    >
      <style>{`
        .dfp-invite-overlay {
          --dp-ink: #0A0704;
          --dp-card: #1E1510;
          --dp-cream: #F2E8D5;
          --dp-sand: #C9B99A;
          --dp-muted: #6A5A48;
          --dp-ember: #BF5A28;
          --dp-gold: #C0892A;
          --dp-border: rgba(242,232,213,0.09);

          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0;
          background: rgba(5,3,2,0.72);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: dfp-fade .35s ease both;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
        }
        @media (min-width: 640px) {
          .dfp-invite-overlay {
            align-items: center;
            padding: 1.5rem;
          }
        }

        .dfp-invite-card {
          position: relative;
          width: 100%;
          max-width: 460px;
          max-height: 92vh;
          overflow-y: auto;
          color: var(--dp-cream);
          background:
            radial-gradient(ellipse 90% 60% at 12% -10%, rgba(191,90,40,0.18) 0%, transparent 62%),
            radial-gradient(ellipse 70% 50% at 100% 110%, rgba(192,137,42,0.12) 0%, transparent 60%),
            var(--dp-card);
          border: 1px solid var(--dp-border);
          border-top: 1px solid rgba(242,232,213,0.14);
          border-radius: 18px 18px 0 0;
          padding: 2rem 1.5rem 1.75rem;
          box-shadow: 0 -8px 60px rgba(0,0,0,0.55);
          animation: dfp-rise .45s cubic-bezier(.16,1,.3,1) both;
        }
        @media (min-width: 640px) {
          .dfp-invite-card {
            border-radius: 18px;
            padding: 2.5rem 2.25rem 2rem;
            box-shadow: 0 30px 80px rgba(0,0,0,0.6);
          }
        }

        .dfp-close {
          position: absolute;
          top: .9rem;
          right: .9rem;
          width: 2rem;
          height: 2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid var(--dp-border);
          background: rgba(10,7,4,0.4);
          color: var(--dp-sand);
          cursor: pointer;
          transition: color .2s, border-color .2s, background .2s;
        }
        .dfp-close:hover { color: var(--dp-cream); border-color: rgba(242,232,213,0.24); }
        .dfp-close:focus-visible { outline: 2px solid var(--dp-gold); outline-offset: 2px; }

        .dfp-wordmark {
          font-family: var(--font-bebas-neue), var(--font-dm-sans), sans-serif;
          font-size: 1.05rem;
          letter-spacing: .06em;
          color: var(--dp-cream);
        }
        .dfp-label {
          font-size: .6rem;
          font-weight: 600;
          letter-spacing: .26em;
          text-transform: uppercase;
          color: var(--dp-ember);
        }
        .dfp-headline {
          font-family: var(--font-cormorant-garamond), Georgia, serif;
          font-weight: 500;
          font-size: 1.85rem;
          line-height: 1.12;
          letter-spacing: -.01em;
          color: var(--dp-cream);
          margin: .6rem 0 0;
        }
        .dfp-headline em { color: var(--dp-gold); font-style: italic; }
        .dfp-sub {
          font-size: .9rem;
          line-height: 1.55;
          color: var(--dp-sand);
          margin: .7rem 0 0;
        }

        .dfp-perks {
          list-style: none;
          margin: 1.15rem 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: .6rem;
        }
        .dfp-perks li {
          display: flex;
          align-items: flex-start;
          gap: .6rem;
          font-size: .82rem;
          line-height: 1.4;
          color: var(--dp-cream);
        }
        .dfp-perks svg { flex-shrink: 0; margin-top: .05rem; color: var(--dp-ember); }

        .dfp-form { margin-top: 1.5rem; display: flex; flex-direction: column; gap: .75rem; }
        .dfp-field { display: flex; flex-direction: column; gap: .35rem; }
        .dfp-field label {
          font-size: .68rem;
          font-weight: 500;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--dp-muted);
        }
        .dfp-input {
          width: 100%;
          box-sizing: border-box;
          background: rgba(10,7,4,0.55);
          border: 1px solid var(--dp-border);
          border-radius: 10px;
          padding: .8rem .9rem;
          font-size: .95rem;
          color: var(--dp-cream);
          font-family: inherit;
          transition: border-color .2s, box-shadow .2s;
        }
        .dfp-input::placeholder { color: var(--dp-muted); }
        .dfp-input:focus {
          outline: none;
          border-color: var(--dp-gold);
          box-shadow: 0 0 0 3px rgba(192,137,42,0.16);
        }

        .dfp-primary {
          width: 100%;
          box-sizing: border-box;
          margin-top: .25rem;
          padding: .9rem 1rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          font-size: .9rem;
          font-weight: 600;
          letter-spacing: .02em;
          color: #1A0E06;
          background: linear-gradient(100deg, var(--dp-gold) 0%, var(--dp-ember) 100%);
          transition: filter .2s, transform .05s;
        }
        .dfp-primary:hover { filter: brightness(1.07); }
        .dfp-primary:active { transform: translateY(1px); }
        .dfp-primary:disabled { opacity: .6; cursor: default; }

        .dfp-ghost {
          width: 100%;
          box-sizing: border-box;
          padding: .55rem;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: .8rem;
          color: var(--dp-sand);
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color .2s;
        }
        .dfp-ghost:hover { color: var(--dp-cream); }

        .dfp-fineprint {
          margin: .3rem 0 0;
          font-size: .72rem;
          line-height: 1.45;
          color: var(--dp-muted);
          text-align: center;
        }

        .dfp-sent {
          margin-top: 1.5rem;
          padding: 1.1rem;
          border: 1px solid var(--dp-border);
          border-radius: 12px;
          background: rgba(10,7,4,0.4);
          font-size: .9rem;
          line-height: 1.55;
          color: var(--dp-sand);
        }

        .dfp-primary:focus-visible,
        .dfp-ghost:focus-visible { outline: 2px solid var(--dp-gold); outline-offset: 2px; }

        @keyframes dfp-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dfp-rise { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .dfp-invite-overlay, .dfp-invite-card { animation: none; }
        }
      `}</style>

      <div
        ref={dialogRef}
        className="dfp-invite-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dfp-invite-heading"
        aria-describedby="dfp-invite-sub"
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="dfp-close"
          aria-label="Close"
        >
          <svg
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <span className="dfp-wordmark">D&apos;FOOTPRINT</span>

        {sent ? (
          <div className="dfp-sent" role="status">
            <p style={{ margin: 0, color: "var(--dp-cream)", fontWeight: 600 }}>
              Check your inbox.
            </p>
            <p style={{ margin: ".4rem 0 0" }}>
              We&apos;ve sent a one-time link to{" "}
              <strong style={{ color: "var(--dp-cream)" }}>
                {formData.email}
              </strong>
              . Open it to finish setting up your account — your 10% welcome
              code is waiting inside.
            </p>
          </div>
        ) : (
          <>
            <p className="dfp-label" style={{ marginTop: "1.25rem" }}>
              Members get first look
            </p>
            <h2 id="dfp-invite-heading" className="dfp-headline">
              Take <em>10% off</em> your first pair.
            </h2>
            <p id="dfp-invite-sub" className="dfp-sub">
              Join D&apos;FOOTPRINT and we&apos;ll send a welcome code for your
              first order — plus a heads-up whenever a new pair drops.
            </p>

            <ul className="dfp-perks">
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                10% off your first pair, sent the moment you join
              </li>
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Be first to know when new drops land
              </li>
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Saved sizes and faster checkout next time
              </li>
            </ul>

            <form
              className="dfp-form"
              onSubmit={usePassword ? handlePasswordSignup : handleMagicLink}
            >
              {usePassword && (
                <div className="dfp-field">
                  <label htmlFor="popup-name">Full name (optional)</label>
                  <input
                    id="popup-name"
                    type="text"
                    className="dfp-input"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData({ ...formData, name: event.target.value })
                    }
                    placeholder="Jane Doe"
                  />
                </div>
              )}

              <div className="dfp-field">
                <label htmlFor="popup-email">Email</label>
                <input
                  id="popup-email"
                  ref={emailRef}
                  type="email"
                  className="dfp-input"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({ ...formData, email: event.target.value })
                  }
                  required
                  autoComplete="email"
                  placeholder="you@email.com"
                />
              </div>

              {usePassword && (
                <>
                  <div className="dfp-field">
                    <label htmlFor="popup-password">Password</label>
                    <input
                      id="popup-password"
                      type="password"
                      className="dfp-input"
                      value={formData.password}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          password: event.target.value,
                        })
                      }
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="dfp-field">
                    <label htmlFor="popup-confirm">Confirm password</label>
                    <input
                      id="popup-confirm"
                      type="password"
                      className="dfp-input"
                      value={formData.confirmPassword}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          confirmPassword: event.target.value,
                        })
                      }
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="dfp-primary"
                disabled={submitting}
              >
                {usePassword
                  ? loading
                    ? "Creating your account…"
                    : "Claim 10% & create account"
                  : magicLoading
                    ? "Sending your link…"
                    : "Email me my 10% code"}
              </button>

              {!usePassword && (
                <p className="dfp-fineprint">
                  No password needed — we&apos;ll email a one-time link to
                  finish. Your code lands right after.
                </p>
              )}

              <button
                type="button"
                className="dfp-ghost"
                onClick={() => setUsePassword((current) => !current)}
              >
                {usePassword
                  ? "Prefer a one-time email link instead?"
                  : "Rather set a password now?"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
