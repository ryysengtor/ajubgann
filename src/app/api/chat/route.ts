import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const after = searchParams.get('after');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const filter: any = { sessionId };

    // If 'after' param provided, only return messages after that timestamp
    if (after) {
      filter.createdAt = { $gt: new Date(after) };
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ data: messages });
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { sessionId, sender, message } = body;

    if (!sessionId || !sender || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, sender, message' },
        { status: 400 }
      );
    }

    if (sender !== 'visitor' && sender !== 'admin') {
      return NextResponse.json(
        { error: 'Sender must be either "visitor" or "admin"' },
        { status: 400 }
      );
    }

    const chatMessage = await ChatMessage.create({
      sessionId,
      sender,
      message,
    });

    return NextResponse.json({ data: chatMessage }, { status: 201 });
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json(
      { error: 'Failed to send chat message' },
      { status: 500 }
    );
  }
}
