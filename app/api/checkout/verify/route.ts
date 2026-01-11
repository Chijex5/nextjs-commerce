import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "lib/prisma";

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

    // Get checkout session from cookie
    const cookieStore = await cookies();
    const checkoutSessionCookie = cookieStore.get("checkout-session");

    if (!checkoutSessionCookie) {
      return redirect("/checkout?error=session_expired");
    }

    const checkoutSession = JSON.parse(checkoutSessionCookie.value);

    // Get cart to create order items
    const cart = await prisma.cart.findUnique({
      where: { id: checkoutSession.cartId },
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
        subtotalAmount: checkoutSession.subtotalAmount,
        shippingAmount: checkoutSession.shippingAmount,
        totalAmount: checkoutSession.totalAmount,
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
    if ((error as Error & { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
        throw error;
    }

    console.error("Payment verification error:", error);
    return redirect("/checkout?error=verification_failed");
  }
}