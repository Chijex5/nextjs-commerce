"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import LoadingDots from "components/loading-dots";
import { buttonClass } from "components/ui/button";
import { Field } from "components/ui/field";
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
      const callbackUrl =
        searchParams.get("callbackUrl") || "/account?welcome=1";
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

  const busy = usePassword ? isLoading : magicLoading;

  return (
    <div className="animate-fade-in">
      <p className="label text-fg-3">(Account)</p>
      <h1 className="display mt-3 text-[clamp(3.4rem,10vw,5.5rem)]">
        Welcome back.
      </h1>
      <p className="mt-4 text-fg-2">
        {usePassword
          ? "Sign in with your email and password."
          : "We'll email you a one-time link — no password needed."}
      </p>

      <form
        onSubmit={usePassword ? handleSubmit : handleMagicLink}
        className="mt-10 space-y-6"
      >
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
        {usePassword ? (
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className={buttonClass("solid", "lg", "w-full !h-14")}
        >
          {busy ? (
            <LoadingDots className="bg-canvas" />
          ) : usePassword ? (
            "Sign in"
          ) : (
            "Email me a sign-in link"
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setUsePassword((v) => !v)}
        className="label link-underline mt-6"
      >
        {usePassword ? "Use a sign-in link instead" : "Use a password instead"}
      </button>

      <div className="mt-12 space-y-3 border-t border-line pt-6 text-sm text-fg-2">
        <p>
          New here?{" "}
          <Link href="/auth/register" className="font-medium text-fg underline">
            Create an account
          </Link>{" "}
          — and get 10% off your first pair.
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
