"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import LoadingDots from "components/loading-dots";
import { buttonClass } from "components/ui/button";
import { Field } from "components/ui/field";
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

  const strength =
    password.length === 0
      ? 0
      : password.length < 8
        ? 1
        : password.length < 12
          ? 2
          : 3;
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <div className="animate-fade-in">
      <p className="label text-fg-3">(New account) · 10% off your first pair</p>
      <h1 className="display mt-3 text-[clamp(3.4rem,10vw,5.5rem)]">
        Join D&apos;Footprint.
      </h1>
      <p className="mt-4 text-fg-2">
        Track orders, save your details for faster checkout, and get 10% off
        your first pair.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <Field
          label="Full name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <div>
          <Field
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={
              strength === 0
                ? "At least 8 characters."
                : ["", "Too short", "Good", "Strong"][strength]
            }
            error={strength === 1}
          />
          <div className="mt-2 grid grid-cols-3 gap-1" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-0.5 transition-colors ${strength >= n ? "bg-fg" : "bg-line"}`}
              />
            ))}
          </div>
        </div>
        <Field
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch}
          hint={
            mismatch
              ? "Passwords don't match"
              : confirm
                ? "Passwords match"
                : undefined
          }
        />

        <button
          type="submit"
          disabled={isLoading}
          className={buttonClass("solid", "lg", "w-full !h-14")}
        >
          {isLoading ? <LoadingDots className="bg-canvas" /> : "Create account"}
        </button>
        <p className="text-xs text-fg-3">
          By creating an account you agree to our{" "}
          <Link href="/terms-conditions" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <div className="mt-12 space-y-3 border-t border-line pt-6 text-sm text-fg-2">
        <p>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-fg underline">
            Sign in
          </Link>
        </p>
        <p>
          <Link href="/" className="underline">
            Continue as guest
          </Link>
        </p>
      </div>
    </div>
  );
}
