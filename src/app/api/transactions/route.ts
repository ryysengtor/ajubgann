import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Product from '@/models/Product';
import QRCode from 'qrcode';
import { notifyTransactionPending } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');
    const phone = searchParams.get('phone');

    if (!transactionId && !phone) {
      return NextResponse.json(
        { status: 400, error: 'Provide transactionId or phone parameter' },
        { status: 400 }
      );
    }

    const filter: any = {};
    if (transactionId) {
      filter.$or = [
        { transactionId },
        { cashifyTransactionId: transactionId },
      ];
    }
    if (phone) {
      filter.$or = [
        { customerPhone: phone },
        { customerWhatsapp: phone },
      ];
    }

    const transactions = await Transaction.find(filter)
      .populate('productId', 'name slug images')
      .sort({ createdAt: -1 })
      .lean();

    if (!transactions.length) {
      return NextResponse.json(
        { status: 404, error: 'No transactions found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 200,
      data: transactions.length === 1 ? transactions[0] : transactions,
    });
  } catch (error) {
    console.error('Transaction GET error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      productId,
      customerName,
      customerPhone,
      customerEmail,
      customerWhatsapp,
    } = body;

    // Validate required fields
    if (!productId || !customerName || !customerPhone) {
      return NextResponse.json(
        { status: 400, error: 'Missing required fields: productId, customerName, customerPhone' },
        { status: 400 }
      );
    }

    // Find the product
    const product = await Product.findById(productId).populate('category', 'name slug');
    if (!product) {
      return NextResponse.json(
        { status: 404, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.isActive || product.isSold) {
      return NextResponse.json(
        { status: 400, error: 'This account is not available for purchase' },
        { status: 400 }
      );
    }

    const originalAmount = product.price;

    // Generate QRIS via Cashify
    const cashifyRes = await fetch('https://cashify.my.id/api/generate/qris', {
      method: 'POST',
      headers: {
        'x-license-key': process.env.CASHIFY_LICENSE_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: process.env.CASHIFY_QR_ID,
        amount: originalAmount,
        useUniqueCode: true,
        packageIds: ['com.orderkuota.app'],
        expiredInMinutes: 15,
      }),
    });

    const cashifyData = await cashifyRes.json();

    if (!cashifyRes.ok || !cashifyData.data) {
      console.error('Cashify QRIS generation failed:', cashifyData);
      return NextResponse.json(
        { status: 500, error: 'Failed to generate QRIS payment', details: cashifyData },
        { status: 500 }
      );
    }

    const {
      transactionId: cashifyTransactionId,
      qr_string,
      totalAmount,
      uniqueNominal,
      expiredAt: cashifyExpiredAt,
    } = cashifyData.data;

    // Use qr_string from Cashify response
    const qrString = typeof qr_string === 'string' && qr_string.length > 0
      ? qr_string
      : (typeof cashifyData.data.qrString === 'string' && cashifyData.data.qrString.length > 0
          ? cashifyData.data.qrString
          : '');

    if (!qrString) {
      console.error('Cashify did not return qr_string:', JSON.stringify(cashifyData.data));
      return NextResponse.json(
        { status: 500, error: 'QR string not received from payment gateway' },
        { status: 500 }
      );
    }

    const expiredAt = cashifyExpiredAt ? new Date(cashifyExpiredAt) : new Date(Date.now() + 15 * 60 * 1000);

    // Generate QR image
    const qrImageUrl = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
    });

    // Use Cashify transactionId as the primary transaction ID
    const transactionId = cashifyTransactionId;

    // Get first product image
    const productImage = product.images && product.images.length > 0 ? product.images[0] : '';

    // Save transaction
    const transaction = await Transaction.create({
      transactionId,
      cashifyTransactionId,
      productId: product._id,
      productName: product.name,
      productImage,
      customerName,
      customerEmail: customerEmail || '',
      customerPhone,
      customerWhatsapp: customerWhatsapp || customerPhone,
      originalAmount,
      totalAmount,
      uniqueNominal: uniqueNominal || 0,
      status: 'pending',
      qrString,
      qrImageUrl,
      expiredAt,
    });

    // Send notifications
    await notifyTransactionPending(transaction);

    return NextResponse.json({
      status: 201,
      data: {
        transactionId: transaction.transactionId,
        qrString,
        qrImageUrl,
        totalAmount,
        originalAmount,
        uniqueNominal: uniqueNominal || 0,
        expiredAt,
        productName: product.name,
        productImage,
        price: product.price,
      },
    });
  } catch (error) {
    console.error('Transaction POST error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
