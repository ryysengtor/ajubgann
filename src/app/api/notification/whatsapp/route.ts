import { NextRequest, NextResponse } from 'next/server';

const FONNTE_API_KEY = process.env.FONNTE_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, message, image } = body;

    if (!target || !message) {
      return NextResponse.json(
        { status: 400, error: 'Missing required fields: target, message' },
        { status: 400 }
      );
    }

    const payload: any = {
      target,
      message,
      type: 'text',
    };

    if (image) {
      payload.type = 'image';
      payload.image = image;
    }

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: FONNTE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json(
        { status: 500, error: 'Failed to send WhatsApp message', details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 200,
      data: { message: 'WhatsApp message sent successfully', result: data },
    });
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}
