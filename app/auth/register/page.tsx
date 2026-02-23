"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim() || undefined,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      toast.success("Account created. Please login.");
      router.push("/auth/login?callbackUrl=/account?welcome=1");
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
      const response = await fetch("/api/user-auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          callbackUrl: "/account?welcome=1",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to send magic link");
        return;
      }

      toast.success(data.message || "Check your email for the sign-in link.");
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Create account
      </h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Start with a magic link or sign up using password.
      </p>

      <form
        onSubmit={usePassword ? handleSubmit : handleMagicLink}
        className="mt-6 space-y-4"
      >
        {!usePassword ? (
          <div>
            <label
              htmlFor="magicEmail"
              className="mb-1 block text-sm font-medium"
            >
              Email
            </label>
            <input
              type="email"
              id="magicEmail"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              placeholder="your@email.com"
            />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Full name (optional)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                placeholder="your@email.com"
              />
            </div>
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium"
              >
                Confirm password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={usePassword ? isLoading : magicLoading}
          className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {usePassword
            ? isLoading
              ? "Creating account..."
              : "Create account"
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
            We&apos;ll email a one-time sign-in link.
          </p>
        ) : null}
      </form>

      <div className="mt-5 space-y-2 text-sm">
        <p className="text-neutral-600 dark:text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100"
          >
            Login
          </Link>
        </p>
        <Link
          href="/"
          className="inline-block text-neutral-500 underline-offset-4 hover:underline dark:text-neutral-400"
        >
          Continue without account
        </Link>
      </div>
    </div>
  );
}
