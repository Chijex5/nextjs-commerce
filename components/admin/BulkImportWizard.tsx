"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

type ImportSpeedMode = "safe" | "balanced" | "fast";

const IMPORT_SPEED_CONCURRENCY: Record<ImportSpeedMode, number> = {
  safe: 3,
  balanced: 6,
  fast: 10,
};

const SPEED_META: Record<
  ImportSpeedMode,
  { label: string; description: string; color: string }
> = {
  safe: {
    label: "Safe",
    description: "3 concurrent · lower server load",
    color: "text-green-600 dark:text-green-400",
  },
  balanced: {
    label: "Balanced",
    description: "6 concurrent · recommended",
    color: "text-blue-600 dark:text-blue-400",
  },
  fast: {
    label: "Fast",
    description: "10 concurrent · may hit rate limits",
    color: "text-yellow-600 dark:text-yellow-400",
  },
};

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  if (items.length === 0) return;
  let nextIndex = 0;
  let failure: Error | null = null;
  const runner = async () => {
    while (!failure) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) break;
      try {
        await worker(items[currentIndex]!, currentIndex);
      } catch (error) {
        failure =
          error instanceof Error ? error : new Error("Bulk import failed");
      }
    }
  };
  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runner()));
  if (failure) throw failure;
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.ceil(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ── Step Indicator ──────────────────────────────────────────────
const STEPS: { key: ImportStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Review" },
  { key: "importing", label: "Importing" },
  { key: "complete", label: "Done" },
];

function StepIndicator({ current }: { current: ImportStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="mb-8 flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all ${
                  done
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                    : active
                      ? "border-neutral-900 bg-white text-neutral-900 dark:border-neutral-100 dark:bg-neutral-900 dark:text-neutral-100"
                      : "border-neutral-200 bg-white text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-600"
                }`}
              >
                {done ? (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 12 12"
                    strokeWidth="2.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M1.5 6l3 3 6-6"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-widest ${
                  active
                    ? "text-neutral-900 dark:text-neutral-100"
                    : done
                      ? "text-neutral-500 dark:text-neutral-400"
                      : "text-neutral-300 dark:text-neutral-600"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 mt-[-14px] h-px flex-1 transition-all ${
                  done
                    ? "bg-neutral-900 dark:bg-neutral-100"
                    : "bg-neutral-200 dark:bg-neutral-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export default function BulkImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importSpeed, setImportSpeed] = useState<ImportSpeedMode>("balanced");
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  }>({ success: 0, failed: 0, errors: [] });
  const [isDragOver, setIsDragOver] = useState(false);

  // ETA tracking
  const importStartRef = useRef<number | null>(null);
  const [rate, setRate] = useState<number | null>(null); // items/sec

  useEffect(() => {
    if (
      step === "importing" &&
      importStartRef.current &&
      progress.current > 0
    ) {
      const elapsed = (Date.now() - importStartRef.current) / 1000;
      setRate(progress.current / elapsed);
    }
  }, [progress.current, step]);

  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  const etaSeconds =
    rate && rate > 0 ? (progress.total - progress.current) / rate : null;

  // ── Handlers ────────────────────────────────────────────────
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

  const processFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("File too large (max 5MB)");
      return;
    }
    setFile(selectedFile);
    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      const MAX_ROWS = 1000;
      if (parsed.length > MAX_ROWS) {
        toast.error(
          `Too many rows (max ${MAX_ROWS}). Please split into multiple imports.`,
        );
        return;
      }
      setProducts(parsed as ProductRow[]);
      setStep("preview");
      toast.success(`Loaded ${parsed.length} products`);
    } catch (error) {
      console.error("Parse error:", error);
      toast.error("Failed to parse CSV file. Please check the format.");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) await processFile(droppedFile);
  };

  const handleImport = async () => {
    setImporting(true);
    setStep("importing");
    setProgress({ current: 0, total: products.length });
    importStartRef.current = Date.now();
    setRate(null);

    const importResults = { success: 0, failed: 0, errors: [] as string[] };
    const concurrency = IMPORT_SPEED_CONCURRENCY[importSpeed];

    await runWithConcurrency(products, concurrency, async (product, i) => {
      try {
        if (!product.title || product.title.trim() === "")
          throw new Error("Title is required");
        if (!product.price || parseFloat(product.price) <= 0)
          throw new Error("Valid price is required (must be > 0)");

        const baseHandle = product.title
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");

        if (!baseHandle)
          throw new Error("Title cannot generate a valid handle");

        const productData = {
          title: product.title.trim(),
          handle: baseHandle,
          description: product.description?.trim() || "",
          descriptionHtml: product.description
            ? `<p>${product.description.trim()}</p>`
            : "",
          availableForSale: product.available_for_sale !== "false",
          seoTitle: `${product.title.trim()} - D'FOOTPRINT`,
          seoDescription: product.description?.trim().substring(0, 160) || "",
          tags: product.tags
            ? product.tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t)
            : [],
          images: product.image_url ? [{ url: product.image_url }] : [],
          basePrice: parseFloat(product.price),
        };

        const response = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.details || errorData.error || `HTTP ${response.status}`,
          );
        }

        importResults.success++;
      } catch (error: any) {
        importResults.failed++;
        importResults.errors.push(
          `Row ${i + 1} (${product.title || "unknown"}): ${error.message || "Unknown error"}`,
        );
      } finally {
        setProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      }
    });

    setResults(importResults);
    setStep("complete");
    setImporting(false);

    if (importResults.success > 0)
      toast.success(`Successfully imported ${importResults.success} products`);
    if (importResults.failed > 0)
      toast.error(`Failed to import ${importResults.failed} products`);
  };

  const resetWizard = () => {
    setStep("upload");
    setFile(null);
    setProducts([]);
    setResults({ success: 0, failed: 0, errors: [] });
    setProgress({ current: 0, total: 0 });
    setRate(null);
    importStartRef.current = null;
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator current={step} />

      {/* ── Step: Upload ── */}
      {step === "upload" && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-100 px-6 py-5 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Upload your CSV file
                </h2>
                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                  Max 1,000 products · 5 MB file limit
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Template
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Drop zone */}
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`group relative flex h-52 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                isDragOver
                  ? "border-neutral-900 bg-neutral-50 dark:border-neutral-300 dark:bg-neutral-800"
                  : "border-neutral-200 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-neutral-500"
              }`}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                    isDragOver
                      ? "bg-neutral-200 dark:bg-neutral-700"
                      : "bg-neutral-100 dark:bg-neutral-800"
                  }`}
                >
                  <svg
                    className="h-6 w-6 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {isDragOver ? "Drop it here" : "Drop your CSV here"}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    or{" "}
                    <span className="font-semibold text-neutral-600 underline underline-offset-2 dark:text-neutral-300">
                      browse files
                    </span>
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {/* Format guidelines */}
            <div className="mt-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                Required columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "title",
                  "price",
                  "description",
                  "available_for_sale",
                  "tags",
                  "image_url",
                ].map((col, i) => (
                  <span
                    key={col}
                    className={`rounded-md px-2 py-0.5 font-mono text-xs ${
                      i < 2
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {col}
                    {i < 2 && (
                      <span className="ml-1 text-[9px] opacity-70">req</span>
                    )}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-xs text-neutral-400">
                Handles & SEO fields are auto-generated. Images can be added
                separately after import.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Preview ── */}
      {step === "preview" && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-100 px-6 py-5 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Review before importing
                </h2>
                <p className="mt-0.5 text-sm text-neutral-500">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {products.length}
                  </span>{" "}
                  products ready ·{" "}
                  <span className="text-neutral-400">{file?.name}</span>
                </p>
              </div>
              <button
                onClick={resetWizard}
                className="text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ← Change file
              </button>
            </div>
          </div>

          {/* Speed selector */}
          <div className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              Import speed
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["safe", "balanced", "fast"] as ImportSpeedMode[]).map(
                (mode) => {
                  const meta = SPEED_META[mode];
                  const active = importSpeed === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setImportSpeed(mode)}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                        active
                          ? "border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100"
                          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600"
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold ${
                          active
                            ? "text-white dark:text-neutral-900"
                            : "text-neutral-900 dark:text-neutral-100"
                        }`}
                      >
                        {meta.label}
                      </p>
                      <p
                        className={`mt-0.5 text-[10px] ${
                          active
                            ? "text-neutral-300 dark:text-neutral-600"
                            : "text-neutral-400"
                        }`}
                      >
                        {meta.description}
                      </p>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Preview table */}
          <div className="max-h-72 overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 border-b border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <tr>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                    #
                  </th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                    Title
                  </th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                    Price
                  </th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {products.map((product, index) => (
                  <tr
                    key={index}
                    className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                  >
                    <td className="px-5 py-2.5 text-xs font-mono text-neutral-400">
                      {index + 1}
                    </td>
                    <td className="max-w-[200px] px-5 py-2.5">
                      <p className="truncate text-sm text-neutral-900 dark:text-neutral-100">
                        {product.title}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      ₦{parseFloat(product.price).toLocaleString()}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Ready
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
            <p className="text-xs text-neutral-400">
              Estimated time:{" "}
              <span className="font-medium text-neutral-600 dark:text-neutral-300">
                {formatEta(
                  products.length / IMPORT_SPEED_CONCURRENCY[importSpeed],
                )}
              </span>
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={resetWizard}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Import {products.length} products
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Importing ── */}
      {step === "importing" && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="p-8">
            {/* Central progress display */}
            <div className="mb-8 flex flex-col items-center text-center">
              {/* Animated ring */}
              <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
                <svg
                  className="absolute inset-0 h-full w-full -rotate-90"
                  viewBox="0 0 96 96"
                >
                  {/* Track */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-neutral-100 dark:text-neutral-800"
                  />
                  {/* Progress */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                    className="text-neutral-900 transition-all duration-500 dark:text-neutral-100"
                  />
                </svg>
                <span className="text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {pct}%
                </span>
              </div>

              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Importing products…
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                {progress.current} of {progress.total} completed
              </p>
            </div>

            {/* Metrics row */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-center dark:border-neutral-800 dark:bg-neutral-800/50">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  Done
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {progress.current}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-center dark:border-neutral-800 dark:bg-neutral-800/50">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  Remaining
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {progress.total - progress.current}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-center dark:border-neutral-800 dark:bg-neutral-800/50">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  ETA
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {etaSeconds != null ? formatEta(etaSeconds) : "—"}
                </p>
              </div>
            </div>

            {/* Linear bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-neutral-900 transition-all duration-500 dark:bg-neutral-100"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  {SPEED_META[importSpeed].label} mode ·{" "}
                  {IMPORT_SPEED_CONCURRENCY[importSpeed]} concurrent
                </span>
                {rate != null && (
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {rate.toFixed(1)} products/sec
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Complete ── */}
      {step === "complete" && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {/* Header */}
          <div className="border-b border-neutral-100 px-6 py-5 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  results.failed === 0
                    ? "bg-green-100 dark:bg-green-900/20"
                    : results.success === 0
                      ? "bg-red-100 dark:bg-red-900/20"
                      : "bg-yellow-100 dark:bg-yellow-900/20"
                }`}
              >
                {results.failed === 0 ? (
                  <svg
                    className="h-5 w-5 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                ) : results.success === 0 ? (
                  <svg
                    className="h-5 w-5 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {results.failed === 0
                    ? "Import complete"
                    : results.success === 0
                      ? "Import failed"
                      : "Import finished with errors"}
                </h2>
                <p className="text-sm text-neutral-400">
                  {results.success + results.failed} products processed
                </p>
              </div>
            </div>
          </div>

          {/* Result stats */}
          <div className="grid grid-cols-2 divide-x divide-neutral-100 dark:divide-neutral-800">
            <div className="px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                Imported
              </p>
              <p className="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">
                {results.success}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">
                products created
              </p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                Failed
              </p>
              <p
                className={`mt-1 text-3xl font-semibold ${
                  results.failed > 0
                    ? "text-red-500 dark:text-red-400"
                    : "text-neutral-300 dark:text-neutral-700"
                }`}
              >
                {results.failed}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {results.failed > 0 ? "see errors below" : "no errors"}
              </p>
            </div>
          </div>

          {/* Error list */}
          {results.errors.length > 0 && (
            <div className="border-t border-neutral-100 dark:border-neutral-800">
              <div className="max-h-44 overflow-y-auto">
                {results.errors.slice(0, 20).map((error, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 border-b border-neutral-100 px-5 py-3 last:border-0 dark:border-neutral-800"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {error}
                    </p>
                  </div>
                ))}
                {results.errors.length > 20 && (
                  <p className="px-5 py-3 text-xs text-neutral-400">
                    +{results.errors.length - 20} more errors
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
            <button
              onClick={resetWizard}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Import more
            </button>
            <button
              onClick={() => router.push("/admin/products")}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              View products
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
