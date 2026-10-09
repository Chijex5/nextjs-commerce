"use client";

import clsx from "clsx";
import { AudienceStep } from "components/admin/campaigns/audience-step";
import { ImageUpload } from "components/admin/ui/image-upload";
import { RichTextEditor } from "components/admin/ui/rich-text-editor";
import { buttonClass } from "components/ui/button";
import {
  BLOCK_LABELS,
  FIRST_NAME_TOKEN,
  STARTERS,
  blockProblems,
  newBlock,
  personaliseSubject,
  renderBlocksEmail,
  type BlockType,
  type EmailBlock,
  type EmailProduct,
} from "lib/email/blocks";
import type { Audience } from "lib/marketing/segment-defs";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  Loader2,
  Monitor,
  Plus,
  Send,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export type ComposerInitial = {
  id: string | null;
  name: string;
  subject: string;
  preheader: string;
  blocks: EmailBlock[] | null;
  audience: Audience;
  capHours: number;
  status: string;
  scheduledAt: string | null;
  convertedFromLegacy?: boolean;
};

type Step = "setup" | "design" | "send";
type PickerProduct = EmailProduct & { available: boolean };

const input =
  "h-11 w-full border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-fg";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dfootprint.me";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label mb-1.5 block text-fg-3">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-fg-3">{hint}</span>
      ) : null}
    </label>
  );
}

export function CampaignComposer({ initial }: { initial: ComposerInitial }) {
  const router = useRouter();
  const [id, setId] = useState(initial.id);
  const [step, setStep] = useState<Step>(initial.blocks ? "design" : "setup");
  const [name, setName] = useState(initial.name);
  const [subject, setSubject] = useState(initial.subject);
  const [preheader, setPreheader] = useState(initial.preheader);
  const [blocks, setBlocks] = useState<EmailBlock[] | null>(initial.blocks);
  const [openBlock, setOpenBlock] = useState<string | null>(
    initial.blocks?.[0]?.id ?? null,
  );
  const [audience, setAudience] = useState(initial.audience);
  const [capHours, setCapHours] = useState(initial.capHours);
  const [sendMode, setSendMode] = useState<"immediate" | "scheduled">(
    initial.scheduledAt ? "scheduled" : "immediate",
  );
  const [scheduleDate, setScheduleDate] = useState(
    initial.scheduledAt ? initial.scheduledAt.slice(0, 10) : "",
  );
  const [reachable, setReachable] = useState<number | null>(null);
  const [catalog, setCatalog] = useState<PickerProduct[]>([]);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [busy, setBusy] = useState<string | null>(null);
  // Render the preview only in the browser so server and client markup match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify([
      initial.name,
      initial.subject,
      initial.preheader,
      initial.blocks,
      initial.audience,
      initial.capHours,
    ]),
  );

  const snapshot = JSON.stringify([
    name,
    subject,
    preheader,
    blocks,
    audience,
    capHours,
  ]);
  const dirty = snapshot !== savedSnapshot || initial.convertedFromLegacy;

  useEffect(() => {
    fetch("/api/admin/campaigns/products")
      .then((r) => r.json())
      .then((d) => setCatalog(d.products ?? []))
      .catch(() => toast.error("Couldn't load products"));
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const productMap = useMemo(
    () => new Map(catalog.map((p) => [p.id, p])),
    [catalog],
  );
  const previewHtml = useMemo(
    () =>
      blocks
        ? renderBlocksEmail(
            blocks,
            { products: productMap, firstName: "Ada", siteUrl: SITE },
            "#",
          )
        : "",
    [blocks, productMap],
  );

  const updateBlock = (bid: string, patch: Partial<EmailBlock>) =>
    setBlocks(
      (bs) =>
        bs?.map((b) =>
          b.id === bid ? ({ ...b, ...patch } as EmailBlock) : b,
        ) ?? bs,
    );
  const moveBlock = (i: number, dir: -1 | 1) =>
    setBlocks((bs) => {
      if (!bs) return bs;
      const next = [...bs];
      const [m] = next.splice(i, 1);
      next.splice(i + dir, 0, m!);
      return next;
    });
  const addBlock = (type: BlockType, at?: number) => {
    const b = newBlock(type);
    setBlocks((bs) => {
      const next = [...(bs ?? [])];
      next.splice(at ?? next.length, 0, b);
      return next;
    });
    setOpenBlock(b.id);
  };

  async function save(quiet = false): Promise<string | null> {
    if (!name.trim()) {
      toast.error("Give the campaign a name (only you see it)");
      setStep("setup");
      return null;
    }
    if (!subject.trim()) {
      toast.error("Add a subject line");
      setStep("setup");
      return null;
    }
    setBusy("save");
    try {
      const body = JSON.stringify({
        name: name.trim(),
        subject: subject.trim(),
        preheader: preheader.trim(),
        type: "COLLECTION",
        content: blocks ?? [],
        audience,
        frequencyCapHours: capHours,
      });
      const res = await fetch(
        id ? `/api/admin/campaigns/${id}` : "/api/admin/campaigns",
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save");
      const newId = id ?? data.campaignId ?? data.campaign?.id ?? null;
      if (!id && newId) {
        setId(newId);
        window.history.replaceState(null, "", `/admin/campaigns/${newId}/edit`);
      }
      setSavedSnapshot(snapshot);
      if (!quiet) toast.success("Draft saved");
      return newId;
    } catch (e) {
      toast.error((e as Error).message);
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function testSend() {
    const cid = await save(true);
    if (!cid) return;
    setBusy("test");
    const res = await fetch(`/api/admin/campaigns/${cid}/test-send`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error(data.error || "Couldn't send the test");
    toast.success(`Test sent to ${data.to}`);
  }

  async function send() {
    const problems = blockProblems(blocks ?? []);
    if (problems.length) {
      toast.error(problems[0]);
      setStep("design");
      return;
    }
    if (sendMode === "scheduled" && !scheduleDate)
      return toast.error("Pick a day");
    if (sendMode === "immediate") {
      if (!reachable) return toast.error("Nobody is in this audience yet");
      if (
        !window.confirm(
          `Send “${subject}” to ${reachable.toLocaleString("en-NG")} people now? This can't be undone.`,
        )
      )
        return;
    }
    const cid = await save(true);
    if (!cid) return;
    setBusy("send");
    try {
      const res = await fetch(`/api/admin/campaigns/${cid}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          sendMode === "immediate"
            ? { sendImmediately: true }
            : { scheduleDate },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send");
      toast.success(
        sendMode === "immediate"
          ? `Sending to ${data.sent + (data.remaining ?? 0)} people`
          : "Scheduled",
      );
      router.push(
        sendMode === "immediate"
          ? `/admin/campaigns/${cid}/analytics`
          : "/admin/campaigns",
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const STEPS: Array<{ key: Step; label: string }> = [
    { key: "setup", label: "1 · Setup" },
    { key: "design", label: "2 · Design" },
    { key: "send", label: "3 · Audience & send" },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <header className="sticky top-14 z-30 -mx-4 mb-6 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-16 lg:-mx-10 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/campaigns"
              aria-label="Back to campaigns"
              className="grid size-10 shrink-0 place-items-center border border-line hover:border-fg"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <p className="truncate font-head text-xl font-extrabold uppercase leading-none [font-stretch:66%] sm:text-2xl">
                {name || "New campaign"}
              </p>
              <p className="mt-1 text-xs text-fg-3">
                {initial.status === "SCHEDULED" ? "Scheduled · " : "Draft · "}
                {dirty ? (
                  <span className="text-amber-700 dark:text-amber-400">
                    unsaved changes
                  </span>
                ) : (
                  "saved"
                )}
              </p>
            </div>
          </div>
          <nav aria-label="Steps" className="flex border border-line">
            {STEPS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() =>
                  s.key !== "setup" && !blocks
                    ? toast.error("Pick a starting layout first")
                    : setStep(s.key)
                }
                className={clsx(
                  "h-9 px-3 font-mono text-[11px] uppercase tracking-wide",
                  step === s.key
                    ? "bg-fg text-canvas"
                    : "text-fg-3 hover:text-fg",
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => save()}
              className={buttonClass("outline", "md")}
            >
              {busy === "save" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}{" "}
              Save draft
            </button>
          </div>
        </div>
        {initial.convertedFromLegacy ? (
          <p className="mt-2 text-xs text-fg-3">
            This campaign used the old template. It&apos;s been turned into
            blocks; save to keep the new version.
          </p>
        ) : null}
      </header>

      {/* ── 1. Setup ── */}
      {step === "setup" ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <Field label="Campaign name" hint="Only you see this.">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. October new arrivals"
                className={input}
              />
            </Field>
            <SubjectField subject={subject} onSubject={setSubject} />
            <Field
              label="Preview text"
              hint="The grey line shown after the subject in most inboxes."
            >
              <input
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                placeholder="e.g. Handmade in Lagos, ready to ship"
                className={input}
              />
            </Field>
            <InboxPreview subject={subject} preheader={preheader} />
          </div>
          <div>
            <p className="label mb-3 text-fg-3">
              {blocks ? "Start again from a layout" : "Pick a starting layout"}
            </p>
            <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
              {STARTERS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    if (
                      blocks &&
                      !window.confirm(
                        "Replace the current design with this layout?",
                      )
                    )
                      return;
                    const built = s.build();
                    setBlocks(built);
                    setOpenBlock(built[0]?.id ?? null);
                    if (!subject && s.subject) setSubject(s.subject);
                    if (!name) setName(s.name);
                    setStep("design");
                  }}
                  className="bg-canvas p-4 text-left transition-colors hover:bg-plate"
                >
                  <span className="block text-sm font-semibold">{s.name}</span>
                  <span className="mt-1 block text-xs text-fg-3">
                    {s.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── 2. Design ── */}
      {step === "design" && blocks ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_640px]">
          <div className="space-y-2">
            {blocks.map((b, i) => (
              <BlockCard
                key={b.id}
                block={b}
                open={openBlock === b.id}
                onToggle={() => setOpenBlock(openBlock === b.id ? null : b.id)}
                onChange={(patch) => updateBlock(b.id, patch)}
                onMove={(dir) => moveBlock(i, dir)}
                onDuplicate={() => {
                  const copy = {
                    ...b,
                    id: Math.random().toString(36).slice(2, 10),
                  } as EmailBlock;
                  setBlocks((bs) => [
                    ...(bs ?? []).slice(0, i + 1),
                    copy,
                    ...(bs ?? []).slice(i + 1),
                  ]);
                }}
                onDelete={() =>
                  setBlocks((bs) => bs?.filter((x) => x.id !== b.id) ?? bs)
                }
                isFirst={i === 0}
                isLast={i === blocks.length - 1}
                catalog={catalog}
              />
            ))}
            <AddBlock onAdd={(t) => addBlock(t)} />
            <div className="flex flex-wrap gap-2 pt-4">
              <button
                type="button"
                onClick={() => setStep("send")}
                className={buttonClass("solid", "md")}
              >
                Next: audience & send
              </button>
              <button
                type="button"
                disabled={!!busy}
                onClick={testSend}
                className={buttonClass("outline", "md")}
              >
                {busy === "test" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}{" "}
                Send me a test
              </button>
            </div>
          </div>

          <div className="xl:sticky xl:top-36 xl:self-start">
            <div className="mb-2 flex items-center justify-between">
              <p className="label text-fg-3">Preview · as “Ada” would see it</p>
              <div className="flex border border-line">
                {(["desktop", "mobile"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-label={`${d} preview`}
                    onClick={() => setDevice(d)}
                    className={clsx(
                      "grid size-8 place-items-center",
                      device === d
                        ? "bg-fg text-canvas"
                        : "text-fg-3 hover:text-fg",
                    )}
                  >
                    {d === "desktop" ? (
                      <Monitor className="size-4" />
                    ) : (
                      <Smartphone className="size-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-center border border-line bg-plate p-3">
              <iframe
                title="Email preview"
                srcDoc={mounted ? previewHtml : ""}
                sandbox=""
                className="h-[72vh] bg-white transition-[width]"
                style={{ width: device === "desktop" ? 620 : 375 }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* ── 3. Audience & send ── */}
      {step === "send" ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <AudienceStep
            campaignId={id ?? undefined}
            audience={audience}
            onAudience={setAudience}
            capHours={capHours}
            onCapHours={setCapHours}
            sendMode={sendMode}
            onSendMode={setSendMode}
            scheduleDate={scheduleDate}
            onScheduleDate={setScheduleDate}
            onReachable={setReachable}
          />
          <aside className="space-y-4 lg:sticky lg:top-36 lg:self-start">
            <InboxPreview subject={subject} preheader={preheader} />
            {blockProblems(blocks ?? []).length ? (
              <ul className="space-y-1 border border-amber-500/50 bg-amber-500/5 p-4 text-sm">
                {blockProblems(blocks ?? []).map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              disabled={!!busy}
              onClick={send}
              className={buttonClass("solid", "lg", "w-full")}
            >
              {busy === "send" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {sendMode === "immediate"
                ? `Send to ${reachable?.toLocaleString("en-NG") ?? "…"} people`
                : "Schedule"}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={testSend}
              className={buttonClass("outline", "md", "w-full")}
            >
              Send me a test first
            </button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function SubjectField({
  subject,
  onSubject,
}: {
  subject: string;
  onSubject: (s: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const length = personaliseSubject(subject, "Ada").length;
  return (
    <Field
      label="Subject line"
      hint={
        <span className="flex justify-between gap-3">
          <span>Phones show about 40 characters. Lead with the news.</span>
          <span
            className={length > 60 ? "text-amber-700 dark:text-amber-400" : ""}
          >
            {length}
          </span>
        </span>
      }
    >
      <div className="flex gap-2">
        <input
          ref={ref}
          value={subject}
          onChange={(e) => onSubject(e.target.value)}
          placeholder="e.g. New in: the Lekki leather slide"
          className={input}
        />
        <button
          type="button"
          onClick={() => {
            const el = ref.current;
            const at = el?.selectionStart ?? subject.length;
            onSubject(
              `${subject.slice(0, at)}${FIRST_NAME_TOKEN}${subject.slice(at)}`,
            );
          }}
          className="h-11 shrink-0 border border-line px-3 font-mono text-[10px] uppercase tracking-wide text-fg-2 hover:border-fg hover:text-fg"
        >
          + First name
        </button>
      </div>
    </Field>
  );
}

function InboxPreview({
  subject,
  preheader,
}: {
  subject: string;
  preheader: string;
}) {
  return (
    <div className="border border-line p-4">
      <p className="label mb-3 text-fg-3">In the inbox</p>
      <div className="flex gap-3">
        <span className="grid size-9 shrink-0 place-items-center bg-fg font-mono text-[10px] text-canvas">
          DF
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">D&apos;FOOTPRINT</p>
          <p className="truncate text-sm text-fg">
            {personaliseSubject(subject, "Ada") || "Your subject line"}
          </p>
          <p className="truncate text-xs text-fg-3">
            {personaliseSubject(preheader, "Ada") ||
              "Preview text appears here"}
          </p>
        </div>
      </div>
    </div>
  );
}

function AddBlock({ onAdd }: { onAdd: (t: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <div className="border border-dashed border-fg p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="label text-fg-3">Add a block</p>
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="text-fg-3 hover:text-fg"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid gap-px bg-line sm:grid-cols-2">
        {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              onAdd(t);
              setOpen(false);
            }}
            className="bg-canvas p-3 text-left hover:bg-plate"
          >
            <span className="block text-sm font-medium">
              {BLOCK_LABELS[t].label}
            </span>
            <span className="block text-xs text-fg-3">
              {BLOCK_LABELS[t].hint}
            </span>
          </button>
        ))}
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex w-full items-center justify-center gap-2 border border-dashed border-line py-4 text-sm text-fg-3 hover:border-fg hover:text-fg"
    >
      <Plus className="size-4" /> Add block
    </button>
  );
}

function summary(b: EmailBlock, catalog: PickerProduct[]) {
  switch (b.type) {
    case "hero":
      return b.heading || "No headline";
    case "text":
      return (
        b.html
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 60) || "Empty"
      );
    case "products":
      return b.productIds.length
        ? b.productIds
            .map((id) => catalog.find((p) => p.id === id)?.title ?? "…")
            .join(", ")
        : "No products picked";
    case "discount":
      return b.code || "No code";
    case "button":
      return b.label;
    case "image":
      return b.src ? b.alt || "Image" : "No image";
    case "divider":
      return "";
  }
}

function BlockCard({
  block,
  open,
  onToggle,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
  isFirst,
  isLast,
  catalog,
}: {
  block: EmailBlock;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<EmailBlock>) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
  catalog: PickerProduct[];
}) {
  const icon =
    "grid size-8 place-items-center text-fg-3 hover:bg-plate hover:text-fg disabled:opacity-30";
  return (
    <section className={clsx("border", open ? "border-fg" : "border-line")}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-baseline gap-3 py-1 text-left"
        >
          <span className="label shrink-0 text-fg">
            {BLOCK_LABELS[block.type].label}
          </span>
          <span className="truncate text-xs text-fg-3">
            {summary(block, catalog)}
          </span>
        </button>
        <button
          type="button"
          aria-label="Move up"
          disabled={isFirst}
          onClick={() => onMove(-1)}
          className={icon}
        >
          <ArrowUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={isLast}
          onClick={() => onMove(1)}
          className={icon}
        >
          <ArrowDown className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Duplicate"
          onClick={onDuplicate}
          className={icon}
        >
          <Copy className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Delete block"
          onClick={onDelete}
          className={clsx(icon, "hover:text-red-600")}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {open ? (
        <div className="space-y-4 border-t border-line p-4">
          {renderEditor(block, onChange, catalog)}
        </div>
      ) : null}
    </section>
  );
}

function renderEditor(
  b: EmailBlock,
  onChange: (patch: Partial<EmailBlock>) => void,
  catalog: PickerProduct[],
) {
  const set = onChange as (p: Record<string, unknown>) => void;
  switch (b.type) {
    case "hero":
      return (
        <>
          <ImageUpload
            label="Photo"
            value={b.image}
            onChange={(image) => set({ image })}
            aspect="aspect-[16/9]"
          />
          <Field label="Headline">
            <input
              value={b.heading}
              onChange={(e) => set({ heading: e.target.value })}
              className={input}
            />
          </Field>
          <Field label="Short line under it">
            <input
              value={b.text}
              onChange={(e) => set({ text: e.target.value })}
              className={input}
            />
          </Field>
          <LinkFields
            label={b.buttonLabel}
            url={b.buttonUrl}
            onLabel={(buttonLabel) => set({ buttonLabel })}
            onUrl={(buttonUrl) => set({ buttonUrl })}
          />
        </>
      );
    case "text":
      return (
        <RichTextEditor
          label="Text"
          value={b.html}
          onChange={(html) => set({ html })}
          minHeight={140}
          tokens={[{ label: "First name", value: FIRST_NAME_TOKEN }]}
        />
      );
    case "products":
      return <ProductPicker block={b} onChange={set} catalog={catalog} />;
    case "discount":
      return (
        <>
          <Field
            label="Coupon code"
            hint={
              <Link
                href="/admin/coupons/new"
                target="_blank"
                className="underline"
              >
                Create a coupon
              </Link>
            }
          >
            <input
              value={b.code}
              onChange={(e) => set({ code: e.target.value.toUpperCase() })}
              placeholder="e.g. EKO15"
              className={`${input} font-mono uppercase`}
            />
          </Field>
          <Field label="Line above the code">
            <input
              value={b.headline}
              onChange={(e) => set({ headline: e.target.value })}
              className={input}
            />
          </Field>
          <Field label="Small print">
            <input
              value={b.note}
              onChange={(e) => set({ note: e.target.value })}
              placeholder="e.g. Ends Sunday. One use per customer."
              className={input}
            />
          </Field>
        </>
      );
    case "button":
      return (
        <LinkFields
          label={b.label}
          url={b.url}
          onLabel={(label) => set({ label })}
          onUrl={(url) => set({ url })}
        />
      );
    case "image":
      return (
        <>
          <ImageUpload
            label="Image"
            value={b.src}
            onChange={(src) => set({ src })}
            aspect="aspect-[16/9]"
          />
          <Field
            label="Describe the image"
            hint="Shown when images are blocked, and read aloud by screen readers."
          >
            <input
              value={b.alt}
              onChange={(e) => set({ alt: e.target.value })}
              className={input}
            />
          </Field>
          <Field label="Link (optional)">
            <input
              value={b.url}
              onChange={(e) => set({ url: e.target.value })}
              placeholder="/products"
              className={input}
            />
          </Field>
        </>
      );
    case "divider":
      return (
        <p className="text-xs text-fg-3">
          A thin line to separate sections. Nothing to set.
        </p>
      );
  }
}

const QUICK_LINKS = [
  { label: "All products", url: "/products" },
  { label: "Custom orders", url: "/custom-orders" },
  { label: "Home page", url: "/" },
];

function LinkFields({
  label,
  url,
  onLabel,
  onUrl,
}: {
  label: string;
  url: string;
  onLabel: (v: string) => void;
  onUrl: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Button text">
        <input
          value={label}
          onChange={(e) => onLabel(e.target.value)}
          className={input}
        />
      </Field>
      <Field
        label="Goes to"
        hint={
          <span className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((q) => (
              <button
                key={q.url}
                type="button"
                onClick={() => onUrl(q.url)}
                className="underline hover:text-fg"
              >
                {q.label}
              </button>
            ))}
          </span>
        }
      >
        <input
          value={url}
          onChange={(e) => onUrl(e.target.value)}
          placeholder="/products"
          className={input}
        />
      </Field>
    </div>
  );
}

function ProductPicker({
  block,
  onChange,
  catalog,
}: {
  block: Extract<EmailBlock, { type: "products" }>;
  onChange: (p: Record<string, unknown>) => void;
  catalog: PickerProduct[];
}) {
  const [q, setQ] = useState("");
  const picked = block.productIds;
  const results = catalog
    .filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 30);
  const toggle = (pid: string) =>
    onChange({
      productIds: picked.includes(pid)
        ? picked.filter((x) => x !== pid)
        : [...picked, pid],
    });
  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex border border-line">
          {([1, 2] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ columns: c })}
              className={clsx(
                "h-9 px-3 font-mono text-[11px] uppercase",
                block.columns === c
                  ? "bg-fg text-canvas"
                  : "text-fg-3 hover:text-fg",
              )}
            >
              {c === 1 ? "Large" : "Grid of 2"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={block.showPrice}
            onChange={(e) => onChange({ showPrice: e.target.checked })}
            className="size-4"
          />
          Show prices
        </label>
        <label className="flex items-center gap-2 text-sm">
          Link text
          <input
            value={block.buttonLabel}
            onChange={(e) => onChange({ buttonLabel: e.target.value })}
            className="h-9 w-28 border border-line bg-canvas px-2 text-sm outline-none focus:border-fg"
          />
        </label>
      </div>

      {picked.length ? (
        <ol className="space-y-1">
          {picked.map((pid, i) => {
            const p = catalog.find((x) => x.id === pid);
            return (
              <li
                key={pid}
                className="flex items-center gap-2 bg-plate px-2 py-1.5 text-sm"
              >
                <span className="font-mono text-[10px] text-fg-3">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">
                  {p?.title ?? "Removed product"}
                </span>
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() =>
                    onChange({ productIds: swap(picked, i, i - 1) })
                  }
                  className="grid size-7 place-items-center text-fg-3 hover:text-fg disabled:opacity-30"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => toggle(pid)}
                  className="grid size-7 place-items-center text-fg-3 hover:text-red-600"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Pick at least one product.
        </p>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products"
        className={input}
      />
      <ul className="max-h-64 divide-y divide-line overflow-y-auto border border-line">
        {results.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-plate">
              <input
                type="checkbox"
                checked={picked.includes(p.id)}
                onChange={() => toggle(p.id)}
                className="size-4"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny thumbnails from mixed hosts */}
              {p.image ? (
                <img src={p.image} alt="" className="size-9 object-cover" />
              ) : (
                <span className="size-9 bg-plate" />
              )}
              <span className="min-w-0 flex-1 truncate">{p.title}</span>
              {!p.available ? (
                <span className="text-xs text-fg-3">Hidden</span>
              ) : null}
            </label>
          </li>
        ))}
      </ul>
    </>
  );
}

function swap<T>(arr: T[], a: number, b: number) {
  const next = [...arr];
  [next[a], next[b]] = [next[b]!, next[a]!];
  return next;
}
