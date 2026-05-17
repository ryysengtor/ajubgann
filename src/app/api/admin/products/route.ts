import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
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
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      filter.category = category;
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug icon image accentColor bgColor bannerColor glowColor borderColor theme')
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      status: 200,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin Products GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { name, slug, category, description, images, detailImages, specs, price, originalPrice, views, likes, isActive, isFeatured, isSold, order } = body;

    if (!name || !slug || !category || price === undefined) {
      return NextResponse.json(
        { status: 400, error: 'Missing required fields: name, slug, category, price' },
        { status: 400 }
      );
    }

    const existing = await Product.findOne({ slug });
    if (existing) {
      return NextResponse.json({ status: 400, error: 'Product with this slug already exists' }, { status: 400 });
    }

    const product = await Product.create({
      name,
      slug,
      category,
      description: description || '',
      images: images || [],
      detailImages: detailImages || [],
      specs: specs || [],
      price,
      originalPrice: originalPrice || undefined,
      views: views || 0,
      likes: likes || 0,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
      isSold: isSold || false,
      order: order || 0,
    });

    const populated = await product.populate('category', 'name slug icon image accentColor bgColor bannerColor glowColor borderColor theme');

    return NextResponse.json({
      status: 201,
      data: populated,
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Admin Products POST error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to create product' }, { status: 500 });
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
      return NextResponse.json({ status: 400, error: 'Missing product id' }, { status: 400 });
    }

    if (updateData.slug) {
      const existing = await Product.findOne({ slug: updateData.slug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ status: 400, error: 'Product with this slug already exists' }, { status: 400 });
      }
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug icon image accentColor bgColor bannerColor glowColor borderColor theme');

    if (!product) {
      return NextResponse.json({ status: 404, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 200,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Admin Products PUT error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to update product' }, { status: 500 });
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
      return NextResponse.json({ status: 400, error: 'Missing product id' }, { status: 400 });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json({ status: 404, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 200,
      data: { message: 'Product deleted successfully' },
    });
  } catch (error) {
    console.error('Admin Products DELETE error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to delete product' }, { status: 500 });
  }
}
