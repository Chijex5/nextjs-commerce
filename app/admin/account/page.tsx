"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminAccount = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type AccountStats = {
  totalAcknowledged: number;
  totalValue: number;
  handled30d: number;
  firstAcknowledgedAt: string | null;
  lastAcknowledgedAt: string | null;
  statusBreakdown: Array<{ status: string; count: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    deliveryStatus: string;
    customerName: string;
    email: string;
    totalAmount: number;
    acknowledgedAt: string | null;
    createdAt: string;
  }>;
};

// ─── Primitives ───────────────────────────────────────────────────────────────

const inputCls =
  "block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-800";

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500"
    >
      {children}
    </label>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-neutral-400"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Toast({
  type,
  message,
  onDismiss,
}: {
  type: "success" | "error";
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
      }`}
    >
      <p className="leading-snug">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-px flex-shrink-0 opacity-50 transition-opacity hover:opacity-100"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M1 1l10 10M11 1L1 11"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
        {label}
      </span>
      <span className="text-right text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {value}
      </span>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="border-t border-neutral-100 dark:border-neutral-800" />
  );
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    case "pending":
    case "processing":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    default:
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AdminAvatar({ name, email }: { name: string | null; email: string }) {
  const initials = useMemo(() => {
    if (name) {
      const parts = name.trim().split(" ");
      return parts.length >= 2
        ? `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
        : parts[0]![0]!.toUpperCase();
    }
    return email[0]!.toUpperCase();
  }, [name, email]);

  return (
    <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-xl font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
      {initials}
      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900" />
    </div>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  if (!password) return null;

  const label =
    score <= 1 ? "Weak" : score <= 2 ? "Fair" : score <= 3 ? "Good" : "Strong";
  const color =
    score <= 1
      ? "bg-red-500"
      : score <= 2
        ? "bg-amber-500"
        : score <= 3
          ? "bg-blue-500"
          : "bg-emerald-500";
  const textColor =
    score <= 1
      ? "text-red-600 dark:text-red-400"
      : score <= 2
        ? "text-amber-600 dark:text-amber-400"
        : score <= 3
          ? "text-blue-600 dark:text-blue-400"
          : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= Math.ceil(score / 1.2)
                ? color
                : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          />
        ))}
      </div>
      <p className={`mt-1 text-[11px] font-medium ${textColor}`}>{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAccountPage() {
  const [admin, setAdmin] = useState<AdminAccount | null>(null);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/account", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load account");
        if (!mounted) return;
        setAdmin(data.admin);
        setStats(data.stats || null);
        setName(data.admin?.name || "");
      } catch (err) {
        if (!mounted) return;
        setProfileError(
          err instanceof Error ? err.message : "Failed to load account",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const memberSinceLabel = useMemo(() => {
    if (!admin?.createdAt) return "—";
    return new Date(admin.createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [admin?.createdAt]);

  const lastLoginLabel = useMemo(() => {
    if (!admin?.lastLoginAt) return "—";
    return new Date(admin.lastLoginAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [admin?.lastLoginAt]);

  const roleLabel = useMemo(
    () =>
      (admin?.role || "admin")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    [admin?.role],
  );

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setProfileSaving(true);
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update profile");
      setAdmin(data.admin);
      setName(data.admin?.name || "");
      setProfileMessage(data?.message || "Profile updated.");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to change password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(data?.message || "Password changed successfully.");
      setPasswordOpen(false);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  // ─── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-36 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3 w-56 rounded-lg bg-neutral-100 dark:bg-neutral-800/60" />
            <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="h-64 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
              <div className="space-y-4">
                <div className="h-48 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-16 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Account
          </h1>
          <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
            Manage your admin profile and credentials
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* ── LEFT: Identity card ── */}
          <aside className="space-y-4">
            {/* Identity panel */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              {/* Top band */}
              <div className="h-16 bg-neutral-900 dark:bg-neutral-800" />

              {/* Avatar + name */}
              <div className="px-5 pb-5">
                <div className="-mt-8 mb-4">
                  <AdminAvatar
                    name={admin?.name ?? null}
                    email={admin?.email ?? ""}
                  />
                </div>

                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {admin?.name || "Unnamed Admin"}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 break-all">
                    {admin?.email}
                  </p>
                </div>

                <div className="mt-3">
                  <StatusBadge active={admin?.isActive ?? true} />
                </div>
              </div>

              <SectionDivider />

              {/* Meta rows */}
              <div className="divide-y divide-neutral-100 px-5 dark:divide-neutral-800">
                <MetaRow label="Role" value={roleLabel} />
                <MetaRow label="Member since" value={memberSinceLabel} />
                <MetaRow label="Last login" value={lastLoginLabel} />
              </div>
            </div>

            {/* Email read-only tile */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                Email address
              </p>
              <p className="mt-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 break-all">
                {admin?.email}
              </p>
              <p className="mt-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                Email cannot be changed here.
              </p>
            </div>
          </aside>

          {/* ── RIGHT: Forms ── */}
          <div className="space-y-4">
            {/* ── Performance snapshot ── */}
            {stats && (
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Performance Snapshot
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                    Your acknowledged-order activity and trends
                  </p>
                </div>

                <div className="grid gap-3 border-b border-neutral-100 p-6 sm:grid-cols-2 xl:grid-cols-4 dark:border-neutral-800">
                  <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Handled Orders
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                      {stats.totalAcknowledged}
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Handled Value
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatMoney(stats.totalValue)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Handled (30d)
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                      {stats.handled30d}
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Last Ack
                    </p>
                    <p className="mt-1 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatDateTime(stats.lastAcknowledgedAt)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 p-6 lg:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Status mix
                    </h3>
                    {stats.statusBreakdown.length === 0 ? (
                      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                        No acknowledged orders yet.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {stats.statusBreakdown.map((row) => (
                          <li
                            key={row.status}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="capitalize text-neutral-700 dark:text-neutral-300">
                              {row.status}
                            </span>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {row.count}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4 space-y-1.5 border-t border-neutral-100 pt-4 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                      <div className="flex items-center justify-between">
                        <span>First acknowledgement</span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {formatDateTime(stats.firstAcknowledgedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Last acknowledgement</span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {formatDateTime(stats.lastAcknowledgedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Recent acknowledged orders
                      </h3>
                    </div>

                    {stats.recentOrders.length === 0 ? (
                      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                        Nothing to show yet.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {stats.recentOrders.map((order) => (
                          <div
                            key={order.id}
                            className="rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-800"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="truncate text-xs font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
                              >
                                {order.orderNumber}
                              </Link>
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(order.status)}`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                              {order.customerName} • {order.email}
                            </p>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                              <span>{formatMoney(order.totalAmount)}</span>
                              <span>
                                {formatDateTime(order.acknowledgedAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Profile form ── */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Profile
                </h2>
                <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                  Update your display name
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="p-6">
                <div className="space-y-5">
                  <div>
                    <FieldLabel htmlFor="admin-name">Full name</FieldLabel>
                    <input
                      id="admin-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className={inputCls}
                    />
                  </div>

                  {profileError && (
                    <Toast
                      type="error"
                      message={profileError}
                      onDismiss={() => setProfileError("")}
                    />
                  )}
                  {profileMessage && (
                    <Toast
                      type="success"
                      message={profileMessage}
                      onDismiss={() => setProfileMessage("")}
                    />
                  )}

                  <div className="flex items-center justify-end border-t border-neutral-100 pt-4 dark:border-neutral-800">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                    >
                      {profileSaving ? (
                        <>
                          <Spinner />
                          Saving…
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* ── Password section ── */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              {/* Always-visible header row */}
              <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Password
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                    {passwordOpen
                      ? "Set a new password below"
                      : "Last updated: never shown for security"}
                  </p>
                </div>

                {!passwordOpen ? (
                  <button
                    type="button"
                    onClick={() => setPasswordOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <LockIcon />
                    Change password
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordOpen(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError("");
                      setPasswordMessage("");
                    }}
                    className="text-xs text-neutral-400 transition-colors hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Collapsed state placeholder */}
              {!passwordOpen && (
                <div className="flex items-center gap-3 px-6 py-5">
                  <div className="flex items-center gap-2">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-neutral-200 dark:bg-neutral-700"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    ••••••••
                  </span>
                </div>
              )}

              {/* Expanded password form */}
              {passwordOpen && (
                <form onSubmit={handlePasswordSubmit} className="p-6">
                  <div className="space-y-5">
                    {/* Current password */}
                    <div>
                      <FieldLabel htmlFor="current-password">
                        Current password
                      </FieldLabel>
                      <input
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="Enter your current password"
                        className={inputCls}
                        autoFocus
                      />
                    </div>

                    <SectionDivider />

                    {/* New + confirm */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="new-password">
                          New password
                        </FieldLabel>
                        <input
                          id="new-password"
                          type="password"
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          placeholder="At least 6 characters"
                          className={inputCls}
                        />
                        <PasswordStrength password={newPassword} />
                      </div>
                      <div>
                        <FieldLabel htmlFor="confirm-password">
                          Confirm new password
                        </FieldLabel>
                        <input
                          id="confirm-password"
                          type="password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Repeat new password"
                          className={`${inputCls} ${
                            confirmPassword && confirmPassword !== newPassword
                              ? "border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-700"
                              : confirmPassword &&
                                  confirmPassword === newPassword
                                ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100 dark:border-emerald-700"
                                : ""
                          }`}
                        />
                        {confirmPassword && confirmPassword !== newPassword && (
                          <p className="mt-1.5 text-[11px] font-medium text-red-500 dark:text-red-400">
                            Passwords don't match
                          </p>
                        )}
                        {confirmPassword && confirmPassword === newPassword && (
                          <p className="mt-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Passwords match ✓
                          </p>
                        )}
                      </div>
                    </div>

                    {passwordError && (
                      <Toast
                        type="error"
                        message={passwordError}
                        onDismiss={() => setPasswordError("")}
                      />
                    )}
                    {passwordMessage && (
                      <Toast
                        type="success"
                        message={passwordMessage}
                        onDismiss={() => setPasswordMessage("")}
                      />
                    )}

                    <div className="flex items-center justify-end border-t border-neutral-100 pt-4 dark:border-neutral-800">
                      <button
                        type="submit"
                        disabled={
                          passwordSaving ||
                          (!!confirmPassword && confirmPassword !== newPassword)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                      >
                        {passwordSaving ? (
                          <>
                            <Spinner />
                            Updating…
                          </>
                        ) : (
                          "Update password"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Micro icons ──────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="1.5"
        y="5.5"
        width="9"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M3.5 5.5V3.5a2.5 2.5 0 0 1 5 0v2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="animate-spin"
    >
      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <path
        d="M7 1.5A5.5 5.5 0 0 1 12.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
