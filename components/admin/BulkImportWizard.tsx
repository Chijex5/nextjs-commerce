"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateBulkImportTemplate, parseCSV } from "../../lib/admin-utils";

type ImportStep = "upload" | "preview" | "importing" | "complete";

type ProductRow = {
  title: string;
  description?: string;
  price: string;
  available_for_sale?: string;
  tags?: string;
  image_url?: string;
  variant_title?: string;
  variant_size?: string;
  variant_color?: string;
};

export default function BulkImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  }>({ success: 0, failed: 0, errors: [] });

  const handleDownloadTemplate = () => {
    const template = generateBulkImportTemplate();
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setProducts(parsed as ProductRow[]);
      setStep("preview");
      toast.success(`Loaded ${parsed.length} products`);
    } catch (error) {
      console.error("Parse error:", error);
      toast.error("Failed to parse CSV file. Please check the format.");
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setStep("importing");
    setProgress({ current: 0, total: products.length });

    const importResults = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product) continue;

      setProgress({ current: i + 1, total: products.length });

      try {
        // Generate handle from title
        const handle = product.title
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");

        // Prepare product data
        const productData = {
          title: product.title,
          handle: handle + `-${Date.now()}-${i}`, // Ensure unique handle
          description: product.description || "",
          descriptionHtml: product.description
            ? `<p>${product.description}</p>`
            : "",
          availableForSale: product.available_for_sale !== "false",
          seoTitle: `${product.title} - D'FOOTPRINT`,
          seoDescription: product.description?.substring(0, 160) || "",
          tags: product.tags
            ? product.tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t)
            : [],
          image: product.image_url || undefined,
          variant: {
            title: product.variant_title || "Default",
            price: parseFloat(product.price),
            currencyCode: "NGN",
            availableForSale: product.available_for_sale !== "false",
            selectedOptions: [] as any[],
          },
        };

        // Add size/color to selected options if provided
        if (product.variant_size) {
          productData.variant.selectedOptions.push({
            name: "Size",
            value: product.variant_size,
          });
        }
        if (product.variant_color) {
          productData.variant.selectedOptions.push({
            name: "Color",
            value: product.variant_color,
          });
        }

        const response = await fetch("/api/admin/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create ${product.title}`);
        }

        importResults.success++;
      } catch (error: any) {
        importResults.failed++;
        importResults.errors.push(
          `Row ${i + 1} (${product.title}): ${error.message}`,
        );
      }

      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setResults(importResults);
    setStep("complete");
    setImporting(false);

    if (importResults.success > 0) {
      toast.success(`Successfully imported ${importResults.success} products`);
    }
    if (importResults.failed > 0) {
      toast.error(`Failed to import ${importResults.failed} products`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Upload */}
      {step === "upload" && (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                Step 1: Upload CSV File
              </h2>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Template
              </button>
            </div>

            <div className="mb-4">
              <label className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700">
                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                  <svg
                    className="mb-4 h-12 w-12 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">
                    CSV file only
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    CSV Format Guidelines
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <ul className="list-disc space-y-1 pl-5">
                      <li>First row must be headers</li>
                      <li>
                        Required columns: <strong>title</strong>,{" "}
                        <strong>price</strong>
                      </li>
                      <li>Slugs will be auto-generated from titles</li>
                      <li>SEO fields will be auto-populated</li>
                      <li>Images can be URLs or uploaded separately</li>
                      <li>Perfect for adding 200+ products at once!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="p-6">
              <h2 className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
                Step 2: Review & Import
              </h2>

              <div className="mb-4 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✓ Loaded <strong>{products.length}</strong> products from CSV
                </p>
              </div>

              <div className="mb-6 max-h-96 overflow-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-neutral-500">
                        #
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-neutral-500">
                        Title
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-neutral-500">
                        Price
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-neutral-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {products.map((product, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-neutral-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100">
                          {product.title}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-neutral-500">
                          NGN {parseFloat(product.price).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-sm">
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Ready
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={() => {
                    setStep("upload");
                    setFile(null);
                    setProducts([]);
                  }}
                  className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Import {products.length} Products
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Importing */}
      {step === "importing" && (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="p-6">
            <h2 className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Importing Products...
            </h2>

            <div className="mb-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Progress
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-2 bg-neutral-900 transition-all dark:bg-neutral-100"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Please wait while we import your products. This may take a few
              minutes for large batches.
            </p>
          </div>
        </div>
      )}

      {/* Step Complete */}
      {step === "complete" && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="p-6">
              <h2 className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
                Import Complete!
              </h2>

              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-3 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {results.success} products imported successfully
                    </p>
                  </div>
                </div>

                {results.failed > 0 && (
                  <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                    <div className="flex items-start gap-3">
                      <svg
                        className="h-5 w-5 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="mb-2 font-medium text-red-800 dark:text-red-200">
                          {results.failed} products failed to import
                        </p>
                        {results.errors.length > 0 && (
                          <ul className="list-disc space-y-1 pl-5 text-sm text-red-700 dark:text-red-300">
                            {results.errors.slice(0, 5).map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                            {results.errors.length > 5 && (
                              <li>
                                ... and {results.errors.length - 5} more errors
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={() => {
                    setStep("upload");
                    setFile(null);
                    setProducts([]);
                    setResults({ success: 0, failed: 0, errors: [] });
                  }}
                  className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  Import More Products
                </button>
                <button
                  onClick={() => router.push("/admin/products")}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  View All Products
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
