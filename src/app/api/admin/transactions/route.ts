import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Product from '@/models/Product';
import { verifyAdmin } from '@/lib/auth';
import { notifyTransactionSuccess, notifyTransactionExpired, notifyTransactionCancel } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter: any = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { cashifyTransactionId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('productId', 'name slug images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      status: 200,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin Transactions GET error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ status: 400, error: 'Missing required fields: id, status' }, { status: 400 });
    }

    const validStatuses = ['pending', 'paid', 'success', 'expired', 'cancel'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ status: 400, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const updateData: any = { status };

    if (status === 'paid') {
      updateData.paidAt = new Date();
    }
    if (status === 'cancel') {
      updateData.canceledAt = new Date();
    }

    const transaction = await Transaction.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate('productId', 'name slug images');

    if (!transaction) {
      return NextResponse.json({ status: 404, error: 'Transaction not found' }, { status: 404 });
    }

    // If marking as paid/success, also mark the product as sold
    if ((status === 'paid' || status === 'success') && transaction.productId) {
      const productId = typeof transaction.productId === 'object' 
        ? (transaction.productId as any)._id 
        : transaction.productId;
      await Product.findByIdAndUpdate(productId, { isSold: true });
      
      // Send success notification (to user: success, to admin: success)
      try {
        await notifyTransactionSuccess(transaction);
      } catch (e) {
        console.error('Failed to send success notification:', e);
      }
    }

    // If expired, send notification (to user: expired, to admin: expired)
    if (status === 'expired') {
      try {
        await notifyTransactionExpired(transaction);
      } catch (e) {
        console.error('Failed to send expired notification:', e);
      }
    }

    // If cancelled, send notification (to admin only: cancel)
    if (status === 'cancel') {
      try {
        await notifyTransactionCancel(transaction);
      } catch (e) {
        console.error('Failed to send cancel notification:', e);
      }
    }

    return NextResponse.json({
      status: 200,
      data: transaction,
      message: 'Transaction status updated successfully',
    });
  } catch (error) {
    console.error('Admin Transactions PUT error:', error);
    return NextResponse.json({ status: 500, error: 'Failed to update transaction' }, { status: 500 });
  }
}
