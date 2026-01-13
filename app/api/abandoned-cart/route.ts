import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from 'lib/prisma';
import { sendAbandonedCartEmail } from '@/lib/email/order-emails';

/**
 * Track abandoned cart for logged-in user
 * POST /api/abandoned-cart/route
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'User must be logged in to track abandoned cart' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cartId, items, cartTotal } = body;

    if (!cartId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid cart data' }, { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if there's already an abandoned cart entry for this user/cart
    const existing = await prisma.abandonedCart.findFirst({
      where: {
        userId: user.id,
        cartId: cartId,
        emailSent: false,
      },
    });

    if (existing) {
      // Update existing entry
      await prisma.abandonedCart.update({
        where: { id: existing.id },
        data: {
          items: items,
          cartTotal: cartTotal,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        },
      });
    } else {
      // Create new entry
      await prisma.abandonedCart.create({
        data: {
          userId: user.id,
          cartId: cartId,
          email: user.email,
          customerName: user.name || 'Valued Customer',
          items: items,
          cartTotal: cartTotal,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Cart tracked' });
  } catch (error) {
    console.error('Failed to track abandoned cart:', error);
    return NextResponse.json(
      { error: 'Failed to track abandoned cart' },
      { status: 500 }
    );
  }
}

/**
 * Send abandoned cart emails for carts that have expired
 * GET /api/abandoned-cart/route
 * (This should be called by a cron job)
 */
export async function GET(request: NextRequest) {
  try {
    // Get abandoned carts that are expired and haven't been emailed yet
    const abandonedCarts = await prisma.abandonedCart.findMany({
      where: {
        emailSent: false,
        recovered: false,
        expiresAt: {
          lte: new Date(), // Expired
        },
      },
      take: 50, // Process in batches
    });

    if (abandonedCarts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No abandoned carts to process',
        sent: 0,
      });
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const cart of abandonedCarts) {
      try {
        const items = cart.items as Array<{
          productTitle: string;
          variantTitle: string;
          quantity: number;
          price: number;
          imageUrl?: string;
        }>;

        await sendAbandonedCartEmail({
          customerName: cart.customerName,
          email: cart.email,
          items: items,
          cartTotal: Number(cart.cartTotal),
        });

        // Mark as email sent
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        });

        emailsSent++;
        console.log(`Abandoned cart email sent to ${cart.email}`);
      } catch (emailError) {
        console.error(`Failed to send abandoned cart email to ${cart.email}:`, emailError);
        errors.push(`${cart.email}: ${(emailError as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${emailsSent} abandoned cart emails`,
      sent: emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Failed to process abandoned carts:', error);
    return NextResponse.json(
      { error: 'Failed to process abandoned carts' },
      { status: 500 }
    );
  }
}
