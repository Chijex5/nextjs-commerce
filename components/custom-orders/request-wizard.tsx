"use client";

import clsx from "clsx";
import { buttonClass } from "components/ui/button";
import { Field } from "components/ui/field";
import { useUserSession } from "hooks/useUserSession";
import { trackCustomOrderRequest } from "lib/analytics";
import {
  BUDGETS,
  DEADLINES,
  KINDS,
  MAX_LINKS,
  MAX_PHOTOS,
  SIZES,
  STYLES,
  estimate,
  labelFor,
  type ChosenEdit,
  type CustomKind,
  type CustomOrderSettings,
  type EditOption,
} from "lib/custom-orders/shared";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Link2,
  Loader2,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PhotoGrid, usePhotoUploads, type Photo } from "./photo-uploader";

export type PickerProduct = {
  handle: string;
  title: string;
  image: string | null;
  price: number;
};

type Step = "kind" | "start" | "changes" | "size" | "timing" | "details";

const STEP_LABEL: Record<Step, string> = {
  kind: "Type",
  start: "Start",
  changes: "Changes",
  size: "Size",
  timing: "Timing",
  details: "Send",
};

const DRAFT_KEY = "dfp-custom-request-draft-v1";

type Draft = {
  kind: CustomKind | null;
  productHandle: string | null;
  style: string | null;
  edits: Record<string, string>; // edit id → detail ("" when none)
  note: string;
  links: string[];
  sizeEu: number | null;
  sizeUnknown: boolean;
  pairs: number;
  footLengthCm: string;
  budgetBand: string | null;
  deadlineKind: string | null;
  desiredDate: string;
  name: string;
  phone: string;
  email: string;
  photos: Photo[];
};

const EMPTY: Draft = {
  kind: null,
  productHandle: null,
  style: null,
  edits: {},
  note: "",
  links: [],
  sizeEu: null,
  sizeUnknown: false,
  pairs: 1,
  footLengthCm: "",
  budgetBand: null,
  deadlineKind: null,
  desiredDate: "",
  name: "",
  phone: "",
  email: "",
  photos: [],
};

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const editPrice = (o: Pick<EditOption, "price" | "needsReview">) =>
  o.price === 0 && !o.needsReview
    ? "Free"
    : `${o.needsReview ? "from " : ""}+${naira(o.price)}`;

export function RequestWizard({
  products,
  editOptions,
  settings,
  initialProduct,
}: {
  products: PickerProduct[];
  editOptions: EditOption[];
  settings: CustomOrderSettings;
  initialProduct?: string;
}) {
  const router = useRouter();
  const { data: session } = useUserSession();
  const presetProduct = products.find((p) => p.handle === initialProduct);

  const [d, setD] = useState<Draft>(() =>
    presetProduct
      ? { ...EMPTY, kind: "modify", productHandle: presetProduct.handle }
      : EMPTY,
  );
  const [step, setStep] = useState<Step>(presetProduct ? "changes" : "kind");
  const [restored, setRestored] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const uploads = usePhotoUploads(MAX_PHOTOS);
  const top = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  // Restore a saved draft once (unless arriving from a product page with a different design).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as
        | (Draft & { step?: Step })
        | null;
      if (
        saved?.kind &&
        (!presetProduct || saved.productHandle === presetProduct.handle)
      ) {
        const { step: savedStep, photos, ...rest } = saved;
        setD({ ...EMPTY, ...rest, photos: [] });
        if (photos?.length) uploads.restore(photos);
        if (savedStep) setStep(savedStep);
        setRestored(true);
      }
    } catch {
      // ignore a corrupt draft
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    if (session?.email) setD((p) => (p.email ? p : { ...p, email: session.email }));
    if (session?.name) setD((p) => (p.name ? p : { ...p, name: session.name || "" }));
  }, [session?.email, session?.name]);

  // Save the draft (uploaded photos only) whenever it changes.
  useEffect(() => {
    if (!d.kind) return;
    const photos = uploads.photos.filter((p) => p.status === "uploaded");
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, photos, step }));
  }, [d, step, uploads.photos]);

  const product = products.find((p) => p.handle === d.productHandle) ?? null;
  const chosen: ChosenEdit[] = editOptions
    .filter((o) => o.id in d.edits)
    .map((o) => ({
      id: o.id,
      name: o.name,
      price: o.price,
      needsReview: o.needsReview,
      detail: d.edits[o.id] || undefined,
    }));
  const est =
    d.kind === "modify" && product
      ? estimate({
          basePrice: product.price,
          edits: chosen,
          sizeEu: d.sizeEu,
          pairs: d.pairs,
          hasExtraNote: Boolean(d.note.trim()),
          settings,
        })
      : null;

  const steps: Step[] = presetProduct
    ? ["changes", "size", "timing", "details"]
    : ["kind", "start", "changes", "size", "timing", "details"];
  const index = steps.indexOf(step);

  const problem = (s: Step): string | null => {
    switch (s) {
      case "kind":
        return d.kind ? null : "Choose one to continue";
      case "start":
        if (d.kind === "modify")
          return product ? null : "Pick the design you want to change";
        if (d.kind === "recreate")
          return uploads.urls.length || d.links.length
            ? null
            : "Add a photo or paste a link";
        return d.style ? null : "Pick a style";
      case "changes": {
        const missingDetail = editOptions.find(
          (o) => o.id in d.edits && o.detailPrompt && !d.edits[o.id]?.trim(),
        );
        if (missingDetail) return `${missingDetail.detailPrompt}`;
        if (d.kind === "modify")
          return chosen.length || d.note.trim()
            ? null
            : "Choose a change or describe it";
        if (d.kind === "new")
          return d.note.trim() || uploads.urls.length
            ? null
            : "Describe your idea";
        return null;
      }
      case "size":
        return d.sizeEu || d.sizeUnknown ? null : "Choose your size";
      case "timing":
        if (!d.deadlineKind) return "Tell us when you need it";
        if (d.deadlineKind === "date" && !d.desiredDate) return "Pick a date";
        return null;
      case "details":
        if (!d.name.trim()) return "Add your name";
        if (d.phone.replace(/\D/g, "").length < 10)
          return "Add your phone number";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()))
          return "Add a valid email";
        return null;
    }
  };

  const go = (target: Step) => {
    setStep(target);
    requestAnimationFrame(() =>
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };
  const next = () => {
    const issue = problem(step);
    if (issue) return toast.error(issue);
    if (step === "start" && uploads.uploading)
      return toast.error("Wait for your photos to finish uploading");
    const following = steps[index + 1];
    if (following) go(following);
  };
  const back = () => {
    const previous = steps[index - 1];
    if (previous) go(previous);
  };

  const startOver = () => {
    localStorage.removeItem(DRAFT_KEY);
    uploads.clear();
    setD(EMPTY);
    setRestored(false);
    go("kind");
  };

  const submit = async () => {
    for (const s of steps) {
      const issue = problem(s);
      if (issue) {
        go(s);
        return toast.error(issue);
      }
    }
    if (uploads.uploading)
      return toast.error("Wait for your photos to finish uploading");
    setSubmitting(true);
    try {
      const res = await fetch("/api/custom-order-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: d.kind,
          productHandle: d.kind === "modify" ? d.productHandle : undefined,
          style: d.kind === "new" ? d.style : undefined,
          edits: chosen.map((e) => ({ id: e.id, detail: e.detail })),
          note: d.note,
          referenceImages: uploads.urls,
          referenceLinks: d.links,
          sizeEu: d.sizeUnknown ? null : d.sizeEu,
          pairs: d.pairs,
          footLengthCm: d.footLengthCm ? Number(d.footLengthCm) : undefined,
          budgetBand: d.kind === "modify" ? undefined : d.budgetBand,
          deadlineKind: d.deadlineKind,
          desiredDate: d.deadlineKind === "date" ? d.desiredDate : undefined,
          customerName: d.name,
          phone: d.phone,
          email: d.email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send your request");
      trackCustomOrderRequest();
      localStorage.removeItem(DRAFT_KEY);
      router.push(`${data.request.pageUrl}&new=1`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send your request");
      setSubmitting(false);
    }
  };

  return (
    <div ref={top} className="mx-auto w-full max-w-2xl scroll-mt-20 px-4 pb-32 pt-6 sm:px-6 sm:pt-10">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="label text-fg-3">
            Step {index + 1} of {steps.length} · {STEP_LABEL[step]}
          </p>
          {restored ? (
            <button
              type="button"
              onClick={startOver}
              className="label text-fg-3 underline hover:text-fg"
            >
              Start over
            </button>
          ) : (
            <p className="label text-fg-3">No payment now</p>
          )}
        </div>
        <div className="flex gap-1" aria-hidden>
          {steps.map((s, i) => (
            <span
              key={s}
              className={clsx(
                "h-1 flex-1 transition-colors",
                i <= index ? "bg-fg" : "bg-line",
              )}
            />
          ))}
        </div>
      </div>

      {step === "kind" ? (
        <Section title="What would you like?" hint="Takes about a minute. You don't pay anything until you've seen the price.">
          <div className="grid gap-3">
            {KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => {
                  set({ kind: k.key });
                  go(k.key === "modify" && product ? "changes" : "start");
                }}
                className={clsx(
                  "group flex items-center justify-between gap-4 border p-5 text-left transition-colors",
                  d.kind === k.key ? "border-fg bg-plate" : "border-line hover:border-fg",
                )}
              >
                <span>
                  <span className="block text-lg font-semibold">{k.title}</span>
                  <span className="mt-1 block text-sm text-fg-2">{k.body}</span>
                </span>
                <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </Section>
      ) : null}

      {step === "start" && d.kind === "modify" ? (
        <ProductPicker
          products={products}
          selected={d.productHandle}
          onSelect={(handle) => {
            set({ productHandle: handle });
            go("changes");
          }}
        />
      ) : null}

      {step === "start" && d.kind === "recreate" ? (
        <Section
          title="Show us the pair"
          hint="A clear photo or screenshot works best. Add a few angles if you have them."
        >
          <PhotoGrid
            photos={uploads.photos}
            max={MAX_PHOTOS}
            onAdd={uploads.add}
            onRemove={uploads.remove}
          />
          <LinkInput links={d.links} onChange={(links) => set({ links })} />
        </Section>
      ) : null}

      {step === "start" && d.kind === "new" ? (
        <Section title="What kind of footwear?">
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <Chip
                key={s}
                active={d.style === s}
                onClick={() => set({ style: s })}
                className="h-14 text-base"
              >
                {s}
              </Chip>
            ))}
          </div>
          <p className="label mb-3 mt-8 text-fg-3">Sketches or inspiration (optional)</p>
          <PhotoGrid
            photos={uploads.photos}
            max={MAX_PHOTOS}
            onAdd={uploads.add}
            onRemove={uploads.remove}
          />
          <LinkInput links={d.links} onChange={(links) => set({ links })} />
        </Section>
      ) : null}

      {step === "changes" ? (
        <Section
          title={
            d.kind === "modify"
              ? "What should we change?"
              : d.kind === "recreate"
                ? "Anything different from the photo?"
                : "Tell us about your idea"
          }
          hint={
            d.kind === "modify"
              ? "Tap everything you'd like. Prices are added to the design's price."
              : d.kind === "recreate"
                ? "Optional — skip this if you want it exactly like the photo."
                : "Colours, materials, details — whatever you have in mind."
          }
        >
          {product && d.kind === "modify" ? (
            <div className="mb-5 flex items-center gap-3 border border-line p-3">
              <ProductThumb product={product} className="size-14" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{product.title}</p>
                <p className="text-sm text-fg-3">{naira(product.price)}</p>
              </div>
              {!presetProduct ? (
                <button
                  type="button"
                  onClick={() => go("start")}
                  className="label text-fg-3 underline hover:text-fg"
                >
                  Change
                </button>
              ) : null}
            </div>
          ) : null}

          {d.kind !== "new" && editOptions.length ? (
            <div className="grid gap-2">
              {editOptions.map((o) => {
                const on = o.id in d.edits;
                return (
                  <div
                    key={o.id}
                    className={clsx(
                      "border transition-colors",
                      on ? "border-fg bg-plate" : "border-line",
                    )}
                  >
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        const edits = { ...d.edits };
                        if (on) delete edits[o.id];
                        else edits[o.id] = "";
                        set({ edits });
                      }}
                      className="flex w-full items-center gap-3 p-4 text-left"
                    >
                      <span
                        className={clsx(
                          "grid size-5 shrink-0 place-items-center border",
                          on ? "border-fg bg-fg text-canvas" : "border-fg/40",
                        )}
                      >
                        {on ? <Check className="size-3.5" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{o.name}</span>
                        {o.description ? (
                          <span className="block text-sm text-fg-3">{o.description}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {editPrice(o)}
                      </span>
                    </button>
                    {on && o.detailPrompt ? (
                      <div className="px-4 pb-4 pl-12">
                        <input
                          autoFocus
                          value={d.edits[o.id]}
                          maxLength={120}
                          onChange={(e) =>
                            set({ edits: { ...d.edits, [o.id]: e.target.value } })
                          }
                          placeholder={o.detailPrompt}
                          aria-label={o.detailPrompt}
                          className="h-11 w-full border-b border-line bg-transparent text-base outline-none placeholder:text-fg-3 focus:border-fg"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          <label className="mt-6 block">
            <span className="label mb-2 block text-fg-3">
              {d.kind === "new"
                ? "Describe it"
                : "Something else? (optional)"}
            </span>
            <textarea
              value={d.note}
              onChange={(e) => set({ note: e.target.value })}
              maxLength={1500}
              rows={d.kind === "new" ? 5 : 3}
              placeholder={
                d.kind === "new"
                  ? "e.g. Flat slides in tan leather with a woven strap and gold detail"
                  : "Anything not on the list — we'll price it for you"
              }
              className="w-full border border-line bg-transparent p-3 text-base outline-none placeholder:text-fg-3 focus:border-fg"
            />
          </label>
          {d.kind === "modify" && d.note.trim() ? (
            <p className="mt-2 text-xs text-fg-3">
              We&apos;ll confirm the price of anything you describe here.
            </p>
          ) : null}
        </Section>
      ) : null}

      {step === "size" ? (
        <Section title="What size?" hint="EU sizes, with UK underneath.">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {SIZES.map((s) => (
              <button
                key={s.eu}
                type="button"
                onClick={() => set({ sizeEu: s.eu, sizeUnknown: false })}
                className={clsx(
                  "flex h-16 flex-col items-center justify-center border transition-colors",
                  d.sizeEu === s.eu && !d.sizeUnknown
                    ? "border-fg bg-fg text-canvas"
                    : "border-line hover:border-fg",
                )}
              >
                <span className="text-lg font-semibold tabular-nums">{s.eu}</span>
                <span className="text-[11px] opacity-60">UK {s.uk}</span>
              </button>
            ))}
          </div>
          {settings.largeSizeSurcharge > 0 ? (
            <p className="mt-2 text-xs text-fg-3">
              Sizes {settings.largeSizeFrom} and up are {naira(settings.largeSizeSurcharge)} extra per pair.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => set({ sizeUnknown: !d.sizeUnknown, sizeEu: null })}
            className={clsx(
              "mt-4 flex w-full items-center gap-3 border p-4 text-left transition-colors",
              d.sizeUnknown ? "border-fg bg-plate" : "border-line hover:border-fg",
            )}
          >
            <span
              className={clsx(
                "grid size-5 place-items-center border",
                d.sizeUnknown ? "border-fg bg-fg text-canvas" : "border-fg/40",
              )}
            >
              {d.sizeUnknown ? <Check className="size-3.5" /> : null}
            </span>
            Not sure — I&apos;ll confirm it with you later
          </button>

          <details className="group mt-6 border-t border-line pt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
              Know your foot length? (optional, helps us get the fit right)
              <Plus className="size-4 shrink-0 transition-transform group-open:rotate-45" />
            </summary>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-fg-2">
              <li>Stand on a sheet of paper with your heel against a wall.</li>
              <li>Mark the tip of your longest toe.</li>
              <li>Measure from the wall to the mark in centimetres. Do both feet and use the longer one.</li>
            </ol>
            <div className="mt-3 flex items-end gap-2">
              <Field
                label="Foot length (cm)"
                inputMode="decimal"
                value={d.footLengthCm}
                onChange={(e) =>
                  set({ footLengthCm: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })
                }
                placeholder="26.5"
                className="w-40"
              />
            </div>
          </details>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <span className="text-sm font-medium">How many pairs?</span>
            <div className="flex items-center">
              <button
                type="button"
                aria-label="Fewer pairs"
                disabled={d.pairs <= 1}
                onClick={() => set({ pairs: Math.max(1, d.pairs - 1) })}
                className="grid size-11 place-items-center border border-line disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-12 text-center text-lg font-semibold tabular-nums">{d.pairs}</span>
              <button
                type="button"
                aria-label="More pairs"
                disabled={d.pairs >= 20}
                onClick={() => set({ pairs: Math.min(20, d.pairs + 1) })}
                className="grid size-11 place-items-center border border-line disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          {d.pairs > 1 ? (
            <p className="mt-2 text-xs text-fg-3">
              Different sizes for each pair? Mention it in the message on your request page.
            </p>
          ) : null}
        </Section>
      ) : null}

      {step === "timing" ? (
        <Section title="When do you need it?" hint="Handmade pairs take time — we'll confirm a delivery date with your price.">
          <div className="grid gap-2 sm:grid-cols-3">
            {DEADLINES.map((o) => (
              <Chip
                key={o.key}
                active={d.deadlineKind === o.key}
                onClick={() => set({ deadlineKind: o.key })}
                className="h-14"
              >
                {o.label}
              </Chip>
            ))}
          </div>
          {d.deadlineKind === "date" ? (
            <Field
              type="date"
              label="Needed by"
              value={d.desiredDate}
              min={new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10)}
              onChange={(e) => set({ desiredDate: e.target.value })}
              className="mt-4 max-w-xs"
            />
          ) : null}

          {d.kind !== "modify" ? (
            <>
              <p className="label mb-3 mt-10 text-fg-3">Rough budget per pair (optional)</p>
              <div className="flex flex-wrap gap-2">
                {BUDGETS.map((b) => (
                  <Chip
                    key={b.key}
                    active={d.budgetBand === b.key}
                    onClick={() =>
                      set({ budgetBand: d.budgetBand === b.key ? null : b.key })
                    }
                    className="h-11 px-4"
                  >
                    {b.label}
                  </Chip>
                ))}
              </div>
            </>
          ) : null}
        </Section>
      ) : null}

      {step === "details" ? (
        <Section title="Check and send">
          <dl className="divide-y divide-line border-y border-line text-sm">
            <SummaryRow
              label="Request"
              onEdit={presetProduct ? undefined : () => go("kind")}
            >
              {KINDS.find((k) => k.key === d.kind)?.title}
              {d.kind === "modify" && product ? ` — ${product.title}` : ""}
              {d.kind === "new" && d.style ? ` — ${d.style}` : ""}
            </SummaryRow>
            {d.kind !== "modify" && (uploads.photos.length || d.links.length) ? (
              <SummaryRow label="References" onEdit={() => go("start")}>
                {[
                  uploads.photos.length
                    ? `${uploads.photos.length} photo${uploads.photos.length === 1 ? "" : "s"}`
                    : null,
                  d.links.length
                    ? `${d.links.length} link${d.links.length === 1 ? "" : "s"}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </SummaryRow>
            ) : null}
            <SummaryRow label="Changes" onEdit={() => go("changes")}>
              {chosen.length || d.note.trim() ? (
                <>
                  {chosen.map((e) => (
                    <span key={e.id} className="block">
                      {e.name}
                      {e.detail ? ` — ${e.detail}` : ""}
                    </span>
                  ))}
                  {d.note.trim() ? (
                    <span className="block text-fg-2">“{d.note.trim()}”</span>
                  ) : null}
                </>
              ) : (
                "Exactly as shown"
              )}
            </SummaryRow>
            <SummaryRow label="Size" onEdit={() => go("size")}>
              {d.sizeUnknown ? "To confirm" : `EU ${d.sizeEu}`}
              {d.footLengthCm ? ` · foot ${d.footLengthCm} cm` : ""}
              {d.pairs > 1 ? ` · ${d.pairs} pairs` : ""}
            </SummaryRow>
            <SummaryRow label="Timing" onEdit={() => go("timing")}>
              {d.deadlineKind === "date" && d.desiredDate
                ? `By ${new Date(d.desiredDate).toLocaleDateString("en-NG", { day: "numeric", month: "long" })}`
                : labelFor(DEADLINES, d.deadlineKind)}
              {d.kind !== "modify" && d.budgetBand
                ? ` · ${labelFor(BUDGETS, d.budgetBand)}`
                : ""}
            </SummaryRow>
          </dl>

          {est ? (
            <div className="mt-6 bg-plate p-5">
              <p className="label mb-3 text-fg-3">Estimated price</p>
              <ul className="space-y-1.5 text-sm">
                {est.lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span className="text-fg-2">{l.label}</span>
                    <span className="tabular-nums">{l.amount ? naira(l.amount) : "Free"}</span>
                  </li>
                ))}
                {d.pairs > 1 ? (
                  <li className="flex justify-between gap-4">
                    <span className="text-fg-2">× {d.pairs} pairs</span>
                    <span />
                  </li>
                ) : null}
              </ul>
              <div className="mt-3 flex items-baseline justify-between border-t border-fg/20 pt-3">
                <span className="font-medium">{est.partial ? "From" : "Total"}</span>
                <span className="font-head text-3xl font-extrabold tabular-nums [font-stretch:66%]">
                  {naira(est.total)}
                </span>
              </div>
              <p className="mt-2 text-xs text-fg-3">
                Plus delivery. {est.partial ? "We'll confirm the final price after we've looked at your request. " : ""}
                Nothing to pay now.
              </p>
            </div>
          ) : (
            <p className="mt-6 bg-plate p-5 text-sm text-fg-2">
              We&apos;ll look at your request and send you a price. Nothing to pay now.
            </p>
          )}

          <div className="mt-8 grid gap-5">
            <Field
              label="Your name"
              required
              autoComplete="name"
              value={d.name}
              onChange={(e) => set({ name: e.target.value })}
            />
            <Field
              label="Phone (WhatsApp if you have it)"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0803 123 4567"
              value={d.phone}
              onChange={(e) => set({ phone: e.target.value })}
            />
            <Field
              label="Email"
              required
              type="email"
              autoComplete="email"
              hint="We email you when we reply or send your price."
              value={d.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </div>
          <p className="mt-6 text-xs text-fg-3">
            We reply within {settings.replyHours} hours. Every request is checked by hand, and not every design can be made — if we can&apos;t make yours well, we&apos;ll tell you.
          </p>
        </Section>
      ) : null}

      {/* Actions (sticky on phones) */}
      {step !== "kind" ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <div className="mx-auto flex max-w-2xl gap-2">
            {index > 0 ? (
              <button type="button" onClick={back} className={buttonClass("outline", "lg", "px-4")} aria-label="Back">
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            ) : null}
            {step === "details" ? (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className={buttonClass("solid", "lg", "flex-1")}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Send request
              </button>
            ) : step === "start" && d.kind === "modify" ? null : (
              <button type="button" onClick={next} className={buttonClass("solid", "lg", "flex-1")}>
                {step === "changes" && d.kind === "recreate" && !chosen.length && !d.note.trim()
                  ? "Skip — make it as shown"
                  : `Next: ${STEP_LABEL[steps[index + 1] ?? "details"]}`}
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h1 className="display text-[clamp(2.4rem,8vw,3.75rem)]">{title}</h1>
      {hint ? <p className="mt-3 max-w-[52ch] text-fg-2">{hint}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center border text-sm font-medium transition-colors",
        active ? "border-fg bg-fg text-canvas" : "border-line hover:border-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}

function SummaryRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 py-3">
      <dt className="label w-24 shrink-0 pt-0.5 text-fg-3">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
      {onEdit ? (
        <button type="button" onClick={onEdit} className="label shrink-0 self-start pt-0.5 text-fg-3 underline hover:text-fg">
          Edit
        </button>
      ) : null}
    </div>
  );
}

function ProductThumb({ product, className }: { product: PickerProduct; className?: string }) {
  return (
    <div className={clsx("relative shrink-0 overflow-hidden bg-plate", className)}>
      {product.image ? (
        <Image src={product.image} alt="" fill sizes="120px" className="object-cover" />
      ) : null}
    </div>
  );
}

function ProductPicker({
  products,
  selected,
  onSelect,
}: {
  products: PickerProduct[];
  selected: string | null;
  onSelect: (handle: string) => void;
}) {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(24);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? products.filter((p) => p.title.toLowerCase().includes(term)) : products;
  }, [products, q]);

  return (
    <Section title="Which design?" hint="Pick the pair you'd like us to change.">
      <label className="relative mb-4 block">
        <Search className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-fg-3" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(24);
          }}
          placeholder="Search designs"
          aria-label="Search designs"
          className="h-12 w-full border-b border-line bg-transparent pl-7 text-base outline-none placeholder:text-fg-3 focus:border-fg"
        />
      </label>
      {list.length ? (
        <ul className="grid grid-cols-2 gap-x-2 gap-y-5 sm:grid-cols-3">
          {list.slice(0, limit).map((p) => (
            <li key={p.handle}>
              <button
                type="button"
                onClick={() => onSelect(p.handle)}
                className={clsx(
                  "group block w-full text-left outline-offset-2",
                  selected === p.handle && "outline outline-2 outline-fg",
                )}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-plate">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      sizes="(min-width:640px) 220px, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  {selected === p.handle ? (
                    <span className="absolute right-2 top-2 grid size-7 place-items-center bg-fg text-canvas">
                      <Check className="size-4" />
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 truncate text-sm font-medium">{p.title}</p>
                <p className="text-sm text-fg-3">{naira(p.price)}</p>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-fg-3">No designs match “{q}”.</p>
      )}
      {list.length > limit ? (
        <button type="button" onClick={() => setLimit((l) => l + 24)} className={buttonClass("outline", "md", "mt-6 w-full")}>
          Show more designs
        </button>
      ) : null}
    </Section>
  );
}

function LinkInput({ links, onChange }: { links: string[]; onChange: (links: string[]) => void }) {
  const [value, setValue] = useState("");
  const add = () => {
    const url = value.trim();
    if (!url) return;
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      if (links.length >= MAX_LINKS) return toast.error(`Up to ${MAX_LINKS} links`);
      onChange([...links, u.toString().replace(/^http:/, "https:")]);
      setValue("");
    } catch {
      toast.error("That doesn't look like a link");
    }
  };
  return (
    <div className="mt-6">
      <p className="label mb-2 text-fg-3">Or paste a link (TikTok, Instagram, Pinterest)</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-fg-3" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            inputMode="url"
            placeholder="https://vm.tiktok.com/…"
            className="h-12 w-full border-b border-line bg-transparent pl-7 text-base outline-none placeholder:text-fg-3 focus:border-fg"
          />
        </div>
        <button type="button" onClick={add} className={buttonClass("outline", "md", "h-12")}>
          Add
        </button>
      </div>
      {links.length ? (
        <ul className="mt-3 space-y-1">
          {links.map((l) => (
            <li key={l} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-fg-2">{l}</span>
              <button
                type="button"
                aria-label="Remove link"
                onClick={() => onChange(links.filter((x) => x !== l))}
                className="grid size-8 place-items-center text-fg-3 hover:text-fg"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
