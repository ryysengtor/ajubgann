import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
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
    const type = searchParams.get('type');

    const filter: any = {};
    if (type) {
      filter.type = type;
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      status: 200,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin Notifications GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { type, title, message, targetSession, link } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { status: 400, error: 'Missing required fields: type, title, message' },
        { status: 400 }
      );
    }

    const validTypes = ['transaction', 'flash_sale', 'coupon', 'system'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { status: 400, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // If targetSession is empty, this is a broadcast notification
    const notification = await Notification.create({
      type,
      title,
      message,
      targetSession: targetSession || '',
      link: link || '',
      isRead: false,
    });

    // If broadcast (no targetSession), create individual notifications for active sessions
    // For now, a single notification with empty targetSession serves as broadcast
    // The frontend can query for notifications where targetSession is empty or matches their session

    return NextResponse.json({
      status: 201,
      data: notification,
      message: 'Notification created successfully',
    });
  } catch (error) {
    console.error('Admin Notifications POST error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to create notification' }, { status: 500 });
  }
}
