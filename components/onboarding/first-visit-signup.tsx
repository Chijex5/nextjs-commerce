"use client";

import { useUserSession } from "hooks/useUserSession";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LoadingDots from "components/loading-dots";
import { buttonClass } from "components/ui/button";
import { Field } from "components/ui/field";
import { LOOKS } from "lib/data/editorial";
import { X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

const INVITE_PHOTO = LOOKS[1]!;

const COOKIE_NAME = "first_visit_signup_shown";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const WELCOME_GIFT_COOKIE = "welcome_gift_signup";
const WELCOME_GIFT_MAX_AGE = 60 * 60 * 24;

// Engagement thresholds before we ever consider showing the invite.
const MIN_TIME_MS = 25_000; // 25s on page
const MIN_SCROLL = 0.4; // 40% down the page
const EXIT_INTENT_GRACE_MS = 6_000; // ignore accidental cursor flicks early on

// Routes where an invite would interrupt a deliberate task.
const EXCLUDED_PREFIXES = ["/auth", "/checkout", "/admin", "/account"];

function isExcludedPath(pathname: string | null) {
  if (!pathname) return false;
  return EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasSeenPopup() {
  if (typeof document === "undefined") return true;
  return document.cookie.includes(`${COOKIE_NAME}=true`);
}

function markPopupSeen() {
  document.cookie = `${COOKIE_NAME}=true; max-age=${COOKIE_MAX_AGE}; path=/`;
}

function markWelcomeGiftEligible() {
  document.cookie = `${WELCOME_GIFT_COOKIE}=true; max-age=${WELCOME_GIFT_MAX_AGE}; path=/`;
}

export default function FirstVisitSignupPopup() {
  const { status } = useUserSession();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // ── Intent-based trigger ──────────────────────────────────────────────
  // Desktop: exit-intent (cursor leaves toward the top of the viewport).
  // Everywhere (incl. mobile where mouseleave never fires): a soft
  // engagement signal — enough time on page AND enough scroll depth.
  useEffect(() => {
    if (status !== "unauthenticated") return;
    if (isExcludedPath(pathname)) return;
    if (hasSeenPopup()) return;

    let triggered = false;
    const armedAt = Date.now();

    const open = () => {
      if (triggered) return;
      triggered = true;
      markPopupSeen(); // dismiss or convert — either way, never nag again
      setIsOpen(true);
      cleanup();
    };

    const scrollProgress = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return 1; // short pages count as "read"
      return (window.scrollY || doc.scrollTop || 0) / scrollable;
    };

    const evaluateEngagement = () => {
      if (
        Date.now() - armedAt >= MIN_TIME_MS &&
        scrollProgress() >= MIN_SCROLL
      ) {
        open();
      }
    };

    const handleExitIntent = (event: MouseEvent) => {
      if (Date.now() - armedAt < EXIT_INTENT_GRACE_MS) return;
      // relatedTarget null + cursor at/above the top edge = leaving upward
      if (event.clientY <= 0) open();
    };

    const supportsHover =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover)").matches;

    window.addEventListener("scroll", evaluateEngagement, { passive: true });
    const intervalId = window.setInterval(evaluateEngagement, 5_000);
    if (supportsHover) {
      document.addEventListener("mouseleave", handleExitIntent);
    }

    function cleanup() {
      window.removeEventListener("scroll", evaluateEngagement);
      window.clearInterval(intervalId);
      document.removeEventListener("mouseleave", handleExitIntent);
    }

    return cleanup;
  }, [status, pathname]);

  // ── Escape to close + body scroll lock + initial focus ────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the email field so keyboard users land inside the dialog.
    const focusTimer = window.setTimeout(() => emailRef.current?.focus(), 60);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [isOpen]);

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setMagicLoading(true);
    markWelcomeGiftEligible();

    try {
      const response = await fetch("/api/user-auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          callbackUrl: "/account?welcome=1",
          purpose: "signup",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send magic link");
      } else {
        toast.success(
          data.message || "Check your email to finish setting up your account.",
        );
        setSent(true);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  };

  const handlePasswordSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    markWelcomeGiftEligible();
    setLoading(true);
    try {
      const registerResponse = await fetch("/api/user-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim() || undefined,
          email: formData.email,
          password: formData.password,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        toast.error(registerData.error || "Registration failed");
        return;
      }

      const loginResponse = await fetch("/api/user-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        toast.error(loginData.error || "Login failed");
        return;
      }

      router.push("/account?welcome=1");
      router.refresh();
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const submitting = usePassword ? loading : magicLoading;
  const update =
    (key: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((d) => ({ ...d, [key]: event.target.value }));

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 md:items-center md:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
        className="animate-slide-up grid max-h-[92svh] w-full overflow-hidden bg-canvas text-fg md:max-w-4xl md:grid-cols-2"
      >
        <div className="relative hidden bg-ink md:block">
          <Image
            src={INVITE_PHOTO.src}
            alt={INVITE_PHOTO.alt}
            fill
            sizes="448px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <p className="label absolute bottom-6 left-6 text-white/80">
            Handmade in Lagos
          </p>
        </div>

        <div className="relative overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pt-8">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            className="label absolute right-4 top-4 flex h-9 items-center gap-1.5"
          >
            Close <X className="size-4" />
          </button>

          {sent ? (
            <div className="pt-8">
              <p className="label text-fg-3">(Almost there)</p>
              <h2
                id="invite-title"
                className="display mt-3 text-[clamp(3rem,8vw,4.5rem)]"
              >
                Check your inbox.
              </h2>
              <p className="mt-4 text-fg-2">
                We sent a link to{" "}
                <strong className="text-fg">{formData.email}</strong>. Open it
                to finish setting up your account — your 10% welcome code lands
                right after.
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={buttonClass("solid", "lg", "mt-8 w-full")}
              >
                Keep browsing
              </button>
            </div>
          ) : (
            <>
              <p className="label pr-20 text-fg-3">(Welcome gift)</p>
              <h2
                id="invite-title"
                className="display mt-3 text-[clamp(3rem,8vw,4.75rem)]"
              >
                10% off your
                <br />
                first pair.
              </h2>
              <p className="mt-4 text-fg-2">
                Join D&apos;FOOTPRINT and we&apos;ll send a welcome code for
                your first order — plus a heads-up whenever a new pair drops.
              </p>

              <form
                onSubmit={usePassword ? handlePasswordSignup : handleMagicLink}
                className="mt-6 space-y-5"
              >
                {usePassword ? (
                  <Field
                    label="Full name (optional)"
                    autoComplete="name"
                    value={formData.name}
                    onChange={update("name")}
                  />
                ) : null}
                <Field
                  ref={emailRef}
                  label="Email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={update("email")}
                  placeholder="you@example.com"
                />
                {usePassword ? (
                  <>
                    <Field
                      label="Password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={update("password")}
                    />
                    <Field
                      label="Confirm password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={update("confirmPassword")}
                    />
                  </>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className={buttonClass("solid", "lg", "w-full !h-14")}
                >
                  {submitting ? (
                    <LoadingDots className="bg-canvas" />
                  ) : usePassword ? (
                    "Create account & claim 10%"
                  ) : (
                    "Email me my 10% code"
                  )}
                </button>
              </form>

              <p className="mt-4 text-xs text-fg-3">
                {usePassword
                  ? "You'll be signed in straight away."
                  : "No password needed — we'll email a one-time link to finish. Your code lands right after."}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setUsePassword((v) => !v)}
                  className="label link-underline"
                >
                  {usePassword
                    ? "Use an email link instead"
                    : "Set a password instead"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="label text-fg-3 hover:text-fg"
                >
                  No thanks
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
