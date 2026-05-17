"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Check, X, Tag, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/components/ProductCard";

interface CouponInputProps {
  totalAmount: number;
  onDiscountApplied: (discount: number, couponCode: string, discountType: string) => void;
  theme: {
    accent: string;
    glow: string;
    border: string;
    btnFrom: string;
    btnTo: string;
  };
}

type CouponState = "idle" | "loading" | "success" | "error";

interface AppliedCoupon {
  code: string;
  discount: number;
  discountType: string;
  discountValue: number;
  description?: string;
}

export default function CouponInput({
  totalAmount,
  onDiscountApplied,
  theme,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [status, setStatus] = useState<CouponState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const handleApply = async () => {
    if (!couponCode.trim()) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch(
        `/api/coupons?code=${encodeURIComponent(couponCode.trim().toUpperCase())}&amount=${totalAmount}`
      );
      const data = await res.json();

      if (res.ok && data.data?.valid) {
        const coupon = data.data;
        setAppliedCoupon({
          code: coupon.code,
          discount: coupon.discount,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          description: coupon.description,
        });
        setStatus("success");
        onDiscountApplied(coupon.discount, coupon.code, coupon.discountType);
      } else {
        setStatus("error");
        setErrorMessage(data.error || data.data?.message || "Kode voucher tidak valid");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Gagal memvalidasi voucher");
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setStatus("idle");
    setErrorMessage("");
    onDiscountApplied(0, "", "");
  };

  return (
    <div
      className="w-full rounded-xl p-4"
      style={{
        background: "linear-gradient(135deg, #1a1a1a, #111)",
        border: `1px solid ${theme.border}`,
      }}
    >
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <Gift className="h-4 w-4" style={{ color: theme.accent }} />
        <span className="text-sm font-bold text-white">Kode Voucher</span>
      </div>

      {/* Applied Coupon Display */}
      <AnimatePresence mode="wait">
        {appliedCoupon ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3"
          >
            <div
              className="flex items-start justify-between p-3 rounded-xl"
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-green-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3 text-green-400" />
                    <span className="text-sm font-bold text-white">{appliedCoupon.code}</span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">
                    {appliedCoupon.discountType === "percentage"
                      ? `Diskon ${appliedCoupon.discountValue}%`
                      : `Potongan ${formatRupiah(appliedCoupon.discountValue)}`}
                  </p>
                  <p className="text-xs font-bold text-green-400 mt-1">
                    Hemat {formatRupiah(appliedCoupon.discount)}
                  </p>
                  {appliedCoupon.description && (
                    <p className="text-[10px] text-white/30 mt-0.5">{appliedCoupon.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleRemove}
                className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {/* Input + Button */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Kode Voucher"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    if (status === "error") {
                      setStatus("idle");
                      setErrorMessage("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApply();
                  }}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 h-10 text-sm rounded-xl uppercase"
                  disabled={status === "loading"}
                />
                {/* Success/Error Icon inside input */}
                {status === "success" && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />
                )}
                {status === "error" && (
                  <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                )}
              </div>
              <button
                onClick={handleApply}
                disabled={!couponCode.trim() || status === "loading"}
                className="px-4 h-10 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40"
                style={{
                  background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`,
                  boxShadow: `0 0 12px ${theme.glow}`,
                }}
              >
                {status === "loading" ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </span>
                ) : (
                  "Gunakan"
                )}
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {status === "error" && errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <div
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    <span className="text-xs text-red-400">{errorMessage}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
