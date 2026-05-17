import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { verifyAdmin } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { code, description, discountType, discountValue, minPurchase, maxDiscount, usageLimit, expiresAt, isActive } = body;

    const updateData: any = {};
    if (code !== undefined) {
      updateData.code = code.toUpperCase();
      // Check for duplicate code if changing
      const existing = await Coupon.findOne({ code: updateData.code, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { status: 400, error: 'Coupon with this code already exists' },
          { status: 400 }
        );
      }
    }
    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) {
      const validTypes = ['percentage', 'fixed'];
      if (!validTypes.includes(discountType)) {
        return NextResponse.json(
          { status: 400, error: `Invalid discountType. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.discountType = discountType;
    }
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (minPurchase !== undefined) updateData.minPurchase = minPurchase;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (expiresAt !== undefined) updateData.expiresAt = new Date(expiresAt);
    if (isActive !== undefined) updateData.isActive = isActive;

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return NextResponse.json({ status: 404, error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 200,
      data: coupon,
      message: 'Coupon updated successfully',
    });
  } catch (error) {
    console.error('Admin Coupons PUT error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    // Soft delete by setting isActive to false
    const coupon = await Coupon.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!coupon) {
      return NextResponse.json({ status: 404, error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 200,
      data: { message: 'Coupon deactivated successfully' },
    });
  } catch (error) {
    console.error('Admin Coupons DELETE error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to deactivate coupon' }, { status: 500 });
  }
}
