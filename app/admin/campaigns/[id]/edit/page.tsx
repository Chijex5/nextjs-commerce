"use client";

import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  type: "JUST_ARRIVED" | "SALE" | "COLLECTION";
  subject: string;
  preheader: string;
  headerTitle: string;
  headerSubtitle: string;
  footerText: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
  products?: Array<{ id: string }>;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Details",  hint: "Name, type & subject"   },
  { n: 2, label: "Content",  hint: "Header, CTA & footer"   },
  { n: 3, label: "Products", hint: "Choose what to feature"  },
  { n: 4, label: "Send",     hint: "Deliver your campaign"   },
] as const;

const CAMPAIGN_TYPES: Array<{ value: Campaign["type"]; label: string; description: string }> = [
  { value: "JUST_ARRIVED", label: "Just Arrived",  description: "Announce new products to subscribers"       },
  { value: "SALE",         label: "Sale",          description: "Promote discounts and limited-time offers"  },
  { value: "COLLECTION",   label: "Collection",    description: "Highlight a curated product collection"      },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls =
  "block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:border-neutral-500";

function FieldLabel({ htmlFor, children, optional }: { htmlFor?: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
      {children}
      {optional && <span className="font-normal normal-case tracking-normal">— optional</span>}
    </label>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 border-b border-neutral-100 pb-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{subtitle}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
        {label}
      </span>
      <span className="text-right text-sm text-neutral-700 dark:text-neutral-300">{value}</span>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, onNavigate }: { current: number; onNavigate: (n: number) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex">
        {STEPS.map((step, i) => {
          const done   = current > step.n;
          const active = current === step.n;
          const locked = current < step.n;
          return (
            <button
              key={step.n}
              type="button"
              onClick={() => !locked && onNavigate(step.n)}
              disabled={locked}
              className={`group relative flex flex-1 flex-col items-start gap-0.5 px-5 py-4 text-left transition-colors disabled:cursor-default ${
                active ? "bg-neutral-50 dark:bg-neutral-950/40" : done ? "hover:bg-neutral-50/60 dark:hover:bg-neutral-950/20" : ""
              }`}
            >
              {i > 0 && (
                <div className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-neutral-200 dark:bg-neutral-800" />
              )}
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                active ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : done  ? "bg-emerald-500 text-white"
                        : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
              }`}>
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : step.n}
              </div>
              <p className={`text-xs font-semibold ${active ? "text-neutral-900 dark:text-neutral-100" : done ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-600"}`}>
                {step.label}
              </p>
              <p className={`hidden text-[10px] sm:block ${active ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-600"}`}>
                {step.hint}
              </p>
              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-neutral-900 dark:bg-neutral-100" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignEditorPage() {
  const router   = useRouter();
  const params   = useParams();
  const campaignId = typeof params.id === "string" ? params.id : "";
  const isNew    = campaignId === "new";

  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving]   = useState(false);
  const [sendMode, setSendMode] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledAt, setScheduledAt] = useState("");

  const [campaign, setCampaign] = useState<Campaign>({
    id: "", name: "", type: "JUST_ARRIVED", subject: "",
    preheader: "", headerTitle: "", headerSubtitle: "",
    footerText: "", ctaButtonText: "", ctaButtonUrl: "",
  });

  const [selectedProducts, setSelectedProducts]   = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts]     = useState(false);
  const [searchQuery, setSearchQuery]             = useState("");

  const set = (patch: Partial<Campaign>) => setCampaign((p) => ({ ...p, ...patch }));

  // ── Data fetching ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/campaigns/${campaignId}`)
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((d) => {
          setCampaign({ ...d.campaign, preheader: d.campaign.preheader || "", headerTitle: d.campaign.headerTitle || "", headerSubtitle: d.campaign.headerSubtitle || "", footerText: d.campaign.footerText || "", ctaButtonText: d.campaign.ctaButtonText || "", ctaButtonUrl: d.campaign.ctaButtonUrl || "" });
          setSelectedProducts(d.campaign.products?.map((p: { id: string }) => p.id) || []);
        })
        .catch(() => { toast.error("Failed to load campaign"); router.push("/admin/campaigns"); })
        .finally(() => setLoading(false));
    }

    setLoadingProducts(true);
    fetch("/api/products?limit=1000")
      .then((r) => r.json())
      .then((d) => setAvailableProducts(d.products || []))
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoadingProducts(false));
  }, []);

  // ── Validation ───────────────────────────────────────────────────────────────
  const canAdvance = useMemo(() => {
    if (step === 1) return !!(campaign.name.trim() && campaign.subject.trim());
    if (step === 3) return selectedProducts.length > 0;
    if (step === 4 && sendMode === "scheduled") return !!scheduledAt;
    return true;
  }, [step, campaign.name, campaign.subject, selectedProducts.length, sendMode, scheduledAt]);

  // ── Save draft ───────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!campaign.name.trim() || !campaign.subject.trim()) {
      toast.error("Name and subject are required"); return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify({
        name: campaign.name, type: campaign.type, subject: campaign.subject,
        preheader: campaign.preheader, headerTitle: campaign.headerTitle,
        headerSubtitle: campaign.headerSubtitle, footerText: campaign.footerText,
        ctaButtonText: campaign.ctaButtonText, ctaButtonUrl: campaign.ctaButtonUrl,
        productIds: selectedProducts,
      });
      const res = isNew
        ? await fetch("/api/admin/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body })
        : await fetch(`/api/admin/campaigns/${campaignId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to save");
      }
      toast.success(isNew ? "Campaign saved as draft" : "Campaign updated");
      router.push("/admin/campaigns");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  }

  // ── Send / schedule ──────────────────────────────────────────────────────────
  async function handleSend() {
    if (selectedProducts.length === 0) { toast.error("Select at least one product"); return; }
    if (sendMode === "scheduled" && !scheduledAt) { toast.error("Pick a date and time"); return; }
    setSaving(true);
    try {
      const id = campaignId || campaign.id;
      const res = await fetch(`/api/admin/campaigns/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendImmediately: sendMode === "immediate", scheduledAt: sendMode === "scheduled" ? scheduledAt : undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to send campaign");
      }
      const result = await res.json();
      toast.success(
        sendMode === "immediate"
          ? `Campaign sent to ${result.sent ?? "your"} subscribers`
          : `Scheduled for ${new Date(scheduledAt).toLocaleString()}`,
      );
      router.push("/admin/campaigns");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally { setSaving(false); }
  }

  const filteredProducts = useMemo(
    () => availableProducts.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [availableProducts, searchQuery],
  );

  const selectedType = CAMPAIGN_TYPES.find((t) => t.value === campaign.type)!;

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Spinner />
          Loading campaign…
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="space-y-5">

          {/* ── Back + title ── */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/campaigns")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                {isNew ? "New Campaign" : campaign.name || "Edit Campaign"}
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                {isNew ? "Create an email campaign" : "Update campaign details"}
              </p>
            </div>
          </div>

          {/* ── Step indicator ── */}
          <StepIndicator current={step} onNavigate={setStep} />

          {/* ── Form panel ── */}
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="p-6">

              {/* ════ STEP 1: Details ════ */}
              {step === 1 && (
                <div className="space-y-5">
                  <SectionHeader title="Campaign Details" subtitle="Set the name, type, and email subject line" />

                  <div>
                    <FieldLabel htmlFor="name">Campaign Name</FieldLabel>
                    <input id="name" type="text" value={campaign.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Spring Collection Launch" className={inputCls} autoFocus />
                  </div>

                  <div>
                    <FieldLabel>Campaign Type</FieldLabel>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {CAMPAIGN_TYPES.map((t) => {
                        const active = campaign.type === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => set({ type: t.value })}
                            className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3.5 text-left transition-all ${
                              active
                                ? "border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100"
                                : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
                            }`}
                          >
                            <span className={`text-xs font-semibold ${active ? "text-white dark:text-neutral-900" : "text-neutral-900 dark:text-neutral-100"}`}>{t.label}</span>
                            <span className={`text-[11px] leading-snug ${active ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-400 dark:text-neutral-500"}`}>{t.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="subject">Email Subject</FieldLabel>
                    <input id="subject" type="text" value={campaign.subject} onChange={(e) => set({ subject: e.target.value })} placeholder="e.g. Discover Our Latest Arrivals!" className={inputCls} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="preheader" optional>Preheader</FieldLabel>
                    <input id="preheader" type="text" value={campaign.preheader} onChange={(e) => set({ preheader: e.target.value })} placeholder="Preview text shown in inbox before opening" className={inputCls} />
                  </div>
                </div>
              )}

              {/* ════ STEP 2: Content ════ */}
              {step === 2 && (
                <div className="space-y-5">
                  <SectionHeader title="Customize Content" subtitle="All fields are optional — defaults will be used if left blank" />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="htitle" optional>Header Title</FieldLabel>
                      <input id="htitle" type="text" value={campaign.headerTitle} onChange={(e) => set({ headerTitle: e.target.value })} placeholder="e.g. Just Arrived!" className={inputCls} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="hsub" optional>Header Subtitle</FieldLabel>
                      <input id="hsub" type="text" value={campaign.headerSubtitle} onChange={(e) => set({ headerSubtitle: e.target.value })} placeholder="e.g. Discover our latest collection" className={inputCls} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="ctatext" optional>CTA Button Label</FieldLabel>
                      <input id="ctatext" type="text" value={campaign.ctaButtonText} onChange={(e) => set({ ctaButtonText: e.target.value })} placeholder="Shop Now" className={inputCls} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="ctaurl" optional>CTA Button URL</FieldLabel>
                      <input id="ctaurl" type="text" value={campaign.ctaButtonUrl} onChange={(e) => set({ ctaButtonUrl: e.target.value })} placeholder="/products or https://..." className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="footer" optional>Footer Text</FieldLabel>
                    <textarea id="footer" value={campaign.footerText} onChange={(e) => set({ footerText: e.target.value })} placeholder="e.g. These styles are flying off the shelves — grab yours before they're gone." rows={3} className={inputCls} />
                  </div>
                </div>
              )}

              {/* ════ STEP 3: Products ════ */}
              {step === 3 && (
                <div className="space-y-4">
                  <SectionHeader title="Select Products" subtitle="Choose the products to feature in this campaign" />

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.25" />
                        <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                      </svg>
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products…" className={`${inputCls} pl-8`} />
                    </div>
                    {selectedProducts.length > 0 && (
                      <span className="flex-shrink-0 rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                        {selectedProducts.length} selected
                      </span>
                    )}
                  </div>

                  {loadingProducts ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-2 text-sm text-neutral-400"><Spinner />Loading products…</div>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-neutral-200 py-12 dark:border-neutral-800">
                      <p className="text-sm text-neutral-400">No products found</p>
                    </div>
                  ) : (
                    <div className="max-h-80 space-y-px overflow-y-auto rounded-xl border border-neutral-100 dark:border-neutral-800">
                      {filteredProducts.map((product) => {
                        const checked = selectedProducts.includes(product.id);
                        return (
                          <label
                            key={product.id}
                            className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${checked ? "bg-neutral-50 dark:bg-neutral-950/50" : "hover:bg-neutral-50/60 dark:hover:bg-neutral-950/30"}`}
                          >
                            <div className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border transition-colors ${checked ? "border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100" : "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800"}`}>
                              {checked && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="white" className="dark:stroke-neutral-900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <input type="checkbox" checked={checked} onChange={(e) => setSelectedProducts(e.target.checked ? [...selectedProducts, product.id] : selectedProducts.filter((id) => id !== product.id))} className="sr-only" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{product.title}</p>
                              {product.description && <p className="mt-0.5 truncate text-[11px] text-neutral-400 dark:text-neutral-500">{product.description.slice(0, 70)}…</p>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {selectedProducts.length === 0 && (
                    <p className="text-center text-xs text-amber-600 dark:text-amber-400">Select at least one product to continue</p>
                  )}
                </div>
              )}

              {/* ════ STEP 4: Send / Schedule ════ */}
              {step === 4 && (
                <div className="space-y-5">
                  <SectionHeader title="Send Campaign" subtitle="Choose when to deliver this campaign to your subscribers" />

                  {/* Campaign summary */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="overflow-hidden rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <div className="border-b border-neutral-100 bg-neutral-50/60 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-950/40">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Campaign</p>
                      </div>
                      <div className="divide-y divide-neutral-100 px-4 dark:divide-neutral-800">
                        <ReviewRow label="Name"    value={campaign.name} />
                        <ReviewRow label="Type"    value={selectedType.label} />
                        <ReviewRow label="Subject" value={campaign.subject} />
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <div className="border-b border-neutral-100 bg-neutral-50/60 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-950/40">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Products</p>
                        <span className="float-right mt-0.5 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                          {selectedProducts.length}
                        </span>
                      </div>
                      <div className="divide-y divide-neutral-100 px-4 dark:divide-neutral-800">
                        {selectedProducts.slice(0, 4).map((id) => {
                          const p = availableProducts.find((pr) => pr.id === id);
                          return p ? (
                            <div key={id} className="py-2.5">
                              <p className="truncate text-xs text-neutral-700 dark:text-neutral-300">{p.title}</p>
                            </div>
                          ) : null;
                        })}
                        {selectedProducts.length > 4 && (
                          <div className="py-2.5">
                            <p className="text-[11px] text-neutral-400">+ {selectedProducts.length - 4} more</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery options — card selector */}
                  <div>
                    <FieldLabel>Delivery</FieldLabel>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        { value: "immediate" as const, label: "Send Now",        hint: "Deliver to all subscribers immediately" },
                        { value: "scheduled"  as const, label: "Schedule Later",  hint: "Pick a date and time to send"           },
                      ].map((opt) => {
                        const active = sendMode === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSendMode(opt.value)}
                            className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3.5 text-left transition-all ${
                              active
                                ? "border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100"
                                : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
                            }`}
                          >
                            <span className={`text-xs font-semibold ${active ? "text-white dark:text-neutral-900" : "text-neutral-900 dark:text-neutral-100"}`}>
                              {opt.label}
                            </span>
                            <span className={`text-[11px] ${active ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-400 dark:text-neutral-500"}`}>
                              {opt.hint}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scheduled date picker */}
                  {sendMode === "scheduled" && (
                    <div>
                      <FieldLabel htmlFor="scheduleAt">Schedule Date & Time</FieldLabel>
                      <input
                        id="scheduleAt"
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className={inputCls}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}

                  {/* Edit shortcuts */}
                  <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                    {[{ label: "Edit details", s: 1 }, { label: "Edit content", s: 2 }, { label: "Change products", s: 3 }].map((l) => (
                      <button key={l.s} type="button" onClick={() => setStep(l.s)}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-400 dark:hover:bg-neutral-800">
                        {l.label} ↗
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Nav footer ── */}
            <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/40 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-950/20">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M8.5 3L5 7l3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>

              <div className="flex items-center gap-2">
                {/* Save draft — available on all steps */}
                {step < 4 && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {saving ? <Spinner /> : null}
                    Save draft
                  </button>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(4, s + 1))}
                    disabled={!canAdvance}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                  >
                    Continue
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5.5 3L9 7l-3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={saving || !canAdvance}
                    className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                  >
                    {saving ? <><Spinner />{sendMode === "immediate" ? "Sending…" : "Scheduling…"}</> : sendMode === "immediate" ? "Send Now" : "Schedule Campaign"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}