"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/user-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to create account");
        return;
      }
      toast.success("Account created! Welcome to D'FOOTPRINT.");
      // Only honour same-origin relative paths to avoid an open redirect via
      // a crafted ?callbackUrl=. Reject anything protocol-relative ("//host")
      // or absolute.
      const rawCallback = searchParams.get("callbackUrl");
      const callbackUrl =
        rawCallback &&
        rawCallback.startsWith("/") &&
        !rawCallback.startsWith("//")
          ? rawCallback
          : "/account?welcome=1";
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* password strength — 3 levels */
  const pwStrength =
    password.length === 0
      ? 0
      : password.length < 8
        ? 1
        : password.length < 12
          ? 2
          : 3;

  const strengthColor =
    pwStrength === 1
      ? "var(--dp-ember)"
      : pwStrength === 2
        ? "var(--dp-gold)"
        : "#6abf69";

  const strengthLabel =
    pwStrength === 1
      ? "Weak"
      : pwStrength === 2
        ? "Good"
        : pwStrength === 3
          ? "Strong"
          : "";

  const strengthWidth = ["0%", "33%", "66%", "100%"][pwStrength];

  const mismatch = confirm.length > 0 && confirm !== password;
  const matches = confirm.length > 0 && confirm === password;

  return (
    <>
      <style>{`
        @keyframes dp-spin { to { transform: rotate(360deg); } }

        /* ───── card (mobile-first) ───── */
        .rc-card {
          width: 100%;
          box-sizing: border-box;
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          border-radius: 14px;
          padding: 1.5rem 1.25rem 1.75rem;
          overflow: hidden;
        }
        @media (min-width: 480px) { .rc-card { padding: 2rem 1.75rem; } }
        @media (min-width: 960px) { .rc-card { padding: 2.25rem 2rem; border-radius: 4px; } }

        /* mobile-only value banner — desktop shows the brand column instead */
        .rc-gift {
          display: block;
          margin: -1.5rem -1.25rem 1.5rem;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, rgba(191,90,40,.16), rgba(192,137,42,.08));
          border-bottom: 1px solid var(--dp-border);
        }
        @media (min-width: 480px) { .rc-gift { margin: -2rem -1.75rem 1.5rem; padding: 1rem 1.75rem; } }
        @media (min-width: 960px) { .rc-gift { display: none; } }
        .rc-gift-tag {
          font-family: 'DM Sans', sans-serif;
          font-size: .58rem; font-weight: 600;
          letter-spacing: .22em; text-transform: uppercase;
          color: var(--dp-ember);
        }
        .rc-gift-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 1.35rem; font-weight: 600; line-height: 1.15;
          color: var(--dp-cream); margin: .3rem 0 0;
        }
        .rc-gift-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: .78rem; line-height: 1.5;
          color: var(--dp-sand); margin: .35rem 0 0;
        }

        /* card heading — hidden on mobile (banner covers it), shown on desktop */
        .rc-heading {
          display: none;
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 1.5rem; font-weight: 600;
          color: var(--dp-cream); line-height: 1.1;
          margin: 0 0 1.5rem;
        }
        @media (min-width: 960px) { .rc-heading { display: block; } }

        /* ───── fields ───── */
        .rc-fields { display: flex; flex-direction: column; gap: 1rem; }
        .rc-field  { display: flex; flex-direction: column; gap: .45rem; }
        .rc-label {
          font-family: 'DM Sans', sans-serif;
          font-size: .72rem; font-weight: 500;
          letter-spacing: .1em; text-transform: uppercase;
          color: var(--dp-sand);
        }
        .rc-wrap { position: relative; }
        .rc-input {
          width: 100%; box-sizing: border-box;
          background: rgba(0,0,0,.15);
          border: 1px solid var(--dp-border);
          border-radius: 9px;
          color: var(--dp-cream);
          font-family: 'DM Sans', sans-serif;
          /* 16px keeps iOS Safari from auto-zooming the page on focus */
          font-size: 16px; line-height: 1.2;
          min-height: 52px;
          padding: .9rem 1rem; outline: none;
          transition: border-color .2s, background .18s;
          -webkit-appearance: none; appearance: none;
        }
        .rc-input::placeholder { color: var(--dp-muted); opacity: .7; }
        .rc-input:focus {
          border-color: rgba(191,90,40,.7);
          background: rgba(191,90,40,.05);
        }
        .rc-input.has-eye  { padding-right: 3rem; }
        .rc-input.is-error { border-color: rgba(191,90,40,.75) !important; }
        .rc-input.is-ok    { border-color: rgba(106,191,105,.5); }

        /* eye toggle — 44px tap target */
        .rc-eye {
          position: absolute; right: .35rem; top: 50%; transform: translateY(-50%);
          width: 44px; height: 44px;
          background: none; border: none; padding: 0; cursor: pointer;
          color: var(--dp-muted);
          display: flex; align-items: center; justify-content: center;
          transition: color .18s;
        }
        .rc-eye:hover, .rc-eye:active { color: var(--dp-sand); }

        /* password strength */
        .rc-strength-row {
          display: flex; align-items: center; gap: .6rem; margin-top: .5rem;
        }
        .rc-strength {
          flex: 1; height: 3px; border-radius: 3px;
          background: var(--dp-border); position: relative; overflow: hidden;
        }
        .rc-strength-fill {
          position: absolute; left: 0; top: 0; height: 100%; border-radius: 3px;
          transition: width .4s cubic-bezier(.16,1,.3,1), background .4s;
        }
        .rc-strength-label {
          font-family: 'DM Sans', sans-serif;
          font-size: .62rem; font-weight: 600; letter-spacing: .06em;
          min-width: 3.2rem; text-align: right;
        }

        /* inline messages */
        .rc-msg {
          font-family: 'DM Sans', sans-serif;
          font-size: .72rem; letter-spacing: .01em;
          margin: .15rem 0 0; line-height: 1.4;
        }
        .rc-msg.error { color: var(--dp-ember); }
        .rc-msg.ok    { color: #6abf69; }

        /* ───── submit ───── */
        .rc-btn {
          display: flex; align-items: center; justify-content: center; gap: .5rem;
          width: 100%; margin-top: .5rem;
          min-height: 54px;
          background: var(--dp-cream); color: var(--dp-ink);
          font-family: 'DM Sans', sans-serif; font-weight: 600;
          font-size: .78rem; letter-spacing: .12em; text-transform: uppercase;
          padding: 1rem 1.5rem; border: none; border-radius: 9px; cursor: pointer;
          transition: background .2s, color .2s, opacity .2s;
          -webkit-tap-highlight-color: transparent;
        }
        .rc-btn:hover:not(:disabled) { background: var(--dp-ember); color: var(--dp-cream); }
        .rc-btn:disabled { opacity: .45; cursor: not-allowed; }

        /* ───── terms + footer ───── */
        .rc-terms {
          font-family: 'DM Sans', sans-serif;
          font-size: .72rem; color: var(--dp-muted);
          margin-top: 1rem; line-height: 1.6; text-align: center;
        }
        .rc-terms a {
          color: var(--dp-sand); text-decoration: none;
          border-bottom: 1px solid rgba(201,185,154,.3); transition: border-color .18s;
        }
        .rc-terms a:hover { border-color: var(--dp-sand); }

        .rc-footer {
          margin-top: 1.5rem; padding-top: 1.25rem;
          border-top: 1px solid var(--dp-border);
          display: flex; align-items: center;
          justify-content: space-between; flex-wrap: wrap; gap: .6rem;
        }
        .rc-footer-text {
          font-family: 'DM Sans', sans-serif;
          font-size: .8rem; color: var(--dp-muted); margin: 0;
        }
        .rc-link {
          color: var(--dp-ember); text-decoration: none; font-weight: 600;
          border-bottom: 1px solid transparent; transition: border-color .18s;
        }
        .rc-link:hover { border-color: var(--dp-ember); }
        .rc-skip {
          font-family: 'DM Sans', sans-serif; font-size: .8rem;
          color: var(--dp-muted); text-decoration: none; transition: color .18s;
        }
        .rc-skip:hover { color: var(--dp-sand); }

        .rc-spin { animation: dp-spin .7s linear infinite; display: inline-flex; }
      `}</style>

      <div className="rc-card">
        {/* mobile-only welcome/value banner (desktop uses the brand column) */}
        <div className="rc-gift">
          <span className="rc-gift-tag">Welcome gift · 10% off</span>
          <h1 className="rc-gift-title">
            Create your D&apos;FOOTPRINT account
          </h1>
          <p className="rc-gift-sub">
            Track orders, save your details for faster checkout, and get 10% off
            your first pair.
          </p>
        </div>

        {/* desktop heading (banner is hidden ≥960px) */}
        <p className="rc-heading">Create your account</p>

        <form onSubmit={handleSubmit}>
          <div className="rc-fields">
            {/* Full name */}
            <div className="rc-field">
              <label htmlFor="name" className="rc-label">
                Full Name
              </label>
              <div className="rc-wrap">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rc-input"
                  placeholder="Chidera Okafor"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="rc-field">
              <label htmlFor="email" className="rc-label">
                Email Address
              </label>
              <div className="rc-wrap">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rc-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
            </div>

            {/* Password + strength */}
            <div className="rc-field">
              <label htmlFor="password" className="rc-label">
                Password
              </label>
              <div className="rc-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="rc-input has-eye"
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="rc-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {password.length > 0 && (
                <div className="rc-strength-row">
                  <div className="rc-strength">
                    <div
                      className="rc-strength-fill"
                      style={{
                        width: strengthWidth,
                        background: strengthColor,
                      }}
                    />
                  </div>
                  <span
                    className="rc-strength-label"
                    style={{ color: strengthColor }}
                  >
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="rc-field">
              <label htmlFor="confirm" className="rc-label">
                Confirm Password
              </label>
              <div className="rc-wrap">
                <input
                  type={showConfirm ? "text" : "password"}
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className={`rc-input has-eye${
                    mismatch ? " is-error" : matches ? " is-ok" : ""
                  }`}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="rc-eye"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {mismatch && (
                <p className="rc-msg error">Passwords don&apos;t match</p>
              )}
              {matches && <p className="rc-msg ok">Passwords match</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || mismatch}
              className="rc-btn"
            >
              {isLoading ? (
                <>
                  <span className="rc-spin">
                    <Spinner />
                  </span>
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <Arrow />
                </>
              )}
            </button>
          </div>

          <p className="rc-terms">
            By creating an account you agree to our{" "}
            <Link href="/terms-conditions">Terms</Link> and{" "}
            <Link href="/privacy-policy">Privacy Policy</Link>.
          </p>
        </form>

        <div className="rc-footer">
          <p className="rc-footer-text">
            Have an account?{" "}
            <Link href="/auth/login" className="rc-link">
              Sign in
            </Link>
          </p>
          <Link href="/" className="rc-skip">
            Continue as guest →
          </Link>
        </div>
      </div>
    </>
  );
}

/* ── icon helpers ── */
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
