import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { verifyAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json(
        { status: 401, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    let settings = await Settings.findOne().lean();

    if (!settings) {
      settings = await Settings.create({});
    }

    return NextResponse.json({
      status: 200,
      data: settings,
    });
  } catch (error) {
    console.error('Admin Settings GET error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json(
        { status: 401, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(body);
    } else {
      Object.assign(settings, body);
      await settings.save();
    }

    return NextResponse.json({
      status: 200,
      data: settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Admin Settings PUT error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
