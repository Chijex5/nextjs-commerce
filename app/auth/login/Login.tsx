"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/user-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Invalid email or password");
        return;
      }
      toast.success("Logged in successfully");
      const callbackUrl = searchParams.get("callbackUrl") || "/account";
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicLoading(true);
    try {
      const callbackUrl = searchParams.get("callbackUrl") || "/account?welcome=1";
      const response = await fetch("/api/user-auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to send magic link");
        return;
      }
      toast.success(data.message || "Check your email for the login link.");
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes dp-spin { to { transform: rotate(360deg); } }

        /* ── card ── */
        .login-card {
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          padding: 2rem 1.75rem;
        }
        @media (min-width: 960px) {
          .login-card { padding: 2.25rem 2rem; }
        }

        /* tiny heading — same weight as the layout's left-column eyebrow */
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
        .lc-input.has-eye { padding-right: 2.7rem; }

        /* eye toggle */
        .lc-eye {
          position: absolute; right: .78rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; padding: 0; cursor: pointer;
          color: var(--dp-muted); display: flex; align-items: center;
          transition: color .18s; line-height: 1;
        }
        .lc-eye:hover { color: var(--dp-sand); }

        /* password field — CSS grid reveal, no layout jump */
        .lc-pw-slide {
          display: grid; grid-template-rows: 0fr; opacity: 0;
          transition: grid-template-rows .25s ease, opacity .22s ease;
        }
        .lc-pw-slide.open { grid-template-rows: 1fr; opacity: 1; }
        .lc-pw-slide > div { overflow: hidden; }

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

        .lc-btn-toggle {
          display: flex; align-items: center; justify-content: center;
          width: 100%; background: transparent; border: none;
          font-family: 'DM Sans', sans-serif; font-size: .65rem;
          color: var(--dp-muted); cursor: pointer; padding: .38rem 0;
          transition: color .2s;
        }
        .lc-btn-toggle:hover { color: var(--dp-sand); }
        .lc-btn-toggle span {
          border-bottom: 1px solid var(--dp-border);
          transition: border-color .2s;
        }
        .lc-btn-toggle:hover span { border-color: var(--dp-sand); }

        /* ── divider ── */
        .lc-divider {
          display: flex; align-items: center; gap: .8rem;
          margin: .85rem 0 .7rem;
        }
        .lc-divider::before,
        .lc-divider::after { content:''; flex:1; height:1px; background: var(--dp-border); }
        .lc-divider span {
          font-family: 'DM Sans', sans-serif; font-size: .55rem;
          letter-spacing: .18em; text-transform: uppercase;
          color: var(--dp-muted); white-space: nowrap;
        }

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

        /* spinner */
        .lc-spin { animation: dp-spin .7s linear infinite; display: inline-flex; }
      `}</style>

      <div className="login-card">

        {/* compact heading */}
        <p className="lc-heading">
          {usePassword ? "Sign in" : "Welcome back"}
        </p>

        <form onSubmit={usePassword ? handleSubmit : handleMagicLink}>
          <div className="lc-fields">

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

            {/* Password — smooth CSS grid reveal */}
            <div className={`lc-pw-slide${usePassword ? " open" : ""}`}>
              <div>
                <div className="lc-field" style={{ paddingBottom: ".04rem" }}>
                  <label htmlFor="password" className="lc-label">Password</label>
                  <div className="lc-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={usePassword}
                      className="lc-input has-eye"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button" className="lc-eye"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        /* eye open */
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      ) : (
                        /* eye off */
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={usePassword ? isLoading : magicLoading}
              className="lc-btn-primary"
            >
              {usePassword ? (
                isLoading ? (
                  <><span className="lc-spin"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></span>Signing in…</>
                ) : (
                  <>Sign In<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></>
                )
              ) : (
                magicLoading ? (
                  <><span className="lc-spin"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></span>Sending…</>
                ) : (
                  <>Send Magic Link<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></>
                )
              )}
            </button>
          </div>

          {!usePassword && (
            <p style={{ fontFamily:"DM Sans,sans-serif", fontSize:".6rem", color:"var(--dp-muted)", marginTop:".5rem", textAlign:"center", lineHeight:1.5 }}>
              One-time link sent to your inbox — no password needed.
            </p>
          )}

          <div className="lc-divider"><span>or</span></div>

          <button type="button" onClick={() => setUsePassword((v) => !v)} className="lc-btn-toggle">
            <span>{usePassword ? "Use a magic link instead" : "Sign in with password instead"}</span>
          </button>
        </form>

        <div className="lc-footer">
          <p className="lc-footer-text">
            No account?{" "}
            <Link href="/auth/register" className="lc-link">Create one</Link>
          </p>
          <Link href="/" className="lc-skip">Continue as guest →</Link>
        </div>
      </div>
    </>
  );
}