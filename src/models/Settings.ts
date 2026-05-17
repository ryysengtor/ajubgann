import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  siteDescription: string;
  siteSlogan: string;
  logoUrl: string;
  ogImageUrl: string;
  // Contact
  whatsappNumber: string;
  telegramUsername: string;
  // Social Media
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  // Notification Settings
  notifyWhatsApp: boolean;
  notifyTelegram: boolean;
  notifyOnPending: boolean;
  notifyOnSuccess: boolean;
  notifyOnExpired: boolean;
  notifyOnCancel: boolean;
  // General
  maintenanceMode: boolean;
  qrisExpiredMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    siteName: { type: String, default: 'Craig Of The Creek' },
    siteDescription: { type: String, default: 'Platform jual beli akun game terpercaya. Akun game berkualitas, harga bersahabat, bayar QRIS!' },
    siteSlogan: { type: String, default: 'Adventure Awaits, Dapatkan Akun Impianmu!' },
    logoUrl: { type: String, default: '/logo.svg' },
    ogImageUrl: { type: String, default: '' },
    // Contact
    whatsappNumber: { type: String, default: '6283856801224' },
    telegramUsername: { type: String, default: '@craigofthecreek' },
    // Social Media
    instagramUrl: { type: String, default: '' },
    tiktokUrl: { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },
    facebookUrl: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    // Notification Settings
    notifyWhatsApp: { type: Boolean, default: true },
    notifyTelegram: { type: Boolean, default: true },
    notifyOnPending: { type: Boolean, default: true },
    notifyOnSuccess: { type: Boolean, default: true },
    notifyOnExpired: { type: Boolean, default: true },
    notifyOnCancel: { type: Boolean, default: true },
    // General
    maintenanceMode: { type: Boolean, default: false },
    qrisExpiredMinutes: { type: Number, default: 15 },
  },
  { timestamps: true }
);

// Delete existing model to force schema recompilation in dev
if (mongoose.models.Settings) {
  delete mongoose.models.Settings;
}

export default mongoose.model<ISettings>('Settings', SettingsSchema);
