import { NextRequest, NextResponse } from 'next/server';
import prisma from 'lib/prisma';
import { verifyAuth } from 'app/api/utils/auth';

// GET /api/admin/coupons - List all coupons
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active' | 'inactive' | 'all'

    const where: any = {};
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Create new coupon
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxUses,
      maxUsesPerUser,
      startDate,
      expiryDate,
      isActive
    } = body;

    // Validation
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    if (!discountType || !['percentage', 'fixed', 'free_shipping'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Valid discount type is required' },
        { status: 400 }
      );
    }

    if (discountType !== 'free_shipping') {
      if (!discountValue || discountValue <= 0) {
        return NextResponse.json(
          { error: 'Discount value must be greater than 0' },
          { status: 400 }
        );
      }
    }

    // Check if code already exists
    const existing = await prisma.coupon.findFirst({
      where: {
        code: {
          equals: code.toUpperCase(),
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue: discountType === 'free_shipping' ? 0 : discountValue,
        minOrderValue: minOrderValue || null,
        maxUses: maxUses || null,
        maxUsesPerUser: maxUsesPerUser || null,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
