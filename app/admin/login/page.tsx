"use client";

import { AdminAuthFrame, AuthNotice } from "components/admin/admin-auth-frame";
import LoadingDots from "components/loading-dots";
import { buttonClass } from "components/ui/button";
import { Field } from "components/ui/field";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("[admin-login] submit", {
      email,
      path: window.location.pathname,
      origin: window.location.origin,
    });

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("[admin-login] signIn result", {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url,
      });

      if (result?.error) {
        console.log("[admin-login] signIn rejected", result.error);
        setError("Invalid email or password");
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.log("[admin-login] submit error", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthFrame
      eyebrow="(Admin) — Sign in"
      title="Welcome back."
      intro="Orders, products and custom requests — all in one place."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end">
          <Link
            href="/admin/forgot-password"
            className="label link-underline text-fg-3 hover:text-fg"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={buttonClass("solid", "lg", "w-full")}
        >
          {loading ? <LoadingDots className="bg-canvas" /> : "Sign in"}
        </button>
      </form>
    </AdminAuthFrame>
  );
}
