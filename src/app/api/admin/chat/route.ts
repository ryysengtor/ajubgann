import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
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

    // Get all unique sessionIds with their latest message and unread count
    const sessions = await ChatMessage.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$sessionId',
          latestMessage: { $first: '$message' },
          latestSender: { $first: '$sender' },
          latestCreatedAt: { $first: '$createdAt' },
          totalMessages: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$isRead', false] }, { $eq: ['$sender', 'visitor'] }] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { latestCreatedAt: -1 },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ]);

    const totalSessions = (await ChatMessage.distinct('sessionId')).length;

    // Format the response
    const formattedSessions = sessions.map((session) => ({
      sessionId: session._id,
      latestMessage: session.latestMessage,
      latestSender: session.latestSender,
      latestCreatedAt: session.latestCreatedAt,
      totalMessages: session.totalMessages,
      unreadCount: session.unreadCount,
    }));

    return NextResponse.json({
      status: 200,
      data: {
        sessions: formattedSessions,
        pagination: {
          page,
          limit,
          total: totalSessions,
          totalPages: Math.ceil(totalSessions / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin Chat GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch chat sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { status: 400, error: 'Missing required fields: sessionId, message' },
        { status: 400 }
      );
    }

    const chatMessage = await ChatMessage.create({
      sessionId,
      sender: 'admin',
      message,
      isRead: true,
    });

    return NextResponse.json({
      status: 201,
      data: chatMessage,
      message: 'Reply sent successfully',
    });
  } catch (error) {
    console.error('Admin Chat POST error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to send reply' }, { status: 500 });
  }
}
