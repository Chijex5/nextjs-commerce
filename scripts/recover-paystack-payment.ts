#!/usr/bin/env tsx

/**
 * Record Paystack payments that never made it into the database, e.g. custom
 * balance payments taken before migration 0007. Asks Paystack for each
 * reference, then matches it to its order exactly like the webhook does.
 * Safe to re-run: a reference that's already recorded is left as is.
 *
 *   pnpm payments:recover <reference> [<reference> …]
 *
 * Find the references in the Paystack dashboard (Transactions → successful).
 */
import "dotenv/config";
import { verifyPaystackReference } from "../lib/payments/paystack";
import { reconcilePaystackPayment } from "../lib/payments/paystack-reconcile";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown) => (typeof value === "string" ? value : undefined);

async function main() {
  const references = process.argv
    .slice(2)
    .map((r) => r.trim())
    .filter(Boolean);
  if (!references.length) {
    console.error("Usage: pnpm payments:recover <reference> [<reference> …]");
    process.exit(1);
  }

  for (const reference of references) {
    const verified = await verifyPaystackReference(reference);
    const data = verified.data;
    if (!verified.status || !data) {
      console.log(
        `${reference}: Paystack doesn't know it (${verified.message})`,
      );
      continue;
    }
    const result = await reconcilePaystackPayment({
      reference,
      amount: Number(data.amount),
      currencyCode: str(data.currency) ?? null,
      paystackStatus: str(data.status) ?? null,
      metadata: isRecord(data.metadata) ? data.metadata : {},
      customer: isRecord(data.customer)
        ? {
            email: str(data.customer.email),
            first_name: str(data.customer.first_name),
            last_name: str(data.customer.last_name),
            phone: str(data.customer.phone),
          }
        : null,
      payload: verified,
      eventType: "backfill",
    });
    console.log(
      result.status === "paid"
        ? `${reference}: paid → order ${result.orderNumber}${result.created ? " (created)" : ""}`
        : `${reference}: ${result.status} — ${"message" in result ? result.message : ""}`,
    );
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
