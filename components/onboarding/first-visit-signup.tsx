"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LoadingDots from "components/loading-dots";
import { useUserSession } from "hooks/useUserSession";

const COOKIE_NAME = "first_visit_signup_shown";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const WELCOME_GIFT_COOKIE = "welcome_gift_signup";
const WELCOME_GIFT_MAX_AGE = 60 * 60 * 24;

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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    if (hasSeenPopup()) return;
    setIsOpen(true);
    markPopupSeen();
  }, [status]);

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send magic link");
      } else {
        toast.success(data.message || "Check your email for the sign-in link.");
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

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-black">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          aria-label="Close"
        >
          <svg
            className="h-6 w-6"
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

        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Welcome gift
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
            Join D&apos;FOOTPRINT and get 10% off
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Create your account in seconds. We&apos;ll send your gift after you
            sign up.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            Check your inbox for the magic link to finish signing in.
          </div>
        ) : (
          <form
            onSubmit={usePassword ? handlePasswordSignup : handleMagicLink}
            className="space-y-4"
          >
            {!usePassword && (
              <>
                <label
                  htmlFor="popup-email"
                  className="block text-sm font-medium"
                >
                  Email
                </label>
                <input
                  id="popup-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({ ...formData, email: event.target.value })
                  }
                  required
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  placeholder="you@email.com"
                />
              </>
            )}

            {usePassword && (
              <>
                <div>
                  <label
                    htmlFor="popup-name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Full name (optional)
                  </label>
                  <input
                    id="popup-name"
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData({ ...formData, name: event.target.value })
                    }
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label
                    htmlFor="popup-email-password"
                    className="mb-2 block text-sm font-medium"
                  >
                    Email
                  </label>
                  <input
                    id="popup-email-password"
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData({ ...formData, email: event.target.value })
                    }
                    required
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="popup-password"
                    className="mb-2 block text-sm font-medium"
                  >
                    Password
                  </label>
                  <input
                    id="popup-password"
                    type="password"
                    value={formData.password}
                    onChange={(event) =>
                      setFormData({ ...formData, password: event.target.value })
                    }
                    required
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label
                    htmlFor="popup-confirm"
                    className="mb-2 block text-sm font-medium"
                  >
                    Confirm password
                  </label>
                  <input
                    id="popup-confirm"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        confirmPassword: event.target.value,
                      })
                    }
                    required
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={usePassword ? loading : magicLoading}
              className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              {usePassword
                ? loading
                  ? "Creating account..."
                  : "Create account"
                : magicLoading
                  ? "Sending link..."
                  : "Send magic link"}
            </button>
            <button
              type="button"
              onClick={() => setUsePassword((current) => !current)}
              className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              {usePassword ? "Use magic link instead" : "Use password instead"}
            </button>
            {!usePassword && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                We&apos;ll email a one-time sign-in link.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
