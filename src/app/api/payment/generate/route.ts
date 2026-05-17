import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, expiredInMinutes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { status: 400, error: 'Missing or invalid amount' },
        { status: 400 }
      );
    }

    const expiresInMin = expiredInMinutes || 15;

    // Generate QRIS via Cashify
    const cashifyRes = await fetch('https://cashify.my.id/api/generate/qris', {
      method: 'POST',
      headers: {
        'x-license-key': process.env.CASHIFY_LICENSE_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: process.env.CASHIFY_QR_ID,
        amount,
        useUniqueCode: true,
        packageIds: ['com.orderkuota.app'],
        expiredInMinutes: expiresInMin,
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
      expiredAt,
    } = cashifyData.data;

    // Use qr_string from Cashify response (API uses snake_case)
    const qrString = qr_string || '';

    if (!qrString) {
      return NextResponse.json(
        { status: 500, error: 'QR string not received from payment gateway' },
        { status: 500 }
      );
    }

    // Generate QR image as data URL
    const qrImageUrl = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
    });

    return NextResponse.json({
      status: 200,
      data: {
        transactionId: cashifyTransactionId,
        qrString,
        qrImageUrl,
        totalAmount,
        originalAmount: amount,
        uniqueNominal: uniqueNominal || 0,
        expiredAt,
      },
    });
  } catch (error) {
    console.error('Payment generate error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to generate QRIS payment' },
      { status: 500 }
    );
  }
}
