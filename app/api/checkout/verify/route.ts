import {
  sendAdminNewOrderNotification,
  sendOrderConfirmationWithMarkup,
} from "@/lib/email/order-emails";
import {
  CouponValidationError,
  validateCouponForCheckout,
} from "lib/coupon-validation";
import { db } from "lib/db";
import {
  adminUsers,
  cartLines,
  carts,
  couponUsages,
  coupons,
  orderItems,
  orders,
  productImages,
  productVariants,
  products,
  users,
} from "lib/db/schema";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { and, eq, ilike, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (!reference) {
      return redirect("/checkout?error=invalid_reference");
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      return redirect("/checkout?error=payment_verification_failed");
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      },
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      console.error("Payment verification failed:", verifyData);
      return redirect("/checkout?error=payment_failed");
    }

    const paystackData = verifyData.data;
    const paystackAmount = Number(paystackData.amount);
    const paystackCurrency = paystackData.currency;
    const metadata = paystackData.metadata || {};
    const cartIdFromMetadata = metadata.cart_id as string | undefined;

    if (!cartIdFromMetadata) {
      console.error("No cart_id in Paystack metadata");
      return redirect("/checkout?error=cart_not_found");
    }

    if (paystackCurrency && paystackCurrency !== "NGN") {
      console.error("Unexpected Paystack currency:", paystackCurrency);
      return redirect("/checkout?error=payment_currency_mismatch");
    }

    const cookieStore = await cookies();
    const checkoutSessionCookie = cookieStore.get("checkout-session");

    if (!checkoutSessionCookie) {
      return redirect("/checkout?error=session_expired");
    }

    const checkoutSession = JSON.parse(checkoutSessionCookie.value);

    if (
      checkoutSession.cartId &&
      checkoutSession.cartId !== cartIdFromMetadata
    ) {
      console.error("Cart ID mismatch between session and Paystack metadata");
      return redirect("/checkout?error=cart_mismatch");
    }

    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.id, cartIdFromMetadata))
      .limit(1);

    if (!cart) {
      return redirect("/checkout?error=cart_not_found");
    }

    const cartLineRows = await db
      .select({
        line: cartLines,
        variant: productVariants,
        product: products,
        image: productImages,
      })
      .from(cartLines)
      .innerJoin(
        productVariants,
        eq(cartLines.productVariantId, productVariants.id),
      )
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(
        productImages,
        and(
          eq(productImages.productId, products.id),
          eq(productImages.isFeatured, true),
        ),
      )
      .where(eq(cartLines.cartId, cart.id));

    const uniqueLines = Array.from(
      cartLineRows.reduce((acc, row) => {
        if (!acc.has(row.line.id)) {
          acc.set(row.line.id, row);
        }
        return acc;
      }, new Map<string, (typeof cartLineRows)[number]>()),
    ).map(([, value]) => value);

    if (!uniqueLines.length) {
      return redirect("/checkout?error=cart_not_found");
    }

    const shippingCost = 0;
    const subtotalAmount = Number(cart.subtotalAmount);
    const rawMetadataDiscount = metadata.discount_amount;
    const metadataDiscountAmount = Number(rawMetadataDiscount);
    const metadataCouponCode =
      typeof metadata.coupon_code === "string" ? metadata.coupon_code : null;
    let appliedCouponCode: string | null = null;
    let discountAmount = Number.isFinite(metadataDiscountAmount)
      ? metadataDiscountAmount
      : 0;

    if (!discountAmount && (metadataCouponCode || checkoutSession.couponCode)) {
      try {
        const { coupon, discountAmount: computedDiscount } =
          await validateCouponForCheckout({
            code: metadataCouponCode || checkoutSession.couponCode,
            cartTotal: subtotalAmount,
            userId: checkoutSession.userId || null,
            sessionId: checkoutSession.userId ? undefined : cartIdFromMetadata,
          });

        appliedCouponCode = coupon.code;
        discountAmount = computedDiscount;
      } catch (error) {
        if (error instanceof CouponValidationError) {
          console.error("Coupon validation failed:", error.message);
          return redirect("/checkout?error=invalid_coupon");
        }
        throw error;
      }
    } else if (metadataCouponCode) {
      appliedCouponCode = metadataCouponCode;
    }

    discountAmount = Math.min(discountAmount, subtotalAmount);
    const totalAmount = subtotalAmount - discountAmount + shippingCost;
    const expectedAmountInKobo = Math.round(totalAmount * 100);

    if (!Number.isFinite(paystackAmount) || paystackAmount <= 0) {
      console.error("Invalid Paystack amount:", paystackData.amount);
      return redirect("/checkout?error=payment_verification_failed");
    }

    if (paystackAmount !== expectedAmountInKobo) {
      console.error("Paystack amount mismatch:", {
        expectedAmountInKobo,
        paystackAmount,
      });
      return redirect("/checkout?error=payment_amount_mismatch");
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    const orderItemsData = uniqueLines.map(
      ({ line, variant, product, image }) => ({
        orderId: "",
        productId: variant.productId,
        productVariantId: line.productVariantId,
        productTitle: product.title,
        variantTitle: variant.title,
        quantity: line.quantity,
        price: String(variant.price),
        totalAmount: String(line.totalAmount),
        currencyCode: line.currencyCode,
        productImage: image?.url || null,
      }),
    );

    const order = await db.transaction(async (tx) => {
      const [createdOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: checkoutSession.userId || null,
          email: checkoutSession.email,
          phone: checkoutSession.phone,
          customerName: `${checkoutSession.shippingAddress.firstName} ${checkoutSession.shippingAddress.lastName}`,
          shippingAddress: checkoutSession.shippingAddress,
          billingAddress: checkoutSession.billingAddress,
          status: "processing",
          subtotalAmount: String(subtotalAmount),
          shippingAmount: String(shippingCost),
          discountAmount: String(discountAmount),
          couponCode: appliedCouponCode,
          totalAmount: String(totalAmount),
          currencyCode: "NGN",
          notes:
            typeof checkoutSession.notes === "string" &&
            checkoutSession.notes.trim().length > 0
              ? checkoutSession.notes.trim()
              : null,
        })
        .returning();

      if (!createdOrder) {
        throw new Error("Failed to create order");
      }

      if (orderItemsData.length > 0) {
        await tx.insert(orderItems).values(
          orderItemsData.map((item) => ({
            ...item,
            orderId: createdOrder.id,
          })),
        );
      }

      return {
        ...createdOrder,
        items: orderItemsData.map((item) => ({
          ...item,
          orderId: createdOrder.id,
        })),
      };
    });

    if (appliedCouponCode) {
      try {
        const [coupon] = await db
          .select()
          .from(coupons)
          .where(ilike(coupons.code, appliedCouponCode))
          .limit(1);

        if (coupon) {
          await db.insert(couponUsages).values({
            couponId: coupon.id,
            userId: checkoutSession.userId || null,
            sessionId: null,
          });

          await db
            .update(coupons)
            .set({ usedCount: sql`${coupons.usedCount} + 1` })
            .where(eq(coupons.id, coupon.id));
        }
      } catch (couponError) {
        console.error("Failed to track coupon usage:", couponError);
      }
    }

    if (checkoutSession.saveAddress && checkoutSession.userId) {
      await db
        .update(users)
        .set({
          shippingAddress: checkoutSession.shippingAddress,
          billingAddress: checkoutSession.billingAddress,
        })
        .where(eq(users.id, checkoutSession.userId));
    }

    try {
      await sendOrderConfirmationWithMarkup({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        email: order.email,
        totalAmount: Number(order.totalAmount),
        subtotalAmount: Number(order.subtotalAmount),
        shippingAmount: Number(order.shippingAmount),
        taxAmount: Number(order.taxAmount),
        discountAmount: Number(order.discountAmount || 0),
        couponCode: order.couponCode,
        items: uniqueLines.map(({ line, variant, product, image }) => ({
          productTitle: product.title,
          variantTitle: variant.title,
          quantity: line.quantity,
          price: Number(variant.price),
          productImage: image?.url || null,
          productHandle: product.handle,
          sku: line.productVariantId,
        })),
        shippingAddress: order.shippingAddress,
        orderDate: order.createdAt.toISOString(),
      });
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }

    try {
      const adminRows = await db
        .select({ email: adminUsers.email })
        .from(adminUsers)
        .where(eq(adminUsers.isActive, true));
      const envAdmins = process.env.ADMIN_NOTIFICATION_EMAILS;
      const envEmail = process.env.ADMIN_EMAIL;
      const envEmails = [
        envEmail,
        ...(envAdmins
          ? envAdmins
              .split(",")
              .map((email) => email.trim())
              .filter(Boolean)
          : []),
      ].filter(Boolean);
      const adminEmails = Array.from(
        new Set([...adminRows.map((admin) => admin.email), ...envEmails]),
      ).filter((email): email is string => Boolean(email));

      if (adminEmails && adminEmails.length > 0) {
        await sendAdminNewOrderNotification({
          to: adminEmails,
          orderNumber: order.orderNumber,
          orderId: order.id,
          customerName: order.customerName,
          email: order.email,
          phone: order.phone,
          totalAmount: Number(order.totalAmount),
          subtotalAmount: Number(order.subtotalAmount),
          shippingAmount: Number(order.shippingAmount),
          taxAmount: Number(order.taxAmount),
          discountAmount: Number(order.discountAmount || 0),
          couponCode: order.couponCode,
          currencyCode: order.currencyCode,
          orderDate: order.createdAt.toISOString(),
          items: order.items.map((item) => ({
            productTitle: item.productTitle,
            variantTitle: item.variantTitle,
            quantity: item.quantity,
          })),
        });
      }
    } catch (emailError) {
      console.error("Failed to send admin new order email:", emailError);
    }

    await db.delete(cartLines).where(eq(cartLines.cartId, cart.id));

    await db
      .update(carts)
      .set({
        totalQuantity: 0,
        subtotalAmount: "0",
        totalAmount: "0",
        totalTaxAmount: "0",
      })
      .where(eq(carts.id, cart.id));

    cookieStore.delete("checkout-session");

    return redirect(`/checkout/success?order=${orderNumber}`);
  } catch (error) {
    if (
      (error as Error & { digest?: string }).digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Payment verification error:", error);
    return redirect("/checkout?error=verification_failed");
  }
}
