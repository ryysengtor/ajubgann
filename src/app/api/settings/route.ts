import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET() {
  try {
    await connectDB();

    let settings = await Settings.findOne().lean();

    if (!settings) {
      settings = await Settings.create({});
    }

    // Only return public fields (no notification settings, etc.)
    const publicSettings = {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      siteSlogan: settings.siteSlogan,
      logoUrl: settings.logoUrl,
      whatsappNumber: settings.whatsappNumber,
      telegramUsername: settings.telegramUsername,
      instagramUrl: settings.instagramUrl,
      tiktokUrl: settings.tiktokUrl,
      youtubeUrl: settings.youtubeUrl,
      facebookUrl: settings.facebookUrl,
      twitterUrl: settings.twitterUrl,
      maintenanceMode: settings.maintenanceMode,
    };

    return NextResponse.json({
      status: 200,
      data: publicSettings,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
