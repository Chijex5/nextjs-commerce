"use client";

import { StatList, StatRow, StatusPill } from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { count, money } from "lib/admin/format";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Settings = { days?: number; couponCode?: string };

const HOW: Record<string, string> = {
  welcome:
    "Sent straight away when someone joins the newsletter. Checkout opt-ins are skipped because they already get an order email.",
  abandoned_cart:
    "Sent once, after a signed-in shopper's bag has sat untouched past its reminder time.",
  review_request:
    "Sent once per order, a few days after it's marked delivered, if they haven't reviewed it yet.",
  win_back:
    "Sent to subscribed customers whose last order is older than the days below. At most once every 6 months per person.",
};

export function FlowCard({
  flow,
  enabled,
  settings,
  stats,
}: {
  flow: { key: string; name: string; trigger: string; goal: string };
  enabled: boolean;
  settings: Settings;
  stats: { sent: number; clicked: number; orders: number; sales: number };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Settings>(settings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  async function save(
    body: { enabled?: boolean; settings?: Settings },
    success: string,
  ) {
    setBusy(true);
    const res = await fetch(`/api/admin/marketing/flows/${flow.key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || "Couldn't save");
    toast.success(success);
    startTransition(() => router.refresh());
  }

  return (
    <section className="flex flex-col border border-line">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold">{flow.name}</h2>
            <StatusPill tone={enabled ? "positive" : "neutral"}>
              {enabled ? "On" : "Off"}
            </StatusPill>
          </div>
          <p className="mt-1 text-xs text-fg-3">
            <span className="text-fg-2">When:</span> {flow.trigger}.{" "}
            <span className="text-fg-2">Goal:</span> {flow.goal}
          </p>
        </div>
        <label
          className="relative inline-flex shrink-0 cursor-pointer items-center"
          title={enabled ? "Switch off" : "Switch on"}
        >
          <input
            type="checkbox"
            className="peer sr-only"
            checked={enabled}
            disabled={busy}
            onChange={(e) =>
              save(
                { enabled: e.target.checked },
                e.target.checked ? `${flow.name} is on` : `${flow.name} is off`,
              )
            }
            aria-label={`${flow.name} automation`}
          />
          <span className="h-6 w-11 border border-line bg-plate transition-colors peer-checked:border-fg peer-checked:bg-fg" />
          <span className="absolute left-1 top-1 size-4 bg-fg-3 transition-transform peer-checked:translate-x-5 peer-checked:bg-canvas" />
        </label>
      </div>
      <div className="flex-1 p-5">
        <p className="mb-4 text-sm text-fg-2">{HOW[flow.key]}</p>
        {flow.key === "review_request" || flow.key === "win_back" ? (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="label mb-1.5 block text-fg-3">
                {flow.key === "review_request"
                  ? "Days after delivery"
                  : "Days since last order"}
              </span>
              <input
                inputMode="numeric"
                value={draft.days ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    days:
                      Number(e.target.value.replace(/\D/g, "")) || undefined,
                  }))
                }
                className="h-10 w-28 border border-line bg-canvas px-3 text-sm tabular-nums outline-none focus:border-fg"
              />
            </label>
            {flow.key === "win_back" ? (
              <label className="block">
                <span className="label mb-1.5 block text-fg-3">
                  Coupon to include (optional)
                </span>
                <input
                  value={draft.couponCode ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      couponCode: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="e.g. MISSYOU10"
                  className="h-10 w-44 border border-line bg-canvas px-3 font-mono text-sm uppercase outline-none focus:border-fg"
                />
              </label>
            ) : null}
            {dirty ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => save({ settings: draft }, "Settings saved")}
                className={buttonClass("solid", "md", "h-10")}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Save
              </button>
            ) : null}
          </div>
        ) : null}
        <StatList>
          <StatRow label="Emails sent" value={count(stats.sent)} />
          {flow.key !== "abandoned_cart" ? (
            <StatRow label="Clicked" value={count(stats.clicked)} />
          ) : null}
          <StatRow
            label={flow.key === "abandoned_cart" ? "Carts recovered" : "Orders"}
            value={count(stats.orders)}
          />
          <StatRow label="Sales" value={money(stats.sales)} />
        </StatList>
        {flow.key === "win_back" && draft.couponCode ? (
          <p className="mt-3 text-xs text-fg-3">
            Make sure {draft.couponCode} exists and is active in Coupons.
          </p>
        ) : null}
      </div>
    </section>
  );
}
