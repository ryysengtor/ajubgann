import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Visitor from '@/models/Visitor';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';

    // Determine date range based on period
    const now = new Date();
    let startDate: Date;

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      return NextResponse.json(
        { error: 'Invalid period. Use "today", "week", or "month"' },
        { status: 400 }
      );
    }

    // Total visitors in the period
    const totalVisitors = await Visitor.countDocuments({
      visitedAt: { $gte: startDate },
    });

    // Unique visitors in the period
    const uniqueResult = await Visitor.distinct('sessionId', {
      visitedAt: { $gte: startDate },
    });
    const uniqueVisitors = uniqueResult.length;

    // Page views in the period
    const pageViews = await Visitor.countDocuments({
      visitedAt: { $gte: startDate },
    });

    // Top 5 pages
    const topPagesResult = await Visitor.aggregate([
      { $match: { visitedAt: { $gte: startDate } } },
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    const topPages = topPagesResult.map((item) => ({
      page: item._id,
      count: item.count,
    }));

    // Daily stats
    const dailyStatsResult = await Visitor.aggregate([
      { $match: { visitedAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$visitedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyStats = dailyStatsResult.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    return NextResponse.json({
      data: {
        totalVisitors,
        uniqueVisitors,
        pageViews,
        topPages,
        dailyStats,
        // Quick stats for visitor widget
        today: await Visitor.countDocuments({
          visitedAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        }),
        weekly: await Visitor.countDocuments({
          visitedAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        }),
        total: await Visitor.countDocuments({}),
        online: await Visitor.distinct('sessionId', {
          visitedAt: { $gte: new Date(now.getTime() - 5 * 60 * 1000) },
        }).then(r => r.length),
      },
    });
  } catch (error) {
    console.error('Visitors GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { sessionId, page, referrer, userAgent } = body;

    if (!sessionId || !page) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, page' },
        { status: 400 }
      );
    }

    const visitor = await Visitor.create({
      sessionId,
      page,
      referrer: referrer || '',
      userAgent: userAgent || '',
    });

    return NextResponse.json({ data: visitor }, { status: 201 });
  } catch (error) {
    console.error('Visitors POST error:', error);
    return NextResponse.json(
      { error: 'Failed to track visitor' },
      { status: 500 }
    );
  }
}
