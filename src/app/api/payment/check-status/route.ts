import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import {
  notifyTransactionSuccess,
  notifyTransactionExpired,
} from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { status: 400, error: 'Missing transactionId' },
        { status: 400 }
      );
    }

    // Find our transaction - support both old COTC-xxx format and new Cashify transactionId
    const transaction = await Transaction.findOne({
      $or: [
        { transactionId },
        { cashifyTransactionId: transactionId },
      ],
    });

    if (!transaction) {
      return NextResponse.json(
        { status: 404, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json({
        status: 200,
        data: { status: transaction.status, message: `Transaction already ${transaction.status}` },
      });
    }

    // Check status via Cashify
    const cashifyRes = await fetch('https://cashify.my.id/api/generate/check-status', {
      method: 'POST',
      headers: {
        'x-license-key': process.env.CASHIFY_LICENSE_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId: transaction.cashifyTransactionId || transaction.transactionId,
      }),
    });

    const cashifyData = await cashifyRes.json();

    if (!cashifyRes.ok) {
      console.error('Cashify check-status failed:', cashifyData);
      return NextResponse.json(
        { status: 500, error: 'Failed to check payment status', details: cashifyData },
        { status: 500 }
      );
    }

    const paymentStatus = cashifyData.data?.status || cashifyData.status;

    if (paymentStatus === 'paid') {
      transaction.status = 'paid';
      transaction.paidAt = new Date();
      await transaction.save();

      // Send success notifications
      await notifyTransactionSuccess(transaction);

      return NextResponse.json({
        status: 200,
        data: { status: 'paid', message: 'Payment confirmed successfully' },
      });
    }

    if (paymentStatus === 'expired') {
      transaction.status = 'expired';
      await transaction.save();

      // Send expired notifications
      await notifyTransactionExpired(transaction);

      return NextResponse.json({
        status: 200,
        data: { status: 'expired', message: 'Payment has expired' },
      });
    }

    return NextResponse.json({
      status: 200,
      data: { status: paymentStatus || 'pending', message: 'Payment still pending' },
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
