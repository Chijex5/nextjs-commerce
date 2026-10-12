import { eq } from "drizzle-orm";
import { buttonClass } from "components/ui/button";
import { normalizeNigerianPhone } from "lib/checkout/details";
import { quoteCheckout } from "lib/checkout/quote";
import { getCart } from "lib/database";
import { db } from "lib/db";
import { users } from "lib/db/schema";
import { getUserSession } from "lib/user-session";
import Link from "next/link";
import { Suspense } from "react";
import { CheckoutForm, type CheckoutPrefill } from "./checkout-form";

/**
 * One-page checkout. The bag, totals and (for signed-in customers) saved
 * details are rendered on the server, so the form is usable immediately.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reference?: string }>;
}) {
  return (
    <div className="bg-canvas text-fg">
      <div className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 lg:pb-20 lg:pt-12">
        <Suspense fallback={<CheckoutSkeleton />}>
          <Checkout searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

async function Checkout({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reference?: string }>;
}) {
  const [{ error }, cart, session] = await Promise.all([
    searchParams,
    getCart(),
    getUserSession(),
  ]);

  if (!cart?.id || cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="label text-fg-3">Checkout</p>
        <h1 className="display mt-3 text-[clamp(2.75rem,10vw,4.5rem)]">
          Your bag is empty
        </h1>
        <p className="mt-4 text-fg-2">
          Add a pair you love and come back — it only takes a minute.
        </p>
        <Link href="/search" className={buttonClass("solid", "lg", "mt-8")}>
          Shop the collection
        </Link>
      </div>
    );
  }

  let prefill: CheckoutPrefill | null = null;
  if (session?.id) {
    const [user] = await db
      .select({
        email: users.email,
        name: users.name,
        phone: users.phone,
        shippingAddress: users.shippingAddress,
      })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    const a = (user?.shippingAddress ?? {}) as Record<string, unknown>;
    const [first = "", ...rest] = (user?.name ?? "").split(" ");
    prefill = {
      email: user?.email ?? session.email,
      phone1: normalizeNigerianPhone(str(a.phone1) || user?.phone || ""),
      phone2: normalizeNigerianPhone(str(a.phone2)),
      firstName: str(a.firstName) || first,
      lastName: str(a.lastName) || rest.join(" "),
      state: str(a.state),
      lga: str(a.lga),
      ward: str(a.ward),
      streetAddress: str(a.streetAddress) || str(a.address),
      // Older saved addresses kept bus stop and landmark apart.
      landmark: [str(a.landmark), str(a.nearestBusStop)]
        .filter(Boolean)
        .join(", "),
    };
  }

  const initialQuote = await quoteCheckout({
    cartId: cart.id,
    address: prefill?.state ? prefill : null,
    userId: session?.id,
    sessionId: session?.id ? null : cart.id,
  });

  return (
    <CheckoutForm
      cartId={cart.id}
      initialQuote={initialQuote}
      prefill={prefill}
      signedIn={Boolean(session?.id)}
      userId={session?.id ?? null}
      returnError={error ?? null}
    />
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-6">
        <div className="h-16 w-64 animate-pulse bg-fg/10" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse bg-fg/5" />
        ))}
      </div>
      <div className="hidden h-96 animate-pulse bg-fg/5 lg:block" />
    </div>
  );
}
