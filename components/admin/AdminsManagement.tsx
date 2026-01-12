"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LoadingDots from "components/loading-dots";

interface Admin {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

interface AdminsManagementProps {
  admins: Admin[];
  currentPage: number;
  totalPages: number;
  total: number;
  perPage: number;
  searchParams: {
    search?: string;
    status?: string;
  };
}

export default function AdminsManagement({
  admins,
  currentPage,
  totalPages,
  total,
  perPage,
  searchParams,
}: AdminsManagementProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "admin",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "admin",
    isActive: true,
  });

  const buildQueryString = (page: number) => {
    const params = new URLSearchParams();
    if (searchParams.search) params.set("search", searchParams.search);
    if (searchParams.status && searchParams.status !== "all")
      params.set("status", searchParams.status);
    params.set("page", page.toString());
    return params.toString();
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Admin added successfully");
        setIsAddModalOpen(false);
        setFormData({ email: "", name: "", password: "", role: "admin" });
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to add admin");
      }
    } catch (error) {
      toast.error("Failed to add admin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        toast.success("Admin updated successfully");
        setIsEditModalOpen(false);
        setSelectedAdmin(null);
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update admin");
      }
    } catch (error) {
      toast.error("Failed to update admin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;

    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Admin deleted successfully");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete admin");
      }
    } catch (error) {
      toast.error("Failed to delete admin");
    }
  };

  const openEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setEditFormData({
      name: admin.name || "",
      role: admin.role,
      isActive: admin.isActive,
    });
    setIsEditModalOpen(true);
  };

  return (
    <div>
      {/* Filters and Add Button */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form action="/admin/admins" method="get" className="flex flex-1 gap-4">
          <div className="flex-1">
            <input
              type="search"
              name="search"
              placeholder="Search by name or email..."
              defaultValue={searchParams.search}
              className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
          <select
            name="status"
            defaultValue={searchParams.status}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Filter
          </button>
        </form>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Admin
        </button>
      </div>

      {/* Admins Table */}
      {admins.length === 0 ? (
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
            No admins found
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Try adjusting your search or filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {admin.name
                            ? admin.name.charAt(0).toUpperCase()
                            : admin.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {admin.name || "No name"}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                      {admin.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        admin.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {admin.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                    {admin.lastLoginAt
                      ? new Date(admin.lastLoginAt).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(admin)}
                      className="mr-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800 sm:px-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
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
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <Link
                  href={`/admin/admins?${buildQueryString(currentPage - 1)}`}
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
                      href={`/admin/admins?${buildQueryString(pageNum)}`}
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
                  href={`/admin/admins?${buildQueryString(currentPage + 1)}`}
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

      {/* Add Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsAddModalOpen(false)}
            ></div>
            <div className="relative w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Add New Admin
              </h2>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <LoadingDots className="bg-white" />
                    ) : (
                      "Add Admin"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {isEditModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsEditModalOpen(false)}
            ></div>
            <div className="relative w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Edit Admin
              </h2>
              <form onSubmit={handleEditAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={selectedAdmin.email}
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Role
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, role: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editFormData.isActive}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          isActive: e.target.checked,
                        })
                      }
                      className="mr-2 rounded border-neutral-300 dark:border-neutral-700"
                    />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Active
                    </span>
                  </label>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <LoadingDots className="bg-white" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
