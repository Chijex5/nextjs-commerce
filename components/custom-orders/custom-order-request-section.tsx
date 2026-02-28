"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import Price from "components/price";
import { useUserSession } from "hooks/useUserSession";
import { trackCustomOrderRequest } from "lib/analytics";

type SubmittedRequest = {
  requestNumber: string;
  email: string;
};

type QuoteDetails = {
  id: string;
  requestId: string;
  requestNumber: string;
  amount: string;
  currencyCode: string;
  note?: string | null;
  status: string;
  expiresAt?: string | null;
  title: string;
  customerName: string;
  requestStatus: string;
  canPay: boolean;
};

type UploadedImage = {
  id: string;
  fileName: string;
  previewUrl: string;
  status: "uploading" | "uploaded" | "error";
  url?: string;
  publicId?: string;
  error?: string;
};

const MAX_IMAGES = 4;

const createUploadId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const isBlobUrl = (value: string) => value.startsWith("blob:");

export default function CustomOrderRequestSection() {
  const searchParams = useSearchParams();
  const { data: session } = useUserSession();
  const quoteId = searchParams.get("quoteId")?.trim() || "";
  const token = searchParams.get("token")?.trim() || "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadItemsRef = useRef<UploadedImage[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadedImage[]>([]);
  const [submittedRequest, setSubmittedRequest] =
    useState<SubmittedRequest | null>(null);
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [payingQuote, setPayingQuote] = useState(false);
  const [formValues, setFormValues] = useState({
    customerName: "",
    email: "",
    phone: "",
    title: "",
    description: "",
    sizeNotes: "",
    colorPreferences: "",
    budgetMin: "",
    budgetMax: "",
    desiredDate: "",
  });

  useEffect(() => {
    if (session?.email) {
      setFormValues((prev) => ({
        ...prev,
        email: prev.email || session.email || "",
      }));
    }
  }, [session?.email]);

  useEffect(() => {
    uploadItemsRef.current = uploadItems;
  }, [uploadItems]);

  useEffect(() => {
    return () => {
      // Revoke any remaining local object URLs on unmount.
      for (const item of uploadItemsRef.current) {
        if (isBlobUrl(item.previewUrl)) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!quoteId || !token) return;

    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        const response = await fetch(
          `/api/custom-order-quotes/${encodeURIComponent(
            quoteId,
          )}?token=${encodeURIComponent(token)}`,
        );
        if (!response.ok) {
          const data = await response.json();
          toast.error(data.error || "Unable to load quote");
          return;
        }

        const data = await response.json();
        setQuote(data.quote || null);
      } catch {
        toast.error("Unable to load quote");
      } finally {
        setQuoteLoading(false);
      }
    };

    void fetchQuote();
  }, [quoteId, token]);

  const canSendMagicLink = useMemo(() => {
    if (!submittedRequest) return false;
    if (session) return false;
    return Boolean(submittedRequest.email);
  }, [submittedRequest, session]);

  const isUploading = useMemo(
    () => uploadItems.some((item) => item.status === "uploading"),
    [uploadItems],
  );

  const uploadedImageUrls = useMemo(
    () =>
      uploadItems
        .filter((item) => item.status === "uploaded" && item.url)
        .map((item) => item.url as string),
    [uploadItems],
  );

  const startUpload = async (uploadId: string, file: File) => {
    try {
      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch("/api/custom-order-requests/upload", {
        method: "POST",
        body: payload,
      });
      const data = await response.json();
      if (!response.ok || !data?.url || !data?.publicId) {
        throw new Error(data?.error || "Failed to upload image");
      }

      setUploadItems((prev) =>
        prev.map((item) => {
          if (item.id !== uploadId) return item;
          if (isBlobUrl(item.previewUrl)) {
            URL.revokeObjectURL(item.previewUrl);
          }
          return {
            ...item,
            status: "uploaded",
            previewUrl: data.url,
            url: data.url,
            publicId: data.publicId,
            error: undefined,
          };
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload image";
      setUploadItems((prev) =>
        prev.map((item) =>
          item.id === uploadId ? { ...item, status: "error", error: message } : item,
        ),
      );
      toast.error(message);
    }
  };

  const handleImageSelection = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = MAX_IMAGES - uploadItems.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const nextItems = selectedFiles.map((file) => ({
      id: createUploadId(),
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      status: "uploading" as const,
    }));

    setUploadItems((prev) => [...prev, ...nextItems]);
    selectedFiles.forEach((file, index) => {
      const uploadId = nextItems[index]?.id;
      if (uploadId) {
        void startUpload(uploadId, file);
      }
    });
  };

  const handleRemoveImage = async (item: UploadedImage) => {
    if (item.publicId) {
      try {
        const response = await fetch("/api/custom-order-requests/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: item.publicId }),
        });
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.error || "Failed to delete image");
          return;
        }
      } catch {
        toast.error("Failed to delete image");
        return;
      }
    }

    if (isBlobUrl(item.previewUrl)) {
      URL.revokeObjectURL(item.previewUrl);
    }

    setUploadItems((prev) => prev.filter((entry) => entry.id !== item.id));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isUploading) {
      toast.error("Please wait for image uploads to finish.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/custom-order-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formValues.customerName,
          email: formValues.email,
          phone: formValues.phone,
          title: formValues.title,
          description: formValues.description,
          sizeNotes: formValues.sizeNotes,
          colorPreferences: formValues.colorPreferences,
          budgetMin: formValues.budgetMin ? Number(formValues.budgetMin) : undefined,
          budgetMax: formValues.budgetMax ? Number(formValues.budgetMax) : undefined,
          desiredDate: formValues.desiredDate || undefined,
          referenceImages: uploadedImageUrls,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to submit request");
        return;
      }

      trackCustomOrderRequest();
      setSubmittedRequest({
        requestNumber: data.request.requestNumber,
        email: data.request.email,
      });
      setFormValues({
        customerName: "",
        email: session?.email || "",
        phone: "",
        title: "",
        description: "",
        sizeNotes: "",
        colorPreferences: "",
        budgetMin: "",
        budgetMax: "",
        desiredDate: "",
      });
      setUploadItems([]);
      toast.success("Custom request submitted");
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const sendMagicLinkForRequest = async () => {
    if (!submittedRequest) return;

    setSendingMagicLink(true);
    try {
      const callbackUrl = `/orders?customRequest=${encodeURIComponent(
        submittedRequest.requestNumber,
      )}&email=${encodeURIComponent(submittedRequest.email)}`;
      const response = await fetch("/api/user-auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submittedRequest.email, callbackUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to send magic link");
        return;
      }
      toast.success(data.message || "Magic link sent");
    } catch {
      toast.error("Failed to send magic link");
    } finally {
      setSendingMagicLink(false);
    }
  };

  const handlePayQuote = async () => {
    if (!quote || !token) return;

    setPayingQuote(true);
    try {
      const response = await fetch(
        `/api/custom-order-quotes/${encodeURIComponent(quote.id)}/initialize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.authorizationUrl) {
        toast.error(data.error || "Failed to start payment");
        return;
      }

      window.location.href = data.authorizationUrl;
    } catch {
      toast.error("Failed to start payment");
    } finally {
      setPayingQuote(false);
    }
  };

  return (
    <div className="space-y-8">
      {quoteId && token ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Review your quote
          </h2>
          {quoteLoading ? (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Loading quote details...
            </p>
          ) : quote ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                  Request {quote.requestNumber}
                </p>
                <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {quote.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                    {quote.status}
                  </span>
                  <span className="inline-flex rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                    {quote.requestStatus}
                  </span>
                </div>
                <Price
                  amount={quote.amount}
                  currencyCode={quote.currencyCode}
                  currencyCodeClassName="hidden"
                  className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100"
                />
                {quote.note ? (
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {quote.note}
                  </p>
                ) : null}
                {quote.expiresAt ? (
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Expires {new Date(quote.expiresAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
              {quote.canPay ? (
                <button
                  onClick={handlePayQuote}
                  disabled={payingQuote}
                  className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                >
                  {payingQuote ? "Redirecting to payment..." : "Pay quote"}
                </button>
              ) : (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  This quote is no longer payable.
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              We could not load this quote.
            </p>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
            Quote before payment
          </p>
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">
            Start your custom order
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            Submit your request details and references. We review and send your
            quote before any payment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Full name"
              required
              value={formValues.customerName}
              onChange={(value) =>
                setFormValues((prev) => ({ ...prev, customerName: value }))
              }
              placeholder="Your full name"
            />
            <Field
              label="Email"
              type="email"
              required
              value={formValues.email}
              onChange={(value) =>
                setFormValues((prev) => ({ ...prev, email: value }))
              }
              placeholder="your@email.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Phone number"
              value={formValues.phone}
              onChange={(value) =>
                setFormValues((prev) => ({ ...prev, phone: value }))
              }
              placeholder="+234..."
            />
            <Field
              label="Request title"
              required
              value={formValues.title}
              onChange={(value) =>
                setFormValues((prev) => ({ ...prev, title: value }))
              }
              placeholder="e.g. Bridal block heel"
            />
          </div>

          <TextAreaField
            label="Design brief"
            required
            rows={6}
            value={formValues.description}
            onChange={(value) =>
              setFormValues((prev) => ({ ...prev, description: value }))
            }
            placeholder="Describe the style, shape, material, and any must-have details."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Size notes"
              value={formValues.sizeNotes}
              onChange={(value) =>
                setFormValues((prev) => ({ ...prev, sizeNotes: value }))
              }
              placeholder="EU/UK size and fit notes"
            />
            <Field
              label="Color preferences"
              value={formValues.colorPreferences}
              onChange={(value) =>
                setFormValues((prev) => ({ ...prev, colorPreferences: value }))
              }
              placeholder="Preferred color(s)"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="Budget min (NGN)"
              type="number"
              value={formValues.budgetMin}
              onChange={(value) =>
                setFormValues((prev) => ({ ...prev, budgetMin: value }))
              }
              placeholder="0"
            />
            <Field
              label="Budget max (NGN)"
              type="number"
              value={formValues.budgetMax}
              onChange={(value) =>
                setFormValues((prev) => ({ ...prev, budgetMax: value }))
              }
              placeholder="0"
            />
            <Field
              label="Desired date"
              type="date"
              value={formValues.desiredDate}
              onChange={(value) =>
                setFormValues((prev) => ({ ...prev, desiredDate: value }))
              }
            />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Reference images
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Upload up to {MAX_IMAGES} images. Remove deletes from Cloudinary.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadItems.length >= MAX_IMAGES || isUploading}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 transition hover:border-neutral-500 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-500"
              >
                <UploadCloud className="h-4 w-4" />
                Add image
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                void handleImageSelection(event.target.files);
                event.target.value = "";
              }}
              className="hidden"
            />

            {uploadItems.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white text-neutral-500 transition hover:border-neutral-500 hover:text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-200"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-sm">Tap to upload reference images</span>
              </button>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {uploadItems.map((item) => (
                  <article
                    key={item.id}
                    className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.fileName}
                      className="h-40 w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/65 px-3 py-2 text-white">
                      <p className="truncate text-xs">{item.fileName}</p>
                      <div className="mt-1 flex items-center gap-1 text-[11px]">
                        {item.status === "uploading" ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Uploading...
                          </>
                        ) : null}
                        {item.status === "uploaded" ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-300" />
                            Uploaded
                          </>
                        ) : null}
                        {item.status === "error" ? (
                          <>
                            <AlertCircle className="h-3.5 w-3.5 text-red-300" />
                            {item.error || "Upload failed"}
                          </>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRemoveImage(item)}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                      aria-label={`Remove ${item.fileName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || isUploading}
            className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {submitting ? "Submitting request..." : "Submit custom request"}
          </button>
        </form>

        {submittedRequest ? (
          <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Request submitted: {submittedRequest.requestNumber}
            </p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              You can track progress with your request number and email.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={`/orders?customRequest=${encodeURIComponent(
                  submittedRequest.requestNumber,
                )}&email=${encodeURIComponent(submittedRequest.email)}`}
                className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-900 transition hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
              >
                Track request
              </Link>
              {canSendMagicLink ? (
                <button
                  onClick={sendMagicLinkForRequest}
                  disabled={sendingMagicLink}
                  className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                >
                  {sendingMagicLink ? "Sending link..." : "Send magic login link"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-black transition focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        required={required}
        rows={rows || 4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="resize-none rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black transition focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
      />
    </label>
  );
}
