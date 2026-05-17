import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Review from '@/models/Review';
import Visitor from '@/models/Visitor';
import { verifyAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'week';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'week':
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Total revenue from paid/success transactions
    const revenueResult = await Transaction.aggregate([
      { $match: { status: { $in: ['paid', 'success'] }, createdAt: { $gte: startDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Total orders in period
    const totalOrders = await Transaction.countDocuments({
      createdAt: { $gte: startDate },
    });

    // Total products
    const totalProducts = await Product.countDocuments({});

    // Total categories
    const totalCategories = await Category.countDocuments({});

    // Total reviews
    const totalReviews = await Review.countDocuments({});

    // Revenue by day for charting
    const revenueByDay = await Transaction.aggregate([
      { $match: { status: { $in: ['paid', 'success'] }, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', revenue: 1, _id: 0 } },
    ]);

    // Top 5 products by views
    const topProducts = await Product.find({})
      .sort({ views: -1 })
      .limit(5)
      .populate('category', 'name slug')
      .lean();

    // Recent 5 transactions
    const recentTransactions = await Transaction.find({})
      .populate('productId', 'name slug images')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Visitor stats
    const totalVisitors = await Visitor.countDocuments({
      visitedAt: { $gte: startDate },
    });

    const uniqueVisitors = await Visitor.distinct('sessionId', {
      visitedAt: { $gte: startDate },
    });

    const visitorStats = {
      total: totalVisitors,
      unique: uniqueVisitors.length,
    };

    return NextResponse.json({
      status: 200,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCategories,
        totalReviews,
        revenueByDay,
        topProducts,
        recentTransactions,
        visitorStats,
        period,
      },
    });
  } catch (error) {
    console.error('Admin Analytics GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
