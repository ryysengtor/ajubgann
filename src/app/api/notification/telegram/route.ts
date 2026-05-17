import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, photoUrl, chatId } = body;

    const targetChatId = chatId || TELEGRAM_ADMIN_ID;

    if (!targetChatId) {
      return NextResponse.json(
        { status: 400, error: 'Missing chat ID' },
        { status: 400 }
      );
    }

    if (photoUrl) {
      // Send photo with caption
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            photo: photoUrl,
            caption: message || '',
            parse_mode: 'HTML',
          }),
        }
      );

      const data = await res.json();

      if (!data.ok) {
        return NextResponse.json(
          { status: 500, error: 'Failed to send Telegram photo', details: data },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: 200,
        data: { message: 'Telegram photo sent successfully', result: data },
      });
    }

    if (!message) {
      return NextResponse.json(
        { status: 400, error: 'Missing message or photoUrl' },
        { status: 400 }
      );
    }

    // Send text message
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json(
        { status: 500, error: 'Failed to send Telegram message', details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 200,
      data: { message: 'Telegram message sent successfully', result: data },
    });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to send Telegram message' },
      { status: 500 }
    );
  }
}
