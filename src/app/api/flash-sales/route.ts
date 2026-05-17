import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FlashSale from '@/models/FlashSale';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';

    const now = new Date();

    const filter = {
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    };

    let sales = await FlashSale.find(filter).lean();

    if (includeProducts && sales.length > 0) {
      // Populate productIds with product data for each sale
      const salesWithProducts = await Promise.all(
        sales.map(async (sale) => {
          const products = await Product.find({
            _id: { $in: sale.productIds },
          })
            .select('name images price slug isSold')
            .lean();

          return {
            ...sale,
            products,
          };
        })
      );

      return NextResponse.json({ data: salesWithProducts });
    }

    return NextResponse.json({ data: sales });
  } catch (error) {
    console.error('Flash Sales GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flash sales' },
      { status: 500 }
    );
  }
}
