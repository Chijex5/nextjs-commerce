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

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Login
      </h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Access your account with magic link or password.
      </p>

      <form
        onSubmit={usePassword ? handleSubmit : handleMagicLink}
        className="mt-6 space-y-4"
      >
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            placeholder="your@email.com"
          />
        </div>

        {usePassword ? (
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              placeholder="••••••••"
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={usePassword ? isLoading : magicLoading}
          className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {usePassword
            ? isLoading
              ? "Logging in..."
              : "Login"
            : magicLoading
              ? "Sending link..."
              : "Send magic link"}
        </button>

        <button
          type="button"
          onClick={() => setUsePassword((current) => !current)}
          className="w-full rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:border-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500"
        >
          {usePassword ? "Use magic link instead" : "Use password instead"}
        </button>

        {!usePassword ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            We will email you a one-time sign-in link.
          </p>
        ) : null}
      </form>

      <div className="mt-5 space-y-2 text-sm">
        <p className="text-neutral-600 dark:text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100"
          >
            Create one
          </Link>
        </p>
        <Link
          href="/"
          className="inline-block text-neutral-500 underline-offset-4 hover:underline dark:text-neutral-400"
        >
          Continue without login
        </Link>
      </div>
    </div>
  );
}
