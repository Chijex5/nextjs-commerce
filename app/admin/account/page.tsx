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

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls =
  "block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-800";

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500"
    >
      {children}
    </label>
  );
}

function Divider() {
  return <div className="border-t border-neutral-100 dark:border-neutral-800" />;
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
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── Avatar — clean circle with initial ──────────────────────────────────────

const AVATAR_COLORS = [
  ["#18181b", "#ffffff"],  // zinc-900 / white
  ["#1e3a5f", "#bfdbfe"],  // dark blue / blue-200
  ["#14532d", "#bbf7d0"],  // dark green / green-200
  ["#4a1d96", "#ddd6fe"],  // dark purple / violet-200
  ["#7c2d12", "#fed7aa"],  // dark orange / orange-200
  ["#1c1917", "#e7e5e4"],  // stone-900 / stone-200
];

function AdminAvatar({ name, email, size = 48 }: { name: string | null; email: string; size?: number }) {
  const { initials, bg, fg } = useMemo(() => {
    const str = name || email;
    const parts = str.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
        : str.slice(0, 2).toUpperCase();

    const idx = str.charCodeAt(0) % AVATAR_COLORS.length;
    const [bg, fg] = AVATAR_COLORS[idx]!;
    return { initials, bg, fg };
  }, [name, email]);

  return (
    <div
      className="relative flex flex-shrink-0 items-center justify-center rounded-full ring-2 ring-white dark:ring-neutral-900"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color: fg,
        fontSize: size * 0.36,
        fontWeight: 600,
        letterSpacing: "-0.01em",
      }}
    >
      {initials}
      {/* Online dot */}
      <span
        className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900"
        style={{ width: size * 0.27, height: size * 0.27 }}
      />
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-neutral-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Order status chip ────────────────────────────────────────────────────────

function OrderStatusChip({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "completed"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
      : s === "pending" || s === "processing"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
        : s === "cancelled"
          ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${cls}`}>
      {status}
    </span>
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

  const label = score <= 1 ? "Weak" : score <= 2 ? "Fair" : score <= 3 ? "Good" : "Strong";
  const color = score <= 1 ? "bg-red-500" : score <= 2 ? "bg-amber-500" : score <= 3 ? "bg-blue-500" : "bg-emerald-500";
  const text = score <= 1 ? "text-red-600 dark:text-red-400" : score <= 2 ? "text-amber-600 dark:text-amber-400" : score <= 3 ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= Math.ceil(score / 1.2) ? color : "bg-neutral-200 dark:bg-neutral-700"}`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${text}`}>{label}</p>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1.5" y="5.5" width="9" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3.5 5.5V3.5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
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
        const res = await fetch("/api/admin/account", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load account");
        if (!mounted) return;
        setAdmin(data.admin);
        setStats(data.stats || null);
        setName(data.admin?.name || "");
      } catch (err) {
        if (!mounted) return;
        setProfileError(err instanceof Error ? err.message : "Failed to load account");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const roleLabel = useMemo(
    () => (admin?.role || "admin").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    [admin?.role],
  );

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(""); setProfileMessage(""); setProfileSaving(true);
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
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally { setProfileSaving(false); }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(""); setPasswordMessage("");
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError("All fields are required."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("New passwords do not match."); return; }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to change password");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPasswordMessage(data?.message || "Password changed successfully.");
      setPasswordOpen(false);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally { setPasswordSaving(false); }
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-28 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-48 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-48 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="space-y-5">

          {/* ══════════════════════════════════════════════════════
              SECTION 1 — Identity header (full width, horizontal)
              ══════════════════════════════════════════════════════ */}
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {/* Dark top band */}
            <div className="h-14 bg-neutral-900 dark:bg-neutral-800" />

            <div className="flex flex-col gap-4 px-6 pb-5 sm:flex-row sm:items-end sm:justify-between">
              {/* Avatar + core identity — avatar overlaps the band */}
              <div className="flex items-end gap-4">
                <div className="-mt-6">
                  <AdminAvatar name={admin?.name ?? null} email={admin?.email ?? ""} size={56} />
                </div>
                <div className="pb-0.5">
                  <div className="flex items-center gap-2.5">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {admin?.name || "Unnamed Admin"}
                    </p>
                    <StatusBadge active={admin?.isActive ?? true} />
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                    {admin?.email}
                  </p>
                </div>
              </div>

              {/* Meta pills — right side */}
              <div className="flex flex-wrap gap-3 pb-0.5">
                {[
                  { label: "Role", value: roleLabel },
                  { label: "Member since", value: formatDate(admin?.createdAt ?? null) },
                  { label: "Last login", value: formatDateTime(admin?.lastLoginAt ?? null) },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                      {m.label}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 2 — Stats metrics (full width, 4-col strip)
              ══════════════════════════════════════════════════════ */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Orders Handled", value: stats.totalAcknowledged.toString(), mono: false },
                { label: "Handled Value", value: formatMoney(stats.totalValue), mono: true },
                { label: "Last 30 days", value: stats.handled30d.toString(), mono: false },
                { label: "Last Acknowledged", value: formatDateTime(stats.lastAcknowledgedAt), mono: false },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                    {s.label}
                  </p>
                  <p className={`mt-1.5 font-semibold text-neutral-900 dark:text-neutral-100 ${s.mono ? "text-base font-mono" : "text-2xl"}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 3 — Settings + Activity (side-by-side)
              ══════════════════════════════════════════════════════ */}
          <div className="grid gap-4 lg:grid-cols-2">

            {/* ── LEFT: Settings forms ── */}
            <div className="space-y-4">

              {/* Profile form */}
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Profile</h2>
                  <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">Update your display name</p>
                </div>
                <form onSubmit={handleProfileSubmit} className="p-5">
                  <div className="space-y-4">
                    {/* Name */}
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

                    {/* Email — readonly, visually separated */}
                    <div>
                      <FieldLabel>Email address</FieldLabel>
                      <div className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
                        <span className="flex-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
                          {admin?.email}
                        </span>
                        <span className="flex-shrink-0 rounded-md bg-neutral-200/80 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500">
                          Read-only
                        </span>
                      </div>
                    </div>

                    {profileError && <Toast type="error" message={profileError} onDismiss={() => setProfileError("")} />}
                    {profileMessage && <Toast type="success" message={profileMessage} onDismiss={() => setProfileMessage("")} />}

                    <div className="flex justify-end border-t border-neutral-100 pt-4 dark:border-neutral-800">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                      >
                        {profileSaving ? <><Spinner />Saving…</> : "Save changes"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Password */}
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Password</h2>
                    <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                      {passwordOpen ? "Set a new password below" : "Never shown for security"}
                    </p>
                  </div>
                  {!passwordOpen ? (
                    <button
                      type="button"
                      onClick={() => setPasswordOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <LockIcon />
                      Change
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setPasswordOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordError(""); setPasswordMessage(""); }}
                      className="text-xs text-neutral-400 transition-colors hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* Closed state */}
                {!passwordOpen && (
                  <div className="flex items-center gap-2.5 px-5 py-4">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-1.5 w-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    ))}
                  </div>
                )}

                {/* Open form */}
                {passwordOpen && (
                  <form onSubmit={handlePasswordSubmit} className="p-5">
                    <div className="space-y-4">
                      <div>
                        <FieldLabel htmlFor="current-password">Current password</FieldLabel>
                        <input
                          id="current-password"
                          type="password"
                          autoComplete="current-password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          placeholder="Enter current password"
                          className={inputCls}
                          autoFocus
                        />
                      </div>

                      <Divider />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel htmlFor="new-password">New password</FieldLabel>
                          <input
                            id="new-password"
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="6+ characters"
                            className={inputCls}
                          />
                          <PasswordStrength password={newPassword} />
                        </div>
                        <div>
                          <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
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
                                ? "border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-800"
                                : confirmPassword && confirmPassword === newPassword
                                  ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100 dark:border-emerald-800"
                                  : ""
                            }`}
                          />
                          {confirmPassword && confirmPassword !== newPassword && (
                            <p className="mt-1.5 text-[11px] font-medium text-red-500 dark:text-red-400">Doesn't match</p>
                          )}
                          {confirmPassword && confirmPassword === newPassword && (
                            <p className="mt-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Matches ✓</p>
                          )}
                        </div>
                      </div>

                      {passwordError && <Toast type="error" message={passwordError} onDismiss={() => setPasswordError("")} />}
                      {passwordMessage && <Toast type="success" message={passwordMessage} onDismiss={() => setPasswordMessage("")} />}

                      <div className="flex justify-end border-t border-neutral-100 pt-4 dark:border-neutral-800">
                        <button
                          type="submit"
                          disabled={passwordSaving || (!!confirmPassword && confirmPassword !== newPassword)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                        >
                          {passwordSaving ? <><Spinner />Updating…</> : "Update password"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* ── RIGHT: Activity ── */}
            {stats ? (
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Recent Activity
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                    Orders you've acknowledged
                  </p>
                </div>

                {/* Status breakdown */}
                {stats.statusBreakdown.length > 0 && (
                  <>
                    <div className="px-5 py-4">
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                        Status breakdown
                      </p>
                      <div className="space-y-2">
                        {stats.statusBreakdown.map((row) => {
                          const pct = stats.totalAcknowledged > 0
                            ? Math.round((row.count / stats.totalAcknowledged) * 100)
                            : 0;
                          return (
                            <div key={row.status}>
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs capitalize text-neutral-600 dark:text-neutral-400">{row.status}</span>
                                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{row.count}</span>
                              </div>
                              <div className="h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                <div
                                  className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-between border-t border-neutral-100 pt-4 text-[11px] text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
                        <span>First: {formatDateTime(stats.firstAcknowledgedAt)}</span>
                        <span>Last: {formatDateTime(stats.lastAcknowledgedAt)}</span>
                      </div>
                    </div>
                    <Divider />
                  </>
                )}

                {/* Recent orders list */}
                {stats.recentOrders.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">No acknowledged orders yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {stats.recentOrders.map((order) => (
                      <div key={order.id} className="group px-5 py-3.5 transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-950/40">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="truncate text-xs font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
                              >
                                {order.orderNumber}
                              </Link>
                              <OrderStatusChip status={order.status} />
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-neutral-400 dark:text-neutral-500">
                              {order.customerName}
                              {order.email && order.email !== order.customerName && (
                                <> · {order.email}</>
                              )}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                              {formatMoney(order.totalAmount)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                              {formatDateTime(order.acknowledgedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* No stats — show a placeholder so the grid stays balanced */
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-400 dark:text-neutral-500">No activity data available.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}