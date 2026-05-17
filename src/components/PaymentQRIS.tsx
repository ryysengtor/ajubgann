"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountdownTimer from "@/components/CountdownTimer";
import { formatRupiah } from "@/components/ProductCard";
import {
  Download,
  Copy,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Clock,
  X,
  AlertCircle,
  PartyPopper,
  QrCode,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";

type PaymentStatus = "pending" | "paid" | "success" | "expired" | "cancel";

interface PaymentQRISProps {
  transactionId: string;
  qrImageUrl: string;
  totalAmount: number;
  originalAmount: number;
  uniqueNominal: number;
  expiredAt: string;
  productName: string;
  productImage?: string;
  initialStatus?: PaymentStatus;
  onClose?: () => void;
  adminWhatsappNumber?: string;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function PaymentQRIS({
  transactionId,
  qrImageUrl,
  totalAmount,
  originalAmount,
  uniqueNominal,
  expiredAt,
  productName,
  productImage,
  initialStatus = "pending",
  onClose,
  adminWhatsappNumber,
}: PaymentQRISProps) {
  const [status, setStatus] = useState<PaymentStatus>(initialStatus);
  const [isChecking, setIsChecking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch("/api/payment/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
      const data = await res.json();
      if (data.data?.status) {
        const newStatus = data.data.status as PaymentStatus;
        setStatus(newStatus);
        if (newStatus === "paid" || newStatus === "success") {
          setShowConfetti(true);
          toast.success("Pembayaran berhasil! 🎉");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else if (newStatus === "expired" || newStatus === "cancel") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    } catch {
      toast.error("Gagal mengecek status pembayaran");
    } finally {
      setIsChecking(false);
    }
  }, [transactionId]);

  useEffect(() => {
    if (status === "pending") {
      pollingRef.current = setInterval(checkStatus, 3000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [status, checkStatus]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch("/api/payment/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("cancel");
        toast.success("Transaksi dibatalkan");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else {
        toast.error(data.error || "Gagal membatalkan transaksi");
      }
    } catch {
      toast.error("Gagal membatalkan transaksi");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCopyNominal = () => {
    navigator.clipboard.writeText(String(totalAmount));
    toast.success("Nominal disalin!");
  };

  const handleCopyTransactionId = () => {
    navigator.clipboard.writeText(transactionId);
    toast.success("ID Transaksi disalin!");
  };

  const handleCopyTransactionIdSuccess = () => {
    navigator.clipboard.writeText(transactionId);
    setCopiedTx(true);
    toast.success("Kode transaksi disalin!");
    setTimeout(() => setCopiedTx(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `QRIS-${transactionId}.png`;
    link.click();
    toast.success("QR Code diunduh!");
  };

  const handleExpired = () => {
    if (status === "pending") {
      setStatus("expired");
    }
  };

  const buildWhatsAppUrl = () => {
    const message = `Halo admin, saya sudah melakukan pembayaran untuk akun ${productName} dengan kode transaksi ${transactionId}. Mohon kirim data akun saya. Terima kasih!`;
    return `https://wa.me/${adminWhatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const statusConfig: Record<
    PaymentStatus,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    pending: {
      label: "Menunggu Pembayaran",
      icon: <Clock className="h-4 w-4" />,
      color: "text-amber-500",
    },
    paid: {
      label: "Pembayaran Berhasil",
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-emerald-500",
    },
    success: {
      label: "Transaksi Sukses",
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-emerald-500",
    },
    expired: {
      label: "Waktu Habis",
      icon: <AlertCircle className="h-4 w-4" />,
      color: "text-red-500",
    },
    cancel: {
      label: "Dibatalkan",
      icon: <X className="h-4 w-4" />,
      color: "text-gray-500",
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {status === "pending" ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Product Info with 1:1 Image */}
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-primary/10 aspect-square">
                {productImage ? (
                  <img src={productImage} alt={productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">🎮</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{productName}</p>
                <Badge variant="secondary" className={`${currentStatus.color} gap-1 mt-1`}>
                  {currentStatus.icon}
                  <span className="hidden sm:inline">{currentStatus.label}</span>
                </Badge>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-xl border-2 border-dashed border-primary/20 bg-white p-2.5 sm:p-3">
                <img
                  src={qrImageUrl}
                  alt="QRIS Payment Code"
                  className="h-48 w-48 sm:h-56 sm:w-56 object-contain"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <QrCode className="h-3.5 w-3.5" />
                <span>Scan dengan e-wallet atau mobile banking</span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-center rounded-xl bg-primary/5 border border-primary/10 p-3 sm:p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Pembayaran</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {formatRupiah(totalAmount)}
              </p>
              {uniqueNominal > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Harga: {formatRupiah(originalAmount)} + Unik: {formatRupiah(uniqueNominal)}
                </p>
              )}
            </div>

            {/* Transaction ID */}
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-xs text-muted-foreground">ID Transaksi</span>
              <button
                onClick={handleCopyTransactionId}
                className="flex items-center gap-1.5 text-xs font-mono hover:text-primary transition-colors"
              >
                {transactionId}
                <Copy className="h-3 w-3" />
              </button>
            </div>

            {/* Countdown */}
            <CountdownTimer expiredAt={expiredAt} onExpired={handleExpired} />

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadQR} className="gap-1.5 h-10">
                <Download className="h-3.5 w-3.5" />
                Unduh QR
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyNominal} className="gap-1.5 h-10">
                <Copy className="h-3.5 w-3.5" />
                Salin Nominal
              </Button>
              <Button variant="outline" size="sm" onClick={checkStatus} disabled={isChecking} className="gap-1.5 h-10">
                <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
                Cek Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isCancelling}
                className="gap-1.5 h-10 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Batalkan
              </Button>
            </div>

            <p className="text-center text-[10px] sm:text-xs text-muted-foreground">
              Pembayaran akan otomatis diverifikasi setelah scan QR
            </p>
          </motion.div>
        ) : status === "paid" || status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-4 sm:py-6"
          >
            {/* Big celebration icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
              className="relative"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/30">
                <PartyPopper className="h-12 w-12 text-white" />
              </div>
              {/* Pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-emerald-400"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                Pembayaran Berhasil! 🎉
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Terima kasih, pembayaran kamu sudah dikonfirmasi
              </p>
            </motion.div>

            {/* Transaction ID */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center"
            >
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mb-0.5">Kode Transaksi</p>
              <p className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300 tracking-wide">
                {transactionId}
              </p>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 p-3 w-full"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-emerald-100 dark:bg-emerald-900/40 aspect-square">
                {productImage ? (
                  <img src={productImage} alt={productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl">🎮</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400 truncate">{productName}</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {formatRupiah(totalAmount)}
                </p>
              </div>
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </motion.div>

            {/* Instruction */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3"
            >
              <p className="text-sm text-amber-800 dark:text-amber-300 text-center leading-relaxed">
                <span className="font-semibold">📱 Langkah selanjutnya:</span><br />
                Silakan chat admin untuk mendapatkan data akun yang sudah di-order
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="w-full space-y-2.5"
            >
              {/* WhatsApp Button */}
              {adminWhatsappNumber && (
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full"
                >
                  <Button
                    className="gap-2 w-full h-12 text-base font-semibold bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg shadow-green-500/25"
                    size="lg"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    Chat Admin via WhatsApp
                  </Button>
                </a>
              )}

              {/* Copy Transaction ID Button */}
              <Button
                variant="outline"
                onClick={handleCopyTransactionIdSuccess}
                className="gap-2 w-full h-10 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                {copiedTx ? (
                  <>
                    <CheckCheck className="h-4 w-4" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Salin Kode Transaksi
                  </>
                )}
              </Button>
            </motion.div>

            {/* Selesai Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="w-full"
            >
              {onClose && (
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="gap-1.5 w-full h-10"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Selesai
                </Button>
              )}
            </motion.div>

            {/* Confetti */}
            {showConfetti && (
              <div className="pointer-events-none fixed inset-0 z-50">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      backgroundColor: ["#10b981", "#f59e0b", "#14b8a6", "#ec4899", "#8b5cf6", "#06b6d4", "#25D366"][
                        Math.floor(Math.random() * 7)
                      ],
                      borderRadius: Math.random() > 0.5 ? "50%" : "0",
                      width: `${6 + Math.random() * 8}px`,
                      height: `${6 + Math.random() * 8}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="expired-cancel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-4 sm:py-6"
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${
                status === "expired" ? "bg-red-100 dark:bg-red-900/20" : "bg-gray-100 dark:bg-gray-800/20"
              }`}
            >
              {status === "expired" ? (
                <AlertCircle className="h-8 w-8 text-red-500" />
              ) : (
                <X className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold">
                {status === "expired" ? "Waktu Pembayaran Habis" : "Transaksi Dibatalkan"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {status === "expired" ? "Silakan buat transaksi baru" : "Transaksi telah dibatalkan"}
              </p>
            </div>
            <div className="rounded-lg border px-3 py-2 text-center w-full">
              <p className="text-xs text-muted-foreground">ID Transaksi</p>
              <p className="font-mono text-xs">{transactionId}</p>
            </div>
            {onClose && (
              <Button onClick={onClose} variant="outline" className="w-full">
                Tutup
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
