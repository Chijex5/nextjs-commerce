import {
    and,
    desc,
    eq,
    ilike,
    inArray,
    or,
    sql,
} from "drizzle-orm";
import { db } from "lib/db";
import {
    abandonedCarts,
    couponUsages,
    customOrderQuoteTokens,
    customOrderRequests,
    emailOtps,
    magicLinkTokens,
    newsletterSubscribers,
    orders,
    paymentTransactions,
    reviews,
    reviewVotes,
    users,
} from "lib/db/schema";
import { clearUserSessionCookie, getUserSession } from "lib/user-session";
import { NextRequest, NextResponse } from "next/server";

type ActivityItem = {
  id: string;
  type: "order" | "custom" | "review";
  label: string;
  status: string;
  createdAt: string;
  meta?: string;
};

export async function GET() {
  try {
    const session = await getUserSession();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        shippingAddress: users.shippingAddress,
        billingAddress: users.billingAddress,
      })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [
      orderRows,
      customRows,
      reviewRows,
      abandonedRows,
      couponCountResult,
      newsletterRows,
    ] = await Promise.all([
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          totalAmount: orders.totalAmount,
          currencyCode: orders.currencyCode,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.userId, session.id))
        .orderBy(desc(orders.createdAt)),
      db
        .select({
          id: customOrderRequests.id,
          requestNumber: customOrderRequests.requestNumber,
          status: customOrderRequests.status,
          title: customOrderRequests.title,
          createdAt: customOrderRequests.createdAt,
        })
        .from(customOrderRequests)
        .where(eq(customOrderRequests.userId, session.id))
        .orderBy(desc(customOrderRequests.createdAt)),
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          status: reviews.status,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .where(eq(reviews.userId, session.id))
        .orderBy(desc(reviews.createdAt)),
      db
        .select({
          id: abandonedCarts.id,
          recovered: abandonedCarts.recovered,
        })
        .from(abandonedCarts)
        .where(eq(abandonedCarts.userId, session.id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(couponUsages)
        .where(eq(couponUsages.userId, session.id)),
      db
        .select({
          id: newsletterSubscribers.id,
          status: newsletterSubscribers.status,
          subscribedAt: newsletterSubscribers.subscribedAt,
          unsubscribedAt: newsletterSubscribers.unsubscribedAt,
        })
        .from(newsletterSubscribers)
        .where(ilike(newsletterSubscribers.email, user.email))
        .limit(1),
    ]);

    const orderIds = orderRows.map((row) => row.id);
    const paymentRows = orderIds.length
      ? await db
          .select({
            id: paymentTransactions.id,
            status: paymentTransactions.status,
            provider: paymentTransactions.provider,
            amount: paymentTransactions.amount,
            currencyCode: paymentTransactions.currencyCode,
            createdAt: paymentTransactions.createdAt,
          })
          .from(paymentTransactions)
          .where(inArray(paymentTransactions.orderId, orderIds))
          .orderBy(desc(paymentTransactions.createdAt))
      : [];

    const totalSpent = orderRows.reduce((acc, row) => {
      const amount = Number.parseFloat(String(row.totalAmount));
      return Number.isFinite(amount) ? acc + amount : acc;
    }, 0);

    const averageRating = reviewRows.length
      ? reviewRows.reduce((acc, row) => acc + row.rating, 0) / reviewRows.length
      : 0;

    const successfulPaymentsCount = paymentRows.filter((row) =>
      ["success", "successful", "verified"].includes(row.status.toLowerCase()),
    ).length;

    const failedPaymentsCount = paymentRows.filter((row) =>
      ["failed", "abandoned", "cancelled"].includes(row.status.toLowerCase()),
    ).length;

    const catalogOrdersCount = orderRows.filter(
      (row) => row.orderNumber && !row.orderNumber.startsWith("CUS"),
    ).length;

    const customOrdersFromOrdersCount = orderRows.length - catalogOrdersCount;

    const newsletter = newsletterRows[0] || null;

    const activity: ActivityItem[] = [
      ...orderRows.slice(0, 5).map((row) => ({
        id: row.id,
        type: "order" as const,
        label: row.orderNumber,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        meta: `${row.currencyCode} ${row.totalAmount}`,
      })),
      ...customRows.slice(0, 5).map((row) => ({
        id: row.id,
        type: "custom" as const,
        label: row.requestNumber,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        meta: row.title,
      })),
      ...reviewRows.slice(0, 5).map((row) => ({
        id: row.id,
        type: "review" as const,
        label: `Review (${row.rating}/5)`,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 8);

    return NextResponse.json({
      summary: {
        accountCreatedAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        hasShippingAddress: Boolean(user.shippingAddress),
        hasBillingAddress: Boolean(user.billingAddress),
        ordersCount: orderRows.length,
        customRequestsCount: customRows.length,
        reviewsCount: reviewRows.length,
        couponUsageCount: Number(couponCountResult[0]?.count ?? 0),
        abandonedCartsCount: abandonedRows.length,
        recoveredCartsCount: abandonedRows.filter((row) => row.recovered).length,
        totalSpent,
        averageOrderValue: orderRows.length ? totalSpent / orderRows.length : 0,
        averageRating,
        currencyCode: orderRows[0]?.currencyCode || "NGN",
        paymentTransactionsCount: paymentRows.length,
        successfulPaymentsCount,
        failedPaymentsCount,
        catalogOrdersCount,
        customOrdersFromOrdersCount,
        lastOrderAt: orderRows[0]?.createdAt?.toISOString() || null,
        newsletterStatus: newsletter?.status || "not-subscribed",
        newsletterSubscribedAt: newsletter?.subscribedAt?.toISOString() || null,
        newsletterUnsubscribedAt: newsletter?.unsubscribedAt?.toISOString() || null,
        recentActivity: activity,
      },
    });
  } catch (error) {
    console.error("Failed to fetch account summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch account summary" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const confirmText = typeof body?.confirmText === "string" ? body.confirmText : "";

    if (confirmText !== "DELETE") {
      return NextResponse.json(
        { error: "Confirmation text is required" },
        { status: 400 },
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const anonymizedEmail = `deleted+${user.id.slice(0, 8)}@redacted.local`;
    const now = new Date();

    await db.transaction(async (tx) => {
      const userOrderRows = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.userId, user.id));

      const userOrderIds = userOrderRows.map((row) => row.id);

      if (userOrderIds.length) {
        await tx
          .update(orders)
          .set({
            userId: null,
            email: anonymizedEmail,
            phone: null,
            customerName: "Deleted Account",
            shippingAddress: { redacted: true },
            billingAddress: null,
            notes: null,
            updatedAt: now,
          })
          .where(eq(orders.userId, user.id));

        await tx
          .update(paymentTransactions)
          .set({
            customer: { redacted: true },
            metadata: { redacted: true },
            payload: null,
            updatedAt: now,
          })
          .where(inArray(paymentTransactions.orderId, userOrderIds));
      }

      await tx
        .update(customOrderRequests)
        .set({
          userId: null,
          email: anonymizedEmail,
          phone: null,
          customerName: "Deleted Account",
          title: "Redacted custom request",
          description: "Personal data removed after account deletion.",
          sizeNotes: null,
          colorPreferences: null,
          referenceImages: [],
          customerNotes: null,
          updatedAt: now,
        })
        .where(
          or(
            eq(customOrderRequests.userId, user.id),
            and(
              isNullSafe(customOrderRequests.userId),
              ilike(customOrderRequests.email, user.email),
            ),
          ),
        );

      await tx.delete(reviewVotes).where(eq(reviewVotes.userId, user.id));

      await tx
        .update(reviews)
        .set({
          userId: null,
          updatedAt: now,
        })
        .where(eq(reviews.userId, user.id));

      await tx.delete(couponUsages).where(eq(couponUsages.userId, user.id));
      await tx.delete(abandonedCarts).where(eq(abandonedCarts.userId, user.id));

      await tx.delete(magicLinkTokens).where(ilike(magicLinkTokens.email, user.email));
      await tx.delete(emailOtps).where(ilike(emailOtps.email, user.email));
      await tx
        .delete(customOrderQuoteTokens)
        .where(ilike(customOrderQuoteTokens.email, user.email));
      await tx
        .delete(newsletterSubscribers)
        .where(ilike(newsletterSubscribers.email, user.email));

      await tx.delete(users).where(eq(users.id, user.id));
    });

    await clearUserSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}

function isNullSafe(column: ReturnType<typeof sql>) {
  return sql`${column} is null`;
}
