import mongoose, { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Like from '@/models/Like';
import Product from '@/models/Product';

// GET /api/likes?productIds=id1,id2,id3 - get like counts for multiple products
// GET /api/likes?productId=id&sessionId=xxx - check if user liked a product
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const productIdsParam = searchParams.get('productIds');
    const productId = searchParams.get('productId');
    const sessionId = searchParams.get('sessionId');

    // Get like counts for multiple products
    if (productIdsParam) {
      const ids = productIdsParam.split(',').filter(Boolean);
      const objectIds = ids.map((id) => {
        try { return new Types.ObjectId(id); } catch { return null; }
      }).filter(Boolean) as Types.ObjectId[];

      const likeCounts = await Like.aggregate([
        { $match: { productId: { $in: objectIds } } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
      ]);

      // Also get user's likes if sessionId provided
      let userLikes: string[] = [];
      if (sessionId) {
        const liked = await Like.find({
          productId: { $in: objectIds },
          sessionId,
        }).lean();
        userLikes = liked.map((l) => l.productId.toString());
      }

      const countsMap: Record<string, number> = {};
      likeCounts.forEach((item) => {
        countsMap[item._id.toString()] = item.count;
      });

      return NextResponse.json({
        status: 200,
        data: { counts: countsMap, userLikes },
      });
    }

    // Check single product like status
    if (productId && sessionId) {
      const existing = await Like.findOne({ productId, sessionId });
      const count = await Like.countDocuments({ productId });

      return NextResponse.json({
        status: 200,
        data: { liked: !!existing, count },
      });
    }

    // Get all like counts
    const likeCounts = await Like.aggregate([
      { $group: { _id: '$productId', count: { $sum: 1 } } },
    ]);

    const countsMap: Record<string, number> = {};
    likeCounts.forEach((item) => {
      countsMap[item._id.toString()] = item.count;
    });

    return NextResponse.json({
      status: 200,
      data: { counts: countsMap },
    });
  } catch (error) {
    console.error('Like GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch likes' }, { status: 500 });
  }
}

// POST /api/likes - Toggle like (like/unlike)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { productId, sessionId } = body;

    if (!productId || !sessionId) {
      return NextResponse.json(
        { status: 400, error: 'Missing productId or sessionId' },
        { status: 400 }
      );
    }

    const existing = await Like.findOne({ productId, sessionId });

    if (existing) {
      // Unlike
      await Like.deleteOne({ _id: existing._id });
      const count = await Like.countDocuments({ productId });

      // Update product likes count
      await Product.findByIdAndUpdate(productId, { likes: count });

      return NextResponse.json({
        status: 200,
        data: { liked: false, count },
      });
    } else {
      // Like
      await Like.create({ productId, sessionId });
      const count = await Like.countDocuments({ productId });

      // Update product likes count
      await Product.findByIdAndUpdate(productId, { likes: count });

      return NextResponse.json({
        status: 200,
        data: { liked: true, count },
      });
    }
  } catch (error) {
    console.error('Like POST error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to toggle like' }, { status: 500 });
  }
}
