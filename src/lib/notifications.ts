import { ITransaction } from '@/models/Transaction';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

const FONNTE_API_KEY = process.env.FONNTE_API_KEY || '';
const FONNTE_ADMIN_NUMBER = process.env.FONNTE_ADMIN_NUMBER || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '';

// ─── Real-time Settings Fetcher ─────────────────────────────────────
// ALWAYS fetches the latest settings from DB at the moment of sending
// This ensures toggles take effect IMMEDIATELY (real-time)

interface NotificationSettings {
  siteName: string;
  logoUrl: string;
  notifyWhatsApp: boolean;
  notifyTelegram: boolean;
  notifyOnPending: boolean;
  notifyOnSuccess: boolean;
  notifyOnExpired: boolean;
  notifyOnCancel: boolean;
}

async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    await connectDB();
    const settings = await Settings.findOne().lean();

    if (!settings) {
      // Default: all enabled if no settings document exists
      return {
        siteName: 'Craig Of The Creek',
        logoUrl: '/logo.svg',
        notifyWhatsApp: true,
        notifyTelegram: true,
        notifyOnPending: true,
        notifyOnSuccess: true,
        notifyOnExpired: true,
        notifyOnCancel: true,
      };
    }

    return {
      siteName: settings.siteName || 'Craig Of The Creek',
      logoUrl: settings.logoUrl || '/logo.svg',
      notifyWhatsApp: settings.notifyWhatsApp ?? true,
      notifyTelegram: settings.notifyTelegram ?? true,
      notifyOnPending: settings.notifyOnPending ?? true,
      notifyOnSuccess: settings.notifyOnSuccess ?? true,
      notifyOnExpired: settings.notifyOnExpired ?? true,
      notifyOnCancel: settings.notifyOnCancel ?? true,
    };
  } catch (error) {
    console.error('Failed to fetch notification settings, defaulting to all enabled:', error);
    return {
      siteName: 'Craig Of The Creek',
      logoUrl: '/logo.svg',
      notifyWhatsApp: true,
      notifyTelegram: true,
      notifyOnPending: true,
      notifyOnSuccess: true,
      notifyOnExpired: true,
      notifyOnCancel: true,
    };
  }
}

// ─── Core Senders ───────────────────────────────────────────────────

export async function sendWhatsAppNotification(target: string, message: string): Promise<void> {
  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: FONNTE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target, message, type: 'text' }),
    });
    const data = await res.json();
    if (!data.status) {
      console.error('WhatsApp notification failed:', data);
    }
  } catch (error) {
    console.error('WhatsApp notification error:', error);
  }
}

export async function sendTelegramNotification(message: string): Promise<void> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_ADMIN_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram notification failed:', data);
    }
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
}

export async function sendTelegramPhoto(photoUrl: string, caption: string): Promise<void> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_ADMIN_ID,
          photo: photoUrl,
          caption,
          parse_mode: 'HTML',
        }),
      }
    );
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram photo failed:', data);
    }
  } catch (error) {
    console.error('Telegram photo error:', error);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getTransactionEmoji(status: string): string {
  switch (status) {
    case 'pending': return '⏳';
    case 'paid': case 'success': return '✅';
    case 'expired': return '⏰';
    case 'cancel': return '❌';
    default: return '📋';
  }
}

// ─── ADMIN Notifications (WhatsApp + Telegram) ─────────────────────
// Admin receives ALL: Pending, Success, Expired, Cancel
// Format: Unique and cool with rich formatting

function buildAdminWhatsAppMessage(tx: ITransaction, status: 'pending' | 'success' | 'expired' | 'cancel', siteName: string): string {
  const emoji = getTransactionEmoji(status);
  const statusLabels: Record<string, string> = {
    pending: 'MENUNGGU PEMBAYARAN',
    success: 'PEMBAYARAN BERHASIL',
    expired: 'PESANAN EXPIRED',
    cancel: 'PESANAN DIBATALKAN',
  };

  const divider = '━━━━━━━━━━━━━━━━━━';
  const statusLabel = statusLabels[status];

  let extraInfo = '';
  if (status === 'pending') {
    extraInfo = `
💳 *Scan QRIS untuk melihat pembayaran*
🚀 Segera konfirmasi setelah customer bayar!`;
  } else if (status === 'success') {
    extraInfo = `
🚀 *AKSI: Segera kirim detail akun ke customer!*
📱 WA Customer: ${tx.customerWhatsapp || tx.customerPhone}`;
  } else if (status === 'expired') {
    extraInfo = `
ℹ️ Pesanan otomatis expired karena melewati batas waktu pembayaran.`;
  } else if (status === 'cancel') {
    extraInfo = `
ℹ️ Pesanan telah dibatalkan.`;
  }

  return `${emoji} *${statusLabel}* ${emoji}

${divider}
🎮 *${siteName} - Admin Alert*
${divider}

📋 *Detail Transaksi:*
┣ 🏷️ ID: *${tx.transactionId}*
┣ 🎯 Akun: *${tx.productName}*
┣ 👤 Customer: *${tx.customerName}*
┣ 📱 Telepon: ${tx.customerPhone}
${tx.customerWhatsapp && tx.customerWhatsapp !== tx.customerPhone ? `┣ 💬 WhatsApp: ${tx.customerWhatsapp}` : ''}
${tx.customerEmail ? `┣ 📧 Email: ${tx.customerEmail}` : ''}
┣ 💰 Total: *${formatCurrency(tx.totalAmount)}*
${tx.uniqueNominal ? `┣ 🔢 Kode Unik: ${formatCurrency(tx.uniqueNominal)}` : ''}
┣ 📅 Dibuat: ${formatDate(tx.createdAt)}
${status === 'success' && tx.paidAt ? `┗ ✅ Dibayar: ${formatDate(tx.paidAt)}` : `┗ ⏰ Expired: ${formatDate(tx.expiredAt)}`}

${divider}${extraInfo}

⚡ _Powered by ${siteName}_`;
}

function buildAdminTelegramMessage(tx: ITransaction, status: 'pending' | 'success' | 'expired' | 'cancel', siteName: string): string {
  const emoji = getTransactionEmoji(status);
  const statusLabels: Record<string, string> = {
    pending: 'MENUNGGU PEMBAYARAN',
    success: 'PEMBAYARAN BERHASIL',
    expired: 'PESANAN EXPIRED',
    cancel: 'PESANAN DIBATALKAN',
  };

  const statusLabel = statusLabels[status];

  let extraInfo = '';
  if (status === 'pending') {
    extraInfo = '\n💳 Scan QRIS untuk melihat pembayaran\n🚀 Segera konfirmasi setelah customer bayar!';
  } else if (status === 'success') {
    extraInfo = '\n🚀 <b>AKSI: Segera kirim detail akun ke customer!</b>\n📱 WA Customer: ' + (tx.customerWhatsapp || tx.customerPhone);
  } else if (status === 'expired') {
    extraInfo = '\nℹ️ Pesanan otomatis expired karena melewati batas waktu pembayaran.';
  } else if (status === 'cancel') {
    extraInfo = '\nℹ️ Pesanan telah dibatalkan.';
  }

  return `${emoji} <b>${statusLabel}</b> ${emoji}

━━━━━━━━━━━━━━━━━━━━
🎮 <b>${siteName} - Admin Alert</b>
━━━━━━━━━━━━━━━━━━━━

📋 <b>Detail Transaksi:</b>
┣ 🏷️ ID: <code>${tx.transactionId}</code>
┣ 🎯 Akun: <b>${tx.productName}</b>
┣ 👤 Customer: <b>${tx.customerName}</b>
┣ 📱 Telepon: ${tx.customerPhone}
${tx.customerWhatsapp && tx.customerWhatsapp !== tx.customerPhone ? `┣ 💬 WhatsApp: ${tx.customerWhatsapp}` : ''}
${tx.customerEmail ? `┣ 📧 Email: ${tx.customerEmail}` : ''}
┣ 💰 Total: <b>${formatCurrency(tx.totalAmount)}</b>
${tx.uniqueNominal ? `┣ 🔢 Kode Unik: ${formatCurrency(tx.uniqueNominal)}` : ''}
┣ 📅 Dibuat: ${formatDate(tx.createdAt)}
${status === 'success' && tx.paidAt ? `┗ ✅ Dibayar: ${formatDate(tx.paidAt)}` : `┗ ⏰ Expired: ${formatDate(tx.expiredAt)}`}
${extraInfo}

━━━━━━━━━━━━━━━━━━━━
⚡ <i>Powered by ${siteName}</i>`;
}

// ─── USER Notifications (WhatsApp only) ────────────────────────────
// User receives ONLY: Success and Expired

function buildUserSuccessMessage(tx: ITransaction, siteName: string): string {
  return `🎉 *PEMBAYARAN BERHASIL!* 🎉

━━━━━━━━━━━━━━━━━━━━
🎮 *${siteName}*
━━━━━━━━━━━━━━━━━━━━

Halo *${tx.customerName}*! 🙌

Pembayaran kamu telah *BERHASIL* dikonfirmasi! ✅

📋 *Detail Pesanan:*
┣ 🏷️ ID: *${tx.transactionId}*
┣ 🎯 Akun: *${tx.productName}*
┣ 💰 Total Bayar: *${formatCurrency(tx.totalAmount)}*
┗ ✅ Status: *BERHASIL*

🚀 *Akun game akan segera dikirim ke WhatsApp kamu oleh admin.*

Terima kasih sudah berbelanja di ${siteName}! 🎮

⚡ _Powered by ${siteName}_`;
}

function buildUserExpiredMessage(tx: ITransaction, siteName: string): string {
  return `⏰ *PESANAN EXPIRED* ⏰

━━━━━━━━━━━━━━━━━━━━
🎮 *${siteName}*
━━━━━━━━━━━━━━━━━━━━

Halo *${tx.customerName}*,

Pesanan kamu telah *EXPIRED* karena belum dibayar dalam batas waktu. 😔

📋 *Detail Pesanan:*
┣ 🏷️ ID: *${tx.transactionId}*
┣ 🎯 Akun: *${tx.productName}*
┣ 💰 Total: *${formatCurrency(tx.totalAmount)}*
┗ ❌ Status: *EXPIRED*

💡 Jika ingin membeli akun lagi, silakan buat pesanan baru di website kami.

Terima kasih! 🙏

⚡ _Powered by ${siteName}_`;
}

// ─── Public Notification Functions (Real-time Settings Check) ────────
// Each function fetches the LATEST settings from DB at the moment of sending.
// This means toggling a setting OFF in admin panel takes effect IMMEDIATELY.
// No restart, no cache, no delay — fully real-time.

export async function notifyTransactionPending(transaction: ITransaction): Promise<void> {
  // Fetch latest settings in real-time
  const settings = await getNotificationSettings();

  // Check: is Pending notification enabled?
  if (!settings.notifyOnPending) {
    console.log('[Notification] Pending notification SKIPPED — notifyOnPending is OFF');
    return;
  }

  // Build messages with dynamic siteName
  const adminWhatsApp = buildAdminWhatsAppMessage(transaction, 'pending', settings.siteName);
  const adminTelegram = buildAdminTelegramMessage(transaction, 'pending', settings.siteName);

  // Send to admin via WhatsApp (if channel enabled)
  if (settings.notifyWhatsApp) {
    await sendWhatsAppNotification(FONNTE_ADMIN_NUMBER, adminWhatsApp);
  } else {
    console.log('[Notification] Admin WhatsApp SKIPPED — notifyWhatsApp is OFF');
  }

  // Send to admin via Telegram (if channel enabled)
  if (settings.notifyTelegram) {
    if (transaction.qrImageUrl) {
      await sendTelegramPhoto(transaction.qrImageUrl, adminTelegram);
    } else {
      await sendTelegramNotification(adminTelegram);
    }
  } else {
    console.log('[Notification] Admin Telegram SKIPPED — notifyTelegram is OFF');
  }

  // NOTE: User does NOT receive pending notification (only Success & Expired)
}

export async function notifyTransactionSuccess(transaction: ITransaction): Promise<void> {
  // Fetch latest settings in real-time
  const settings = await getNotificationSettings();

  // Check: is Success notification enabled?
  if (!settings.notifyOnSuccess) {
    console.log('[Notification] Success notification SKIPPED — notifyOnSuccess is OFF');
    return;
  }

  // ─── User receives Success notification (WhatsApp only) ───
  if (settings.notifyWhatsApp && (transaction.customerWhatsapp || transaction.customerPhone)) {
    const userMessage = buildUserSuccessMessage(transaction, settings.siteName);
    await sendWhatsAppNotification(transaction.customerWhatsapp || transaction.customerPhone, userMessage);
  } else {
    console.log('[Notification] User WhatsApp SKIPPED — notifyWhatsApp is OFF or no phone number');
  }

  // ─── Admin receives Success notification ───
  const adminWhatsApp = buildAdminWhatsAppMessage(transaction, 'success', settings.siteName);
  const adminTelegram = buildAdminTelegramMessage(transaction, 'success', settings.siteName);

  if (settings.notifyWhatsApp) {
    await sendWhatsAppNotification(FONNTE_ADMIN_NUMBER, adminWhatsApp);
  } else {
    console.log('[Notification] Admin WhatsApp SKIPPED — notifyWhatsApp is OFF');
  }

  if (settings.notifyTelegram) {
    await sendTelegramNotification(adminTelegram);
  } else {
    console.log('[Notification] Admin Telegram SKIPPED — notifyTelegram is OFF');
  }
}

export async function notifyTransactionExpired(transaction: ITransaction): Promise<void> {
  // Fetch latest settings in real-time
  const settings = await getNotificationSettings();

  // Check: is Expired notification enabled?
  if (!settings.notifyOnExpired) {
    console.log('[Notification] Expired notification SKIPPED — notifyOnExpired is OFF');
    return;
  }

  // ─── User receives Expired notification (WhatsApp only) ───
  if (settings.notifyWhatsApp && (transaction.customerWhatsapp || transaction.customerPhone)) {
    const userMessage = buildUserExpiredMessage(transaction, settings.siteName);
    await sendWhatsAppNotification(transaction.customerWhatsapp || transaction.customerPhone, userMessage);
  } else {
    console.log('[Notification] User WhatsApp SKIPPED — notifyWhatsApp is OFF or no phone number');
  }

  // ─── Admin receives Expired notification ───
  const adminWhatsApp = buildAdminWhatsAppMessage(transaction, 'expired', settings.siteName);
  const adminTelegram = buildAdminTelegramMessage(transaction, 'expired', settings.siteName);

  if (settings.notifyWhatsApp) {
    await sendWhatsAppNotification(FONNTE_ADMIN_NUMBER, adminWhatsApp);
  } else {
    console.log('[Notification] Admin WhatsApp SKIPPED — notifyWhatsApp is OFF');
  }

  if (settings.notifyTelegram) {
    await sendTelegramNotification(adminTelegram);
  } else {
    console.log('[Notification] Admin Telegram SKIPPED — notifyTelegram is OFF');
  }
}

export async function notifyTransactionCancel(transaction: ITransaction): Promise<void> {
  // Fetch latest settings in real-time
  const settings = await getNotificationSettings();

  // Check: is Cancel notification enabled?
  if (!settings.notifyOnCancel) {
    console.log('[Notification] Cancel notification SKIPPED — notifyOnCancel is OFF');
    return;
  }

  // ─── Admin receives Cancel notification ───
  const adminWhatsApp = buildAdminWhatsAppMessage(transaction, 'cancel', settings.siteName);
  const adminTelegram = buildAdminTelegramMessage(transaction, 'cancel', settings.siteName);

  if (settings.notifyWhatsApp) {
    await sendWhatsAppNotification(FONNTE_ADMIN_NUMBER, adminWhatsApp);
  } else {
    console.log('[Notification] Admin WhatsApp SKIPPED — notifyWhatsApp is OFF');
  }

  if (settings.notifyTelegram) {
    await sendTelegramNotification(adminTelegram);
  } else {
    console.log('[Notification] Admin Telegram SKIPPED — notifyTelegram is OFF');
  }

  // NOTE: User does NOT receive cancel notification
}
