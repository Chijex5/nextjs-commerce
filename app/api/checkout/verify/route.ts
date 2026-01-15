import {
  sendAdminNewOrderNotification,
  sendOrderConfirmationWithMarkup,
} from "@/lib/email/order-emails";
import {
  CouponValidationError,
  validateCouponForCheckout,
} from "lib/coupon-validation";
import prisma from "lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (!reference) {
      return redirect("/checkout?error=invalid_reference");
    }

    // Verify payment with Paystack
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

    // Get checkout session from cookie
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

    // Get cart to create order items
    const cart = await prisma.cart.findUnique({
      where: { id: cartIdFromMetadata },
      include: {
        lines: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isFeatured: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.lines.length === 0) {
      return redirect("/checkout?error=cart_not_found");
    }

    const shippingCost = 2000; // ₦2,000 flat shipping
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

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: checkoutSession.userId || null,
        email: checkoutSession.email,
        phone: checkoutSession.phone,
        customerName: `${checkoutSession.shippingAddress.firstName} ${checkoutSession.shippingAddress.lastName}`,
        shippingAddress: checkoutSession.shippingAddress,
        billingAddress: checkoutSession.billingAddress,
        status: "processing",
        subtotalAmount,
        shippingAmount: shippingCost,
        discountAmount,
        couponCode: appliedCouponCode,
        totalAmount,
        currencyCode: "NGN",
        items: {
          create: cart.lines.map((line) => ({
            productId: line.variant.productId,
            productVariantId: line.productVariantId,
            productTitle: line.variant.product.title,
            variantTitle: line.variant.title,
            quantity: line.quantity,
            price: line.variant.price,
            totalAmount: line.totalAmount,
            currencyCode: line.currencyCode,
            productImage: line.variant.product.images[0]?.url || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Track coupon usage if coupon was applied
    if (appliedCouponCode) {
      try {
        // Find the coupon
        const coupon = await prisma.coupon.findFirst({
          where: {
            code: {
              equals: appliedCouponCode,
              mode: "insensitive",
            },
          },
        });

        if (coupon) {
          // Create usage record
          await prisma.couponUsage.create({
            data: {
              couponId: coupon.id,
              userId: checkoutSession.userId || null,
              sessionId: null, // Could get from cookies if tracking guest sessions
            },
          });

          // Increment usage count
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      } catch (couponError) {
        console.error("Failed to track coupon usage:", couponError);
        // Don't fail the order if coupon tracking fails
      }
    }

    // Update user addresses if requested and user is logged in
    if (checkoutSession.saveAddress && checkoutSession.userId) {
      await prisma.user.update({
        where: { id: checkoutSession.userId },
        data: {
          shippingAddress: checkoutSession.shippingAddress,
          billingAddress: checkoutSession.billingAddress,
        },
      });
    }

    // Send order confirmation email with Google Email Markup
    try {
      await sendOrderConfirmationWithMarkup({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        email: order.email,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((item) => ({
          productTitle: item.productTitle,
          variantTitle: item.variantTitle,
          quantity: item.quantity,
          price: Number(item.price),
          productImage: item.productImage,
        })),
        shippingAddress: order.shippingAddress,
        orderDate: order.createdAt.toISOString(),
      });
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
      // Don't fail the order creation if email fails
    }

    // Send admin notification for new order
    try {
      const adminUsers = await prisma.adminUser.findMany({
        where: { isActive: true },
        select: { email: true },
      });
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
        new Set([
          ...adminUsers.map((admin) => admin.email),
          ...envEmails,
        ]),
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

    // Clear cart
    await prisma.cartLine.deleteMany({
      where: { cartId: cart.id },
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        totalQuantity: 0,
        subtotalAmount: 0,
        totalAmount: 0,
        totalTaxAmount: 0,
      },
    });

    // Clear checkout session cookie
    cookieStore.delete("checkout-session");

    // Redirect to success page
    return redirect(`/checkout/success?order=${orderNumber}`);
  } catch (error) {
    // ✅ FIX: Check if the error is a Next.js redirect
    if (
      (error as Error & { digest?: string }).digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Payment verification error:", error);
    return redirect("/checkout?error=verification_failed");
  }
}
