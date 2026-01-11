import { NextRequest, NextResponse } from "next/server";
import { getCart } from "lib/database";
import { getUserSession } from "lib/user-session";
import { cookies } from "next/headers";

interface CheckoutData {
  email: string;
  phone: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  saveAddress: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutData = await request.json();
    
    // Validate required fields
    if (!body.email || !body.phone || !body.shippingAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get cart
    const cart = await getCart();
    if (!cart || cart.lines.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Calculate total amount (including shipping)
    const shippingCost = 2000; // ₦2,000 flat shipping
    const totalAmount = parseFloat(cart.cost.totalAmount.amount) + shippingCost;
    
    // Convert amount to kobo (Paystack uses kobo for NGN)
    const amountInKobo = Math.round(totalAmount * 100);

    // Get user session if available
    const session = await getUserSession();

    // Store checkout data in a cookie temporarily (will be retrieved after payment)
    const checkoutSession = {
      email: body.email,
      phone: body.phone,
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress,
      saveAddress: body.saveAddress,
      userId: session?.id,
      cartId: cart.id,
      subtotalAmount: cart.cost.subtotalAmount.amount,
      shippingAmount: shippingCost,
      totalAmount: totalAmount,
    };

    (await cookies()).set("checkout-session", JSON.stringify(checkoutSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30, // 30 minutes
      path: "/",
    });

    // Initialize Paystack payment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    const callbackUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/checkout/verify`;

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: body.email,
          amount: amountInKobo,
          currency: "NGN",
          callback_url: callbackUrl,
          metadata: {
            customer_name: `${body.shippingAddress.firstName} ${body.shippingAddress.lastName}`,
            phone: body.phone,
            cart_id: cart.id,
          },
        }),
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || !paystackData.data) {
      console.error("Paystack initialization failed:", paystackData);
      return NextResponse.json(
        { error: paystackData.message || "Failed to initialize payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (error) {
    console.error("Checkout initialization error:", error);
    return NextResponse.json(
      { error: "An error occurred during checkout" },
      { status: 500 }
    );
  }
}
