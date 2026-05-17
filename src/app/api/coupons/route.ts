import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const amount = parseFloat(searchParams.get('amount') || '0');

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return NextResponse.json({
        data: { valid: false, error: 'Coupon not found' },
      });
    }

    if (!coupon.isActive) {
      return NextResponse.json({
        data: { valid: false, error: 'Coupon is not active' },
      });
    }

    const now = new Date();
    if (coupon.expiresAt && new Date(coupon.expiresAt) <= now) {
      return NextResponse.json({
        data: { valid: false, error: 'Coupon has expired' },
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({
        data: { valid: false, error: 'Coupon usage limit reached' },
      });
    }

    if (coupon.minPurchase && amount < coupon.minPurchase) {
      return NextResponse.json({
        data: { valid: false, error: `Minimum purchase amount is ${coupon.minPurchase}` },
      });
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      // Fixed discount
      discount = coupon.discountValue;
    }

    return NextResponse.json({
      data: {
        valid: true,
        discount,
        maxDiscount: coupon.maxDiscount || null,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
      },
    });
  } catch (error) {
    console.error('Coupons GET error:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
