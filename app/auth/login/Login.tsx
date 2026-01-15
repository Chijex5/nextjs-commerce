"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import LoadingDots from "components/loading-dots";

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
      } else {
        toast.success("Logged in successfully!");
        const callbackUrl = searchParams.get("callbackUrl") || "/account";
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
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
      } else {
        toast.success(data.message || "Check your email for the login link.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-md px-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-black">
        <h1 className="mb-6 text-2xl font-bold">Login</h1>
        <form onSubmit={usePassword ? handleSubmit : handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              placeholder="your@email.com"
            />
          </div>
          {usePassword && (
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={usePassword ? isLoading : magicLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
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
            className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            {usePassword ? "Use magic link instead" : "Use password instead"}
          </button>
          {!usePassword && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              We will email you a one-time sign-in link.
            </p>
          )}
        </form>
        <div className="mt-4 text-center text-sm">
          <p className="text-neutral-600 dark:text-neutral-400">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Register
            </Link>
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
          >
            Continue without login
          </Link>
        </div>
      </div>
    </div>
  );
}
