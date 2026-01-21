import Link from "next/link";
import { signOut } from "next-auth/react";

export default function AdminNav({
  currentPage,
  userEmail,
}: {
  currentPage: string;
  userEmail?: string | null;
}) {
  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", key: "dashboard" },
    { href: "/admin/products", label: "Products", key: "products" },
    { href: "/admin/collections", label: "Collections", key: "collections" },
    { href: "/admin/content", label: "Content", key: "content" },
    {
      href: "/admin/custom-orders",
      label: "Custom Orders",
      key: "custom-orders",
    },
    { href: "/admin/orders", label: "Orders", key: "orders" },
    { href: "/admin/coupons", label: "Coupons", key: "coupons" },
    { href: "/admin/reviews", label: "Reviews", key: "reviews" },
    { href: "/admin/testimonials", label: "Testimonials", key: "testimonials" },
    { href: "/admin/size-guides", label: "Size Guides", key: "size-guides" },
    { href: "/admin/users", label: "Users", key: "users" },
    { href: "/admin/admins", label: "Admins", key: "admins" },
  ];

  return (
    <nav className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link
                href="/admin/dashboard"
                className="text-xl font-bold text-neutral-900 dark:text-neutral-100"
              ></Link>
            </div>
            <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    currentPage === item.key
                      ? "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100"
                      : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-300"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-neutral-700 dark:text-neutral-300 sm:block">
              {userEmail}
            </span>
            <Link
              href="/api/auth/signout"
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 sm:hidden">
        <div className="space-y-1 pb-3 pt-2">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
                currentPage === item.key
                  ? "border-neutral-900 bg-neutral-50 text-neutral-900 dark:border-neutral-100 dark:bg-neutral-800 dark:text-neutral-100"
                  : "border-transparent text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
