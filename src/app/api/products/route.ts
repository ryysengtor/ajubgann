import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort'); // 'price_asc', 'price_desc', 'newest', 'popular'
    const status = searchParams.get('status'); // 'available' to filter out sold items
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filter: any = { isActive: true };

    // Filter by availability status
    if (status === 'available') {
      filter.isSold = false;
    }

    if (category && category !== 'all') {
      // Find category by slug to get its ObjectId
      const catDoc = await Category.findOne({ slug: category }).lean();
      if (catDoc) {
        filter.category = catDoc._id;
      }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Determine sort order
    let sortOptions: any = { isFeatured: -1, order: 1, createdAt: -1 };
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sort === 'popular') {
      sortOptions = { views: -1, likes: -1 };
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug icon image accentColor bgColor bannerColor glowColor borderColor theme')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      status: 200,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch products' }, { status: 500 });
  }
}
