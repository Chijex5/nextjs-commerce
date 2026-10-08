"use client";

import { AdminAuthFrame, AuthNotice } from "components/admin/admin-auth-frame";
import { buttonClass } from "components/ui/button";
import { Field } from "components/ui/field";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export default function AdminResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset link is missing or invalid.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to reset password");
      }

      setNewPassword("");
      setConfirmPassword("");
      setMessage(data?.message || "Password reset successfully.");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to reset password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthFrame
      eyebrow="(Admin) — Password"
      title="New password."
      intro="Choose a new password to get back into the admin."
    >
      {!token ? (
        <div className="mb-6">
          <AuthNotice tone="error">
            This reset link is invalid. Request a new one from the
            forgot-password page.
          </AuthNotice>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          hint="At least 6 characters"
        />
        <Field
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}
        {message ? <AuthNotice tone="success">{message}</AuthNotice> : null}

        <button
          type="submit"
          disabled={loading || !token}
          className={buttonClass("solid", "lg", "w-full")}
        >
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>

      <Link
        href={token ? "/admin/login" : "/admin/forgot-password"}
        className="label link-underline mt-8 inline-block text-fg-3 hover:text-fg"
      >
        ← {token ? "Back to admin login" : "Request a new link"}
      </Link>
    </AdminAuthFrame>
  );
}
