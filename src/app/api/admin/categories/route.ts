import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
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

    const categories = await Category.find()
      .sort({ order: 1, name: 1 })
      .lean();

    return NextResponse.json({
      status: 200,
      data: categories,
    });
  } catch (error) {
    console.error('Admin Categories GET error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json(
        { status: 401, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { name, slug, icon, description, order, isActive, image, accentColor, bgColor, bannerColor, glowColor, borderColor, theme } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { status: 400, error: 'Missing required fields: name, slug' },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { status: 400, error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }

    const category = await Category.create({
      name,
      slug,
      icon: icon || '🎮',
      image: image || '',
      description: description || '',
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      accentColor: accentColor || '#ff2d2d',
      bgColor: bgColor || '#170000',
      bannerColor: bannerColor || '#ff2d2d',
      glowColor: glowColor || 'rgba(255,45,45,0.3)',
      borderColor: borderColor || 'rgba(255,80,80,0.35)',
      theme: theme || 'default',
    });

    return NextResponse.json({
      status: 201,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Admin Categories POST error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to create category' },
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { status: 400, error: 'Missing category id' },
        { status: 400 }
      );
    }

    // If slug is being updated, check for duplicates
    if (updateData.slug) {
      const existing = await Category.findOne({ slug: updateData.slug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { status: 400, error: 'Category with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return NextResponse.json(
        { status: 404, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 200,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Admin Categories PUT error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json(
        { status: 401, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { status: 400, error: 'Missing category id' },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { status: 404, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 200,
      data: { message: 'Category deleted successfully' },
    });
  } catch (error) {
    console.error('Admin Categories DELETE error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
