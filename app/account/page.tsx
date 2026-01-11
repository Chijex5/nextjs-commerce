"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/account");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="mx-auto mt-20 max-w-4xl px-4">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-48 rounded bg-neutral-200 dark:bg-neutral-800"></div>
          <div className="space-y-4">
            <div className="h-32 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
            <div className="h-32 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
          </div>
        </div>
      </div>
    );
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
              <p className="font-medium">
                {session.user?.name || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Email
              </p>
              <p className="font-medium">{session.user?.email}</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
