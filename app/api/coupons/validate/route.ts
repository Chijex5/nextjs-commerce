import { NextRequest, NextResponse } from 'next/server';
import prisma from 'lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal, userId } = body;

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

    // Find coupon (case-insensitive)
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: {
          equals: code.toUpperCase(),
          mode: 'insensitive'
        }
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

    // Check minimum order value
    if (coupon.minOrderValue && cartTotal < Number(coupon.minOrderValue)) {
      return NextResponse.json(
        {
          error: `Minimum order value of ₦${coupon.minOrderValue} required`
        },
        { status: 400 }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * Number(coupon.discountValue)) / 100;
    } else if (coupon.discountType === 'fixed') {
      discountAmount = Number(coupon.discountValue);
    }

    // Increment usage count
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } }
    });

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        description: coupon.description
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
