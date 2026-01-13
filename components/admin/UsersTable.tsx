"use client";

import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  _count: {
    orders: number;
  };
}

interface UsersTableProps {
  users: User[];
  currentPage: number;
  totalPages: number;
  total: number;
  perPage: number;
  searchParams: {
    search?: string;
    status?: string;
    perPage?: string;
  };
}

export default function UsersTable({
  users,
  currentPage,
  totalPages,
  total,
  perPage,
  searchParams,
}: UsersTableProps) {
  const buildQueryString = (page: number) => {
    const params = new URLSearchParams();
    if (searchParams.search) params.set("search", searchParams.search);
    if (searchParams.status && searchParams.status !== "all")
      params.set("status", searchParams.status);
    if (searchParams.perPage && searchParams.perPage !== "20")
      params.set("perPage", searchParams.perPage);
    params.set("page", page.toString());
    return params.toString();
  };

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <svg
          className="mx-auto h-12 w-12 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          No users found
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Try adjusting your search or filter.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:block">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Last Login
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                        {user.name
                          ? user.name.charAt(0).toUpperCase()
                          : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {user.name || "No name"}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-neutral-900 dark:text-neutral-100">
                    {user.phone || "No phone"}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      user.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {user._count.orders}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString()
                    : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 lg:hidden">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    {user.name
                      ? user.name.charAt(0).toUpperCase()
                      : user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {user.name || "No name"}
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {user.email}
                  </div>
                </div>
              </div>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  user.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {user.phone && (
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Phone:
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {user.phone}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">
                  Orders:
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {user._count.orders}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">
                  Joined:
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">
                  Last Login:
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-4 border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800 sm:px-6">
          {/* Mobile View */}
          <div className="flex flex-1 justify-between sm:hidden">
            <Link
              href={`/admin/users?${buildQueryString(currentPage - 1)}`}
              className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage <= 1
                  ? "pointer-events-none text-neutral-400"
                  : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              Previous
            </Link>
            <Link
              href={`/admin/users?${buildQueryString(currentPage + 1)}`}
              className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage >= totalPages
                  ? "pointer-events-none text-neutral-400"
                  : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              Next
            </Link>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * perPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * perPage, total)}
                </span>{" "}
                of <span className="font-medium">{total}</span> results
              </p>

              {/* Per Page Selector */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="perPage"
                  className="text-sm text-neutral-600 dark:text-neutral-400"
                >
                  Show:
                </label>
                <select
                  id="perPage"
                  value={perPage}
                  onChange={(e) => {
                    const newPerPage = e.target.value;
                    const params = new URLSearchParams();
                    if (searchParams.search)
                      params.set("search", searchParams.search);
                    if (searchParams.status && searchParams.status !== "all")
                      params.set("status", searchParams.status);
                    params.set("page", "1");
                    params.set("perPage", newPerPage);
                    window.location.href = `/admin/users?${params.toString()}`;
                  }}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="20">20 per page</option>
                  <option value="40">40 per page</option>
                  <option value="60">60 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <Link
                  href={`/admin/users?${buildQueryString(currentPage - 1)}`}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 focus:z-20 focus:outline-offset-0 dark:ring-neutral-700 dark:hover:bg-neutral-700 ${
                    currentPage <= 1 ? "pointer-events-none" : ""
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return (
                    <Link
                      key={pageNum}
                      href={`/admin/users?${buildQueryString(pageNum)}`}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === pageNum
                          ? "z-10 bg-neutral-900 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-neutral-100 dark:text-neutral-900"
                          : "text-neutral-900 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 focus:z-20 focus:outline-offset-0 dark:text-neutral-100 dark:ring-neutral-700 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
                <Link
                  href={`/admin/users?${buildQueryString(currentPage + 1)}`}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 focus:z-20 focus:outline-offset-0 dark:ring-neutral-700 dark:hover:bg-neutral-700 ${
                    currentPage >= totalPages ? "pointer-events-none" : ""
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
