"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import PageLoader from "components/page-loader";
import { useUserSession } from "hooks/useUserSession";

export default function AccountPage() {
  const { data: session, status } = useUserSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/account");
    }
  }, [status, router]);

  if (status === "loading") {
    return <PageLoader size="lg" message="Loading account..." />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="mx-auto mt-20 max-w-4xl px-4">
      <h1 className="mb-6 text-3xl font-bold">My Account</h1>

      <div className="space-y-6">
        {/* Account Info */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
          <h2 className="mb-4 text-xl font-semibold">Account Information</h2>
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
          </div>
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
