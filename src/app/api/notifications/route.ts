import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Return both targeted notifications (targetSession=sessionId) and broadcast notifications (targetSession='')
    const filter: any = {
      $or: [
        { targetSession: sessionId },
        { targetSession: '' },
      ],
    };

    if (unreadOnly) {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { sessionId, notificationIds } = body;

    if (!sessionId || !notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, notificationIds (array)' },
        { status: 400 }
      );
    }

    // Mark notifications as read - only those targeting this session or broadcasts
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        $or: [
          { targetSession: sessionId },
          { targetSession: '' },
        ],
      },
      { $set: { isRead: true } }
    );

    return NextResponse.json({
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
