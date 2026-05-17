import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const filter = { productId };

    const total = await Review.countDocuments(filter);

    // Calculate average rating
    const ratingResult = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } },
    ]);

    const averageRating = ratingResult.length > 0 ? Math.round(ratingResult[0].averageRating * 10) / 10 : 0;

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      data: {
        reviews,
        averageRating,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { productId, sessionId, customerName, rating, comment } = body;

    if (!productId || !sessionId || !customerName || rating === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, sessionId, customerName, rating' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if session already reviewed this product
    const existingReview = await Review.findOne({ productId, sessionId });
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    const review = await Review.create({
      productId,
      sessionId,
      customerName,
      rating,
      comment: comment || '',
    });

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
