"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import PageLoader from "components/page-loader";
import LoadingDots from "components/loading-dots";
import { useUserSession } from "hooks/useUserSession";
import { deriveNameFromEmail } from "lib/user-utils";

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
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const derivedName = useMemo(() => {
    if (!session?.email) return "";
    return deriveNameFromEmail(session.email);
  }, [session?.email]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/account");
    } else if (status === "authenticated" && session) {
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
    if (showWelcome) {
      const hasGiftCookie =
        typeof document !== "undefined" &&
        document.cookie.includes("welcome_gift_signup=true");
      setShowWelcomeGift(hasGiftCookie);
    }
  }, [showWelcome]);

  const handleCopyCoupon = async () => {
    try {
      await navigator.clipboard.writeText("NEWCOM");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
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

      if (response.ok) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        setShowProfilePrompt(false);
        await refetch();
        router.replace("/account");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
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
      toast.error("All fields are required");
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

      if (response.ok) {
        toast.success("Password changed successfully");
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return <PageLoader size="lg" message="Loading account..." />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="mx-auto mt-20 max-w-4xl px-4 pb-20">
      {showWelcomeGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-xs sm:max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-lg dark:border-neutral-800 dark:bg-black">
            <button
              onClick={() => {
                setShowWelcomeGift(false);
                document.cookie = "welcome_gift_signup=; Max-Age=0; path=/";
                router.replace("/account");
              }}
              className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              aria-label="Close"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  Welcome gift
                </p>
                <h2 className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
                  Welcome to D&apos;FOOTPRINT
                </h2>
              </div>
            </div>

            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Here&apos;s a little gift to start you up.
            </p>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                Code
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-[0.25em] text-neutral-900 dark:text-white">
                  NEWCOM
                </span>
                <button
                  type="button"
                  onClick={handleCopyCoupon}
                  className="rounded-full border border-neutral-300 px-2 py-0.5 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              Use this code at checkout for 10% off your first purchase.
            </p>
            <p className="mt-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Make haste — this welcome offer closes soon.
            </p>
          </div>
        </div>
      )}
      <h1 className="mb-6 text-3xl font-bold">My Account</h1>

      <div className="space-y-6">
        {/* Account Info */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Account Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Edit Profile
              </button>
            )}
          </div>
          {showProfilePrompt && !isEditing && (
            <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-100">
              <p className="font-medium">Welcome! We prefilled your name.</p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">
                Feel free to edit it so we address you properly.
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 text-xs font-medium text-blue-700 hover:underline dark:text-blue-200"
              >
                Edit name
              </button>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email (cannot be changed)
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-4 py-2 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="+234 801 234 5678"
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleEditProfile}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <LoadingDots className="bg-white" /> : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setProfile({
                      name: session.name || "",
                      email: session.email || "",
                      phone: session.phone || "",
                    });
                  }}
                  disabled={saving}
                  className="rounded-md border border-neutral-300 px-6 py-2 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Name
                </p>
                <p className="font-medium">{session.name || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Email
                </p>
                <p className="font-medium">{session.email}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Phone
                </p>
                <p className="font-medium">{session.phone || "Not provided"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Security Settings */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Security</h2>
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Change Password
              </button>
            )}
          </div>

          {isChangingPassword ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <LoadingDots className="bg-white" />
                  ) : (
                    "Change Password"
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  disabled={saving}
                  className="rounded-md border border-neutral-300 px-6 py-2 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Password
              </p>
              <p className="font-medium">••••••••</p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
          <h2 className="mb-4 text-xl font-semibold">Quick Links</h2>
          <div className="space-y-2">
            <Link
              href="/orders"
              className="block rounded-md border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              <h3 className="font-medium">My Orders</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                View and track your orders
              </p>
            </Link>
            <Link
              href="/account/addresses"
              className="block rounded-md border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              <h3 className="font-medium">Saved Addresses</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Manage your shipping and billing addresses
              </p>
            </Link>
          </div>
        </div>
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
