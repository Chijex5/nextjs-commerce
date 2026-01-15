"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import PageLoader from "components/page-loader";
import LoadingDots from "components/loading-dots";
import { useUserSession } from "hooks/useUserSession";
import { deriveNameFromEmail } from "lib/user-utils";

export default function AccountPage() {
  const { data: session, status, refetch } = useUserSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showWelcome = searchParams.get("welcome") === "1";
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
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
      console.log("Session data:", session);
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
