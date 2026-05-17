import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
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
    const productId = searchParams.get('productId');
    const rating = searchParams.get('rating');

    const filter: any = {};
    if (productId) {
      filter.productId = productId;
    }
    if (rating) {
      filter.rating = parseInt(rating);
    }

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      status: 200,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin Reviews GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json({ status: 400, error: 'Missing reviewId' }, { status: 400 });
    }

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return NextResponse.json({ status: 404, error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 200,
      data: { message: 'Review deleted successfully' },
    });
  } catch (error) {
    console.error('Admin Reviews DELETE error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to delete review' }, { status: 500 });
  }
}
