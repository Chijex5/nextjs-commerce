import {
  BalanceActions,
  QuoteActions,
  Thread,
} from "components/custom-orders/request-actions";
import Footer from "components/layout/footer";
import { buttonClass } from "components/ui/button";
import clsx from "clsx";
import { desc, eq } from "drizzle-orm";
import { isCustomOrderFeatureEnabled } from "lib/custom-order-utils";
import { getRequestForCustomer } from "lib/custom-orders/access";
import { listMessages } from "lib/custom-orders/messages";
import { getCustomOrderSettings } from "lib/custom-orders/settings";
import {
  BUDGETS,
  CUSTOMER_STATUS,
  DEADLINES,
  KIND_LABEL,
  TIMELINE,
  labelFor,
  timelineStep,
  type ChosenEdit,
  type CustomKind,
} from "lib/custom-orders/shared";
import { db } from "lib/db";
import {
  customOrderQuotes,
  orders,
  productImages,
  products,
} from "lib/db/schema";
import { asc } from "drizzle-orm";
import { Check, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Your custom request",
  robots: { index: false, follow: false },
};

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const day = (d: Date) =>
  d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

export default async function CustomRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestNumber: string }>;
  searchParams: Promise<{ t?: string; new?: string; paid?: string }>;
}) {
  if (!isCustomOrderFeatureEnabled()) notFound();
  const { requestNumber } = await params;
  const { t, new: justSent, paid: justPaid } = await searchParams;
  const request = await getRequestForCustomer(decodeURIComponent(requestNumber), t);
  if (!request) notFound();

  const [quote] = await db
    .select()
    .from(customOrderQuotes)
    .where(eq(customOrderQuotes.requestId, request.id))
    .orderBy(desc(customOrderQuotes.version))
    .limit(1);
  const [messages, settings, base, order] = await Promise.all([
    listMessages(request.id),
    getCustomOrderSettings(),
    request.baseProductId
      ? db
          .select({
            title: products.title,
            handle: products.handle,
          })
          .from(products)
          .where(eq(products.id, request.baseProductId))
          .limit(1)
          .then(async ([p]) => {
            if (!p) return null;
            const [img] = await db
              .select({ url: productImages.url })
              .from(productImages)
              .where(eq(productImages.productId, request.baseProductId!))
              .orderBy(asc(productImages.position))
              .limit(1);
            return { ...p, image: img?.url ?? null };
          })
      : Promise.resolve(null),
    request.convertedOrderId
      ? db
          .select({ total: orders.totalAmount, balanceDue: orders.balanceDue })
          .from(orders)
          .where(eq(orders.id, request.convertedOrderId))
          .limit(1)
          .then(([o]) => o ?? null)
      : Promise.resolve(null),
  ]);

  const status = CUSTOMER_STATUS[request.status] ?? {
    label: request.status,
    body: "",
  };
  const step = timelineStep(request.status);
  const kind = request.kind as CustomKind;
  const edits = (Array.isArray(request.edits) ? request.edits : []) as ChosenEdit[];
  const images = (Array.isArray(request.referenceImages) ? request.referenceImages : []) as string[];
  const links = (Array.isArray(request.referenceLinks) ? request.referenceLinks : []) as string[];
  const quoteOpen =
    quote &&
    ["quoted", "awaiting_payment"].includes(request.status) &&
    ["sent", "accepted"].includes(quote.status) &&
    (!quote.expiresAt || quote.expiresAt > new Date());
  const closed = ["completed", "cancelled", "rejected"].includes(request.status);
  const token = t ?? null;
  const balance = Number(order?.balanceDue ?? 0);
  const orderTotal = Number(order?.total ?? 0);

  return (
    <>
      <main className="min-h-[70svh] bg-canvas text-fg">
        <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
          {justSent ? (
            <div className="mb-10 flex gap-3 bg-plate p-5">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">Request sent — thank you!</p>
                <p className="mt-1 text-sm text-fg-2">
                  We&apos;ll reply within {settings.replyHours} hours with a price or a question. We&apos;ve emailed you a link to this page so you can come back any time.
                </p>
              </div>
            </div>
          ) : null}

          {justPaid ? (
            <div className="mb-10 flex gap-3 bg-plate p-5">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">Payment received — thank you!</p>
                <p className="mt-1 text-sm text-fg-2">
                  We&apos;ve emailed your receipt. If this page hasn&apos;t caught up yet, refresh it in a minute.
                </p>
              </div>
            </div>
          ) : null}

          <p className="label text-fg-3">
            Custom request · {request.requestNumber}
          </p>
          <h1 className="display mt-3 text-[clamp(2.4rem,7vw,4rem)]">
            {status.label}
          </h1>
          <p className="mt-3 max-w-[52ch] text-fg-2">{status.body}</p>

          {/* Timeline */}
          {step >= 0 ? (
            <ol className="mt-8 grid grid-cols-6 gap-1" aria-label="Progress">
              {TIMELINE.map((s, i) => (
                <li key={s.key} className="min-w-0">
                  <span className={clsx("block h-1", i <= step ? "bg-fg" : "bg-line")} />
                  <span
                    className={clsx(
                      "mt-2 flex items-center gap-1 text-[11px] leading-tight sm:text-xs",
                      i <= step ? "text-fg" : "text-fg-3",
                    )}
                  >
                    {i < step ? <Check className="size-3 shrink-0" /> : null}
                    {s.label}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}

          {/* What to do now */}
          {quoteOpen ? (
            <section className="mt-10 border border-fg p-5 sm:p-6">
              <p className="label text-fg-3">Your price</p>
              <p className="mt-2 font-head text-5xl font-extrabold tabular-nums [font-stretch:66%]">
                {naira(Number(quote.amount))}
              </p>
              {quote.note ? (
                <p className="mt-3 whitespace-pre-line text-fg-2">{quote.note}</p>
              ) : null}
              {quote.depositAmount ? (
                <p className="mt-2 text-sm text-fg-2">
                  Start with a deposit of {naira(Number(quote.depositAmount))} and pay the rest when your pair is ready.
                </p>
              ) : null}
              {quote.expiresAt ? (
                <p className="mt-3 text-sm text-fg-3">
                  This price is held until {day(quote.expiresAt)}.
                </p>
              ) : null}
              <QuoteActions
                requestNumber={request.requestNumber}
                token={token}
                amount={Number(quote.amount)}
                depositAmount={quote.depositAmount ? Number(quote.depositAmount) : null}
                pairs={request.pairs}
                customerName={request.customerName}
                phone={request.phone ?? ""}
              />
            </section>
          ) : null}

          {request.status === "balance_due" && balance > 0 ? (
            <section className="mt-10 border border-fg p-5 sm:p-6">
              <p className="label text-fg-3">Balance to pay</p>
              <p className="mt-2 font-head text-5xl font-extrabold tabular-nums [font-stretch:66%]">
                {naira(balance)}
              </p>
              <p className="mt-3 text-sm text-fg-2">
                Total {naira(orderTotal)} · paid so far {naira(orderTotal - balance)}. We&apos;ll send your pair as soon as this is paid.
              </p>
              <BalanceActions requestNumber={request.requestNumber} token={token} balance={balance} />
            </section>
          ) : null}

          {request.convertedOrderId ? (
            <section className="mt-10 flex flex-col gap-4 border border-line p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-fg-2">
                {balance > 0
                  ? `Your deposit is confirmed and your pair is now an order. ${naira(balance)} is left to pay when it's ready.`
                  : "Your payment is confirmed and your pair is now an order. Track making and delivery on the order page."}
              </p>
              <Link href={`/order/${request.convertedOrderId}`} className={buttonClass("solid", "md")}>
                View order
              </Link>
            </section>
          ) : null}

          {/* Conversation */}
          <section className="mt-12">
            <h2 className="label mb-4 text-fg-3">Messages</h2>
            <Thread
              requestNumber={request.requestNumber}
              token={token}
              messages={messages}
              canReply={!closed}
              highlightReply={request.status === "needs_info"}
            />
          </section>

          {/* What they asked for */}
          <section className="mt-12 border-t border-line pt-8">
            <h2 className="label mb-4 text-fg-3">Your request</h2>
            {base ? (
              <Link href={`/product/${base.handle}`} className="mb-5 flex items-center gap-3 border border-line p-3 hover:border-fg">
                <div className="relative size-16 shrink-0 overflow-hidden bg-plate">
                  {base.image ? <Image src={base.image} alt="" fill sizes="64px" className="object-cover" /> : null}
                </div>
                <div className="min-w-0">
                  <p className="label text-fg-3">Based on</p>
                  <p className="truncate font-medium">{base.title}</p>
                </div>
              </Link>
            ) : null}
            <dl className="divide-y divide-line border-y border-line text-sm">
              <Row label="Type">{KIND_LABEL[kind] ?? "Custom"}</Row>
              {edits.length ? (
                <Row label="Changes">
                  {edits.map((e) => (
                    <span key={e.id} className="block">
                      {e.name}
                      {e.detail ? ` — ${e.detail}` : ""}
                    </span>
                  ))}
                </Row>
              ) : null}
              {request.customerNotes ? (
                <Row label="Notes">
                  <span className="whitespace-pre-line">{request.customerNotes}</span>
                </Row>
              ) : !edits.length && request.description ? (
                <Row label="Details">
                  <span className="whitespace-pre-line">{request.description}</span>
                </Row>
              ) : null}
              <Row label="Size">{request.sizeNotes || "To confirm"}</Row>
              {request.deadlineKind || request.desiredDate ? (
                <Row label="Timing">
                  {request.deadlineKind === "date" && request.desiredDate
                    ? `By ${day(request.desiredDate)}`
                    : labelFor(DEADLINES, request.deadlineKind) ??
                      (request.desiredDate ? `By ${day(request.desiredDate)}` : "")}
                </Row>
              ) : null}
              {request.budgetBand ? (
                <Row label="Budget">{labelFor(BUDGETS, request.budgetBand)}</Row>
              ) : null}
              {request.estimateAmount && !quote ? (
                <Row label="Estimate">
                  {naira(Number(request.estimateAmount))} — we&apos;ll confirm the final price
                </Row>
              ) : null}
              {links.length ? (
                <Row label="Links">
                  {links.map((l) => (
                    <a key={l} href={l} target="_blank" rel="noreferrer nofollow" className="block truncate underline">
                      {l}
                    </a>
                  ))}
                </Row>
              ) : null}
            </dl>
            {images.length ? (
              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {images.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden bg-plate">
                    <Image src={src} alt="Reference photo" fill sizes="120px" className="object-cover" />
                  </a>
                ))}
              </div>
            ) : null}
            <p className="mt-6 text-xs text-fg-3">
              Sent {day(request.createdAt)} by {request.customerName}. Keep the link to this page private — anyone with it can see and reply to your request.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-3">
      <dt className="label w-20 shrink-0 pt-0.5 text-fg-3">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
