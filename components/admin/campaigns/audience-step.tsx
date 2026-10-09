"use client";

import clsx from "clsx";
import {
  DEFAULT_VIP_SPEND,
  SEGMENTS,
  type Audience,
} from "lib/marketing/segment-defs";
import { Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";

const input =
  "h-10 border border-line bg-canvas px-3 text-sm text-fg outline-none focus:border-fg";

/** Tomorrow in Lagos as YYYY-MM-DD: the earliest a campaign can be scheduled. */
export function tomorrowInLagos() {
  const lagosNow = new Date(Date.now() + 60 * 60 * 1000);
  lagosNow.setUTCDate(lagosNow.getUTCDate() + 1);
  return lagosNow.toISOString().slice(0, 10);
}

/**
 * Audience + delivery for a campaign: pick a segment, see exactly how many
 * people get it after the frequency cap, then send now or on a chosen day.
 */
export function AudienceStep({
  campaignId,
  audience,
  onAudience,
  capHours,
  onCapHours,
  sendMode,
  onSendMode,
  scheduleDate,
  onScheduleDate,
  onReachable,
}: {
  campaignId?: string;
  audience: Audience;
  onAudience: (a: Audience) => void;
  capHours: number;
  onCapHours: (h: number) => void;
  sendMode: "immediate" | "scheduled";
  onSendMode: (m: "immediate" | "scheduled") => void;
  scheduleDate: string;
  onScheduleDate: (d: string) => void;
  onReachable: (n: number) => void;
}) {
  const [counts, setCounts] = useState<{
    matched: number;
    reachable: number;
    subscribers: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<
    Array<{ id: string; title: string }>
  >([]);

  useEffect(() => {
    fetch("/api/admin/collections?perPage=100")
      .then((r) => r.json())
      .then((d) =>
        setCollections(
          (d.collections ?? []).map((c: { id: string; title: string }) => ({
            id: c.id,
            title: c.title,
          })),
        ),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const q = new URLSearchParams({
      segment: audience.segment,
      cap: String(capHours),
    });
    if (audience.collectionId) q.set("collectionId", audience.collectionId);
    if (audience.minSpend) q.set("minSpend", String(audience.minSpend));
    if (campaignId) q.set("campaignId", campaignId);
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/admin/campaigns/audience?${q}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => {
          setCounts(d);
          onReachable(Number(d.reachable ?? 0));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onReachable is a setter
  }, [
    audience.segment,
    audience.collectionId,
    audience.minSpend,
    capHours,
    campaignId,
  ]);

  const capped = counts ? counts.matched - counts.reachable : 0;

  return (
    <div className="space-y-6">
      {/* Who */}
      <fieldset>
        <legend className="label mb-2 text-fg-3">Who gets it</legend>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {SEGMENTS.map((s) => {
            const active = audience.segment === s.key;
            return (
              <label
                key={s.key}
                className={clsx(
                  "flex cursor-pointer items-start gap-3 p-3",
                  active ? "bg-fg text-canvas" : "bg-canvas hover:bg-plate/60",
                )}
              >
                <input
                  type="radio"
                  name="segment"
                  className="mt-1"
                  checked={active}
                  onChange={() =>
                    onAudience({
                      segment: s.key,
                      collectionId: audience.collectionId,
                      minSpend: audience.minSpend,
                    })
                  }
                />
                <span>
                  <span className="block text-sm font-medium">{s.label}</span>
                  <span
                    className={clsx(
                      "block text-xs",
                      active ? "text-canvas/70" : "text-fg-3",
                    )}
                  >
                    {s.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {audience.segment === "collection" ? (
          <label className="mt-3 block">
            <span className="label mb-1.5 block text-fg-3">Collection</span>
            <select
              value={audience.collectionId ?? ""}
              onChange={(e) =>
                onAudience({
                  ...audience,
                  collectionId: e.target.value || undefined,
                })
              }
              className={`${input} w-full`}
            >
              <option value="">Pick a collection…</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {audience.segment === "vip" ? (
          <label className="mt-3 block">
            <span className="label mb-1.5 block text-fg-3">
              Lifetime spend above (₦)
            </span>
            <input
              inputMode="numeric"
              value={audience.minSpend ?? DEFAULT_VIP_SPEND}
              onChange={(e) =>
                onAudience({
                  ...audience,
                  minSpend:
                    Number(e.target.value.replace(/\D/g, "")) || undefined,
                })
              }
              className={`${input} w-48 tabular-nums`}
            />
          </label>
        ) : null}
      </fieldset>

      {/* Fatigue */}
      <label className="block">
        <span className="label mb-1.5 block text-fg-3">
          Don&apos;t email people who got a campaign in the last
        </span>
        <select
          value={capHours}
          onChange={(e) => onCapHours(Number(e.target.value))}
          className={input}
        >
          <option value={0}>No limit</option>
          <option value={24}>24 hours</option>
          <option value={48}>2 days (recommended)</option>
          <option value={72}>3 days</option>
          <option value={168}>7 days</option>
        </select>
      </label>

      {/* Count */}
      <div className="flex items-center gap-4 border border-line p-4">
        <span className="grid size-10 shrink-0 place-items-center bg-plate">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Users className="size-4" />
          )}
        </span>
        <div>
          <p className="font-head text-3xl font-extrabold leading-none tabular-nums [font-stretch:75%]">
            {counts ? counts.reachable.toLocaleString("en-NG") : "—"}
          </p>
          <p className="mt-1 text-xs text-fg-3">
            {counts
              ? `people will get this email${capped > 0 ? `, ${capped.toLocaleString("en-NG")} skipped because they were emailed recently` : ""}. ${counts.subscribers.toLocaleString("en-NG")} subscribers in total.`
              : "Counting…"}
          </p>
          {counts && counts.reachable === 0 ? (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              {counts.matched > 0
                ? "Everyone in this audience got a campaign recently. Shorten the limit above, or send another day."
                : "Nobody matches yet. Pick a broader audience."}
            </p>
          ) : null}
        </div>
      </div>

      {/* When */}
      <fieldset>
        <legend className="label mb-2 text-fg-3">When</legend>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {(
            [
              {
                value: "immediate",
                label: "Send now",
                hint: "Goes out straight away, in batches.",
              },
              {
                value: "scheduled",
                label: "Send on a day",
                hint: "Goes out at 08:00 Lagos time.",
              },
            ] as const
          ).map((o) => (
            <label
              key={o.value}
              className={clsx(
                "flex cursor-pointer items-start gap-3 p-3",
                sendMode === o.value
                  ? "bg-fg text-canvas"
                  : "bg-canvas hover:bg-plate/60",
              )}
            >
              <input
                type="radio"
                name="when"
                className="mt-1"
                checked={sendMode === o.value}
                onChange={() => onSendMode(o.value)}
              />
              <span>
                <span className="block text-sm font-medium">{o.label}</span>
                <span
                  className={clsx(
                    "block text-xs",
                    sendMode === o.value ? "text-canvas/70" : "text-fg-3",
                  )}
                >
                  {o.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
        {sendMode === "scheduled" ? (
          <label className="mt-3 block">
            <span className="label mb-1.5 block text-fg-3">Date</span>
            <input
              type="date"
              min={tomorrowInLagos()}
              value={scheduleDate}
              onChange={(e) => onScheduleDate(e.target.value)}
              className={input}
            />
          </label>
        ) : null}
      </fieldset>
    </div>
  );
}
