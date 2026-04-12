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

        .auth-card {
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          padding: 2rem;
        }

        .auth-link {
          color: var(--dp-ember);
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid transparent;
          transition: border-color .2s;
        }
        .auth-link:hover { border-color: var(--dp-ember); }

        .pw-strength {
          height: 2px;
          background: var(--dp-border);
          margin-top: .5rem;
          position: relative;
          overflow: hidden;
        }
        .pw-strength-bar {
          position: absolute; left: 0; top: 0; height: 100%;
          transition: width .4s cubic-bezier(.16,1,.3,1), background .4s;
        }
      `}</style>

      <div className="auth-card">
        {/* Header */}
        <p className="dp-label" style={{ marginBottom: ".6rem" }}>New here?</p>
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
          Create your account
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
          Join D&apos;FOOTPRINT to track orders and request custom pairs.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

            {/* Full name */}
            <div>
              <label htmlFor="name" className="co-label">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="co-input"
                placeholder="Chidera Okafor"
              />
            </div>

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

            {/* Password */}
            <div>
              <label htmlFor="password" className="co-label">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="co-input"
                placeholder="Minimum 8 characters"
              />
              {/* Strength indicator */}
              <div className="pw-strength">
                <div
                  className="pw-strength-bar"
                  style={{
                    width: password.length === 0 ? "0%" : password.length < 8 ? "33%" : password.length < 12 ? "66%" : "100%",
                    background: password.length < 8 ? "var(--dp-ember)" : password.length < 12 ? "var(--dp-gold)" : "#6abf69",
                  }}
                />
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm" className="co-label">Confirm Password</label>
              <input
                type="password"
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="co-input"
                placeholder="••••••••"
                style={{
                  borderColor: confirm && confirm !== password
                    ? "rgba(191,90,40,.7)"
                    : undefined,
                }}
              />
              {confirm && confirm !== password && (
                <p
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: ".62rem",
                    color: "var(--dp-ember)",
                    marginTop: ".4rem",
                    letterSpacing: ".04em",
                  }}
                >
                  Passwords don&apos;t match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="dp-btn-solid"
              style={{ marginTop: ".4rem" }}
            >
              {isLoading ? "Creating account…" : "Create Account"}
              {!isLoading && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

          </div>

          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: ".62rem",
              color: "var(--dp-muted)",
              marginTop: "1rem",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            By creating an account you agree to our{" "}
            <Link href="/terms" className="auth-link" style={{ fontSize: ".62rem" }}>
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="auth-link" style={{ fontSize: ".62rem" }}>
              Privacy Policy
            </Link>
            .
          </p>
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
            Already have an account?{" "}
            <Link href="/auth/login" className="auth-link">
              Sign in
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