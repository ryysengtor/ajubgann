"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Heart, Star } from "lucide-react";
import type { IProduct } from "@/models/Product";

// ===== Types =====
export type ProductCardProduct = IProduct & {
  category?: { name: string; slug: string; icon: string };
};

interface ProductCardProps {
  product: ProductCardProduct;
  onClick: (product: ProductCardProduct) => void;
}

// ===== Helpers =====
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getLowestPrice(items: { price: number; isActive?: boolean }[]): number {
  const activeItems = items.filter((i) => i.isActive !== false);
  if (activeItems.length === 0) return 0;
  return Math.min(...activeItems.map((i) => i.price));
}

// ===== Component =====
export default function ProductCard({ product, onClick }: ProductCardProps) {
  const categoryInfo = product.category as
    | { name: string; slug: string; icon: string }
    | undefined;
  const firstImage =
    product.images && product.images.length > 0 ? product.images[0] : null;
  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) *
          100
      )
    : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className="h-full"
    >
      <Card
        className={`group relative flex flex-col overflow-hidden rounded-xl border py-0 gap-0 shadow-md transition-colors ${
          product.isSold
            ? "opacity-70 border-muted-foreground/20"
            : "border-border/50 hover:border-[#FFD700]/40 hover:shadow-lg hover:shadow-[#FFD700]/5"
        } bg-card`}
      >
        <CardContent className="p-0 flex flex-1 flex-col">
          {/* ===== Image Area (1:1) ===== */}
          <div className="relative aspect-square overflow-hidden bg-muted/40">
            {firstImage ? (
              <img
                src={firstImage}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted/20">
                <span className="text-5xl opacity-60">
                  {categoryInfo?.icon || "🎮"}
                </span>
              </div>
            )}

            {/* --- SOLD overlay --- */}
            {product.isSold && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                <Badge className="bg-gray-900/90 text-white text-xs font-bold px-4 py-1.5 border-0 shadow-lg uppercase tracking-wider">
                  SOLD
                </Badge>
              </div>
            )}

            {/* --- Top-left Badges --- */}
            {!product.isSold && (
              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                {product.isFeatured && (
                  <Badge className="bg-amber-500/90 text-white text-[10px] font-semibold px-2 py-0.5 border-0 shadow-sm gap-0.5 backdrop-blur-sm">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Featured
                  </Badge>
                )}
                {hasDiscount && (
                  <Badge className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 border-0 shadow-sm backdrop-blur-sm">
                    -{discountPercent}%
                  </Badge>
                )}
              </div>
            )}

            {/* --- Heart icon (top-right) --- */}
            {!product.isSold && (
              <div className="absolute top-2 right-2 z-10">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-colors hover:bg-black/50">
                  <Heart className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            )}

            {/* --- Image count badge --- */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-2 right-2 z-10">
                <Badge
                  variant="secondary"
                  className="bg-black/40 text-white text-[10px] px-1.5 py-0.5 border-0 backdrop-blur-sm"
                >
                  📷 {product.images.length}
                </Badge>
              </div>
            )}
          </div>

          {/* ===== Info Section ===== */}
          <div className="flex flex-1 flex-col px-3 pt-2.5 pb-3 space-y-1.5">
            {/* Category tag */}
            {categoryInfo && (
              <Badge
                variant="secondary"
                className="w-fit text-[10px] px-1.5 py-0 h-5 bg-muted/60 text-muted-foreground hover:bg-muted/80 border-0"
              >
                {categoryInfo.icon} {categoryInfo.name}
              </Badge>
            )}

            {/* Product Name */}
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground min-h-[2.5rem]">
              {product.name}
            </h3>

            {/* Price Section */}
            <div className="space-y-0.5">
              {hasDiscount && (
                <p className="text-sm text-muted-foreground line-through leading-tight">
                  {formatRupiah(product.originalPrice!)}
                </p>
              )}
              <p
                className={`text-lg font-extrabold leading-tight ${
                  product.isSold
                    ? "text-muted-foreground"
                    : "text-[#FFD700]"
                }`}
              >
                {product.price > 0 ? formatRupiah(product.price) : "Gratis"}
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 pt-0.5">
              {(product.views > 0) && (
                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Eye className="h-3 w-3" />
                  {product.views}x dilihat
                </span>
              )}
              {(product.likes > 0) && (
                <span className="flex items-center gap-1 text-red-500 text-xs">
                  <Heart className="h-3 w-3 fill-red-500" />
                  {product.likes}x disukai
                </span>
              )}
            </div>

            {/* "Lihat Detail" CTA Button */}
            <div className="pt-1.5 flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(product);
                }}
                className={`h-10 w-[80%] rounded-lg text-sm font-bold transition-all duration-200 ${
                  product.isSold
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-[#FFD700] text-white hover:bg-[#FFC000] active:scale-[0.97] shadow-md shadow-[#FFD700]/20 hover:shadow-lg hover:shadow-[#FFD700]/30"
                }`}
                disabled={product.isSold}
              >
                {product.isSold ? "Sudah Terjual" : "Lihat Detail"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
