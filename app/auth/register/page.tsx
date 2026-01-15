"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import LoadingDots from "components/loading-dots";

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
      } else {
        toast.success("Account created! Please login.");
        router.push("/auth/login?callbackUrl=/account?welcome=1");
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
      } else {
        toast.success(data.message || "Check your email for the sign-in link.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="mx-auto mt-20 max-w-md px-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-black">
        <h1 className="mb-6 text-2xl font-bold">Create Account</h1>
        <form onSubmit={usePassword ? handleSubmit : handleMagicLink} className="space-y-4">
          {!usePassword && (
            <>
              <label htmlFor="magicEmail" className="block text-sm font-medium">
                Email me a sign-in link
              </label>
              <input
                type="email"
                id="magicEmail"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                required
                className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                placeholder="your@email.com"
              />
            </>
          )}
          {usePassword && (
            <>
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                  Full name (optional)
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  placeholder="your@email.com"
                />
              </div>
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={usePassword ? isLoading : magicLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {usePassword
              ? isLoading
                ? "Creating account..."
                : "Create Account"
              : magicLoading
                ? "Sending link..."
                : "Send magic link"}
          </button>
          <button
            type="button"
            onClick={() => setUsePassword((current) => !current)}
            className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            {usePassword ? "Use magic link instead" : "Use password instead"}
          </button>
          {!usePassword && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              We'll email a one-time sign-in link.
            </p>
          )}
        </form>
        <div className="mt-4 text-center text-sm">
          <p className="text-neutral-600 dark:text-neutral-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Login
            </Link>
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
          >
            Continue without account
          </Link>
        </div>
      </div>
    </div>
  );
}
