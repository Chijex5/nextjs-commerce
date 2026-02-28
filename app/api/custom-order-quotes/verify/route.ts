import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, eq, ilike } from "drizzle-orm";
import { db } from "lib/db";
import {
  customOrderQuoteTokens,
  customOrderQuotes,
  customOrderRequests,
  orderItems,
  orders,
} from "lib/db/schema";
import { NextRequest } from "next/server";
import {
  sendAdminNewOrderNotification,
  sendOrderConfirmationWithMarkup,
} from "@/lib/email/order-emails";
import { getAdminNotificationEmails } from "lib/email/admin-notification-emails";
import { isCustomOrderFeatureEnabled } from "lib/custom-order-utils";

export async function GET(request: NextRequest) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return redirect("/custom-orders?error=feature_disabled");
    }

    const reference = request.nextUrl.searchParams.get("reference");
    if (!reference) {
      return redirect("/custom-orders?error=invalid_reference");
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return redirect("/custom-orders?error=payment_verification_failed");
    }

    const verificationResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      },
    );
    const verifyData = await verificationResponse.json();
    if (!verifyData.status || verifyData.data.status !== "success") {
      return redirect("/custom-orders?error=payment_failed");
    }

    const [existingOrderByReference] = await db
      .select({ orderNumber: orders.orderNumber })
      .from(orders)
      .where(ilike(orders.notes, `%Paystack Ref: ${reference}%`))
      .limit(1);

    if (existingOrderByReference?.orderNumber) {
      return redirect(
        `/checkout/success?order=${encodeURIComponent(existingOrderByReference.orderNumber)}`,
      );
    }

    const metadata = verifyData.data.metadata || {};
    const metadataQuoteId = metadata.custom_quote_id as string | undefined;
    const metadataRequestId = metadata.custom_request_id as string | undefined;
    const paystackAmount = Number(verifyData.data.amount);

    if (!metadataQuoteId || !metadataRequestId) {
      return redirect("/custom-orders?error=invalid_metadata");
    }

    const cookieStore = await cookies();
    const quoteSessionCookie = cookieStore.get("custom-quote-session");
    if (!quoteSessionCookie) {
      return redirect("/custom-orders?error=session_expired");
    }

    const quoteSession = JSON.parse(quoteSessionCookie.value) as {
      quoteId: string;
      requestId: string;
      tokenHash: string;
      email: string;
      customerName: string;
      phone?: string | null;
      amount: number;
      currencyCode: string;
    };

    if (
      quoteSession.quoteId !== metadataQuoteId ||
      quoteSession.requestId !== metadataRequestId
    ) {
      return redirect("/custom-orders?error=metadata_mismatch");
    }

    const [quote, requestRow] = await Promise.all([
      db
        .select()
        .from(customOrderQuotes)
        .where(eq(customOrderQuotes.id, metadataQuoteId))
        .limit(1)
        .then((rows) => rows[0]),
      db
        .select()
        .from(customOrderRequests)
        .where(eq(customOrderRequests.id, metadataRequestId))
        .limit(1)
        .then((rows) => rows[0]),
    ]);

    if (!quote || !requestRow) {
      return redirect("/custom-orders?error=quote_not_found");
    }

    if (requestRow.convertedOrderId) {
      const [existingOrder] = await db
        .select({ orderNumber: orders.orderNumber })
        .from(orders)
        .where(eq(orders.id, requestRow.convertedOrderId))
        .limit(1);
      cookieStore.delete("custom-quote-session");
      return redirect(
        `/checkout/success?order=${encodeURIComponent(existingOrder?.orderNumber || "")}`,
      );
    }

    const expectedAmount = Math.round(Number(quote.amount) * 100);
    if (!Number.isFinite(paystackAmount) || paystackAmount !== expectedAmount) {
      return redirect("/custom-orders?error=payment_amount_mismatch");
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)
      .toUpperCase()}`;

    const created = await db.transaction(async (tx) => {
      const [createdOrder] = await tx
        .insert(orders)
        .values({
          userId: requestRow.userId,
          orderNumber,
          email: requestRow.email,
          phone: requestRow.phone,
          customerName: requestRow.customerName,
          shippingAddress: {},
          billingAddress: null,
          status: "processing",
          subtotalAmount: String(quote.amount),
          shippingAmount: "0",
          discountAmount: "0",
          totalAmount: String(quote.amount),
          currencyCode: quote.currencyCode,
          notes: `Custom order ${requestRow.requestNumber} | Paystack Ref: ${reference}`,
          orderType: "custom",
          customOrderRequestId: requestRow.id,
        })
        .returning();

      if (!createdOrder) {
        throw new Error("Order creation failed");
      }

      await tx.insert(orderItems).values({
        orderId: createdOrder.id,
        productId: requestRow.id,
        productVariantId: quote.id,
        productTitle: `Custom Order - ${requestRow.requestNumber}`,
        variantTitle: "Quoted Request",
        quantity: 1,
        price: String(quote.amount),
        totalAmount: String(quote.amount),
        currencyCode: quote.currencyCode,
        productImage: Array.isArray(requestRow.referenceImages)
          ? (requestRow.referenceImages[0] as string | undefined) || null
          : null,
      });

      await tx
        .update(customOrderQuotes)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(customOrderQuotes.id, quote.id));

      await tx
        .update(customOrderRequests)
        .set({
          status: "paid",
          paidAt: new Date(),
          convertedOrderId: createdOrder.id,
          quotedAmount: String(quote.amount),
          updatedAt: new Date(),
        })
        .where(eq(customOrderRequests.id, requestRow.id));

      await tx
        .update(customOrderQuoteTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(customOrderQuoteTokens.quoteId, quote.id),
            eq(customOrderQuoteTokens.tokenHash, quoteSession.tokenHash),
          ),
        );

      return createdOrder;
    });

    try {
      await sendOrderConfirmationWithMarkup({
        orderNumber: created.orderNumber,
        customerName: created.customerName,
        email: created.email,
        totalAmount: Number(created.totalAmount),
        subtotalAmount: Number(created.subtotalAmount),
        shippingAmount: Number(created.shippingAmount),
        taxAmount: Number(created.taxAmount),
        discountAmount: Number(created.discountAmount || 0),
        couponCode: created.couponCode,
        items: [
          {
            productTitle: `Custom Order - ${requestRow.requestNumber}`,
            variantTitle: "Quoted Request",
            quantity: 1,
            price: Number(quote.amount),
            productImage: Array.isArray(requestRow.referenceImages)
              ? (requestRow.referenceImages[0] as string | undefined) || null
              : null,
            sku: quote.id,
          },
        ],
        shippingAddress: created.shippingAddress,
        orderDate: created.createdAt.toISOString(),
      });
    } catch (emailError) {
      console.error("Failed to send custom order confirmation:", emailError);
    }

    try {
      const adminEmails = await getAdminNotificationEmails();
      if (adminEmails.length > 0) {
        await sendAdminNewOrderNotification({
          to: adminEmails,
          orderNumber: created.orderNumber,
          orderId: created.id,
          customerName: created.customerName,
          email: created.email,
          phone: created.phone,
          totalAmount: Number(created.totalAmount),
          subtotalAmount: Number(created.subtotalAmount),
          shippingAmount: Number(created.shippingAmount),
          taxAmount: Number(created.taxAmount),
          discountAmount: Number(created.discountAmount || 0),
          couponCode: created.couponCode,
          currencyCode: created.currencyCode,
          orderDate: created.createdAt.toISOString(),
          items: [
            {
              productTitle: `Custom Order - ${requestRow.requestNumber}`,
              variantTitle: "Quoted Request",
              quantity: 1,
            },
          ],
        });
      }
    } catch (adminEmailError) {
      console.error("Failed to send custom paid admin email:", adminEmailError);
    }

    cookieStore.delete("custom-quote-session");
    return redirect(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
  } catch (error) {
    console.error("Failed to verify custom quote payment:", error);
    return redirect("/custom-orders?error=payment_verification_failed");
  }
}
