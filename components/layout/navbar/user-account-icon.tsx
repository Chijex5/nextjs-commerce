"use client";

import { UserIcon } from "@heroicons/react/24/outline";
import { useUserSession } from "hooks/useUserSession";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function UserAccountIcon() {
  const { data: session, status, signOut } = useUserSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  if (status === "loading") {
    return (
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
        <UserIcon className="h-5 w-5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-black transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-500"
        aria-label="User account"
      >
        <UserIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {session ? (
            <>
              <div className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-700">
                <p className="text-sm font-medium">{session.name || "User"}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {session.email}
                </p>
              </div>
              <div className="py-1">
                <Link
                  href="/account"
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => setIsOpen(false)}
                >
                  My Account
                </Link>
                <Link
                  href="/orders"
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => setIsOpen(false)}
                >
                  My Orders
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="py-1">
              <Link
                href="/auth/login"
                className="block rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="block rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => setIsOpen(false)}
              >
                Register
              </Link>
              <Link
                href="/orders"
                className="block rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => setIsOpen(false)}
              >
                Track Order
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
