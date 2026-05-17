import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FlashSale from '@/models/FlashSale';
import Product from '@/models/Product';
import { verifyAdmin } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { title, description, productIds, discountPercent, startsAt, endsAt, bannerImage, isActive } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent;
    if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);
    if (endsAt !== undefined) updateData.endsAt = new Date(endsAt);
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If productIds or discountPercent changed, recalculate prices
    if (productIds || discountPercent !== undefined) {
      const existingFlashSale = await FlashSale.findById(id);
      if (!existingFlashSale) {
        return NextResponse.json({ status: 404, error: 'Flash sale not found' }, { status: 404 });
      }

      const finalProductIds = productIds || existingFlashSale.productIds;
      const finalDiscount = discountPercent !== undefined ? discountPercent : existingFlashSale.discountPercent;

      const products = await Product.find({ _id: { $in: finalProductIds } }).lean();

      const originalPrices: Record<string, number> = {};
      const salePrices: Record<string, number> = {};

      for (const product of products) {
        const productIdStr = product._id.toString();
        const originalPrice = product.price;
        const salePrice = Math.round(originalPrice * (1 - finalDiscount / 100));
        originalPrices[productIdStr] = originalPrice;
        salePrices[productIdStr] = salePrice;
      }

      if (productIds) updateData.productIds = productIds;
      updateData.originalPrices = originalPrices;
      updateData.salePrices = salePrices;
    }

    const flashSale = await FlashSale.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('productIds', 'name slug price images');

    if (!flashSale) {
      return NextResponse.json({ status: 404, error: 'Flash sale not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 200,
      data: flashSale,
      message: 'Flash sale updated successfully',
    });
  } catch (error) {
    console.error('Admin Flash Sales PUT error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to update flash sale' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const flashSale = await FlashSale.findByIdAndDelete(id);

    if (!flashSale) {
      return NextResponse.json({ status: 404, error: 'Flash sale not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 200,
      data: { message: 'Flash sale deleted successfully' },
    });
  } catch (error) {
    console.error('Admin Flash Sales DELETE error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to delete flash sale' }, { status: 500 });
  }
}
