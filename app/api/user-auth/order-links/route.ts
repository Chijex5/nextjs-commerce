import { emailEquals } from "lib/db/email-match";
import { and, desc, inArray, isNull } from "drizzle-orm";
import { db } from "lib/db";
import { orders } from "lib/db/schema";
import { handleApiError, validationError } from "lib/errors";
import { getUserSession } from "lib/user-session";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getUserSession();

    if (!session?.id || !session.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Anyone can register a password account with someone else's email, so
    // guest orders are only offered to sessions that proved ownership of the
    // address (magic-link sign-in).
    if (!session.emailVerified) {
      return NextResponse.json({ orders: [], verificationRequired: true });
    }

    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        currencyCode: orders.currencyCode,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          emailEquals(orders.email, session.email),
          isNull(orders.userId),
        ),
      )
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({
      orders: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error, "Fetch pending order links");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session?.id || !session.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.emailVerified) {
      return NextResponse.json(
        {
          error:
            "Sign in with an email link to confirm this address before linking orders.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      orderIds?: unknown;
    };

    const orderIds = Array.isArray(body.orderIds)
      ? body.orderIds.filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
      : [];

    if (!orderIds.length) {
      throw validationError("At least one order is required", "MISSING_FIELDS");
    }

    const linkedRows = await db
      .update(orders)
      .set({ userId: session.id, updatedAt: new Date() })
      .where(
        and(
          inArray(orders.id, orderIds),
          emailEquals(orders.email, session.email),
          isNull(orders.userId),
        ),
      )
      .returning({
        id: orders.id,
        orderNumber: orders.orderNumber,
      });

    return NextResponse.json({
      success: true,
      linkedCount: linkedRows.length,
      orders: linkedRows,
    });
  } catch (error) {
    return handleApiError(error, "Link pending orders");
  }
}