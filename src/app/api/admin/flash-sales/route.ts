import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FlashSale from '@/models/FlashSale';
import Product from '@/models/Product';
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

    const total = await FlashSale.countDocuments({});
    const flashSales = await FlashSale.find({})
      .populate('productIds', 'name slug price images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      status: 200,
      data: {
        flashSales,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin Flash Sales GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch flash sales' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { title, description, productIds, discountPercent, startsAt, endsAt, bannerImage, isActive } = body;

    if (!title || !discountPercent || !startsAt || !endsAt) {
      return NextResponse.json(
        { status: 400, error: 'Missing required fields: title, discountPercent, startsAt, endsAt' },
        { status: 400 }
      );
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { status: 400, error: 'At least one productId is required' },
        { status: 400 }
      );
    }

    // Fetch products to calculate prices
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const originalPrices: Record<string, number> = {};
    const salePrices: Record<string, number> = {};

    for (const product of products) {
      const productIdStr = product._id.toString();
      const originalPrice = product.price;
      const salePrice = Math.round(originalPrice * (1 - discountPercent / 100));
      originalPrices[productIdStr] = originalPrice;
      salePrices[productIdStr] = salePrice;
    }

    const flashSale = await FlashSale.create({
      title,
      description: description || '',
      productIds,
      discountPercent,
      originalPrices,
      salePrices,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      isActive: isActive !== undefined ? isActive : true,
      bannerImage: bannerImage || '',
    });

    const populated = await flashSale.populate('productIds', 'name slug price images');

    return NextResponse.json({
      status: 201,
      data: populated,
      message: 'Flash sale created successfully',
    });
  } catch (error) {
    console.error('Admin Flash Sales POST error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to create flash sale' }, { status: 500 });
  }
}
