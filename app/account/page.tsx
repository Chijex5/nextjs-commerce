"use client";

import LoadingDots from "components/loading-dots";
import PageLoader from "components/page-loader";
import ThemeToggle from "components/theme-toggle";
import { useUserSession } from "hooks/useUserSession";
import { deriveNameFromEmail } from "lib/user-utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ─── helpers ─────────────────────────────────────────────────────────────────

function emptyPasswordData() {
  return { currentPassword: "", newPassword: "", confirmPassword: "" };
}

function emptyAddPasswordData() {
  return { otp: "", newPassword: "", confirmPassword: "" };
}

function getInitials(name: string | null | undefined, email: string) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/);
  const first = parts[0] && parts[0][0] ? parts[0][0] : "";
  const second = parts[1] && parts[1][0] ? parts[1][0] : "";
  if (first && second) return (first + second).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {title}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      </div>
    </Link>
  );
}

// ─── main content ─────────────────────────────────────────────────────────────

function AccountPageContent() {
  const { data: session, status, refetch } = useUserSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const showWelcome = searchParams.get("welcome") === "1";

  // profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  // welcome gift
  const [showWelcomeGift, setShowWelcomeGift] = useState(false);
  const [copied, setCopied] = useState(false);

  // change password (existing password set)
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState(emptyPasswordData());

  // add password (magic-link user – OTP flow)
  const [addPasswordStep, setAddPasswordStep] = useState<"idle" | "otp-sent" | "done">("idle");
  const [addPasswordData, setAddPasswordData] = useState(emptyAddPasswordData());
  const [sendingOtp, setSendingOtp] = useState(false);

  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });

  const derivedName = useMemo(() => {
    if (!session?.email) return "";
    return deriveNameFromEmail(session.email);
  }, [session?.email]);

  // ── seed profile from session ──
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/account");
      return;
    }
    if (status === "authenticated" && session) {
      setProfile({
        name: session.name || "",
        email: session.email || "",
        phone: session.phone || "",
      });
      const needsNameReview =
        showWelcome &&
        derivedName &&
        session.name?.trim().toLowerCase() === derivedName.toLowerCase();
      setShowProfilePrompt(!!needsNameReview);
      if (needsNameReview) setIsEditing(true);
    }
  }, [status, router, session, showWelcome, derivedName]);

  // ── welcome gift cookie ──
  useEffect(() => {
    if (!showWelcome) return;
    const hasGiftCookie =
      typeof document !== "undefined" &&
      document.cookie.includes("welcome_gift_signup=true");
    setShowWelcomeGift(hasGiftCookie);
  }, [showWelcome]);

  // ── handlers ──

  const handleCopyCoupon = async () => {
    try {
      await navigator.clipboard.writeText("NEWCOM");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleEditProfile = async () => {
    if (!profile.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user-auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update profile");
        return;
      }
      toast.success("Profile updated successfully");
      setIsEditing(false);
      setShowProfilePrompt(false);
      await refetch();
      router.replace("/account");
      router.refresh();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user-auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to change password");
        return;
      }
      toast.success("Password changed successfully");
      setIsChangingPassword(false);
      setPasswordData(emptyPasswordData());
      await refetch();
    } catch {
      toast.error("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await fetch("/api/user-auth/request-add-password-otp", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send verification code");
        return;
      }
      toast.success("Verification code sent to your email");
      setAddPasswordStep("otp-sent");
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleAddPassword = async () => {
    if (!addPasswordData.otp || !addPasswordData.newPassword || !addPasswordData.confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (addPasswordData.newPassword !== addPasswordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (addPasswordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user-auth/add-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addPasswordData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add password");
        return;
      }
      toast.success("Password added successfully");
      setAddPasswordStep("done");
      setAddPasswordData(emptyAddPasswordData());
      await refetch();
    } catch {
      toast.error("Failed to add password");
    } finally {
      setSaving(false);
    }
  };

  // ── render ──

  if (status === "loading") {
    return <PageLoader size="lg" message="Loading account..." />;
  }

  if (!session) return null;

  const hasPassword = session.hasPassword ?? false;
  const initials = getInitials(session.name, session.email);

  return (
    <div className="space-y-8 pb-12">
      {/* ── Welcome gift modal ── */}
      {showWelcomeGift ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
            <button
              onClick={() => {
                setShowWelcomeGift(false);
                document.cookie = "welcome_gift_signup=; Max-Age=0; path=/";
                router.replace("/account");
              }}
              className="absolute right-3 top-3 rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Close"
            >
              ✕
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
              Welcome gift
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              ₦1,500 off your first order
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Use this code at checkout.
            </p>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-neutral-300 px-4 py-3 dark:border-neutral-700">
              <p className="font-mono text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                NEWCOM
              </p>
              <button
                onClick={handleCopyCoupon}
                className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:border-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Profile prompt for new users ── */}
      {showProfilePrompt ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Please confirm your profile details before continuing.
        </div>
      ) : null}

      {/* ── Hero / account overview ── */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-wrap items-center gap-5">
          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold tracking-wider text-white dark:bg-neutral-100 dark:text-neutral-900">
            {initials}
          </div>

          {/* Name / email */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {session.name || deriveNameFromEmail(session.email)}
            </h2>
            <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
              {session.email}
            </p>
          </div>

          {/* Theme toggle on the right */}
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/* Divider + quick stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-3 dark:border-neutral-800">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
              Auth method
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {hasPassword ? "Password" : "Magic link"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
              Account type
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Customer
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
              Phone
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {session.phone || "Not provided"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* ── Profile details ── */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 xl:col-span-2 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Profile details
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
              >
                Edit
              </button>
            ) : null}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Name
                </label>
                <input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Phone
                </label>
                <input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="e.g. +2348012345678"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Email
                </label>
                <input
                  value={profile.email}
                  disabled
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2.5 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500"
                />
                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                  Email cannot be changed.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={handleEditProfile}
                  disabled={saving}
                  className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                >
                  {saving ? (
                    <LoadingDots className="bg-white dark:bg-black" />
                  ) : (
                    "Save changes"
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setShowProfilePrompt(false);
                    setProfile({
                      name: session.name || "",
                      email: session.email || "",
                      phone: session.phone || "",
                    });
                  }}
                  disabled={saving}
                  className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium hover:border-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <Info label="Full name" value={session.name || "Not set"} />
              <Info label="Email address" value={session.email || "Not set"} />
              <Info label="Phone number" value={session.phone || "Not provided"} />
              <Info label="Account status" value="Active" />
            </div>
          )}
        </section>

        {/* ── Right column ── */}
        <section className="space-y-6">
          {/* ── Security ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Security
              </h2>
              {hasPassword && !isChangingPassword ? (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                >
                  Change
                </button>
              ) : null}
            </div>

            {/* ── Has a real password → Change Password ── */}
            {hasPassword ? (
              isChangingPassword ? (
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black"
                    >
                      {saving ? (
                        <LoadingDots className="bg-white dark:bg-black" />
                      ) : (
                        "Update password"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData(emptyPasswordData());
                      }}
                      className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium dark:border-neutral-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Password is set and protected.
                </p>
              )
            ) : (
              /* ── Magic-link user → Add Password (OTP flow) ── */
              <div className="space-y-4">
                {addPasswordStep === "idle" ? (
                  <>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      You signed in with a magic link. Add a password to also
                      sign in with your email and password.
                    </p>
                    <button
                      onClick={handleRequestOtp}
                      disabled={sendingOtp}
                      className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black"
                    >
                      {sendingOtp ? (
                        <LoadingDots className="bg-white dark:bg-black" />
                      ) : (
                        "Add password"
                      )}
                    </button>
                  </>
                ) : addPasswordStep === "otp-sent" ? (
                  <>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      We sent a 6-digit code to{" "}
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {session.email}
                      </span>
                      . Enter it below along with your new password.
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={addPasswordData.otp}
                      onChange={(e) =>
                        setAddPasswordData((prev) => ({
                          ...prev,
                          otp: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm tracking-widest dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      value={addPasswordData.newPassword}
                      onChange={(e) =>
                        setAddPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={addPasswordData.confirmPassword}
                      onChange={(e) =>
                        setAddPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={handleAddPassword}
                        disabled={saving}
                        className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black"
                      >
                        {saving ? (
                          <LoadingDots className="bg-white dark:bg-black" />
                        ) : (
                          "Confirm & add password"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setAddPasswordStep("idle");
                          setAddPasswordData(emptyAddPasswordData());
                        }}
                        className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium dark:border-neutral-700"
                      >
                        Cancel
                      </button>
                    </div>
                    <button
                      onClick={handleRequestOtp}
                      disabled={sendingOtp}
                      className="text-xs text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline dark:text-neutral-500 dark:hover:text-neutral-300"
                    >
                      {sendingOtp ? "Resending…" : "Resend code"}
                    </button>
                  </>
                ) : (
                  /* addPasswordStep === "done" — session refetch should flip hasPassword */
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Password added successfully.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Appearance ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Appearance
            </h2>
            <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
              Choose a colour theme. &ldquo;System&rdquo; follows your device
              setting.
            </p>
            <ThemeToggle />
          </div>

          {/* ── Quick links ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Quick links
            </h2>
            <div className="space-y-2">
              <QuickLink
                href="/orders"
                title="My orders"
                description="Track delivery and order updates"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 0 0-4 0v2" />
                    <path d="M8 7V5a2 2 0 0 1 4 0" />
                    <line x1="12" y1="12" x2="12" y2="16" />
                    <line x1="10" y1="14" x2="14" y2="14" />
                  </svg>
                }
              />
              <QuickLink
                href="/account/addresses"
                title="Saved addresses"
                description="Manage shipping and billing details"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                }
              />
              <QuickLink
                href="/"
                title="Continue shopping"
                description="Browse the latest collections"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                }
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<PageLoader size="lg" message="Loading account..." />}>
      <AccountPageContent />
    </Suspense>
  );
}
