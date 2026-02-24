"use client";

import LoadingDots from "components/loading-dots";
import PageLoader from "components/page-loader";
import { useUserSession } from "hooks/useUserSession";
import { deriveNameFromEmail } from "lib/user-utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function emptyPasswordData() {
  return {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

function AccountPageContent() {
  const { data: session, status, refetch } = useUserSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const showWelcome = searchParams.get("welcome") === "1";
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [showWelcomeGift, setShowWelcomeGift] = useState(false);
  const [copied, setCopied] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState(emptyPasswordData());

  const derivedName = useMemo(() => {
    if (!session?.email) return "";
    return deriveNameFromEmail(session.email);
  }, [session?.email]);

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
      if (needsNameReview) {
        setIsEditing(true);
      }
    }
  }, [status, router, session, showWelcome, derivedName]);

  useEffect(() => {
    if (!showWelcome) return;

    const hasGiftCookie =
      typeof document !== "undefined" &&
      document.cookie.includes("welcome_gift_signup=true");

    setShowWelcomeGift(hasGiftCookie);
  }, [showWelcome]);

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
      const response = await fetch("/api/user-auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
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
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
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
      const response = await fetch("/api/user-auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully");
      setIsChangingPassword(false);
      setPasswordData(emptyPasswordData());
    } catch {
      toast.error("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return <PageLoader size="lg" message="Loading account..." />;
  }

  if (!session) return null;

  return (
    <div className="space-y-6 pb-10">
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

      {showProfilePrompt ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Please confirm your profile details before continuing.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
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
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  value={profile.email}
                  disabled
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2.5 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
                />
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
                    "Save"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Name" value={session.name || "Not set"} />
              <Info label="Email" value={session.email || "Not set"} />
              <Info label="Phone" value={session.phone || "Not provided"} />
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Security
              </h2>
              {!isChangingPassword ? (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                >
                  Change
                </button>
              ) : null}
            </div>

            {isChangingPassword ? (
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
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 dark:border-neutral-700 dark:bg-neutral-900"
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
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 dark:border-neutral-700 dark:bg-neutral-900"
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
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 dark:border-neutral-700 dark:bg-neutral-900"
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
                      "Save"
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
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Quick links
            </h2>
            <div className="space-y-2">
              <QuickLink
                href="/orders"
                title="My orders"
                description="Track delivery and order updates"
              />
              <QuickLink
                href="/account/addresses"
                title="Saved addresses"
                description="Manage shipping and billing details"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

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
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-neutral-200 p-3 transition-colors hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
    >
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {title}
      </p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
    </Link>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<PageLoader size="lg" message="Loading account..." />}>
      <AccountPageContent />
    </Suspense>
  );
}
