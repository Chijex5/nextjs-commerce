"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: searchParams.get("callbackUrl") || "/account",
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else if (result?.ok) {
        toast.success("Logged in successfully!");
        router.push(searchParams.get("callbackUrl") || "/account");
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-md px-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-black">
        <h1 className="mb-6 text-2xl font-bold">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
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
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
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
