"use client";

import Price from "components/price";
import { useUserSession } from "hooks/useUserSession";
import { trackCustomOrderRequest } from "lib/analytics";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

const createUploadId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const isBlobUrl = (value: string) => value.startsWith("blob:");

const parseErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // ignore
  }
  return fallback;
};

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
  const [submittedRequest, setSubmittedRequest] = useState<SubmittedRequest | null>(null);
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
      setFormValues((prev) => ({ ...prev, email: prev.email || session.email || "" }));
    }
  }, [session?.email]);

  useEffect(() => {
    uploadItemsRef.current = uploadItems;
  }, [uploadItems]);

  useEffect(() => {
    return () => {
      for (const item of uploadItemsRef.current) {
        if (isBlobUrl(item.previewUrl)) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!quoteId || !token) return;
    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        const response = await fetch(
          `/api/custom-order-quotes/${encodeURIComponent(quoteId)}?token=${encodeURIComponent(token)}`,
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
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, `Failed to upload ${file.name}`));
      }
      const data = await response.json();
      if (!data?.url || !data?.publicId) {
        throw new Error(`Upload response was invalid for ${file.name}`);
      }
      setUploadItems((prev) =>
        prev.map((item) => {
          if (item.id !== uploadId) return item;
          if (isBlobUrl(item.previewUrl)) URL.revokeObjectURL(item.previewUrl);
          return { ...item, status: "uploaded", previewUrl: data.url, url: data.url, publicId: data.publicId, error: undefined };
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      setUploadItems((prev) =>
        prev.map((item) => item.id === uploadId ? { ...item, status: "error", error: message } : item),
      );
      toast.error(message);
    }
  };

  const handleImageSelection = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = MAX_IMAGES - uploadItems.length;
    if (remainingSlots <= 0) { toast.error(`Maximum ${MAX_IMAGES} images allowed.`); return; }
    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const validFiles = selectedFiles.filter((file) => {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image file.`); return false; }
      if (file.size > MAX_IMAGE_SIZE_BYTES) { toast.error(`${file.name} is larger than 8MB.`); return false; }
      return true;
    });
    if (validFiles.length === 0) return;
    const nextItems = validFiles.map((file) => ({
      id: createUploadId(),
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      status: "uploading" as const,
    }));
    setUploadItems((prev) => [...prev, ...nextItems]);
    validFiles.forEach((file, index) => {
      const uploadId = nextItems[index]?.id;
      if (uploadId) void startUpload(uploadId, file);
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
        if (!response.ok) { toast.error(data.error || "Failed to delete image"); return; }
      } catch {
        toast.error("Failed to delete image"); return;
      }
    }
    if (isBlobUrl(item.previewUrl)) URL.revokeObjectURL(item.previewUrl);
    setUploadItems((prev) => prev.filter((entry) => entry.id !== item.id));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValues.customerName.trim()) { toast.error("Full name is required"); return; }
    if (!formValues.email.trim()) { toast.error("Email is required"); return; }
    if (!formValues.title.trim()) { toast.error("Request title is required"); return; }
    if (!formValues.description.trim()) { toast.error("Design brief is required"); return; }
    const budgetMin = formValues.budgetMin ? Number(formValues.budgetMin) : undefined;
    const budgetMax = formValues.budgetMax ? Number(formValues.budgetMax) : undefined;
    if (budgetMin !== undefined && budgetMax !== undefined && Number.isFinite(budgetMin) && Number.isFinite(budgetMax) && budgetMin > budgetMax) {
      toast.error("Budget min cannot be greater than budget max"); return;
    }
    if (isUploading) { toast.error("Please wait for image uploads to finish."); return; }
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
          budgetMin,
          budgetMax,
          desiredDate: formValues.desiredDate || undefined,
          referenceImages: uploadedImageUrls,
        }),
      });
      if (!response.ok) { toast.error(await parseErrorMessage(response, "Failed to submit request")); return; }
      const data = await response.json();
      trackCustomOrderRequest();
      setSubmittedRequest({ requestNumber: data.request.requestNumber, email: data.request.email });
      setFormValues({ customerName: "", email: session?.email || "", phone: "", title: "", description: "", sizeNotes: "", colorPreferences: "", budgetMin: "", budgetMax: "", desiredDate: "" });
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
      const callbackUrl = `/orders?customRequest=${encodeURIComponent(submittedRequest.requestNumber)}&email=${encodeURIComponent(submittedRequest.email)}`;
      const response = await fetch("/api/user-auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submittedRequest.email, callbackUrl }),
      });
      const data = await response.json();
      if (!response.ok) { toast.error(data.error || "Failed to send magic link"); return; }
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
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) },
      );
      const data = await response.json();
      if (!response.ok || !data.authorizationUrl) { toast.error(data.error || "Failed to start payment"); return; }
      window.location.href = data.authorizationUrl;
    } catch {
      toast.error("Failed to start payment");
    } finally {
      setPayingQuote(false);
    }
  };

  return (
    <>
      <style>{`
        .co-input {
          width: 100%;
          background: var(--dp-charcoal);
          border: 1px solid var(--dp-border);
          color: var(--dp-cream);
          font-family: 'DM Sans', sans-serif;
          font-size: .82rem;
          padding: .8rem 1rem;
          outline: none;
          transition: border-color .22s;
        }
        .co-input::placeholder { color: var(--dp-muted); }
        .co-input:focus { border-color: rgba(191,90,40,.6); }
        .co-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); }

        .co-label {
          font-family: 'DM Sans', sans-serif;
          font-size: .58rem;
          font-weight: 500;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--dp-muted);
          display: block;
          margin-bottom: .4rem;
        }

        .co-card {
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          padding: 2rem;
        }

        .dp-btn-solid {
          display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
          background: var(--dp-cream); color: var(--dp-ink);
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          font-size: .72rem; letter-spacing: .12em; text-transform: uppercase;
          padding: .9rem 2.1rem; border: none; cursor: pointer;
          transition: background .22s, color .22s;
        }
        .dp-btn-solid:hover:not(:disabled) { background: var(--dp-ember); color: var(--dp-cream); }
        .dp-btn-solid:disabled { opacity: .5; cursor: not-allowed; }

        .dp-btn-ember {
          display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
          background: var(--dp-ember); color: var(--dp-cream);
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          font-size: .72rem; letter-spacing: .12em; text-transform: uppercase;
          padding: .9rem 2.1rem; border: none; cursor: pointer;
          transition: opacity .22s;
        }
        .dp-btn-ember:hover:not(:disabled) { opacity: .88; }
        .dp-btn-ember:disabled { opacity: .5; cursor: not-allowed; }

        .dp-btn-ghost {
          display: inline-flex; align-items: center; gap: .5rem;
          border: 1px solid var(--dp-border); color: var(--dp-sand);
          background: transparent;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          font-size: .65rem; letter-spacing: .14em; text-transform: uppercase;
          padding: .65rem 1.25rem; cursor: pointer; text-decoration: none;
          transition: border-color .22s, color .22s;
        }
        .dp-btn-ghost:hover { border-color: rgba(191,90,40,.4); color: var(--dp-cream); }

        .upload-zone {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: .75rem; height: 9rem; width: 100%;
          border: 1px dashed rgba(242,232,213,0.15);
          background: var(--dp-charcoal);
          color: var(--dp-muted);
          cursor: pointer;
          transition: border-color .22s, color .22s;
        }
        .upload-zone:hover { border-color: rgba(191,90,40,.4); color: var(--dp-sand); }

        .img-card {
          position: relative; overflow: hidden;
          border: 1px solid var(--dp-border);
          background: var(--dp-charcoal);
        }

        .status-chip {
          display: inline-flex; align-items: center; gap: .35rem;
          font-family: 'DM Sans', sans-serif;
          font-size: .58rem; font-weight: 500;
          letter-spacing: .1em; text-transform: uppercase;
          padding: 2px 7px;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Quote review panel ── */}
        {quoteId && token && (
          <section className="co-card">
            <p className="dp-label" style={{ marginBottom: ".6rem" }}>Your quote</p>
            <h2
              className="dp-serif"
              style={{ fontSize: "1.8rem", fontWeight: 600, color: "var(--dp-cream)", marginBottom: "1.5rem" }}
            >
              Review &amp; Pay
            </h2>

            {quoteLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <Loader2 size={16} style={{ color: "var(--dp-ember)", animation: "dp-spin .8s linear infinite" }} />
                <style>{`@keyframes dp-spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".75rem", color: "var(--dp-muted)" }}>Loading quote details…</p>
              </div>
            ) : quote ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Quote detail block */}
                <div style={{ background: "var(--dp-charcoal)", border: "1px solid var(--dp-border)", padding: "1.25rem" }}>
                  <p className="dp-label" style={{ marginBottom: ".4rem" }}>Request {quote.requestNumber}</p>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".9rem", fontWeight: 500, color: "var(--dp-cream)", marginBottom: ".75rem" }}>
                    {quote.title}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginBottom: "1rem" }}>
                    {[quote.status, quote.requestStatus].map((s) => (
                      <span key={s} className="status-chip" style={{ background: "var(--dp-card)", color: "var(--dp-sand)", border: "1px solid var(--dp-border)" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <Price
                    amount={quote.amount}
                    currencyCode={quote.currencyCode}
                    currencyCodeClassName="hidden"
                    className="dp-wordmark"
                    style={{ fontSize: "2.2rem", color: "var(--dp-gold)", display: "block", marginBottom: ".5rem" } as React.CSSProperties}
                  />
                  {quote.note && (
                    <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".75rem", color: "var(--dp-muted)", lineHeight: 1.6 }}>{quote.note}</p>
                  )}
                  {quote.expiresAt && (
                    <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".62rem", color: "var(--dp-muted)", marginTop: ".5rem", letterSpacing: ".06em" }}>
                      Expires {new Date(quote.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {quote.canPay ? (
                  <button onClick={handlePayQuote} disabled={payingQuote} className="dp-btn-ember" style={{ alignSelf: "flex-start" }}>
                    {payingQuote ? (
                      <><Loader2 size={14} style={{ animation: "dp-spin .8s linear infinite" }} /> Redirecting…</>
                    ) : (
                      <>Pay quote <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></>
                    )}
                  </button>
                ) : (
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".75rem", color: "var(--dp-muted)" }}>
                    This quote is no longer payable.
                  </p>
                )}
              </div>
            ) : (
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".75rem", color: "var(--dp-muted)" }}>
                We could not load this quote.
              </p>
            )}
          </section>
        )}

        {/* ── Request form ── */}
        <section className="co-card">
          <p className="dp-label" style={{ marginBottom: ".6rem" }}>Quote before payment</p>
          <h2
            className="dp-serif"
            style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 600, color: "var(--dp-cream)", marginBottom: ".5rem" }}
          >
            Start your custom order
          </h2>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".75rem", color: "var(--dp-muted)", lineHeight: 1.7, maxWidth: 520, marginBottom: "2rem" }}>
            Submit your request and references — we review and send a quote before any payment is taken.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Row 1: name + email */}
            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(1,1fr)" }} className="md:grid-cols-2">
              <Field label="Full name" required value={formValues.customerName} onChange={(v) => setFormValues((p) => ({ ...p, customerName: v }))} placeholder="Your full name" />
              <Field label="Email" type="email" required value={formValues.email} onChange={(v) => setFormValues((p) => ({ ...p, email: v }))} placeholder="your@email.com" />
            </div>

            {/* Row 2: phone + title */}
            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(1,1fr)" }} className="md:grid-cols-2">
              <Field label="Phone number" value={formValues.phone} onChange={(v) => setFormValues((p) => ({ ...p, phone: v }))} placeholder="+234…" />
              <Field label="Request title" required value={formValues.title} onChange={(v) => setFormValues((p) => ({ ...p, title: v }))} placeholder="e.g. Bridal block heel" />
            </div>

            {/* Design brief */}
            <TextAreaField
              label="Design brief"
              required
              rows={6}
              value={formValues.description}
              onChange={(v) => setFormValues((p) => ({ ...p, description: v }))}
              placeholder="Describe the style, shape, material, and any must-have details."
            />

            {/* Row 3: size + colour */}
            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(1,1fr)" }} className="md:grid-cols-2">
              <Field label="Size notes" value={formValues.sizeNotes} onChange={(v) => setFormValues((p) => ({ ...p, sizeNotes: v }))} placeholder="EU/UK size and fit notes" />
              <Field label="Color preferences" value={formValues.colorPreferences} onChange={(v) => setFormValues((p) => ({ ...p, colorPreferences: v }))} placeholder="Preferred colour(s)" />
            </div>

            {/* Row 4: budget + date */}
            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(1,1fr)" }} className="md:grid-cols-3">
              <Field label="Budget min (NGN)" type="number" value={formValues.budgetMin} onChange={(v) => setFormValues((p) => ({ ...p, budgetMin: v }))} placeholder="0" />
              <Field label="Budget max (NGN)" type="number" value={formValues.budgetMax} onChange={(v) => setFormValues((p) => ({ ...p, budgetMax: v }))} placeholder="0" />
              <Field label="Desired date" type="date" value={formValues.desiredDate} onChange={(v) => setFormValues((p) => ({ ...p, desiredDate: v }))} />
            </div>

            {/* Image upload */}
            <div style={{ background: "var(--dp-charcoal)", border: "1px solid var(--dp-border)", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".78rem", fontWeight: 500, color: "var(--dp-cream)", marginBottom: ".2rem" }}>
                    Reference images
                  </p>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".65rem", color: "var(--dp-muted)" }}>
                    Up to {MAX_IMAGES} images · max 8 MB each
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadItems.length >= MAX_IMAGES || isUploading}
                  className="dp-btn-ghost"
                  style={{ padding: ".55rem 1rem" }}
                >
                  <UploadCloud size={13} />
                  Add image
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => { void handleImageSelection(e.target.files); e.target.value = ""; }}
                className="hidden"
              />

              {uploadItems.length === 0 ? (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="upload-zone">
                  <ImagePlus size={22} />
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".72rem", letterSpacing: ".08em" }}>
                    Tap to upload reference images
                  </span>
                </button>
              ) : (
                <div style={{ display: "grid", gap: ".5rem", gridTemplateColumns: "repeat(2,1fr)" }}>
                  {uploadItems.map((item) => (
                    <article key={item.id} className="img-card">
                      <img src={item.previewUrl} alt={item.fileName} style={{ height: "10rem", width: "100%", objectFit: "cover", display: "block" }} />

                      {/* Status overlay */}
                      <div style={{ position: "absolute", insetInline: 0, bottom: 0, background: "rgba(6,4,2,0.82)", padding: ".5rem .75rem" }}>
                        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".65rem", color: "var(--dp-sand)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: ".25rem" }}>
                          {item.fileName}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                          {item.status === "uploading" && (
                            <span className="status-chip" style={{ color: "var(--dp-sand)" }}>
                              <Loader2 size={10} style={{ animation: "dp-spin .8s linear infinite" }} /> Uploading…
                            </span>
                          )}
                          {item.status === "uploaded" && (
                            <span className="status-chip" style={{ color: "#6abf69" }}>
                              <CheckCircle2 size={10} /> Uploaded
                            </span>
                          )}
                          {item.status === "error" && (
                            <span className="status-chip" style={{ color: "var(--dp-ember)" }}>
                              <AlertCircle size={10} /> {item.error || "Failed"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => void handleRemoveImage(item)}
                        aria-label={`Remove ${item.fileName}`}
                        style={{
                          position: "absolute", top: ".5rem", right: ".5rem",
                          width: "1.75rem", height: "1.75rem",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(6,4,2,0.75)", border: "1px solid rgba(242,232,213,0.15)",
                          color: "var(--dp-sand)", cursor: "pointer",
                          transition: "background .2s, color .2s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--dp-ember)"; e.currentTarget.style.color = "var(--dp-cream)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(6,4,2,0.75)"; e.currentTarget.style.color = "var(--dp-sand)"; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting || isUploading} className="dp-btn-solid" style={{ alignSelf: "flex-start" }}>
              {submitting ? (
                <><Loader2 size={14} style={{ animation: "dp-spin .8s linear infinite" }} /> Submitting…</>
              ) : (
                <>Submit custom request <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></>
              )}
            </button>
          </form>

          {/* Success banner */}
          {submittedRequest && (
            <div style={{ marginTop: "1.5rem", background: "var(--dp-charcoal)", border: "1px solid rgba(191,90,40,.3)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: ".75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                <CheckCircle2 size={16} style={{ color: "var(--dp-ember)", flexShrink: 0 }} />
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".78rem", fontWeight: 500, color: "var(--dp-cream)" }}>
                  Request submitted — {submittedRequest.requestNumber}
                </p>
              </div>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".72rem", color: "var(--dp-muted)", lineHeight: 1.6 }}>
                You can track progress with your request number and email.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
                <Link
                  href={`/orders?customRequest=${encodeURIComponent(submittedRequest.requestNumber)}&email=${encodeURIComponent(submittedRequest.email)}`}
                  className="dp-btn-ghost"
                >
                  Track request →
                </Link>
                {canSendMagicLink && (
                  <button onClick={sendMagicLinkForRequest} disabled={sendingMagicLink} className="dp-btn-ember">
                    {sendingMagicLink ? (
                      <><Loader2 size={13} style={{ animation: "dp-spin .8s linear infinite" }} /> Sending…</>
                    ) : (
                      "Send magic login link"
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// ── Field components ──────────────────────────────────────────────────────────

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
    <label style={{ display: "grid", gap: ".4rem" }}>
      <span className="co-label">
        {label}{required ? " *" : ""}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="co-input"
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
    <label style={{ display: "grid", gap: ".4rem" }}>
      <span className="co-label">
        {label}{required ? " *" : ""}
      </span>
      <textarea
        required={required}
        rows={rows || 4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="co-input"
        style={{ resize: "none" }}
      />
    </label>
  );
}