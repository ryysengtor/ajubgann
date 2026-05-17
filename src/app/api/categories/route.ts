import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET(_req: NextRequest) {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();

    return NextResponse.json({
      status: 200,
      data: categories,
    });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
