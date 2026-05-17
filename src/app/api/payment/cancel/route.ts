import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { notifyTransactionCancel } from '@/lib/notifications';

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
      return NextResponse.json(
        { status: 400, error: `Cannot cancel transaction with status: ${transaction.status}` },
        { status: 400 }
      );
    }

    // Cancel via Cashify
    const cashifyRes = await fetch('https://cashify.my.id/api/generate/cancel-status', {
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
      console.error('Cashify cancel failed:', cashifyData);
      return NextResponse.json(
        { status: 500, error: 'Failed to cancel transaction via Cashify', details: cashifyData },
        { status: 500 }
      );
    }

    // Update transaction status
    transaction.status = 'cancel';
    transaction.canceledAt = new Date();
    await transaction.save();

    // Send cancel notifications
    await notifyTransactionCancel(transaction);

    return NextResponse.json({
      status: 200,
      data: { status: 'cancel', message: 'Transaction cancelled successfully' },
    });
  } catch (error) {
    console.error('Cancel transaction error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to cancel transaction' },
      { status: 500 }
    );
  }
}
