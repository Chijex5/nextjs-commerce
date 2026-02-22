"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface SizeGuide {
  id: string;
  productType: string;
  title: string;
  sizesChart: any;
  measurements: any;
  isActive: boolean;
  createdAt: string;
}

export default function SizeGuidesPageClient() {
  const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productType: "",
    title: "",
    sizesChart: "",
    measurements: "",
    isActive: true,
  });

  useEffect(() => {
    fetchSizeGuides();
  }, []);

  const fetchSizeGuides = async () => {
    try {
      const response = await fetch("/api/admin/size-guides");
      const data = await response.json();
      setSizeGuides(data.sizeGuides || []);
    } catch (error) {
      console.error("Error fetching size guides:", error);
      toast.error("Failed to load size guides");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productType.trim() || !formData.title.trim()) {
      toast.error("Product type and title are required");
      return;
    }

    let sizesChartJson;
    let measurementsJson;

    try {
      sizesChartJson = formData.sizesChart
        ? JSON.parse(formData.sizesChart)
        : {};
    } catch {
      toast.error("Invalid JSON in sizes chart");
      return;
    }

    try {
      measurementsJson = formData.measurements
        ? JSON.parse(formData.measurements)
        : {};
    } catch {
      toast.error("Invalid JSON in measurements");
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/size-guides/${editingId}`
        : "/api/admin/size-guides";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: formData.productType,
          title: formData.title,
          sizesChart: sizesChartJson,
          measurements: measurementsJson,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          editingId
            ? "Size guide updated successfully"
            : "Size guide created successfully"
        );
        setShowCreateForm(false);
        setEditingId(null);
        setFormData({
          productType: "",
          title: "",
          sizesChart: "",
          measurements: "",
          isActive: true,
        });
        fetchSizeGuides();
      } else {
        toast.error(data.error || "Failed to save size guide");
      }
    } catch (error) {
      console.error("Error saving size guide:", error);
      toast.error("Failed to save size guide");
    }
  };

  const handleEdit = (sizeGuide: SizeGuide) => {
    setEditingId(sizeGuide.id);
    setFormData({
      productType: sizeGuide.productType,
      title: sizeGuide.title,
      sizesChart: JSON.stringify(sizeGuide.sizesChart, null, 2),
      measurements: JSON.stringify(sizeGuide.measurements, null, 2),
      isActive: sizeGuide.isActive,
    });
    setShowCreateForm(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/size-guides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Size guide ${!currentStatus ? "activated" : "deactivated"}`);
        fetchSizeGuides();
      } else {
        toast.error("Failed to update size guide");
      }
    } catch (error) {
      console.error("Error toggling size guide:", error);
      toast.error("Failed to update size guide");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this size guide?")) return;

    try {
      const response = await fetch(`/api/admin/size-guides/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Size guide deleted successfully");
        fetchSizeGuides();
      } else {
        toast.error("Failed to delete size guide");
      }
    } catch (error) {
      console.error("Error deleting size guide:", error);
      toast.error("Failed to delete size guide");
    }
  };

  const loadExampleData = () => {
    const exampleSizesChart = {
      sizes: [
        { us: "6", uk: "5.5", eu: "38.5", cm: "23.5" },
        { us: "6.5", uk: "6", eu: "39", cm: "24" },
        { us: "7", uk: "6.5", eu: "40", cm: "24.5" },
        { us: "7.5", uk: "7", eu: "40.5", cm: "25" },
        { us: "8", uk: "7.5", eu: "41", cm: "25.5" },
        { us: "8.5", uk: "8", eu: "42", cm: "26" },
        { us: "9", uk: "8.5", eu: "42.5", cm: "26.5" },
        { us: "9.5", uk: "9", eu: "43", cm: "27" },
        { us: "10", uk: "9.5", eu: "44", cm: "27.5" },
        { us: "10.5", uk: "10", eu: "44.5", cm: "28" },
        { us: "11", uk: "10.5", eu: "45", cm: "28.5" },
        { us: "11.5", uk: "11", eu: "45.5", cm: "29" },
        { us: "12", uk: "11.5", eu: "46", cm: "29.5" },
      ],
    };

    const exampleMeasurements = {
      instructions: [
        "Stand on a piece of paper with your heel against a wall",
        "Mark the longest part of your foot on the paper",
        "Measure the distance from the wall to the mark",
        "Compare your measurement to the size chart",
        "If between sizes, we recommend sizing up",
      ],
      tips: [
        "Measure both feet and use the larger measurement",
        "Measure at the end of the day when feet are largest",
        "Wear the socks you plan to wear with the shoes",
      ],
    };

    setFormData({
      ...formData,
      sizesChart: JSON.stringify(exampleSizesChart, null, 2),
      measurements: JSON.stringify(exampleMeasurements, null, 2),
    });
    toast.success("Example data loaded");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100"></div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Loading size guides...
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
              Size Guides
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Manage size conversion charts ({sizeGuides.length} total)
            </p>
          </div>
          <button
            onClick={() => {
              if (showCreateForm) {
                setShowCreateForm(false);
                setEditingId(null);
                setFormData({
                  productType: "",
                  title: "",
                  sizesChart: "",
                  measurements: "",
                  isActive: true,
                });
              } else {
                setShowCreateForm(true);
              }
            }}
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {showCreateForm ? "Cancel" : "+ Create Size Guide"}
          </button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="mb-6 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {editingId ? "Edit Size Guide" : "Create New Size Guide"}
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Enter size chart data in JSON format
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Product Type <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.productType}
                      onChange={(e) =>
                        setFormData({ ...formData, productType: e.target.value })
                      }
                      placeholder="e.g., footwear, sandals, boots"
                      required
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g., Footwear Size Guide"
                      required
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Sizes Chart (JSON) <span className="text-red-600">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={loadExampleData}
                      className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    >
                      Load Example
                    </button>
                  </div>
                  <textarea
                    value={formData.sizesChart}
                    onChange={(e) =>
                      setFormData({ ...formData, sizesChart: e.target.value })
                    }
                    placeholder='{"sizes": [{"us": "6", "uk": "5.5", "eu": "38.5", "cm": "23.5"}]}'
                    required
                    rows={10}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Enter size conversions in JSON format with US, UK, EU, and CM
                    measurements
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Measurements & Instructions (JSON)
                  </label>
                  <textarea
                    value={formData.measurements}
                    onChange={(e) =>
                      setFormData({ ...formData, measurements: e.target.value })
                    }
                    placeholder='{"instructions": ["Step 1", "Step 2"], "tips": ["Tip 1"]}'
                    rows={8}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Optional measurement instructions and tips in JSON format
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    Active (visible to customers)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingId(null);
                      setFormData({
                        productType: "",
                        title: "",
                        sizesChart: "",
                        measurements: "",
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
                    {editingId ? "Update" : "Create"} Size Guide
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Size Guides List */}
        <div className="space-y-4">
          {sizeGuides.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                No size guides found
              </p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Create your first size guide to get started
              </p>
            </div>
          ) : (
            sizeGuides.map((guide) => (
              <div
                key={guide.id}
                className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {guide.title}
                        </h3>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                          Product Type: <span className="font-medium">{guide.productType}</span>
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          guide.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                        }`}
                      >
                        {guide.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Size Chart Preview */}
                    {guide.sizesChart?.sizes && (
                      <div className="mb-3 mt-4">
                        <p className="mb-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
                          Size Chart Preview
                        </p>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                <th className="px-3 py-2 text-left font-medium text-neutral-700 dark:text-neutral-300">
                                  US
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-neutral-700 dark:text-neutral-300">
                                  UK
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-neutral-700 dark:text-neutral-300">
                                  EU
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-neutral-700 dark:text-neutral-300">
                                  CM
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {guide.sizesChart.sizes.slice(0, 5).map((size: any, idx: number) => (
                                <tr
                                  key={idx}
                                  className="border-b border-neutral-100 dark:border-neutral-800"
                                >
                                  <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100">
                                    {size.us}
                                  </td>
                                  <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100">
                                    {size.uk}
                                  </td>
                                  <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100">
                                    {size.eu}
                                  </td>
                                  <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100">
                                    {size.cm}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {guide.sizesChart.sizes.length > 5 && (
                            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                              + {guide.sizesChart.sizes.length - 5} more sizes
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Created: {new Date(guide.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row gap-2 lg:flex-col">
                    <button
                      onClick={() => handleEdit(guide)}
                      className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(guide.id, guide.isActive)}
                      className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      {guide.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(guide.id)}
                      className="inline-flex items-center justify-center rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
