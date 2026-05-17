import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { status: 400, error: 'Missing username or password' },
        { status: 400 }
      );
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { status: 401, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate simple token (base64 encoded credentials)
    const token = Buffer.from(`${username}:${password}`).toString('base64');

    return NextResponse.json({
      status: 200,
      data: {
        token,
        username,
        message: 'Login successful',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to login' },
      { status: 500 }
    );
  }
}
