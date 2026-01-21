"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";

interface Testimonial {
  id: string;
  customerName: string;
  role: string | null;
  content: string;
  rating: number;
  image: string | null;
  isActive: boolean;
  position: number;
  createdAt: string;
}

export default function TestimonialsPageClient() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    role: "",
    content: "",
    rating: 5,
    image: "",
    position: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchTestimonials();
  }, [filter]);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch(`/api/admin/testimonials?status=${filter}`);
      const data = await response.json();
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim() || !formData.content.trim()) {
      toast.error("Customer name and content are required");
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/testimonials/${editingId}`
        : "/api/admin/testimonials";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          role: formData.role || null,
          content: formData.content,
          rating: formData.rating,
          image: formData.image || null,
          position: formData.position,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          editingId
            ? "Testimonial updated successfully"
            : "Testimonial created successfully"
        );
        setShowCreateForm(false);
        setEditingId(null);
        setFormData({
          customerName: "",
          role: "",
          content: "",
          rating: 5,
          image: "",
          position: 0,
          isActive: true,
        });
        fetchTestimonials();
      } else {
        toast.error(data.error || "Failed to save testimonial");
      }
    } catch (error) {
      console.error("Error saving testimonial:", error);
      toast.error("Failed to save testimonial");
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setFormData({
      customerName: testimonial.customerName,
      role: testimonial.role || "",
      content: testimonial.content,
      rating: testimonial.rating,
      image: testimonial.image || "",
      position: testimonial.position,
      isActive: testimonial.isActive,
    });
    setShowCreateForm(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Testimonial ${!currentStatus ? "activated" : "deactivated"}`);
        fetchTestimonials();
      } else {
        toast.error("Failed to update testimonial");
      }
    } catch (error) {
      console.error("Error toggling testimonial:", error);
      toast.error("Failed to update testimonial");
    }
  };

  const handleUpdatePosition = async (id: string, newPosition: number) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: newPosition }),
      });

      if (response.ok) {
        toast.success("Position updated");
        fetchTestimonials();
      } else {
        toast.error("Failed to update position");
      }
    } catch (error) {
      console.error("Error updating position:", error);
      toast.error("Failed to update position");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Testimonial deleted successfully");
        fetchTestimonials();
      } else {
        toast.error("Failed to delete testimonial");
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400" : "text-neutral-300 dark:text-neutral-700"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100"></div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Loading testimonials...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Customer Testimonials
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Manage testimonials for your homepage ({testimonials.length} total)
            </p>
          </div>
          <button
            onClick={() => {
              if (showCreateForm) {
                setShowCreateForm(false);
                setEditingId(null);
                setFormData({
                  customerName: "",
                  role: "",
                  content: "",
                  rating: 5,
                  image: "",
                  position: 0,
                  isActive: true,
                });
              } else {
                setShowCreateForm(true);
              }
            }}
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {showCreateForm ? "Cancel" : "+ Create Testimonial"}
          </button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="mb-6 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {editingId ? "Edit Testimonial" : "Create New Testimonial"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Customer Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                      placeholder="e.g., Sarah Johnson"
                      required
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Role/Title
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      placeholder="e.g., Fashion Enthusiast"
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Content <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Customer's testimonial..."
                    required
                    rows={4}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Rating <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(e) =>
                        setFormData({ ...formData, rating: parseInt(e.target.value) })
                      }
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    >
                      {[5, 4, 3, 2, 1].map((num) => (
                        <option key={num} value={num}>
                          {num} Star{num !== 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Position
                    </label>
                    <input
                      type="number"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          position: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      min="0"
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        Active
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingId(null);
                      setFormData({
                        customerName: "",
                        role: "",
                        content: "",
                        rating: 5,
                        image: "",
                        position: 0,
                        isActive: true,
                      });
                    }}
                    className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    {editingId ? "Update" : "Create"} Testimonial
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === "active"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === "inactive"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            Inactive
          </button>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900">
              <svg
                className="mb-3 h-12 w-12 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                No testimonials found
              </p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Create your first testimonial to get started
              </p>
            </div>
          ) : (
            testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex flex-col rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {testimonial.image ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-full">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.customerName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                        <span className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">
                          {testimonial.customerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {testimonial.customerName}
                      </h3>
                      {testimonial.role && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {testimonial.role}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      testimonial.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    {testimonial.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mb-3">{renderStars(testimonial.rating)}</div>

                <p className="mb-4 flex-1 text-sm text-neutral-700 dark:text-neutral-300">
                  {testimonial.content.length > 150
                    ? `${testimonial.content.substring(0, 150)}...`
                    : testimonial.content}
                </p>

                <div className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                  Position: {testimonial.position}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(testimonial)}
                    className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleToggleActive(testimonial.id, testimonial.isActive)
                    }
                    className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {testimonial.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() =>
                      handleUpdatePosition(testimonial.id, testimonial.position - 1)
                    }
                    disabled={testimonial.position === 0}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() =>
                      handleUpdatePosition(testimonial.id, testimonial.position + 1)
                    }
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial.id)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
