"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronRight, Eye, Heart, Star } from "lucide-react";
import { formatRupiah } from "@/components/ProductCard";

interface FlashSaleSectionProps {
  theme: {
    accent: string;
    glow: string;
    border: string;
    btnFrom: string;
    btnTo: string;
    bannerGrad: string;
  };
  onProductClick: (product: any) => void;
}

interface FlashSaleProduct {
  _id: string;
  name: string;
  images: string[];
  price: number;
  originalPrice?: number;
  views?: number;
  likes?: number;
  category?: { name: string; slug: string; icon: string };
}

interface FlashSale {
  _id: string;
  title: string;
  description?: string;
  discountPercent: number;
  endsAt: string;
  products?: FlashSaleProduct[];
  originalPrices?: Record<string, number>;
  salePrices?: Record<string, number>;
}

function FlipDigit({ value }: { value: string }) {
  return (
    <div
      className="relative w-8 h-10 sm:w-10 sm:h-12 rounded-lg flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #1a1a1a 0%, #111 50%, #1a1a1a 100%)",
        border: `1px solid rgba(255,45,45,0.3)`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      {/* Center line */}
      <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-black/40" />
      <span className="text-base sm:text-xl font-extrabold text-white tabular-nums relative z-10">
        {value}
      </span>
    </div>
  );
}

function CountdownTimer({ endsAt, theme }: { endsAt: string; theme: FlashSaleSectionProps["theme"] }) {
  const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00" });

  useEffect(() => {
    const calculateTime = () => {
      const end = new Date(endsAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, end - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <div className="flex items-center gap-1">
      <FlipDigit value={timeLeft.hours[0]} />
      <FlipDigit value={timeLeft.hours[1]} />
      <span className="text-white/50 font-bold text-sm mx-0.5">:</span>
      <FlipDigit value={timeLeft.minutes[0]} />
      <FlipDigit value={timeLeft.minutes[1]} />
      <span className="text-white/50 font-bold text-sm mx-0.5">:</span>
      <FlipDigit value={timeLeft.seconds[0]} />
      <FlipDigit value={timeLeft.seconds[1]} />
    </div>
  );
}

export default function FlashSaleSection({ theme, onProductClick }: FlashSaleSectionProps) {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlashSales = useCallback(async () => {
    try {
      const res = await fetch("/api/flash-sales?includeProducts=true");
      const data = await res.json();
      if (data.data) {
        setFlashSales(data.data);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlashSales();
  }, [fetchFlashSales]);

  // Don't render if no active flash sales
  if (!isLoading && flashSales.length === 0) return null;

  return (
    <div className="w-full">
      {flashSales.map((sale) => (
        <div key={sale._id} className="mb-6">
          {/* Section Header */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-4 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #1a1a1a, #111)",
              border: `1px solid ${theme.border}`,
              boxShadow: `0 0 20px ${theme.glow}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: theme.bannerGrad, boxShadow: `0 0 15px ${theme.glow}` }}
              >
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <span style={{ color: theme.accent }}>⚡ FLASH SALE</span>
                  {sale.title && (
                    <span className="text-white/50 text-xs font-medium hidden sm:inline">— {sale.title}</span>
                  )}
                </h2>
                {sale.discountPercent > 0 && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: theme.bannerGrad }}
                  >
                    Diskon hingga {sale.discountPercent}%
                  </span>
                )}
              </div>
            </div>
            <CountdownTimer endsAt={sale.endsAt} theme={theme} />
          </div>

          {/* Product Cards - Horizontal Scroll */}
          <div className="scroll-x-smooth flex gap-3 pb-2">
            {(sale.products || []).map((product) => {
              const originalPrice = sale.originalPrices?.[product._id] || product.originalPrice || product.price;
              const salePrice = sale.salePrices?.[product._id] || product.price;
              const discountPct = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
              const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
              const categoryInfo = product.category as { name: string; slug: string; icon: string } | undefined;

              return (
                <motion.div
                  key={product._id}
                  whileTap={{ scale: 0.97 }}
                  className="shrink-0 w-[160px] sm:w-[180px] cursor-pointer group"
                  onClick={() => onProductClick(product)}
                >
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: "#1a1a1a",
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    {/* Image */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#0a0a0a]">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl opacity-30">{categoryInfo?.icon || "🎮"}</span>
                        </div>
                      )}
                      {/* Discount Badge */}
                      {discountPct > 0 && (
                        <span
                          className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white z-10"
                          style={{ background: theme.bannerGrad, boxShadow: `0 0 8px ${theme.glow}` }}
                        >
                          -{discountPct}%
                        </span>
                      )}
                      {/* Flash sale indicator */}
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1a1a1a] to-transparent pointer-events-none" />
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                      {categoryInfo && (
                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                          {categoryInfo.icon} {categoryInfo.name}
                        </span>
                      )}
                      <h3 className="text-[12px] font-bold text-white leading-tight mt-0.5 line-clamp-2 min-h-[2rem]">
                        {product.name}
                      </h3>
                      <div className="mt-1.5">
                        {originalPrice > salePrice && (
                          <p className="text-[10px] text-white/30 line-through leading-tight">{formatRupiah(originalPrice)}</p>
                        )}
                        <p className="text-sm font-extrabold text-white leading-tight">{formatRupiah(salePrice)}</p>
                      </div>
                      <button
                        className="w-full mt-2 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all active:scale-[0.97]"
                        style={{
                          background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`,
                          boxShadow: `0 0 8px ${theme.glow}`,
                        }}
                      >
                        Beli Sekarang
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
