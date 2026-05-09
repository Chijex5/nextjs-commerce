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

type ActivityItem = {
  id: string;
  type: "order" | "custom" | "review";
  label: string;
  status: string;
  createdAt: string;
  meta?: string;
};

type PendingOrderMatch = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currencyCode: string;
  createdAt: string;
};

type AccountSummary = {
  accountCreatedAt: string;
  lastLoginAt: string | null;
  hasShippingAddress: boolean;
  hasBillingAddress: boolean;
  ordersCount: number;
  customRequestsCount: number;
  reviewsCount: number;
  couponUsageCount: number;
  abandonedCartsCount: number;
  recoveredCartsCount: number;
  totalSpent: number;
  averageOrderValue: number;
  averageRating: number;
  currencyCode: string;
  paymentTransactionsCount: number;
  successfulPaymentsCount: number;
  failedPaymentsCount: number;
  catalogOrdersCount: number;
  customOrdersFromOrdersCount: number;
  lastOrderAt: string | null;
  newsletterStatus: string;
  newsletterSubscribedAt: string | null;
  newsletterUnsubscribedAt: string | null;
  recentActivity: ActivityItem[];
};

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number, currencyCode: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currencyCode || "NGN",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function getOrderPromptStorageKey(email: string, orderIds: string[]) {
  return `order-link-prompt:${email.trim().toLowerCase()}:${[...orderIds]
    .sort()
    .join(",")}`;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="ac-info-cell">
      <span className="ac-info-label">{label}</span>
      <span className="ac-info-value">{value}</span>
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
    <Link href={href} className="ac-quick-link">
      <span className="ac-quick-icon">{icon}</span>
      <div>
        <p className="ac-quick-title">{title}</p>
        <p className="ac-quick-desc">{description}</p>
      </div>
      <span className="ac-quick-arrow">→</span>
    </Link>
  );
}

// ─── main content ─────────────────────────────────────────────────────────────

function AccountPageContent() {
  const { data: session, status, refetch } = useUserSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const showWelcome = searchParams.get("welcome") === "1";

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  const [showWelcomeGift, setShowWelcomeGift] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingOrderMatches, setPendingOrderMatches] = useState<
    PendingOrderMatch[]
  >([]);
  const [showOrderLinkPrompt, setShowOrderLinkPrompt] = useState(false);
  const [linkingOrders, setLinkingOrders] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState(emptyPasswordData());

  const [addPasswordStep, setAddPasswordStep] = useState<
    "idle" | "otp-sent" | "done"
  >("idle");
  const [addPasswordData, setAddPasswordData] = useState(
    emptyAddPasswordData(),
  );
  const [sendingOtp, setSendingOtp] = useState(false);

  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });

  const loadAccountSummary = async () => {
    if (status !== "authenticated" || !session?.id) return;

    setSummaryLoading(true);
    try {
      const res = await fetch("/api/user-auth/account", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setSummary(data.summary || null);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

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
      if (needsNameReview) setIsEditing(true);
    }
  }, [status, router, session, showWelcome, derivedName]);

  useEffect(() => {
    if (!showWelcome) return;
    const hasGiftCookie =
      typeof document !== "undefined" &&
      document.cookie.includes("welcome_gift_signup=true");
    setShowWelcomeGift(hasGiftCookie);
  }, [showWelcome]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.id) return;
    void loadAccountSummary();
  }, [status, session?.id]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.email) {
      setPendingOrderMatches([]);
      setShowOrderLinkPrompt(false);
      return;
    }

    let cancelled = false;

    const fetchPendingOrderMatches = async () => {
      try {
        const res = await fetch("/api/user-auth/order-links", {
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) {
            setPendingOrderMatches([]);
            setShowOrderLinkPrompt(false);
          }
          return;
        }

        const data = await res.json();
        const matches = Array.isArray(data.orders)
          ? (data.orders as PendingOrderMatch[])
          : [];

        if (cancelled) return;

        setPendingOrderMatches(matches);

        if (!matches.length || typeof window === "undefined") {
          setShowOrderLinkPrompt(false);
          return;
        }

        const storageKey = getOrderPromptStorageKey(
          session.email,
          matches.map((order) => order.id),
        );
        setShowOrderLinkPrompt(
          window.localStorage.getItem(storageKey) !== "dismissed",
        );
      } catch {
        if (!cancelled) {
          setPendingOrderMatches([]);
          setShowOrderLinkPrompt(false);
        }
      }
    };

    void fetchPendingOrderMatches();

    return () => {
      cancelled = true;
    };
  }, [status, session?.email]);

  const handleCopyCoupon = async () => {
    try {
      await navigator.clipboard.writeText("NEWCOM");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleLinkPendingOrders = async () => {
    if (!pendingOrderMatches.length) return;

    setLinkingOrders(true);
    try {
      const orderIds = pendingOrderMatches.map((order) => order.id);
      const res = await fetch("/api/user-auth/order-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to link orders");
        return;
      }

      if (typeof window !== "undefined" && session?.email) {
        window.localStorage.removeItem(
          getOrderPromptStorageKey(session.email, orderIds),
        );
      }

      toast.success(
        pendingOrderMatches.length === 1
          ? `Linked ${pendingOrderMatches[0]?.orderNumber} to your account`
          : `Linked ${pendingOrderMatches.length} orders to your account`,
      );

      setPendingOrderMatches([]);
      setShowOrderLinkPrompt(false);
      await loadAccountSummary();
      await refetch();
      router.refresh();
    } catch {
      toast.error("Failed to link orders");
    } finally {
      setLinkingOrders(false);
    }
  };

  const handleIgnorePendingOrders = () => {
    if (!pendingOrderMatches.length || !session?.email) {
      setShowOrderLinkPrompt(false);
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        getOrderPromptStorageKey(
          session.email,
          pendingOrderMatches.map((order) => order.id),
        ),
        "dismissed",
      );
    }

    setShowOrderLinkPrompt(false);
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
    if (
      !addPasswordData.otp ||
      !addPasswordData.newPassword ||
      !addPasswordData.confirmPassword
    ) {
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Type DELETE exactly to continue.");
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/user-auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText: deleteConfirmText }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to delete account");
        return;
      }

      toast.success("Account deleted successfully");
      router.replace("/?accountDeleted=1");
      router.refresh();
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeletingAccount(false);
    }
  };

  if (status === "loading")
    return <PageLoader size="lg" message="Loading account..." />;
  if (!session) return null;

  const hasPassword = session.hasPassword ?? false;
  const initials = getInitials(session.name, session.email);
  const displayName = session.name || deriveNameFromEmail(session.email);

  return (
    <>
      <style>{`

        :root {
          --espresso:   #0A0704;
          --charcoal:   #100C06;
          --cream:      #F2E8D5;
          --sand:       #C9B99A;
          --muted:      #6A5A48;
          --terra:      #BF5A28;
          --gold:       #C0892A;
          --border:     rgba(242,232,213,0.09);
          --border-mid: rgba(242,232,213,0.18);
        }

        .ac-root {
          font-family: var(--font-dm-sans), sans-serif;
          color: var(--cream);
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-bottom: 80px;
        }

        /* ── HERO ── */
        .ac-hero {
          background: rgba(16,12,6,0.96);
          border: 1px solid var(--border);
          padding: 48px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 32px;
          flex-wrap: wrap;
        }
        .ac-hero::before {
          content: '';
          position: absolute;
          right: -60px; top: -60px;
          width: 280px; height: 280px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .ac-hero::after {
          content: '';
          position: absolute;
          right: 50px; top: 50px;
          width: 120px; height: 120px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .ac-hero-left { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; position: relative; z-index: 1; flex: 1; min-width: 0; }
        .ac-avatar {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: rgba(191,90,40,0.15);
          border: 1px solid rgba(191,90,40,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 24px;
          font-weight: 400;
          color: var(--terra);
          flex-shrink: 0;
          letter-spacing: 0.05em;
        }
        .ac-hero-name {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 300;
          line-height: 1.0;
          color: var(--cream);
          margin-bottom: 4px;
        }
        .ac-hero-email {
          font-size: 13px;
          color: var(--muted);
          letter-spacing: 0.03em;
        }
        .ac-hero-right {
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }

        /* ── STATS BAR ── */
        .ac-stats-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          border: 1px solid var(--border);
          border-top: none;
        }
        .ac-stat {
          background: rgba(242,232,213,0.02);
          padding: 18px 24px;
        }
        .ac-stat-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--terra);
          margin-bottom: 6px;
        }
        .ac-stat-value {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 18px;
          font-weight: 400;
          color: var(--cream);
        }

        /* ── PROFILE PROMPT ── */
        .ac-prompt {
          border: 1px solid rgba(192,137,42,0.35);
          border-top: none;
          background: rgba(192,137,42,0.06);
          padding: 14px 24px;
          font-size: 13px;
          color: #d4a84b;
          letter-spacing: 0.03em;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ac-prompt::before {
          content: '';
          display: block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
        }

        /* ── MAIN GRID ── */
        .ac-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 2px;
          align-items: start;
          border: 1px solid var(--border);
          border-top: none;
        }

        /* ── PANEL BASE ── */
        .ac-panel {
          background: rgba(16,12,6,0.7);
          padding: 36px 40px;
          border-right: 1px solid var(--border);
        }
        .ac-panel-last { border-right: none; }
        .ac-panel-accent {
          height: 1px;
          background: linear-gradient(90deg, var(--terra) 0%, var(--gold) 50%, transparent 100%);
          margin-bottom: 24px;
        }
        .ac-panel-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 28px;
        }
        .ac-panel-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 26px;
          font-weight: 300;
          color: var(--cream);
        }
        .ac-panel-action {
          background: none;
          border: none;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--terra);
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }
        .ac-panel-action:hover { color: #d96a30; }

        /* ── PROFILE VIEW ── */
        .ac-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
        .ac-info-cell {
          background: rgba(242,232,213,0.02);
          border: 1px solid var(--border);
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ac-info-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .ac-info-value {
          font-size: 14px;
          color: var(--cream);
          font-weight: 400;
          overflow-wrap: anywhere;
        }

        /* ── FORM ── */
        .ac-form { display: flex; flex-direction: column; gap: 14px; }
        .ac-field-label {
          display: block;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .ac-input {
          width: 100%;
          background: rgba(10,7,4,0.7);
          border: 1px solid rgba(242,232,213,0.09);
          color: var(--cream);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .ac-input::placeholder { color: var(--muted); }
        .ac-input:focus { border-color: rgba(191,90,40,0.5); }
        .ac-input:disabled {
          background: rgba(242,232,213,0.03);
          color: rgba(242,232,213,0.25);
          cursor: not-allowed;
        }
        .ac-input-hint {
          font-size: 11px;
          color: var(--muted);
          margin-top: 5px;
          letter-spacing: 0.03em;
        }
        .ac-form-actions { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 6px; }
        .ac-btn-primary {
          background: var(--terra);
          border: none;
          color: var(--cream);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 12px 22px;
          cursor: pointer;
          transition: background 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 120px;
        }
        .ac-btn-primary:hover { background: #a34d22; }
        .ac-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .ac-btn-ghost {
          background: transparent;
          border: 1px solid var(--border-mid);
          color: var(--muted);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 12px 20px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .ac-btn-ghost:hover { border-color: rgba(242,232,213,0.35); color: var(--cream); }
        .ac-btn-text {
          background: none;
          border: none;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          color: var(--muted);
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s;
          padding: 0;
          margin-top: 4px;
          align-self: flex-start;
        }
        .ac-btn-text:hover { color: var(--cream); }
        .ac-btn-text:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── DATA FOOTPRINT ── */
        .ac-summary-strip {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
        }
        .ac-summary-metric {
          background: rgba(242,232,213,0.02);
          border: 1px solid var(--border);
          padding: 14px;
        }
        .ac-summary-metric-label {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 6px;
        }
        .ac-summary-metric-value {
          color: var(--cream);
          font-size: 14px;
        }

        /* ── INSIGHTS + ACTIVITY ── */
        .ac-insight-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
        }
        .ac-insight-card {
          background: rgba(242,232,213,0.02);
          border: 1px solid var(--border);
          padding: 12px;
        }
        .ac-insight-label {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 6px;
        }
        .ac-insight-value {
          color: var(--cream);
          font-size: 13px;
          line-height: 1.5;
        }

        .ac-activity-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ac-activity-item {
          border: 1px solid var(--border);
          background: rgba(242,232,213,0.02);
          padding: 10px 12px;
        }
        .ac-activity-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .ac-activity-label {
          color: var(--cream);
          font-size: 12px;
          font-weight: 500;
        }
        .ac-activity-date {
          color: var(--muted);
          font-size: 10px;
          white-space: nowrap;
        }
        .ac-activity-meta {
          margin-top: 3px;
          color: var(--muted);
          font-size: 11px;
          line-height: 1.4;
        }

        .ac-status-pill {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(242,232,213,0.18);
          padding: 2px 8px;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--sand);
        }

        /* ── DANGER ZONE ── */
        .ac-danger {
          border: 1px solid rgba(191,90,40,0.35);
          background: rgba(191,90,40,0.06);
          padding: 14px;
        }
        .ac-danger-title {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #e08a58;
          margin-bottom: 6px;
        }
        .ac-danger-note {
          font-size: 12px;
          color: #cfb7a0;
          line-height: 1.6;
          margin-bottom: 12px;
        }
        .ac-danger-input {
          width: 100%;
          background: rgba(10,7,4,0.9);
          border: 1px solid rgba(191,90,40,0.35);
          color: var(--cream);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 10px 12px;
          margin-bottom: 10px;
          box-sizing: border-box;
        }
        .ac-danger-btn {
          background: transparent;
          border: 1px solid rgba(191,90,40,0.45);
          color: #f0b08b;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 10px 14px;
          cursor: pointer;
        }
        .ac-danger-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* ── RIGHT COLUMN ── */
        .ac-right {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ac-right-panel {
          background: rgba(16,12,6,0.5);
          padding: 28px 32px;
          border-bottom: 1px solid var(--border);
        }
        .ac-right-panel:last-child { border-bottom: none; }
        .ac-right-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 20px;
          font-weight: 300;
          color: var(--cream);
          margin-bottom: 16px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }

        /* Security note */
        .ac-security-note {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        /* ── QUICK LINKS ── */
        .ac-quick-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
          text-decoration: none;
          transition: padding-left 0.2s;
        }
        .ac-quick-link:last-child { border-bottom: none; }
        .ac-quick-link:hover { padding-left: 4px; }
        .ac-quick-icon {
          width: 32px; height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(191,90,40,0.1);
          border: 1px solid rgba(191,90,40,0.2);
          border-radius: 50%;
          color: var(--terra);
          flex-shrink: 0;
        }
        .ac-quick-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--cream);
          margin-bottom: 2px;
        }
        .ac-quick-desc { font-size: 11px; color: var(--muted); }
        .ac-quick-arrow { margin-left: auto; font-size: 12px; color: var(--muted); flex-shrink: 0; transition: color 0.2s; }
        .ac-quick-link:hover .ac-quick-arrow { color: var(--terra); }

        /* ── THEME SECTION ── */
        .ac-theme-note {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 16px;
          line-height: 1.5;
        }

        /* ── WELCOME MODAL ── */
        .ac-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(10,7,4,0.88);
          backdrop-filter: blur(4px);
        }
        .ac-modal {
          width: 100%;
          max-width: 440px;
          background: #100C06;
          border: 1px solid var(--border-mid);
          padding: 40px;
          position: relative;
        }
        .ac-order-modal { max-width: 560px; }
        .ac-modal-close {
          position: absolute;
          top: 16px; right: 16px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
          font-size: 11px;
          letter-spacing: 0.1em;
          padding: 6px 12px;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .ac-modal-close:hover { color: var(--cream); border-color: var(--border-mid); }
        .ac-modal-eyebrow {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--terra);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ac-modal-eyebrow::before {
          content: '';
          display: block;
          width: 20px; height: 1px;
          background: var(--terra);
        }
        .ac-modal-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 34px;
          font-weight: 300;
          line-height: 1.05;
          color: var(--cream);
          margin-bottom: 8px;
        }
        .ac-modal-sub {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 28px;
          line-height: 1.5;
        }
        .ac-order-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ac-order-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          border: 1px solid var(--border);
          background: rgba(242,232,213,0.02);
          padding: 14px 16px;
        }
        .ac-order-number {
          color: var(--cream);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.04em;
        }
        .ac-order-meta {
          margin-top: 4px;
          color: var(--muted);
          font-size: 11px;
          line-height: 1.4;
        }
        .ac-order-amount {
          color: var(--terra);
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }
        .ac-order-actions {
          display: flex;
          gap: 12px;
          margin-top: 28px;
          flex-wrap: wrap;
        }
        .ac-order-actions .ac-btn-primary,
        .ac-order-actions .ac-btn-ghost {
          flex: 1;
          min-width: 150px;
        }
        .ac-coupon-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 1px dashed rgba(192,137,42,0.4);
          background: rgba(192,137,42,0.05);
          padding: 16px 20px;
        }
        .ac-coupon-code {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 28px;
          font-weight: 400;
          color: var(--gold);
          letter-spacing: 0.1em;
        }
        .ac-coupon-copy {
          background: transparent;
          border: 1px solid rgba(192,137,42,0.4);
          color: var(--gold);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 8px 14px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          flex-shrink: 0;
        }
        .ac-coupon-copy:hover { background: rgba(192,137,42,0.12); }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .ac-grid { grid-template-columns: 1fr; }
          .ac-panel { border-right: none; border-bottom: 1px solid var(--border); }
          .ac-panel-last { border-bottom: none; }
          .ac-stats-bar { grid-template-columns: 1fr 1fr; }
          .ac-order-actions .ac-btn-primary,
          .ac-order-actions .ac-btn-ghost { flex: 1 1 100%; }
        }
        @media (max-width: 640px) {
          .ac-hero { padding: 28px 24px; }
          .ac-panel { padding: 24px; }
          .ac-right-panel { padding: 20px 24px; }
          .ac-modal { padding: 28px 24px; }
          .ac-info-grid { grid-template-columns: 1fr; }
          .ac-stats-bar { grid-template-columns: 1fr; }
          .ac-order-item { flex-direction: column; }
          .ac-summary-strip { grid-template-columns: 1fr; }
          .ac-insight-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ac-root">
        {/* ── ORDER LINK PROMPT ── */}
        {showOrderLinkPrompt && pendingOrderMatches.length > 0 && (
          <div
            className="ac-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleIgnorePendingOrders();
              }
            }}
          >
            <div className="ac-modal ac-order-modal">
              <button
                className="ac-modal-close"
                onClick={handleIgnorePendingOrders}
                aria-label="Close"
              >
                Close ✕
              </button>
              <div className="ac-modal-eyebrow">Order match found</div>
              <h2 className="ac-modal-title">Link these orders?</h2>
              <p className="ac-modal-sub">
                We found {pendingOrderMatches.length} order
                {pendingOrderMatches.length === 1 ? "" : "s"} that share your
                login email and are not linked to your account yet.
              </p>

              <div className="ac-order-list">
                {pendingOrderMatches.map((order) => {
                  const amount = Number(order.totalAmount);
                  return (
                    <div key={order.id} className="ac-order-item">
                      <div>
                        <div className="ac-order-number">
                          {order.orderNumber}
                        </div>
                        <div className="ac-order-meta">
                          {formatDate(order.createdAt)} · {order.status}
                        </div>
                      </div>
                      <div className="ac-order-amount">
                        {formatCurrency(amount, order.currencyCode)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="ac-order-actions">
                <button
                  className="ac-btn-primary"
                  onClick={handleLinkPendingOrders}
                  disabled={linkingOrders}
                >
                  {linkingOrders ? (
                    <LoadingDots className="bg-[#F2E8D5]" />
                  ) : (
                    "Link orders"
                  )}
                </button>
                <button
                  className="ac-btn-ghost"
                  onClick={handleIgnorePendingOrders}
                >
                  Ignore for now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── WELCOME GIFT MODAL ── */}
        {showWelcomeGift && !showOrderLinkPrompt && (
          <div
            className="ac-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowWelcomeGift(false);
                document.cookie = "welcome_gift_signup=; Max-Age=0; path=/";
                router.replace("/account");
              }
            }}
          >
            <div className="ac-modal">
              <button
                className="ac-modal-close"
                onClick={() => {
                  setShowWelcomeGift(false);
                  document.cookie = "welcome_gift_signup=; Max-Age=0; path=/";
                  router.replace("/account");
                }}
                aria-label="Close"
              >
                Close ✕
              </button>
              <div className="ac-modal-eyebrow">Welcome gift</div>
              <h2 className="ac-modal-title">
                ₦1,500 off your
                <br />
                first order
              </h2>
              <p className="ac-modal-sub">
                Use this code at checkout. One use only.
              </p>
              <div className="ac-coupon-box">
                <span className="ac-coupon-code">NEWCOM</span>
                <button onClick={handleCopyCoupon} className="ac-coupon-copy">
                  {copied ? "Copied ✓" : "Copy code"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HERO ── */}
        <header className="ac-hero">
          <div className="ac-hero-left">
            <div className="ac-avatar">{initials}</div>
            <div>
              <h1 className="ac-hero-name">{displayName}</h1>
              <p className="ac-hero-email">{session.email}</p>
            </div>
          </div>
          <div className="ac-hero-right">
            <ThemeToggle />
          </div>
        </header>

        {/* ── STATS BAR ── */}
        <div className="ac-stats-bar">
          <div className="ac-stat">
            <div className="ac-stat-label">Auth method</div>
            <div className="ac-stat-value">
              {hasPassword ? "Password" : "Magic link"}
            </div>
          </div>
          <div className="ac-stat">
            <div className="ac-stat-label">Orders</div>
            <div className="ac-stat-value">{summary?.ordersCount ?? "-"}</div>
          </div>
          <div className="ac-stat">
            <div className="ac-stat-label">Lifetime spend</div>
            <div className="ac-stat-value">
              {summary
                ? formatCurrency(summary.totalSpent, summary.currencyCode)
                : "-"}
            </div>
          </div>
        </div>

        {/* ── PROFILE PROMPT ── */}
        {showProfilePrompt && (
          <div className="ac-prompt">
            Please confirm your profile details before continuing.
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div className="ac-grid">
          {/* ── PROFILE DETAILS ── */}
          <section className="ac-panel">
            <div className="ac-panel-accent" />
            <div className="ac-panel-head">
              <h2 className="ac-panel-title">Profile details</h2>
              {!isEditing && (
                <button
                  className="ac-panel-action"
                  onClick={() => setIsEditing(true)}
                >
                  Edit →
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="ac-form">
                <div>
                  <label className="ac-field-label">Full name</label>
                  <input
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, name: e.target.value }))
                    }
                    className="ac-input"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="ac-field-label">Phone</label>
                  <input
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="ac-input"
                    placeholder="e.g. +2348012345678"
                  />
                </div>
                <div>
                  <label className="ac-field-label">Email address</label>
                  <input value={profile.email} disabled className="ac-input" />
                  <p className="ac-input-hint">Email cannot be changed.</p>
                </div>
                <div className="ac-form-actions">
                  <button
                    onClick={handleEditProfile}
                    disabled={saving}
                    className="ac-btn-primary"
                  >
                    {saving ? (
                      <LoadingDots className="bg-[#F2E8D5]" />
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
                    className="ac-btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="ac-info-grid">
                  <InfoCell
                    label="Full name"
                    value={session.name || "Not set"}
                  />
                  <InfoCell
                    label="Email address"
                    value={session.email || "Not set"}
                  />
                  <InfoCell
                    label="Phone number"
                    value={session.phone || "Not provided"}
                  />
                  <InfoCell label="Account status" value="Active" />
                </div>

                <div className="ac-summary-strip">
                  <div className="ac-summary-metric">
                    <p className="ac-summary-metric-label">Member since</p>
                    <p className="ac-summary-metric-value">
                      {summary
                        ? formatDate(summary.accountCreatedAt)
                        : "Loading..."}
                    </p>
                  </div>
                  <div className="ac-summary-metric">
                    <p className="ac-summary-metric-label">Last sign in</p>
                    <p className="ac-summary-metric-value">
                      {summary ? formatDate(summary.lastLoginAt) : "Loading..."}
                    </p>
                  </div>
                  <div className="ac-summary-metric">
                    <p className="ac-summary-metric-label">Newsletter</p>
                    <p className="ac-summary-metric-value">
                      {summary
                        ? summary.newsletterStatus === "active"
                          ? "Subscribed"
                          : "Not subscribed"
                        : "Loading..."}
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* ── RIGHT COLUMN ── */}
          <div className="ac-right ac-panel-last">
            {/* Security */}
            <div className="ac-right-panel">
              <div className="ac-right-title">
                <span>Security</span>
                {hasPassword && !isChangingPassword && (
                  <button
                    className="ac-panel-action"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    Change →
                  </button>
                )}
              </div>

              {hasPassword ? (
                isChangingPassword ? (
                  <div className="ac-form">
                    <input
                      type="password"
                      placeholder="Current password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((p) => ({
                          ...p,
                          currentPassword: e.target.value,
                        }))
                      }
                      className="ac-input"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((p) => ({
                          ...p,
                          newPassword: e.target.value,
                        }))
                      }
                      className="ac-input"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((p) => ({
                          ...p,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="ac-input"
                    />
                    <div className="ac-form-actions">
                      <button
                        onClick={handleChangePassword}
                        disabled={saving}
                        className="ac-btn-primary"
                      >
                        {saving ? (
                          <LoadingDots className="bg-[#F2E8D5]" />
                        ) : (
                          "Update"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData(emptyPasswordData());
                        }}
                        className="ac-btn-ghost"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="ac-security-note">
                    Password is set and protected.
                  </p>
                )
              ) : (
                <div className="ac-form">
                  {addPasswordStep === "idle" && (
                    <>
                      <p className="ac-security-note">
                        You signed in with a magic link. Add a password to also
                        sign in with email and password.
                      </p>
                      <button
                        onClick={handleRequestOtp}
                        disabled={sendingOtp}
                        className="ac-btn-primary"
                        style={{ alignSelf: "flex-start" }}
                      >
                        {sendingOtp ? (
                          <LoadingDots className="bg-[#F2E8D5]" />
                        ) : (
                          "Add password"
                        )}
                      </button>
                    </>
                  )}
                  {addPasswordStep === "otp-sent" && (
                    <>
                      <p className="ac-security-note">
                        We sent a 6-digit code to{" "}
                        <strong style={{ color: "var(--sand)" }}>
                          {session.email}
                        </strong>
                        . Enter it below with your new password.
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="6-digit code"
                        value={addPasswordData.otp}
                        onChange={(e) =>
                          setAddPasswordData((p) => ({
                            ...p,
                            otp: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        className="ac-input"
                        style={{ letterSpacing: "0.2em" }}
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        value={addPasswordData.newPassword}
                        onChange={(e) =>
                          setAddPasswordData((p) => ({
                            ...p,
                            newPassword: e.target.value,
                          }))
                        }
                        className="ac-input"
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={addPasswordData.confirmPassword}
                        onChange={(e) =>
                          setAddPasswordData((p) => ({
                            ...p,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="ac-input"
                      />
                      <div className="ac-form-actions">
                        <button
                          onClick={handleAddPassword}
                          disabled={saving}
                          className="ac-btn-primary"
                        >
                          {saving ? (
                            <LoadingDots className="bg-[#F2E8D5]" />
                          ) : (
                            "Confirm"
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setAddPasswordStep("idle");
                            setAddPasswordData(emptyAddPasswordData());
                          }}
                          className="ac-btn-ghost"
                        >
                          Cancel
                        </button>
                      </div>
                      <button
                        onClick={handleRequestOtp}
                        disabled={sendingOtp}
                        className="ac-btn-text"
                      >
                        {sendingOtp ? "Resending…" : "Resend code"}
                      </button>
                    </>
                  )}
                  {addPasswordStep === "done" && (
                    <p className="ac-security-note">
                      Password added successfully.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Appearance */}
            <div className="ac-right-panel">
              <div className="ac-right-title">Account insights</div>

              {summaryLoading ? (
                <p className="ac-security-note">Loading account activity...</p>
              ) : summary ? (
                <div className="ac-insight-grid">
                  <div className="ac-insight-card">
                    <p className="ac-insight-label">Order mix</p>
                    <p className="ac-insight-value">
                      {summary.catalogOrdersCount} catalog /{" "}
                      {summary.customOrdersFromOrdersCount} custom
                    </p>
                  </div>
                  <div className="ac-insight-card">
                    <p className="ac-insight-label">Avg order value</p>
                    <p className="ac-insight-value">
                      {formatCurrency(
                        summary.averageOrderValue,
                        summary.currencyCode,
                      )}
                    </p>
                  </div>
                  <div className="ac-insight-card">
                    <p className="ac-insight-label">Payments</p>
                    <p className="ac-insight-value">
                      {summary.successfulPaymentsCount} successful /{" "}
                      {summary.failedPaymentsCount} failed
                    </p>
                  </div>
                  <div className="ac-insight-card">
                    <p className="ac-insight-label">Engagement</p>
                    <p className="ac-insight-value">
                      {summary.reviewsCount} reviews /{" "}
                      {summary.couponUsageCount} coupon uses
                    </p>
                  </div>
                </div>
              ) : (
                <p className="ac-security-note">
                  No account insights available yet.
                </p>
              )}
            </div>

            <div className="ac-right-panel">
              <div className="ac-right-title">Recent activity</div>

              {summary?.recentActivity?.length ? (
                <div className="ac-activity-list">
                  {summary.recentActivity.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="ac-activity-item"
                    >
                      <div className="ac-activity-head">
                        <p className="ac-activity-label">{item.label}</p>
                        <span className="ac-status-pill">{item.status}</span>
                      </div>
                      <p className="ac-activity-meta">
                        {item.meta ? `${item.meta} • ` : ""}
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ac-security-note">
                  No recent activity to show yet.
                </p>
              )}
            </div>

            <div className="ac-right-panel">
              <div className="ac-right-title">Appearance</div>
              <p className="ac-theme-note">
                Choose a colour theme. "System" follows your device setting.
              </p>
              <ThemeToggle />
            </div>

            {/* Quick links */}
            <div className="ac-right-panel">
              <div className="ac-right-title">Quick links</div>
              <QuickLink
                href="/orders"
                title="My orders"
                description="Track delivery and order updates"
                icon={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 0 0-4 0v2" />
                  </svg>
                }
              />
              <QuickLink
                href="/account/addresses"
                title="Saved addresses"
                description="Manage shipping and billing details"
                icon={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                }
              />
            </div>

            <div className="ac-right-panel">
              <div className="ac-right-title">Privacy controls</div>
              <div className="ac-danger">
                <p className="ac-danger-title">
                  Delete all personal information
                </p>
                <p className="ac-danger-note">
                  This permanently deletes your account profile, address data,
                  saved authentication records, and newsletter profile.
                  Essential order and payment records are retained only in
                  anonymized form for legal and audit purposes.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    className="ac-danger-btn"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Start deletion
                  </button>
                ) : (
                  <>
                    <input
                      className="ac-danger-input"
                      value={deleteConfirmText}
                      onChange={(e) =>
                        setDeleteConfirmText(e.target.value.toUpperCase())
                      }
                      placeholder="Type DELETE"
                      maxLength={6}
                    />
                    <div className="ac-form-actions">
                      <button
                        className="ac-danger-btn"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                      >
                        {deletingAccount ? "Deleting..." : "Delete account"}
                      </button>
                      <button
                        className="ac-btn-ghost"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText("");
                        }}
                        disabled={deletingAccount}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<PageLoader size="lg" message="Loading account..." />}>
      <AccountPageContent />
    </Suspense>
  );
}
