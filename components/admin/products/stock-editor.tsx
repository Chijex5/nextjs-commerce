"use client";

import { Panel } from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export type StockVariant = {
  id: string;
  selectedOptions: Array<{ name: string; value: string }>;
  trackInventory: boolean;
  stockQuantity: number | null;
};

const opt = (v: StockVariant, name: string) =>
  v.selectedOptions.find((o) => o.name.toLowerCase() === name)?.value ?? "";

const unique = (values: string[]) => [...new Set(values)];

/**
 * Made to order (never sells out) or kept in stock (sells until the count
 * hits zero). Couple sets sold from this product take from the same counts.
 */
export function StockEditor({
  productId,
  variants,
}: {
  productId: string;
  variants: StockVariant[];
}) {
  const router = useRouter();
  const [tracked, setTracked] = useState(() =>
    variants.some((v) => v.trackInventory),
  );
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(variants.map((v) => [v.id, v.stockQuantity ?? 0])),
  );
  const [saving, setSaving] = useState(false);

  const initialTracked = variants.some((v) => v.trackInventory);
  const dirty =
    tracked !== initialTracked ||
    variants.some(
      (v) => tracked && (counts[v.id] ?? 0) !== (v.stockQuantity ?? 0),
    );

  const groups = useMemo(
    () => [
      {
        label: null as string | null,
        list: variants,
        sizes: unique(variants.map((v) => opt(v, "size"))),
        colors: unique(variants.map((v) => opt(v, "color"))),
      },
    ],
    [variants],
  );

  const total = variants.reduce((n, v) => n + (counts[v.id] ?? 0), 0);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants: variants.map((v) => ({
            id: v.id,
            trackInventory: tracked,
            stockQuantity: tracked ? (counts[v.id] ?? 0) : null,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.details || data.error || "Couldn't save stock");
      toast.success("Stock saved");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!variants.length) return null;

  return (
    <Panel
      title="Stock"
      description="Made to order pairs never sell out. Pairs kept in stock sell until the count hits zero, then show as sold out."
    >
      <div className="mb-5 flex border border-line" role="radiogroup">
        {[
          { value: false, label: "Made to order" },
          { value: true, label: "Kept in stock" },
        ].map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={tracked === o.value}
            onClick={() => setTracked(o.value)}
            className={clsx(
              "h-11 flex-1 text-sm",
              tracked === o.value
                ? "bg-fg text-canvas"
                : "text-fg-2 hover:text-fg",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {tracked ? (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.label ?? "all"}>
              {g.label ? (
                <p className="label mb-2 text-fg-3">
                  {g.label} ·{" "}
                  {g.list.reduce((n, v) => n + (counts[v.id] ?? 0), 0)} pairs
                </p>
              ) : null}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="label py-2 pr-3 font-normal text-fg-3">
                        Size
                      </th>
                      {g.colors.map((c) => (
                        <th
                          key={c}
                          className="label px-1 py-2 font-normal text-fg-3"
                        >
                          {c || "Stock"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.sizes.map((s) => (
                      <tr key={s} className="border-t border-line">
                        <td className="py-1.5 pr-3 font-mono">{s || "—"}</td>
                        {g.colors.map((c) => {
                          const v = g.list.find(
                            (x) =>
                              opt(x, "size") === s && opt(x, "color") === c,
                          );
                          return (
                            <td key={c} className="px-1 py-1.5">
                              {v ? (
                                <input
                                  inputMode="numeric"
                                  aria-label={`${g.label ?? ""} ${s} ${c} stock`.trim()}
                                  value={counts[v.id] || ""}
                                  placeholder="0"
                                  onChange={(e) =>
                                    setCounts((x) => ({
                                      ...x,
                                      [v.id]: Math.min(
                                        100000,
                                        Number(
                                          e.target.value.replace(/\D/g, ""),
                                        ) || 0,
                                      ),
                                    }))
                                  }
                                  className={clsx(
                                    "h-9 w-16 border bg-canvas px-2 text-center font-mono text-sm outline-none focus:border-fg",
                                    (counts[v.id] ?? 0) === 0
                                      ? "border-red-600/40"
                                      : "border-line",
                                  )}
                                />
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p className="text-xs text-fg-3">
            {total} pairs in stock. Empty boxes are sold out.
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className={buttonClass("solid", "md")}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save stock
        </button>
      </div>
    </Panel>
  );
}
