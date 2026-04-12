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
        .co-input {
          width: 100%;
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          color: var(--dp-cream);
          font-family: 'DM Sans', sans-serif;
          font-size: .82rem;
          padding: .85rem 1rem;
          outline: none;
          transition: border-color .22s;
        }
        .co-input::placeholder { color: var(--dp-muted); }
        .co-input:focus { border-color: rgba(191,90,40,.6); }

        .co-label {
          font-family: 'DM Sans', sans-serif;
          font-size: .6rem;
          font-weight: 500;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--dp-muted);
          display: block;
          margin-bottom: .45rem;
        }

        .dp-btn-solid {
          display: flex; align-items: center; justify-content: center; gap: .5rem;
          width: 100%;
          background: var(--dp-cream); color: var(--dp-ink);
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          font-size: .72rem; letter-spacing: .12em; text-transform: uppercase;
          padding: .95rem 2rem; border: none; cursor: pointer;
          transition: background .22s, color .22s;
        }
        .dp-btn-solid:hover:not(:disabled) { background: var(--dp-ember); color: var(--dp-cream); }
        .dp-btn-solid:disabled { opacity: .5; cursor: not-allowed; }

        .dp-btn-ghost {
          display: flex; align-items: center; justify-content: center; gap: .5rem;
          width: 100%;
          border: 1px solid rgba(242,232,213,.18); color: var(--dp-sand);
          background: transparent;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          font-size: .72rem; letter-spacing: .12em; text-transform: uppercase;
          padding: .95rem 2rem; cursor: pointer;
          transition: border-color .22s, color .22s;
        }
        .dp-btn-ghost:hover { border-color: rgba(242,232,213,.45); color: var(--dp-cream); }

        .auth-card {
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          padding: 2rem;
        }

        .auth-divider {
          display: flex; align-items: center; gap: 1rem;
          margin: 1.5rem 0;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--dp-border);
        }
        .auth-divider span {
          font-family: 'DM Sans', sans-serif;
          font-size: .6rem;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--dp-muted);
          white-space: nowrap;
        }

        .auth-link {
          color: var(--dp-ember);
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid transparent;
          transition: border-color .2s;
        }
        .auth-link:hover { border-color: var(--dp-ember); }
      `}</style>

      <div className="auth-card">
        {/* Header */}
        <p className="dp-label" style={{ marginBottom: ".6rem" }}>Welcome back</p>
        <h2
          className="dp-serif"
          style={{
            fontSize: "1.9rem",
            fontWeight: 600,
            color: "var(--dp-cream)",
            lineHeight: 1.15,
            marginBottom: ".5rem",
          }}
        >
          Sign in to your account
        </h2>
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: ".75rem",
            color: "var(--dp-muted)",
            marginBottom: "2rem",
            lineHeight: 1.6,
          }}
        >
          {usePassword
            ? "Enter your email and password below."
            : "Enter your email and we'll send a one-time sign-in link."}
        </p>

        <form onSubmit={usePassword ? handleSubmit : handleMagicLink}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="co-label">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="co-input"
                placeholder="you@example.com"
              />
            </div>

            {/* Password (conditional) */}
            {usePassword && (
              <div>
                <label htmlFor="password" className="co-label">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="co-input"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Primary action */}
            <button
              type="submit"
              disabled={usePassword ? isLoading : magicLoading}
              className="dp-btn-solid"
              style={{ marginTop: ".4rem" }}
            >
              {usePassword
                ? isLoading ? "Signing in…" : "Sign In"
                : magicLoading ? "Sending link…" : "Send Magic Link"}
              {!isLoading && !magicLoading && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>

          {!usePassword && (
            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: ".65rem",
                color: "var(--dp-muted)",
                marginTop: ".75rem",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              We&apos;ll email you a one-time sign-in link. No password needed.
            </p>
          )}

          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Toggle auth mode */}
          <button
            type="button"
            onClick={() => setUsePassword((v) => !v)}
            className="dp-btn-ghost"
          >
            {usePassword ? "Use magic link instead" : "Use password instead"}
          </button>
        </form>

        {/* Footer links */}
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--dp-border)",
            display: "flex",
            flexDirection: "column",
            gap: ".6rem",
          }}
        >
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: ".72rem",
              color: "var(--dp-muted)",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="auth-link">
              Create one
            </Link>
          </p>
          <Link
            href="/"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: ".72rem",
              color: "var(--dp-muted)",
              textDecoration: "none",
              transition: "color .2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--dp-sand)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--dp-muted)")}
          >
            Continue without login →
          </Link>
        </div>
      </div>
    </>
  );
}