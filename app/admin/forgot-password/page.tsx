"use client";

import { AdminAuthFrame, AuthNotice } from "components/admin/admin-auth-frame";
import { buttonClass } from "components/ui/button";
import { Field } from "components/ui/field";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to send reset link");
      }

      setMessage(
        data?.message ||
          "If that admin email exists, a reset link has been sent.",
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to send reset link",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthFrame
      eyebrow="(Admin) — Password"
      title="Forgot it?"
      intro="Enter your admin email and we’ll send a secure reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Field
          label="Admin email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
        />

        {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}
        {message ? <AuthNotice tone="success">{message}</AuthNotice> : null}

        <button
          type="submit"
          disabled={loading}
          className={buttonClass("solid", "lg", "w-full")}
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <Link
        href="/admin/login"
        className="label link-underline mt-8 inline-block text-fg-3 hover:text-fg"
      >
        ← Back to admin login
      </Link>
    </AdminAuthFrame>
  );
}
