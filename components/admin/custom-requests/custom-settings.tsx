"use client";

import clsx from "clsx";
import { Panel } from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { Sheet } from "components/ui/sheet";
import { money } from "lib/admin/format";
import type { CustomOrderSettings, EditOption } from "lib/custom-orders/shared";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Option = EditOption & { isActive: boolean; position: number };

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  detailPrompt: string;
  needsReview: boolean;
  isActive: boolean;
  position: number;
};

const blank = (position: number): Draft => ({
  name: "",
  description: "",
  price: "",
  detailPrompt: "",
  needsReview: false,
  isActive: true,
  position,
});

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

const toForm = (s: CustomOrderSettings) => ({
  depositPercent: String(s.depositPercent),
  largeSizeFrom: String(s.largeSizeFrom),
  largeSizeSurcharge: String(s.largeSizeSurcharge),
  replyHours: String(s.replyHours),
  photoAutoApproveHours: String(s.photoAutoApproveHours),
});

const input =
  "h-11 w-full border border-line bg-canvas px-3 text-sm outline-none focus:border-fg";

export function CustomOrderSettingsForm({
  options,
  settings,
}: {
  options: Option[];
  settings: CustomOrderSettings;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState(toForm(settings));

  async function run(
    label: string,
    task: () => Promise<unknown>,
    done?: string,
  ) {
    setBusy(label);
    try {
      await task();
      if (done) toast.success(done);
      refresh();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(null);
    }
  }

  const saveOption = async () => {
    if (!editing) return;
    const body = {
      ...editing,
      price: Number(editing.price.replace(/[^\d.]/g, "") || 0),
    };
    const ok = await run(
      "option",
      () =>
        editing.id
          ? send(`/api/admin/custom-edit-options/${editing.id}`, "PUT", body)
          : send("/api/admin/custom-edit-options", "POST", body),
      "Saved",
    );
    if (ok) setEditing(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    const a = options[index];
    const b = options[index + dir];
    if (!a || !b) return;
    const order = [...options];
    order[index] = b;
    order[index + dir] = a;
    // Renumber everything so equal positions can't get stuck.
    void run(`move-${a.id}`, () =>
      Promise.all(
        order.map((o, i) =>
          o.position === i + 1
            ? null
            : send(`/api/admin/custom-edit-options/${o.id}`, "PUT", {
                ...o,
                position: i + 1,
              }),
        ),
      ),
    );
  };

  const saveSettings = () =>
    run(
      "settings",
      async () => {
        const data = await send("/api/admin/custom-order-settings", "PUT", {
          depositPercent: Number(form.depositPercent),
          largeSizeFrom: Number(form.largeSizeFrom),
          largeSizeSurcharge: Number(
            form.largeSizeSurcharge.replace(/[^\d]/g, ""),
          ),
          replyHours: Number(form.replyHours),
          photoAutoApproveHours: Number(form.photoAutoApproveHours),
        });
        setForm(toForm(data.settings));
      },
      "Settings saved",
    );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel
        title="Edit menu"
        description="Shown as tick-boxes when a customer customises a design. The price is added to the design's price."
      >
        <ul className="divide-y divide-line">
          {options.map((o, i) => (
            <li
              key={o.id}
              className={clsx(
                "flex items-center gap-3 px-5 py-3",
                !o.isActive && "opacity-50",
              )}
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0 || !!busy}
                  onClick={() => move(i, -1)}
                  className="text-fg-3 hover:text-fg disabled:opacity-30"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === options.length - 1 || !!busy}
                  onClick={() => move(i, 1)}
                  className="text-fg-3 hover:text-fg disabled:opacity-30"
                >
                  <ArrowDown className="size-3.5" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {o.name}
                  {!o.isActive ? (
                    <span className="font-normal text-fg-3"> · hidden</span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-fg-3">
                  {[
                    o.description,
                    o.detailPrompt ? `asks “${o.detailPrompt}”` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              <span className="shrink-0 text-sm tabular-nums">
                {o.needsReview ? "from " : ""}
                {o.price ? money(o.price) : "Free"}
              </span>
              <button
                type="button"
                onClick={() =>
                  run(`vis-${o.id}`, () =>
                    send(`/api/admin/custom-edit-options/${o.id}`, "PUT", {
                      ...o,
                      isActive: !o.isActive,
                    }),
                  )
                }
                disabled={!!busy}
                className="label shrink-0 text-fg-3 hover:text-fg"
              >
                {o.isActive ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                aria-label={`Edit ${o.name}`}
                onClick={() =>
                  setEditing({
                    id: o.id,
                    name: o.name,
                    description: o.description ?? "",
                    price: String(o.price),
                    detailPrompt: o.detailPrompt ?? "",
                    needsReview: o.needsReview,
                    isActive: o.isActive,
                    position: o.position,
                  })
                }
                className="text-fg-3 hover:text-fg"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${o.name}`}
                disabled={!!busy}
                onClick={() =>
                  window.confirm(
                    `Delete “${o.name}”? Past requests keep their own copy.`,
                  ) &&
                  run(`del-${o.id}`, () =>
                    send(`/api/admin/custom-edit-options/${o.id}`, "DELETE"),
                  )
                }
                className="text-fg-3 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
          {!options.length ? (
            <li className="px-5 py-8 text-center text-sm text-fg-3">
              No edits yet. Add the changes you&apos;re happy to make.
            </li>
          ) : null}
        </ul>

        <div className="border-t border-line p-4">
          <button
            type="button"
            onClick={() => setEditing(blank(options.length + 1))}
            className={buttonClass("outline", "md")}
          >
            <Plus className="size-4" /> Add an edit
          </button>
        </div>
      </Panel>

      <Panel title="Pricing & promises">
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label mb-1.5 block text-fg-3">
                Large sizes from (EU)
              </span>
              <input
                inputMode="numeric"
                value={form.largeSizeFrom}
                onChange={(e) =>
                  setForm({ ...form, largeSizeFrom: e.target.value })
                }
                className={input}
              />
            </label>
            <label className="block">
              <span className="label mb-1.5 block text-fg-3">
                Extra per pair (₦)
              </span>
              <input
                inputMode="numeric"
                value={form.largeSizeSurcharge}
                onChange={(e) =>
                  setForm({ ...form, largeSizeSurcharge: e.target.value })
                }
                className={input}
              />
            </label>
          </div>
          <p className="-mt-2 text-xs text-fg-3">
            EU {form.largeSizeFrom || "—"} and up cost{" "}
            {money(Number(form.largeSizeSurcharge.replace(/[^\d]/g, "")) || 0)}{" "}
            more per pair. Use 0 for no surcharge.
          </p>
          <label className="block">
            <span className="label mb-1.5 block text-fg-3">
              We reply within (hours)
            </span>
            <input
              inputMode="numeric"
              value={form.replyHours}
              onChange={(e) => setForm({ ...form, replyHours: e.target.value })}
              className={input}
            />
            <span className="mt-1 block text-xs text-fg-3">
              Shown on the form, the confirmation and the email.
            </span>
          </label>
          <label className="block">
            <span className="label mb-1.5 block text-fg-3">Deposit (%)</span>
            <input
              inputMode="numeric"
              value={form.depositPercent}
              onChange={(e) =>
                setForm({ ...form, depositPercent: e.target.value })
              }
              className={input}
            />
          </label>
          <label className="block">
            <span className="label mb-1.5 block text-fg-3">
              Progress photo approves itself after (hours)
            </span>
            <input
              inputMode="numeric"
              value={form.photoAutoApproveHours}
              onChange={(e) =>
                setForm({ ...form, photoAutoApproveHours: e.target.value })
              }
              className={input}
            />
          </label>
          <p className="text-xs text-fg-3">
            Progress photos switch on in the next update. Set the time now and
            it&apos;ll be used then.
          </p>
          <button
            type="button"
            onClick={saveSettings}
            disabled={busy === "settings"}
            className={buttonClass("solid", "md", "w-full")}
          >
            {busy === "settings" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save settings
          </button>
        </div>
      </Panel>

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit item" : "New item"}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveOption}
              disabled={busy === "option"}
              className={buttonClass("solid", "md", "flex-1")}
            >
              {busy === "option" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className={buttonClass("outline", "md")}
            >
              Cancel
            </button>
          </div>
        }
      >
        {editing ? (
          <div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
              <label className="block">
                <span className="label mb-1.5 block text-fg-3">Name</span>
                <input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  placeholder="Add roses"
                  autoFocus
                  className={input}
                />
              </label>
              <label className="block">
                <span className="label mb-1.5 block text-fg-3">Price (₦)</span>
                <input
                  inputMode="numeric"
                  value={editing.price}
                  onChange={(e) =>
                    setEditing({ ...editing, price: e.target.value })
                  }
                  placeholder="0 = free"
                  className={input}
                />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="label mb-1.5 block text-fg-3">
                Short description (optional)
              </span>
              <input
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                placeholder="Hand-finished rose details on the strap"
                className={input}
              />
            </label>
            <label className="mt-3 block">
              <span className="label mb-1.5 block text-fg-3">
                Ask the customer (optional)
              </span>
              <input
                value={editing.detailPrompt}
                onChange={(e) =>
                  setEditing({ ...editing, detailPrompt: e.target.value })
                }
                placeholder="Which colour?"
                className={input}
              />
              <span className="mt-1 block text-xs text-fg-3">
                Shows a text box when they pick this, e.g. for the colour or the
                name to add.
              </span>
            </label>
            <label className="mt-4 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.needsReview}
                onChange={(e) =>
                  setEditing({ ...editing, needsReview: e.target.checked })
                }
                className="mt-0.5 size-4"
              />
              <span>
                Price depends on the design
                <span className="block text-xs text-fg-3">
                  Shown as a “from” price; you confirm the final price in the
                  quote.
                </span>
              </span>
            </label>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
