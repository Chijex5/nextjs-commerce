"use client";

import { Dialog, DialogPanel, TransitionChild, Transition } from "@headlessui/react";
import { Bars3Icon, UserIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useUserSession } from "hooks/useUserSession";
import { Menu } from "lib/shopify/types";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

export default function MobileMenu({ menu }: { menu: Menu[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useUserSession();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open mobile menu"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-black transition-colors md:hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      <Transition show={isOpen}>
        <Dialog onClose={() => setIsOpen(false)} className="relative z-50">
<<<<<<< HEAD
          <TransitionChild
=======
          <Transition.Child
>>>>>>> f048c7eb9503111630607767c891548765c9af04
            as={Fragment}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
<<<<<<< HEAD
          </TransitionChild>

          <TransitionChild
=======
          </Transition.Child>

          <Transition.Child
>>>>>>> f048c7eb9503111630607767c891548765c9af04
            as={Fragment}
            enter="transition-transform duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
<<<<<<< HEAD
            <DialogPanel className="fixed inset-y-0 left-0 flex w-[86%] max-w-sm flex-col justify-between border-r border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
=======
            <Dialog.Panel className="fixed inset-y-0 left-0 flex w-[86%] max-w-sm flex-col justify-between border-r border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
>>>>>>> f048c7eb9503111630607767c891548765c9af04
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                    Menu
                  </p>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-black transition-colors dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close mobile menu"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {menu.length ? (
                  <ul className="space-y-2">
                    {menu.map((item: Menu) => (
                      <li key={item.title}>
                        <Link
                          href={item.path}
                          prefetch={true}
                          onClick={() => setIsOpen(false)}
                          className="block rounded-xl px-3 py-3 text-base font-medium text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href={session ? "/account" : "/auth/login"}
                        prefetch={true}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <UserIcon className="h-5 w-5" />
                        {session ? "My Account" : "Login"}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/orders"
                        prefetch={true}
                        onClick={() => setIsOpen(false)}
                        className="block rounded-xl px-3 py-3 text-base font-medium text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
                      >
                        Orders
                      </Link>
                    </li>
                    <li>
                      <Link
                        href={session ? "/account" : "/auth/login"}
                        prefetch={true}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <UserIcon className="h-5 w-5" />
                        {session ? "My Account" : "Login"}
                      </Link>
                    </li>
                  </ul>
                ) : null}
              </div>

              <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Handcrafted footwear from Lagos, Nigeria.
                </p>
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
}
