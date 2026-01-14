import { NextRequest, NextResponse } from 'next/server';
import prisma from 'lib/prisma';
import { getUserSession } from 'lib/user-session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal, sessionId } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    if (!cartTotal || typeof cartTotal !== 'number') {
      return NextResponse.json(
        { error: 'Cart total is required' },
        { status: 400 }
      );
    }

    // Get user session
    const session = await getUserSession();
    const currentUserId = session?.id;

    // Find coupon (case-insensitive)
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: {
          equals: code.toUpperCase(),
          mode: 'insensitive'
        }
      },
      include: {
        usages: true
      }
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    // Check if active
    if (!coupon.isActive) {
      return NextResponse.json(
        { error: 'This coupon is no longer active' },
        { status: 400 }
      );
    }

    // Check if requires login
    if (coupon.requiresLogin && !currentUserId) {
      return NextResponse.json(
        { error: 'Please sign in to use this coupon' },
        { status: 401 }
      );
    }

    // Check start date
    if (coupon.startDate && new Date() < new Date(coupon.startDate)) {
      return NextResponse.json(
        { error: 'This coupon is not yet valid' },
        { status: 400 }
      );
    }

    // Check expiry date
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return NextResponse.json(
        { error: 'This coupon has expired' },
        { status: 400 }
      );
    }

    // Check usage limit
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: 'This coupon has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check per-user usage limit
    if (coupon.maxUsesPerUser) {
      let userUsageCount = 0;
      
      if (currentUserId) {
        // Count usage by user ID
        userUsageCount = coupon.usages.filter(u => u.userId === currentUserId).length;
      } else if (sessionId) {
        // Count usage by session ID for guest users
        userUsageCount = coupon.usages.filter(u => u.sessionId === sessionId).length;
      }
      
      if (userUsageCount >= coupon.maxUsesPerUser) {
        return NextResponse.json(
          { error: 'You have already used this coupon the maximum number of times' },
          { status: 400 }
        );
      }
    }

    // Check minimum order value
    if (coupon.minOrderValue && cartTotal < Number(coupon.minOrderValue)) {
      return NextResponse.json(
        {
          error: `Minimum order value of ₦${Number(coupon.minOrderValue).toLocaleString()} required`
        },
        { status: 400 }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * Number(coupon.discountValue)) / 100;
    } else if (coupon.discountType === 'fixed') {
      discountAmount = Math.min(Number(coupon.discountValue), cartTotal);
    }

    // Note: Usage is tracked when order is created, not during validation
    // This prevents premature usage counting

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        description: coupon.description,
        requiresLogin: coupon.requiresLogin
      }
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
