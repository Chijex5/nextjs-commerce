import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { products } from "lib/db/schema";
import { loadEmailProducts } from "lib/marketing/render";
import { NextResponse } from "next/server";

// GET /api/admin/campaigns/products — catalogue for the email composer's product picker.
export async function GET() {
  const session = await requireAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select({ id: products.id, available: products.availableForSale })
    .from(products);
  const details = await loadEmailProducts(rows.map((r) => r.id));
  const available = new Map(rows.map((r) => [r.id, r.available]));
  return NextResponse.json({
    products: [...details.values()]
      .map((p) => ({ ...p, available: available.get(p.id) ?? false }))
      .sort(
        (a, b) =>
          Number(b.available) - Number(a.available) ||
          a.title.localeCompare(b.title),
      ),
  });
}
