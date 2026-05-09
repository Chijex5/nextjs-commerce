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
      const callbackUrl = searchParams.get("callbackUrl") || "/account?welcome=1";
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
    password.length === 0 ? 0 :
    password.length < 8   ? 1 :
    password.length < 12  ? 2 : 3;

  const strengthColor =
    pwStrength === 1 ? "var(--dp-ember)" :
    pwStrength === 2 ? "var(--dp-gold)"  : "#6abf69";

  const strengthWidth = ["0%", "33%", "66%", "100%"][pwStrength];

  const mismatch = confirm.length > 0 && confirm !== password;
  const matches  = confirm.length > 0 && confirm === password;

  return (
    <>
      <style>{`
        @keyframes dp-spin { to { transform: rotate(360deg); } }

        /* ── card — identical shell to login ── */
        .lc-card {
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          padding: 2rem 1.75rem;
        }
        @media (min-width: 960px) { .lc-card { padding: 2.25rem 2rem; } }

        .lc-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.35rem; font-weight: 600;
          color: var(--dp-cream); line-height: 1.1;
          margin-bottom: 1.5rem;
        }

        /* ── fields ── */
        .lc-fields { display: flex; flex-direction: column; gap: .85rem; }
        .lc-field  { display: flex; flex-direction: column; gap: .38rem; }
        .lc-label {
          font-family: 'DM Sans', sans-serif;
          font-size: .55rem; font-weight: 500;
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--dp-muted);
        }
        .lc-wrap { position: relative; }
        .lc-input {
          width: 100%; box-sizing: border-box;
          background: transparent;
          border: 1px solid var(--dp-border);
          color: var(--dp-cream);
          font-family: 'DM Sans', sans-serif; font-size: .82rem;
          padding: .74rem .9rem; outline: none;
          transition: border-color .2s, background .18s;
          -webkit-appearance: none;
        }
        .lc-input::placeholder { color: var(--dp-muted); opacity: .5; }
        .lc-input:focus {
          border-color: rgba(191,90,40,.65);
          background: rgba(191,90,40,.03);
        }
        .lc-input.has-eye  { padding-right: 2.7rem; }
        .lc-input.is-error { border-color: rgba(191,90,40,.7) !important; }
        .lc-input.is-ok    { border-color: rgba(106,191,105,.45); }

        /* eye toggle */
        .lc-eye {
          position: absolute; right: .78rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; padding: 0; cursor: pointer;
          color: var(--dp-muted); display: flex; align-items: center;
          transition: color .18s; line-height: 1;
        }
        .lc-eye:hover { color: var(--dp-sand); }

        /* password strength bar */
        .lc-strength {
          height: 2px; background: var(--dp-border);
          margin-top: .45rem; position: relative; overflow: hidden;
        }
        .lc-strength-fill {
          position: absolute; left: 0; top: 0; height: 100%;
          transition: width .4s cubic-bezier(.16,1,.3,1), background .4s;
        }

        /* inline messages */
        .lc-msg {
          font-family: 'DM Sans', sans-serif;
          font-size: .6rem; letter-spacing: .04em;
          margin-top: .35rem; line-height: 1.4;
        }
        .lc-msg.error { color: var(--dp-ember); }
        .lc-msg.ok    { color: #6abf69; }

        /* ── buttons ── */
        .lc-btn-primary {
          display: flex; align-items: center; justify-content: center; gap: .45rem;
          width: 100%; margin-top: .3rem;
          background: var(--dp-cream); color: var(--dp-ink);
          font-family: 'DM Sans', sans-serif; font-weight: 600;
          font-size: .67rem; letter-spacing: .14em; text-transform: uppercase;
          padding: .9rem 1.5rem; border: none; cursor: pointer;
          transition: background .2s, color .2s;
        }
        .lc-btn-primary:hover:not(:disabled) { background: var(--dp-ember); color: var(--dp-cream); }
        .lc-btn-primary:disabled { opacity: .4; cursor: not-allowed; }

        /* ── terms ── */
        .lc-terms {
          font-family: 'DM Sans', sans-serif;
          font-size: .6rem; color: var(--dp-muted);
          margin-top: .85rem; line-height: 1.6; text-align: center;
        }
        .lc-terms a {
          color: var(--dp-ember); text-decoration: none;
          border-bottom: 1px solid transparent; transition: border-color .18s;
        }
        .lc-terms a:hover { border-color: var(--dp-ember); }

        /* ── footer ── */
        .lc-footer {
          margin-top: 1.35rem; padding-top: 1rem;
          border-top: 1px solid var(--dp-border);
          display: flex; align-items: center;
          justify-content: space-between; flex-wrap: wrap; gap: .4rem;
        }
        .lc-footer-text {
          font-family: 'DM Sans', sans-serif;
          font-size: .65rem; color: var(--dp-muted); margin: 0;
        }
        .lc-link {
          color: var(--dp-ember); text-decoration: none;
          border-bottom: 1px solid transparent; transition: border-color .18s;
        }
        .lc-link:hover { border-color: var(--dp-ember); }
        .lc-skip {
          font-family: 'DM Sans', sans-serif; font-size: .65rem;
          color: var(--dp-muted); text-decoration: none; transition: color .18s;
        }
        .lc-skip:hover { color: var(--dp-sand); }

        .lc-spin { animation: dp-spin .7s linear infinite; display: inline-flex; }
      `}</style>

      <div className="lc-card">

        <p className="lc-heading">Create your account</p>

        <form onSubmit={handleSubmit}>
          <div className="lc-fields">

            {/* Full name */}
            <div className="lc-field">
              <label htmlFor="name" className="lc-label">Full Name</label>
              <div className="lc-wrap">
                <input
                  type="text" id="name" value={name}
                  onChange={(e) => setName(e.target.value)}
                  required className="lc-input"
                  placeholder="Chidera Okafor"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="lc-field">
              <label htmlFor="email" className="lc-label">Email Address</label>
              <div className="lc-wrap">
                <input
                  type="email" id="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required className="lc-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password + strength bar */}
            <div className="lc-field">
              <label htmlFor="password" className="lc-label">Password</label>
              <div className="lc-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required minLength={8}
                  className="lc-input has-eye"
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button" className="lc-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {/* strength bar — only while typing */}
              {password.length > 0 && (
                <div className="lc-strength">
                  <div className="lc-strength-fill" style={{ width: strengthWidth, background: strengthColor }} />
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="lc-field">
              <label htmlFor="confirm" className="lc-label">Confirm Password</label>
              <div className="lc-wrap">
                <input
                  type={showConfirm ? "text" : "password"}
                  id="confirm" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className={`lc-input has-eye${mismatch ? " is-error" : matches ? " is-ok" : ""}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button" className="lc-eye"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {mismatch && <p className="lc-msg error">Passwords don&apos;t match</p>}
              {matches  && <p className="lc-msg ok">Passwords match</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || mismatch}
              className="lc-btn-primary"
            >
              {isLoading ? (
                <><span className="lc-spin"><Spinner /></span>Creating account…</>
              ) : (
                <>Create Account<Arrow /></>
              )}
            </button>
          </div>

          <p className="lc-terms">
            By creating an account you agree to our{" "}
            <Link href="/terms-conditions">Terms</Link> and{" "}
            <Link href="/privacy-policy">Privacy Policy</Link>.
          </p>
        </form>

        <div className="lc-footer">
          <p className="lc-footer-text">
            Have an account?{" "}
            <Link href="/auth/login" className="lc-link">Sign in</Link>
          </p>
          <Link href="/" className="lc-skip">Continue as guest →</Link>
        </div>
      </div>
    </>
  );
}

/* ── icon helpers ── */
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}