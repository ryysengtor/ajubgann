import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'home' or 'product'
    const category = searchParams.get('category'); // category slug

    const filter: Record<string, unknown> = { isActive: true };

    if (type === 'home') {
      // Match banners with type='home' OR type field missing/null/undefined (legacy banners)
      filter.$or = [
        { type: 'home' },
        { type: { $exists: false } },
        { type: null },
        { type: '' },
      ];
    } else if (type === 'product') {
      // Only match banners explicitly set as product type
      filter.type = 'product';
      if (category) {
        filter.category = category;
      }
    }

    const banners = await Banner.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ status: 200, data: banners });
  } catch (error) {
    console.error('Banners GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch banners' }, { status: 500 });
  }
}
