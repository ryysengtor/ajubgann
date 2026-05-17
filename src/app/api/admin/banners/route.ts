import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { verifyAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch all banners - the admin panel will categorize them client-side
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 }).lean();

    return NextResponse.json({ status: 200, data: banners });
  } catch (error) {
    console.error('Admin Banners GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { imageUrl, title, description, link, order, isActive, type, category } = body;

    if (!imageUrl) {
      return NextResponse.json({ status: 400, error: 'Image URL is required' }, { status: 400 });
    }

    // If type is 'product', category is required
    if (type === 'product' && !category) {
      return NextResponse.json({ status: 400, error: 'Category is required for product banners' }, { status: 400 });
    }

    const banner = await Banner.create({
      imageUrl,
      title: title || '',
      description: description || '',
      link: link || '',
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      type: type || 'home',
      category: type === 'product' ? category : '',
    });

    return NextResponse.json({ status: 201, data: banner, message: 'Banner created successfully' });
  } catch (error) {
    console.error('Admin Banners POST error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to create banner' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ status: 400, error: 'Missing banner id' }, { status: 400 });
    }

    // If type is 'product', ensure category is set
    if (updateData.type === 'product' && !updateData.category) {
      return NextResponse.json({ status: 400, error: 'Category is required for product banners' }, { status: 400 });
    }

    // If type is 'home', clear category
    if (updateData.type === 'home') {
      updateData.category = '';
    }

    const banner = await Banner.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!banner) {
      return NextResponse.json({ status: 404, error: 'Banner not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 200, data: banner, message: 'Banner updated successfully' });
  } catch (error) {
    console.error('Admin Banners PUT error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ status: 400, error: 'Missing banner id' }, { status: 400 });
    }

    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return NextResponse.json({ status: 404, error: 'Banner not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 200, data: { message: 'Banner deleted successfully' } });
  } catch (error) {
    console.error('Admin Banners DELETE error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to delete banner' }, { status: 500 });
  }
}
