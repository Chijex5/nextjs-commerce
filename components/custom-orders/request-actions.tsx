"use client";

import clsx from "clsx";
import {
  LocationSelectGroup,
  type LocationChangeSource,
} from "components/locations/location-select-group";
import { buttonClass } from "components/ui/button";
import { Field } from "components/ui/field";
import { deliveryFee, readDeliveryAddress } from "lib/custom-orders/delivery";
import type { PaymentOption } from "lib/custom-orders/shared";
import { normalizeLocationName } from "lib/locations";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PhotoGrid, usePhotoUploads } from "./photo-uploader";

export type ThreadItem = {
  id: string;
  author: "customer" | "admin" | "system";
  authorName: string | null;
  body: string;
  attachments: string[];
  createdAt: string;
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const locationInput =
  "h-12 w-full rounded-none border-0 border-b border-line bg-transparent px-0 text-base text-fg outline-none placeholder:text-fg-3 focus:border-fg disabled:opacity-50";

type DeliveryForm = {
  method: "delivery" | "pickup";
  name: string;
  phone: string;
  state: string;
  lga: string;
  ward: string;
  streetAddress: string;
  landmark: string;
};

/**
 * Pay the price, or ask for something to change. Paying the first time asks
 * where to send the pair (the delivery fee depends on it) and, when the quote
 * has one, whether to pay the deposit or everything now.
 */
export function QuoteActions({
  requestNumber,
  token,
  amount,
  depositAmount,
  pairs,
  customerName,
  phone,
}: {
  requestNumber: string;
  token: string | null;
  amount: number;
  depositAmount: number | null;
  pairs: number;
  customerName: string;
  phone: string;
}) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [changing, setChanging] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [option, setOption] = useState<PaymentOption>(depositAmount ? "deposit" : "full");
  const [form, setForm] = useState<DeliveryForm>({
    method: "delivery",
    name: customerName,
    phone,
    state: "",
    lga: "",
    ward: "",
    streetAddress: "",
    landmark: "",
  });
  const base = `/api/custom-order-requests/${encodeURIComponent(requestNumber)}`;

  const set = (patch: Partial<DeliveryForm>) => setForm((f) => ({ ...f, ...patch }));
  const setLocation =
    (field: "state" | "lga" | "ward") => (value: string, source: LocationChangeSource) => {
      const changed =
        normalizeLocationName(form[field]) !== normalizeLocationName(value);
      const patch: Partial<DeliveryForm> = { [field]: value };
      if (source === "select" && changed) {
        if (field === "state") Object.assign(patch, { lga: "", ward: "" });
        if (field === "lga") patch.ward = "";
      }
      set(patch);
    };

  // Same checks and fee as the server, so the total shown is what's charged.
  const parsed = useMemo(() => readDeliveryAddress(form), [form]);
  const shipping =
    "address" in parsed ? deliveryFee(parsed.address, amount, pairs) : null;
  const total = amount + (shipping ?? 0);
  const payNow = option === "deposit" && depositAmount ? depositAmount : total;

  const pay = async () => {
    if ("error" in parsed) return toast.error(parsed.error);
    setPaying(true);
    try {
      const data = await post(`${base}/pay`, {
        t: token,
        option,
        address: {
          method: form.method,
          name: form.name,
          phone: form.phone,
          state: form.state,
          lga: form.lga,
          ward: form.ward,
          streetAddress: form.streetAddress,
          landmark: form.landmark,
        },
      });
      window.location.href = data.authorizationUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start the payment");
      setPaying(false);
    }
  };

  const askForChanges = async () => {
    if (!text.trim()) return toast.error("Tell us what you'd like to change");
    setSending(true);
    try {
      await post(`${base}/changes`, { t: token, body: text });
      toast.success("Sent — we'll get back to you with a new price");
      setText("");
      setChanging(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-5">
      {checkout ? (
        <div className="space-y-6 border-t border-line pt-5">
          <div>
            <p className="label mb-2 text-fg-3">How do you want it?</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["delivery", "Deliver to me"],
                  ["pickup", "I'll pick it up"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={form.method === key}
                  onClick={() => set({ method: key })}
                  className={clsx(
                    "h-12 border text-sm font-medium",
                    form.method === key ? "border-fg bg-fg text-canvas" : "border-line hover:border-fg",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
            />
            <Field
              label="Phone"
              required
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
            />
          </div>

          {form.method === "delivery" ? (
            <>
              <LocationSelectGroup
                stateValue={form.state}
                lgaValue={form.lga}
                wardValue={form.ward}
                onStateChange={setLocation("state")}
                onLgaChange={setLocation("lga")}
                onWardChange={setLocation("ward")}
                inputClassName={locationInput}
                menuClassName="rounded-none"
                labelClassName="label mb-1 block text-fg-3"
                stateRequired
                lgaRequired
              />
              <Field
                label="Street address"
                required
                autoComplete="street-address"
                placeholder="House number and street name"
                value={form.streetAddress}
                onChange={(e) => set({ streetAddress: e.target.value })}
              />
              <Field
                label="Landmark (optional)"
                placeholder="e.g. Opposite the filling station"
                value={form.landmark}
                onChange={(e) => set({ landmark: e.target.value })}
              />
            </>
          ) : (
            <p className="text-sm text-fg-2">
              We&apos;ll message you here when it&apos;s ready to collect.
            </p>
          )}

          {depositAmount ? (
            <div>
              <p className="label mb-2 text-fg-3">Pay now</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["deposit", `Deposit ${naira(depositAmount)}`, "Pay the rest when your pair is ready"],
                    ["full", "Pay in full", "Nothing more to pay later"],
                  ] as const
                ).map(([key, label, hint]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={option === key}
                    onClick={() => setOption(key)}
                    className={clsx(
                      "border p-3 text-left",
                      option === key ? "border-fg" : "border-line hover:border-fg",
                    )}
                  >
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="mt-0.5 block text-xs text-fg-3">{hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <dl className="space-y-1.5 border-y border-line py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-fg-2">Your pair{pairs > 1 ? "s" : ""}</dt>
              <dd className="tabular-nums">{naira(amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-2">Delivery</dt>
              <dd className="tabular-nums">
                {form.method === "pickup"
                  ? "Free"
                  : shipping === null
                    ? "Add your address"
                    : naira(shipping)}
              </dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{naira(total)}</dd>
            </div>
            {option === "deposit" && depositAmount ? (
              <div className="flex justify-between text-fg-3">
                <dt>Left to pay when it&apos;s ready</dt>
                <dd className="tabular-nums">{naira(total - depositAmount)}</dd>
              </div>
            ) : null}
          </dl>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={pay}
              disabled={paying}
              className={buttonClass("solid", "lg", "flex-1")}
            >
              {paying ? <Loader2 className="size-4 animate-spin" /> : null}
              Pay {naira(payNow)}
            </button>
            <button
              type="button"
              onClick={() => setCheckout(false)}
              className={buttonClass("outline", "lg", "sm:w-auto")}
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setCheckout(true);
              setChanging(false);
            }}
            className={buttonClass("solid", "lg", "flex-1")}
          >
            Accept &amp; pay
          </button>
          <button
            type="button"
            onClick={() => setChanging((v) => !v)}
            className={buttonClass("outline", "lg", "sm:w-auto")}
          >
            Request changes
          </button>
        </div>
      )}
      {changing && !checkout ? (
        <div className="mt-4">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="e.g. Could you do it without the roses to bring the price down?"
            className="w-full border border-line bg-canvas p-3 text-base outline-none placeholder:text-fg-3 focus:border-fg"
          />
          <button
            type="button"
            onClick={askForChanges}
            disabled={sending}
            className={buttonClass("solid", "md", "mt-2")}
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : null}
            Send
          </button>
        </div>
      ) : null}
      <p className="mt-3 text-xs text-fg-3">
        Secure payment with Paystack. Custom pairs are made just for you, so they can&apos;t be refunded once we&apos;ve started — unless what we make doesn&apos;t match what we agreed.
      </p>
    </div>
  );
}

/** Pay what's left on the order once the pair is ready. */
export function BalanceActions({
  requestNumber,
  token,
  balance,
}: {
  requestNumber: string;
  token: string | null;
  balance: number;
}) {
  const [paying, setPaying] = useState(false);
  const pay = async () => {
    setPaying(true);
    try {
      const data = await post(
        `/api/custom-order-requests/${encodeURIComponent(requestNumber)}/pay`,
        { t: token },
      );
      window.location.href = data.authorizationUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start the payment");
      setPaying(false);
    }
  };
  return (
    <button type="button" onClick={pay} disabled={paying} className={buttonClass("solid", "lg", "mt-5 w-full")}>
      {paying ? <Loader2 className="size-4 animate-spin" /> : null}
      Pay balance {naira(balance)}
    </button>
  );
}

/** The conversation with the shop, newest at the bottom, with a reply box. */
export function Thread({
  requestNumber,
  token,
  messages,
  canReply,
  highlightReply,
}: {
  requestNumber: string;
  token: string | null;
  messages: ThreadItem[];
  canReply: boolean;
  highlightReply: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const uploads = usePhotoUploads(4);

  const send = async () => {
    if (!text.trim() && !uploads.urls.length) return;
    if (uploads.uploading) return toast.error("Wait for your photos to upload");
    setSending(true);
    try {
      await post(`/api/custom-order-requests/${encodeURIComponent(requestNumber)}/messages`, {
        t: token,
        body: text,
        attachments: uploads.urls,
      });
      setText("");
      uploads.clear();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send your message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {messages.length ? (
        <ol className="space-y-4">
          {messages.map((m) =>
            m.author === "system" ? (
              <li key={m.id} className="text-center text-xs text-fg-3">
                {m.body} · {when(m.createdAt)}
              </li>
            ) : (
              <li
                key={m.id}
                className={clsx(
                  "flex flex-col",
                  m.author === "customer" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={clsx(
                    "max-w-[85%] p-3.5 text-[15px] leading-relaxed",
                    m.author === "customer" ? "bg-fg text-canvas" : "bg-plate text-fg",
                  )}
                >
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  {m.attachments.length ? (
                    <div className="mt-2 grid grid-cols-3 gap-1">
                      {m.attachments.map((src) => (
                        <a key={src} href={src} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary upload */}
                          <img src={src} alt="" className="size-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span className="mt-1 text-[11px] text-fg-3">
                  {m.author === "customer" ? "You" : "D'FOOTPRINT"} · {when(m.createdAt)}
                </span>
              </li>
            ),
          )}
        </ol>
      ) : (
        <p className="text-sm text-fg-3">
          No messages yet. If you think of anything else — a photo, a detail, a question — send it here.
        </p>
      )}

      {canReply ? (
        <div className={clsx("mt-6 border p-3", highlightReply ? "border-fg" : "border-line")}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={highlightReply ? "Type your answer…" : "Write a message…"}
            aria-label="Message"
            className="w-full resize-none bg-transparent text-base outline-none placeholder:text-fg-3"
          />
          {uploads.photos.length ? (
            <div className="mb-3">
              <PhotoGrid photos={uploads.photos} max={4} onAdd={uploads.add} onRemove={uploads.remove} compact />
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <label className="label cursor-pointer text-fg-3 hover:text-fg">
              + Photo
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  uploads.add(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={send}
              disabled={sending || (!text.trim() && !uploads.urls.length)}
              className={buttonClass("solid", "md")}
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Send
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
