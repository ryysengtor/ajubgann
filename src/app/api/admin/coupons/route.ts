import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { verifyAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const total = await Coupon.countDocuments({});
    const coupons = await Coupon.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      status: 200,
      data: {
        coupons,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin Coupons GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { code, description, discountType, discountValue, minPurchase, maxDiscount, usageLimit, expiresAt, isActive } = body;

    if (!code || !discountType || discountValue === undefined || !expiresAt) {
      return NextResponse.json(
        { status: 400, error: 'Missing required fields: code, discountType, discountValue, expiresAt' },
        { status: 400 }
      );
    }

    const validTypes = ['percentage', 'fixed'];
    if (!validTypes.includes(discountType)) {
      return NextResponse.json(
        { status: 400, error: `Invalid discountType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const upperCode = code.toUpperCase();

    // Check for duplicate code
    const existing = await Coupon.findOne({ code: upperCode });
    if (existing) {
      return NextResponse.json(
        { status: 400, error: 'Coupon with this code already exists' },
        { status: 400 }
      );
    }

    const coupon = await Coupon.create({
      code: upperCode,
      description: description || '',
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || undefined,
      usageLimit: usageLimit || undefined,
      usedCount: 0,
      isActive: isActive !== undefined ? isActive : true,
      expiresAt: new Date(expiresAt),
    });

    return NextResponse.json({
      status: 201,
      data: coupon,
      message: 'Coupon created successfully',
    });
  } catch (error) {
    console.error('Admin Coupons POST error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to create coupon' }, { status: 500 });
  }
}
