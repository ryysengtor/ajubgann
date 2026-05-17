import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const product = await Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug icon')
      .lean();

    if (!product) {
      return NextResponse.json({ status: 404, error: 'Product not found' }, { status: 404 });
    }

    if (product.isSold) {
      return NextResponse.json({ status: 400, error: 'This account has been sold' }, { status: 400 });
    }

    // Increment view count (fire and forget)
    Product.updateOne({ slug }, { $inc: { views: 1 } }).catch(() => {});

    return NextResponse.json({ status: 200, data: product });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch product' }, { status: 500 });
  }
}
