"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { formatRupiah } from "@/components/ProductCard";
import PaymentQRIS from "@/components/PaymentQRIS";
import ProductVariationTabs from "@/components/ProductVariationTabs";
import FlashSaleSection from "@/components/FlashSaleSection";
import CouponInput from "@/components/CouponInput";
import LiveChatWidget from "@/components/LiveChatWidget";
import NotificationCenter from "@/components/NotificationCenter";
import ReviewSection from "@/components/ReviewSection";
import AdvancedSearch from "@/components/AdvancedSearch";
import SiteThemeSwitcher from "@/components/SiteThemeSwitcher";
import VisitorStats from "@/components/VisitorStats";
import { useSiteTheme, SITE_THEMES, type SiteThemeKey } from "@/hooks/useSiteTheme";
import type { ICategory } from "@/models/Category";
import type { IProduct } from "@/models/Product";
import Autoplay from "embla-carousel-autoplay";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Menu, X, Search, Home, ClipboardList, ShoppingCart, Heart, Eye, Star,
  Trash2, ArrowLeft, ChevronRight, Flame, Zap, Shield, Clock, RefreshCw,
  CheckCircle2, User, CreditCard, QrCode, MessageCircle, PartyPopper,
  Copy, BadgeCheck, TreePine, Gamepad2, Lock, Handshake, ArrowRight,
  CircleDot, Key, Banknote, LogIn, Sparkles, TrendingUp, Crown,
  SlidersHorizontal, ArrowUpDown, ChevronUp, ChevronDown, Filter, RotateCcw,
  HelpCircle, BookOpen, Phone, Bell,
} from "lucide-react";

// ===== Types =====
type PageView = "home" | "cek-transaksi" | "keranjang" | "bantuan" | "tutorial";
type CheckoutStep = "data" | "payment" | "qris" | "success";

interface SiteSettings {
  siteName: string; siteDescription: string; siteSlogan: string; logoUrl: string;
  whatsappNumber: string; telegramUsername: string;
  instagramUrl?: string; tiktokUrl?: string; youtubeUrl?: string;
  facebookUrl?: string; twitterUrl?: string; maintenanceMode?: boolean;
}

interface TransactionData {
  transactionId: string; qrString: string; qrImageUrl: string; totalAmount: number;
  originalAmount: number; uniqueNominal: number; expiredAt: string;
  productName: string; productImage?: string;
}

interface TransactionLookup {
  transactionId: string; productName: string; customerName: string;
  totalAmount: number; status: string; createdAt: string; expiredAt: string;
}

interface BannerData {
  _id: string; imageUrl: string; title: string; description: string;
  link: string; order: number; isActive: boolean;
  type: 'home' | 'product'; category: string;
}

interface LikeData { counts: Record<string, number>; userLikes: string[]; }

type ProductItem = IProduct & { category?: { name: string; slug: string; icon: string; image?: string; accentColor?: string; borderColor?: string; glowColor?: string; bgColor?: string; theme?: string } };

interface CartItem {
  _id: string; name: string; price: number; originalPrice?: number;
  images: string[]; slug: string;
}

// ===== PER-GAME THEME CONFIG =====
const GAME_THEMES: Record<string, {
  name: string; accent: string; glow: string; border: string;
  bgStart: string; bgMid: string; bgEnd: string; bannerGrad: string;
  cardBorder: string; cardGlow: string; btnFrom: string; btnTo: string;
}> = {
  "free-fire": {
    name: "Free Fire", accent: "#ff2d2d", glow: "rgba(255,45,45,0.3)", border: "rgba(255,80,80,0.35)",
    bgStart: "#170000", bgMid: "#250000", bgEnd: "#0a0000",
    bannerGrad: "linear-gradient(135deg, #ff2d2d, #ff6b00)",
    cardBorder: "rgba(255,80,80,0.35)", cardGlow: "0 0 15px rgba(255,0,0,0.12)",
    btnFrom: "#ff2d2d", btnTo: "#ff6b00",
  },
  "mobile-legends": {
    name: "Mobile Legends", accent: "#3b82f6", glow: "rgba(59,130,246,0.3)", border: "rgba(59,130,246,0.35)",
    bgStart: "#050b22", bgMid: "#101c45", bgEnd: "#050814",
    bannerGrad: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    cardBorder: "rgba(59,130,246,0.35)", cardGlow: "0 0 15px rgba(59,130,246,0.12)",
    btnFrom: "#3b82f6", btnTo: "#8b5cf6",
  },
  "pubg": {
    name: "PUBG", accent: "#22c55e", glow: "rgba(34,197,94,0.3)", border: "rgba(34,197,94,0.35)",
    bgStart: "#101510", bgMid: "#1a2418", bgEnd: "#090d09",
    bannerGrad: "linear-gradient(135deg, #22c55e, #16a34a)",
    cardBorder: "rgba(34,197,94,0.35)", cardGlow: "0 0 15px rgba(34,197,94,0.12)",
    btnFrom: "#22c55e", btnTo: "#16a34a",
  },
  "valorant": {
    name: "Valorant", accent: "#f43f5e", glow: "rgba(244,63,94,0.3)", border: "rgba(244,63,94,0.35)",
    bgStart: "#120b10", bgMid: "#220d14", bgEnd: "#0b0608",
    bannerGrad: "linear-gradient(135deg, #f43f5e, #dc2626)",
    cardBorder: "rgba(244,63,94,0.35)", cardGlow: "0 0 15px rgba(244,63,94,0.12)",
    btnFrom: "#f43f5e", btnTo: "#dc2626",
  },
  "genshin-impact": {
    name: "Genshin Impact", accent: "#8b5cf6", glow: "rgba(139,92,246,0.3)", border: "rgba(139,92,246,0.35)",
    bgStart: "#0e1024", bgMid: "#171d40", bgEnd: "#0a0d18",
    bannerGrad: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    cardBorder: "rgba(139,92,246,0.35)", cardGlow: "0 0 15px rgba(139,92,246,0.12)",
    btnFrom: "#8b5cf6", btnTo: "#6366f1",
  },
  "roblox": {
    name: "Roblox", accent: "#f59e0b", glow: "rgba(245,158,11,0.3)", border: "rgba(245,158,11,0.35)",
    bgStart: "#151515", bgMid: "#252525", bgEnd: "#111111",
    bannerGrad: "linear-gradient(135deg, #f59e0b, #ef4444)",
    cardBorder: "rgba(245,158,11,0.35)", cardGlow: "0 0 15px rgba(245,158,11,0.12)",
    btnFrom: "#f59e0b", btnTo: "#ef4444",
  },
  "honor-of-kings": {
    name: "Honor of Kings", accent: "#a855f7", glow: "rgba(168,85,247,0.3)", border: "rgba(168,85,247,0.35)",
    bgStart: "#0e0520", bgMid: "#1a0d35", bgEnd: "#080315",
    bannerGrad: "linear-gradient(135deg, #a855f7, #7c3aed)",
    cardBorder: "rgba(168,85,247,0.35)", cardGlow: "0 0 15px rgba(168,85,247,0.12)",
    btnFrom: "#a855f7", btnTo: "#7c3aed",
  },
  "fortnite": {
    name: "Fortnite", accent: "#06b6d4", glow: "rgba(6,182,212,0.3)", border: "rgba(6,182,212,0.35)",
    bgStart: "#051517", bgMid: "#0d2530", bgEnd: "#030d10",
    bannerGrad: "linear-gradient(135deg, #06b6d4, #0891b2)",
    cardBorder: "rgba(6,182,212,0.35)", cardGlow: "0 0 15px rgba(6,182,212,0.12)",
    btnFrom: "#06b6d4", btnTo: "#0891b2",
  },
  "clash-royale": {
    name: "Clash Royale", accent: "#f97316", glow: "rgba(249,115,22,0.3)", border: "rgba(249,115,22,0.35)",
    bgStart: "#151005", bgMid: "#251a0a", bgEnd: "#0d0803",
    bannerGrad: "linear-gradient(135deg, #f97316, #ea580c)",
    cardBorder: "rgba(249,115,22,0.35)", cardGlow: "0 0 15px rgba(249,115,22,0.12)",
    btnFrom: "#f97316", btnTo: "#ea580c",
  },
  "efootball": {
    name: "eFootball", accent: "#10b981", glow: "rgba(16,185,129,0.3)", border: "rgba(16,185,129,0.35)",
    bgStart: "#051510", bgMid: "#0d251a", bgEnd: "#030d08",
    bannerGrad: "linear-gradient(135deg, #10b981, #059669)",
    cardBorder: "rgba(16,185,129,0.35)", cardGlow: "0 0 15px rgba(16,185,129,0.12)",
    btnFrom: "#10b981", btnTo: "#059669",
  },
};

const DEFAULT_THEME = {
  name: "Game", accent: "#06b6d4", glow: "rgba(6,182,212,0.3)", border: "rgba(6,182,212,0.35)",
  bgStart: "#030d10", bgMid: "#0a1a20", bgEnd: "#020809",
  bannerGrad: "linear-gradient(135deg, #06b6d4, #0891b2)",
  cardBorder: "rgba(6,182,212,0.4)", cardGlow: "0 0 15px rgba(6,182,212,0.15)",
  btnFrom: "#06b6d4", btnTo: "#0284c7",
};

function getTheme(slug: string) {
  return GAME_THEMES[slug] || DEFAULT_THEME;
}

// ===== Animation Variants =====
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};
const pageVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ===== Helpers =====
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("cotc_session_id");
  if (!sid) {
    sid = "sess_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem("cotc_session_id", sid);
  }
  return sid;
}

function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem("cotc_cart"); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function saveCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("cotc_cart", JSON.stringify(items));
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const checkoutSteps: { key: CheckoutStep; label: string; icon: React.ElementType }[] = [
  { key: "data", label: "Data", icon: User },
  { key: "payment", label: "Bayar", icon: CreditCard },
  { key: "qris", label: "QRIS", icon: QrCode },
  { key: "success", label: "Selesai", icon: CheckCircle2 },
];

const confettiColors = ["#ff2d2d", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

// ===== Banner Carousel =====
function BannerCarousel({ banners }: { banners: BannerData[] }) {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  return (
    <div className="relative">
      <div className="rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/10">
        <Carousel setApi={setApi} opts={{ align: "start", loop: true, duration: 30 }} plugins={[plugin.current]} className="w-full">
          <CarouselContent>
            {banners.map((banner, idx) => (
              <CarouselItem key={banner._id}>
                <motion.div
                  initial={{ opacity: 0.7, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="relative w-full aspect-[2.2/1] sm:aspect-[3/1] overflow-hidden group"
                >
                  {banner.link ? (
                    <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </a>
                  ) : (
                    <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                  {banner.title && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
                      className="absolute bottom-3 left-4 right-4 sm:bottom-5 sm:left-6 sm:right-6">
                      <h2 className="text-sm sm:text-xl font-bold text-white drop-shadow-lg line-clamp-1">{banner.title}</h2>
                      {banner.description && <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 line-clamp-1">{banner.description}</p>}
                    </motion.div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[#06b6d4]/80 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 border-0 font-bold">{idx + 1}/{banners.length}</Badge>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {banners.length > 1 && (
            <>
              <CarouselPrevious className="left-2 bg-black/60 backdrop-blur-sm border-cyan-500/30 text-white hover:bg-black/80 hover:border-cyan-400/50 h-9 w-9 rounded-full" />
              <CarouselNext className="right-2 bg-black/60 backdrop-blur-sm border-cyan-500/30 text-white hover:bg-black/80 hover:border-cyan-400/50 h-9 w-9 rounded-full" />
            </>
          )}
        </Carousel>
      </div>
      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {banners.map((_, idx) => (
            <button key={idx} onClick={() => api?.scrollTo(idx)}
              className={`transition-all duration-300 rounded-full ${currentSlide === idx ? "w-6 h-2 bg-[#06b6d4] shadow-md shadow-cyan-500/30" : "w-2 h-2 bg-white/25 hover:bg-white/50"}`}
              aria-label={`Slide ${idx + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== GAME BANNER COMPONENT =====
function GameBanner({ theme, category, productCount }: { theme: typeof DEFAULT_THEME; category: ICategory; productCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="vexa-game-banner mb-5"
      style={{ borderColor: theme.border }}
    >
      <div className="relative aspect-[4/1] overflow-hidden rounded-[18px]">
        {/* Background with gradient */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.bgStart}, ${theme.bgMid}, ${theme.bgEnd})` }} />
        {/* Abstract glow shapes */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30">
          <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full" style={{ background: theme.accent, filter: "blur(60px)" }} />
          <div className="absolute bottom-1/4 right-1/3 w-24 h-24 rounded-full" style={{ background: theme.accent, filter: "blur(40px)", opacity: 0.5 }} />
        </div>
        {/* Category image */}
        {category.image && (
          <div className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 h-20 w-20 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-2 z-10" style={{ borderColor: theme.border, boxShadow: theme.cardGlow }}>
            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
          </div>
        )}
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center z-10 px-4 sm:px-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg sm:text-2xl">{category.icon}</span>
              <h2 className="text-base sm:text-2xl font-extrabold text-white drop-shadow-lg">{category.name}</h2>
            </div>
            <p className="text-xs sm:text-sm text-white/70 max-w-xs">{category.description || `Beli akun ${category.name} terpercaya dengan harga terbaik`}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: theme.bannerGrad }}>
                <Flame className="h-3 w-3" /> {productCount} Akun
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-white/50">
                <Shield className="h-3 w-3" /> Aman & Terpercaya
              </span>
            </div>
          </div>
        </div>
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: theme.bannerGrad }} />
      </div>
    </motion.div>
  );
}

// ===== PRODUCT CARD COMPONENT =====
function ProductCard({
  product, categoryInfo, likeData, likingProducts, sessionId,
  onToggleLike, onClick, theme,
}: {
  product: ProductItem; categoryInfo: { name: string; slug: string; icon: string } | undefined;
  likeData: LikeData; likingProducts: Set<string>; sessionId: string;
  onToggleLike: (id: string, e?: React.MouseEvent) => void;
  onClick: () => void; theme: typeof DEFAULT_THEME;
}) {
  const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;
  const productId = product._id as string;
  const isLiked = likeData.userLikes.includes(productId);
  const isLiking = likingProducts.has(productId);
  const likeCount = likeData.counts[productId] ?? product.likes ?? 0;

  return (
    <motion.div variants={itemVariants} className="h-full">
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        className="vexa-product-card cursor-pointer group"
        style={{
          borderColor: theme.cardBorder,
        }}
        onClick={onClick}
      >
        {/* Cover / Sampul Image - 3:4 Aspect Ratio */}
        <div className="relative overflow-hidden bg-[#0a0a0a]" style={{ aspectRatio: "3/4" }}>
          {firstImage ? (
            <img src={firstImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" style={{ borderRadius: "14px 14px 0 0" }} loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.bgStart}, ${theme.bgEnd})` }}>
              <span className="text-4xl opacity-40">{categoryInfo?.icon || "🎮"}</span>
            </div>
          )}
          {/* Sold overlay */}
          {product.isSold && (
            <div className="vexa-sold-overlay">
              <X className="h-8 w-8 text-[#ff2d2d] opacity-90" />
              <span className="sold-text" style={{ color: theme.accent }}>TERJUAL</span>
            </div>
          )}
          {/* Badges top-left */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {product.isFeatured && !product.isSold && (
              <span className="vexa-badge flex items-center gap-0.5" style={{ background: "#06b6d4" }}>
                <Star className="h-2.5 w-2.5 fill-current" />Hot
              </span>
            )}
            {hasDiscount && !product.isSold && (
              <span className="vexa-badge" style={{ background: "#ef4444" }}>-{discountPercent}%</span>
            )}
          </div>
          {/* Heart button top-right */}
          {!product.isSold && (
            <button className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
              onClick={(e) => onToggleLike(productId, e)} disabled={isLiking}>
              <Heart className={`h-3.5 w-3.5 transition-colors ${isLiked ? "fill-[#ff2d2d] text-[#ff2d2d]" : "text-white/70"}`} />
            </button>
          )}
          {/* View/Like bottom-left */}
          {!product.isSold && (
            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2">
              <span className="flex items-center gap-0.5 text-[9px] text-white/50 bg-black/30 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                <Eye className="h-2.5 w-2.5" />{product.views || 0}
              </span>
              <span className="flex items-center gap-0.5 text-[9px] text-white/50 bg-black/30 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                <Heart className="h-2.5 w-2.5" />{likeCount}
              </span>
            </div>
          )}
          {/* Bottom gradient overlay on image */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1a1a1a] to-transparent pointer-events-none" />
        </div>

        {/* Red accent line separator between image and info - prominent garis merah */}
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.btnTo}, transparent)` }} />

        {/* Card Info - flex column with spacer for uniform button alignment */}
        <div className="card-info p-3 sm:p-4">
          {categoryInfo && (
            <span className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: theme.accent }}>
              {categoryInfo.icon} {categoryInfo.name}
            </span>
          )}
          {/* Product name - FULL text visible, no truncation */}
          <h3 className="text-[13px] sm:text-sm font-bold text-white leading-snug mb-2" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
            {product.name}
          </h3>
          <div className="mb-3">
            {hasDiscount && <p className="text-[11px] text-[#ff2d2d] line-through leading-tight">{formatRupiah(product.originalPrice!)}</p>}
            <p className="text-base sm:text-lg font-extrabold text-white leading-tight">{product.price > 0 ? formatRupiah(product.price) : "Gratis"}</p>
          </div>
          {/* Spacer pushes button to bottom for uniform alignment */}
          <div className="card-spacer" />
          <button
            className="w-full py-2.5 min-h-[38px] rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
            style={product.isSold
              ? { background: "rgba(255,255,255,0.05)", color: "#8a8a8a", cursor: "not-allowed", border: "1px solid rgba(255,255,255,0.05)" }
              : { background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`, color: "#fff", boxShadow: `0 0 12px ${theme.glow}` }
            }
            onClick={(e) => { e.stopPropagation(); if (!product.isSold) onClick(); }}
          >
            {product.isSold ? "Terjual" : "Lihat Detail"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== FILTER MODAL COMPONENT =====
function FilterModal({
  open, onClose, priceMin, priceMax, sortBy, filterStatus,
  setPriceMin, setPriceMax, setSortBy, setFilterStatus,
  onApply, onReset, onQuickSort, onQuickStatusChange, onQuickPriceChange, theme,
}: {
  open: boolean; onClose: () => void;
  priceMin: string; priceMax: string; sortBy: string; filterStatus: "all" | "available";
  setPriceMin: (v: string) => void; setPriceMax: (v: string) => void; setSortBy: (v: any) => void; setFilterStatus: (v: "all" | "available") => void;
  onApply: () => void; onReset: () => void;
  onQuickSort: (v: string) => void; onQuickStatusChange: (v: "all" | "available") => void; onQuickPriceChange: (min: string, max: string) => void;
  theme: typeof DEFAULT_THEME;
}) {
  const quickSortOptions = [
    { key: "price_asc", label: "Termurah", icon: ChevronUp },
    { key: "price_desc", label: "Termahal", icon: ChevronDown },
    { key: "newest", label: "Terbaru", icon: Clock },
    { key: "popular", label: "Terpopuler", icon: Flame },
  ] as const;

  const pricePresets = [
    { label: "< 50K", min: "", max: "50000" },
    { label: "50K-100K", min: "50000", max: "100000" },
    { label: "100K-500K", min: "100000", max: "500000" },
    { label: "500K+", min: "500000", max: "" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md mx-3 mb-3 sm:mb-0 rounded-2xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, #1a1a1a, #111)`, border: `1px solid ${theme.border}` }}
          >
            {/* Close button at top */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Filter className="h-4 w-4" style={{ color: theme.accent }} /> Filter
              </h3>
              <button onClick={onClose} className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>

            {/* Filter content */}
            <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Quick Sort Buttons - apply immediately */}
              <div>
                <Label className="text-xs font-semibold text-white/80 mb-2 block">Urutkan</Label>
                <div className="flex flex-wrap gap-2">
                  {quickSortOptions.map((opt) => {
                    const IconComp = opt.icon;
                    const isActive = sortBy === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          const newSort = isActive ? "default" : opt.key;
                          setSortBy(newSort);
                          onQuickSort(newSort);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                          isActive
                            ? "text-white shadow-md"
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                        }`}
                        style={isActive ? {
                          background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`,
                          boxShadow: `0 0 12px ${theme.glow}`,
                        } : { border: `1px solid ${theme.border}` }}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Status Filter - apply immediately */}
              <div>
                <Label className="text-xs font-semibold text-white/80 mb-2 block">Status Akun</Label>
                <div className="flex gap-2">
                  {([
                    { key: "available" as const, label: "Tersedia" },
                    { key: "all" as const, label: "Semua" },
                  ]).map((opt) => {
                    const isActive = filterStatus === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setFilterStatus(opt.key);
                          onQuickStatusChange(opt.key);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                          isActive
                            ? "text-white shadow-md"
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                        }`}
                        style={isActive ? {
                          background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`,
                          boxShadow: `0 0 12px ${theme.glow}`,
                        } : { border: `1px solid ${theme.border}` }}
                      >
                        {opt.key === "available" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {opt.key === "all" && <CircleDot className="h-3.5 w-3.5" />}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Preset Buttons - apply immediately */}
              <div>
                <Label className="text-xs font-semibold text-white/80 mb-2 block">Rentang Harga Cepat</Label>
                <div className="flex flex-wrap gap-2">
                  {pricePresets.map((preset) => {
                    const isActive = priceMin === preset.min && priceMax === preset.max;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => {
                          if (isActive) {
                            setPriceMin("");
                            setPriceMax("");
                            onQuickPriceChange("", "");
                          } else {
                            setPriceMin(preset.min);
                            setPriceMax(preset.max);
                            onQuickPriceChange(preset.min, preset.max);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                          isActive
                            ? "text-white"
                            : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                        }`}
                        style={isActive ? {
                          background: theme.accent,
                          boxShadow: `0 0 8px ${theme.glow}`,
                        } : { border: `1px solid rgba(255,255,255,0.08)` }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Price range */}
              <div>
                <Label className="text-xs font-semibold text-white/80 mb-2 block">Rentang Harga Kustom</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/40">Rp</span>
                      <Input
                        type="number" placeholder="Minimal" value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 h-10 pl-9 text-sm rounded-xl"
                      />
                    </div>
                  </div>
                  <span className="text-white/30 text-xs">—</span>
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/40">Rp</span>
                      <Input
                        type="number" placeholder="Maksimal" value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 h-10 pl-9 text-sm rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 border-t border-white/5 space-y-2">
              <button
                onClick={onApply}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
                style={{ background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`, boxShadow: `0 0 16px ${theme.glow}` }}
              >
                Terapkan Harga Kustom
              </button>
              <button
                onClick={onReset}
                className="w-full py-3 rounded-xl text-sm font-bold text-white/70 bg-white/5 hover:bg-white/10 transition-all"
                style={{ border: `1px solid ${theme.border}` }}
              >
                <span className="flex items-center justify-center gap-2"><RotateCcw className="h-3.5 w-3.5" />Reset Filter</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== Loading Progress Component =====
function LoadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + Math.random() * 15 + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);
  return <span className="text-[10px] text-[#ff6b00] font-bold">{Math.min(Math.round(progress), 100)}%</span>;
}

// ===== Main Component =====
export default function HomePage() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activePage, setActivePage] = useState<PageView>("home");
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [productBanners, setProductBanners] = useState<BannerData[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [likeData, setLikeData] = useState<LikeData>({ counts: {}, userLikes: [] });
  const [sessionId, setSessionId] = useState("");
  const [likingProducts, setLikingProducts] = useState<Set<string>>(new Set());
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("data");
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [formData, setFormData] = useState({ customerName: "", customerWhatsapp: "", customerEmail: "" });
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [checkInput, setCheckInput] = useState("");
  const [isCheckingTransaction, setIsCheckingTransaction] = useState(false);
  const [transactionResult, setTransactionResult] = useState<TransactionLookup | TransactionLookup[] | null>(null);
  const paymentPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const likeRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const homeHeaderRef = useRef<HTMLElement | null>(null);
  const [categoryProductCounts, setCategoryProductCounts] = useState<Record<string, number>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "newest" | "popular">("default");
  const [categorySearch, setCategorySearch] = useState("");
  const [activeSortBy, setActiveSortBy] = useState<"default" | "price_asc" | "price_desc" | "newest" | "popular">("default");
  const [activePriceMin, setActivePriceMin] = useState("");
  const [activePriceMax, setActivePriceMax] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available">("available");
  const [activeFilterStatus, setActiveFilterStatus] = useState<"all" | "available">("available");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  // Site-wide theme switcher hook
  const { themeKey: siteThemeKey, theme: siteTheme } = useSiteTheme();

  // Current theme: use per-game theme when category selected, else use site-wide theme
  const currentTheme = selectedCategory !== "all" ? getTheme(selectedCategory) : {
    ...DEFAULT_THEME,
    accent: siteTheme.accent,
    glow: siteTheme.glow,
    border: siteTheme.border,
    btnFrom: siteTheme.btnFrom,
    btnTo: siteTheme.btnTo,
    bgStart: siteTheme.bgStart,
    bgMid: siteTheme.bgMid,
    bgEnd: siteTheme.bgEnd,
    bannerGrad: `linear-gradient(135deg, ${siteTheme.btnFrom}, ${siteTheme.btnTo})`,
    cardBorder: siteTheme.border,
    cardGlow: `0 0 15px ${siteTheme.glow}`,
  };

  // ===== Effects =====
  useEffect(() => {
    // Loading screen: show for 2.5 seconds then fade out
    const loadingTimer = setTimeout(() => setShowLoading(false), 2500);
    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    setMounted(true);
    setTheme("dark");
    const sid = getSessionId();
    setSessionId(sid);
    setCartItems(getCartItems());
    // Track visitor
    if (sid) {
      fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          page: 'home',
          referrer: document.referrer || '',
          userAgent: navigator.userAgent || '',
        }),
      }).catch(() => {});
    }
  }, [setTheme]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 20;
          if (homeHeaderRef.current) {
            homeHeaderRef.current.classList.toggle('home-scrolled', scrolled);
          }
          setIsScrolled(scrolled);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchBanners() {
      try { const res = await fetch("/api/banners?type=home"); const data = await res.json(); if (data.data) setBanners(data.data); } catch {} finally { setIsLoadingBanners(false); }
    }
    fetchBanners();
  }, []);

  // Fetch product banners when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      setProductBanners([]);
      return;
    }
    async function fetchProductBanners() {
      try {
        const res = await fetch(`/api/banners?type=product&category=${encodeURIComponent(selectedCategory)}`);
        const data = await res.json();
        if (data.data) setProductBanners(data.data);
      } catch {}
    }
    fetchProductBanners();
  }, [selectedCategory]);

  useEffect(() => {
    async function fetchCategories() {
      try { const res = await fetch("/api/categories"); const data = await res.json(); if (data.data) setCategories(data.data); } catch { toast.error("Gagal memuat kategori"); } finally { setIsLoadingCategories(false); }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchCategoryCounts() {
      if (categories.length === 0) return;
      const counts: Record<string, number> = {};
      try {
        const res = await fetch("/api/products?");
        const data = await res.json();
        if (data.data) {
          const allProducts: ProductItem[] = data.data;
          categories.forEach((cat) => {
            counts[cat.slug] = allProducts.filter((p: ProductItem) => { const pCat = p.category as { slug?: string } | undefined; return pCat && pCat.slug === cat.slug; }).length;
          });
          setCategoryProductCounts(counts);
        }
      } catch {}
    }
    fetchCategoryCounts();
  }, [categories]);

  const fetchProducts = useCallback(async (category?: string, search?: string, minPrice?: string, maxPrice?: string, sort?: string, status?: string) => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (category && category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (sort && sort !== "default") params.set("sort", sort);
      if (status && status !== "all") params.set("status", status);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.data) setProducts(data.data);
    } catch { toast.error("Gagal memuat produk"); } finally { setIsLoadingProducts(false); }
  }, []);

  useEffect(() => { fetchProducts(selectedCategory, searchQuery, activePriceMin, activePriceMax, activeSortBy, activeFilterStatus); }, [selectedCategory, searchQuery, activePriceMin, activePriceMax, activeSortBy, activeFilterStatus, fetchProducts]);

  useEffect(() => {
    async function fetchSettings() { try { const res = await fetch("/api/settings"); const data = await res.json(); if (data.data) setSettings(data.data); } catch {} }
    fetchSettings();
  }, []);

  const fetchLikes = useCallback(async () => {
    if (!sessionId || products.length === 0) return;
    const productIds = products.map((p) => (p._id as string)).join(",");
    if (!productIds) return;
    try { const res = await fetch(`/api/likes?productIds=${productIds}&sessionId=${sessionId}`); const data = await res.json(); if (data.data) setLikeData(data.data); } catch {}
  }, [sessionId, products]);

  useEffect(() => { fetchLikes(); }, [fetchLikes]);
  useEffect(() => { likeRefreshRef.current = setInterval(fetchLikes, 10000); return () => { if (likeRefreshRef.current) clearInterval(likeRefreshRef.current); }; }, [fetchLikes]);

  useEffect(() => {
    if (checkoutStep === "qris" && transactionData) {
      paymentPollingRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/payment/check-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactionId: transactionData.transactionId }) });
          const data = await res.json();
          if (data.data?.status === "paid" || data.data?.status === "success") {
            setCheckoutStep("success"); setShowConfetti(true); toast.success("Pembayaran berhasil! 🎉");
            if (paymentPollingRef.current) { clearInterval(paymentPollingRef.current); paymentPollingRef.current = null; }
          }
        } catch {}
      }, 3000);
    }
    return () => { if (paymentPollingRef.current) { clearInterval(paymentPollingRef.current); paymentPollingRef.current = null; } };
  }, [checkoutStep, transactionData]);

  // ===== Handlers =====
  const handleToggleLike = async (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!sessionId) return;
    setLikingProducts((prev) => new Set(prev).add(productId));
    try {
      const res = await fetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, sessionId }) });
      const data = await res.json();
      if (data.data) {
        setLikeData((prev) => ({
          counts: { ...prev.counts, [productId]: data.data.count },
          userLikes: data.data.liked ? [...prev.userLikes.filter((id) => id !== productId), productId] : prev.userLikes.filter((id) => id !== productId),
        }));
        setProducts((prev) => prev.map((p) => (p._id as string) === productId ? { ...p, likes: data.data.count } : p));
      }
    } catch { toast.error("Gagal mengubah like"); } finally {
      setLikingProducts((prev) => { const next = new Set(prev); next.delete(productId); return next; });
    }
  };

  const addToCart = (product: ProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const existing = getCartItems();
    if (existing.some((item) => item._id === (product._id as string))) { toast.info("Produk sudah ada di keranjang"); return; }
    const cartItem: CartItem = { _id: product._id as string, name: product.name, price: product.price, originalPrice: product.originalPrice, images: product.images, slug: product.slug };
    const updated = [...existing, cartItem];
    saveCartItems(updated); setCartItems(updated); toast.success("Ditambahkan ke keranjang! 🛒");
  };

  const removeFromCart = (productId: string) => {
    const updated = cartItems.filter((item) => item._id !== productId);
    saveCartItems(updated); setCartItems(updated); toast.success("Dihapus dari keranjang");
  };

  const isInCart = (productId: string): boolean => cartItems.some((item) => item._id === productId);

  const navigateTo = (page: PageView) => { setActivePage(page); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleProductClick = (product: ProductItem) => {
    setDetailProduct(product); setDetailOpen(true);
    fetch(`/api/products/${product.slug}`).catch(() => {});
  };

  const handleBuyNow = (product?: ProductItem) => {
    const prod = product || detailProduct;
    if (!prod) return;
    if (prod.isSold) { toast.error("Akun ini sudah terjual!"); return; }
    setSelectedProduct(prod);
    setFormData({ customerName: "", customerWhatsapp: "", customerEmail: "" });
    setTransactionData(null); setCheckoutStep("data"); setShowConfetti(false); setDetailOpen(false); setCheckoutOpen(true);
  };

  const handleCreateTransaction = async () => {
    if (!selectedProduct) { toast.error("Produk tidak ditemukan"); return; }
    if (!formData.customerName.trim()) { toast.error("Masukkan nama pelanggan"); return; }
    if (!formData.customerWhatsapp.trim()) { toast.error("Masukkan nomor WhatsApp"); return; }
    setIsCreatingTransaction(true);
    try {
      const res = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct._id, customerName: formData.customerName, customerPhone: formData.customerWhatsapp, customerEmail: formData.customerEmail, customerWhatsapp: formData.customerWhatsapp }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal membuat transaksi"); return; }
      const productImage = selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images[0] : "";
      setTransactionData({ ...data.data, productImage }); setCheckoutStep("qris");
      toast.success("Transaksi dibuat! Silakan lakukan pembayaran.");
    } catch { toast.error("Gagal membuat transaksi. Coba lagi."); } finally { setIsCreatingTransaction(false); }
  };

  const handleCheckTransaction = async () => {
    if (!checkInput.trim()) { toast.error("Masukkan ID transaksi atau nomor WhatsApp"); return; }
    setIsCheckingTransaction(true); setTransactionResult(null);
    try {
      const isPhone = /^\d+$/.test(checkInput.trim());
      const params = isPhone ? `phone=${encodeURIComponent(checkInput.trim())}` : `transactionId=${encodeURIComponent(checkInput.trim())}`;
      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Transaksi tidak ditemukan"); return; }
      setTransactionResult(data.data);
    } catch { toast.error("Gagal mengecek transaksi"); } finally { setIsCheckingTransaction(false); }
  };

  const handleCopyTransactionId = () => {
    if (transactionData?.transactionId) { navigator.clipboard.writeText(transactionData.transactionId); toast.success("Kode transaksi disalin!"); }
  };

  const handleApplyFilter = () => {
    setActivePriceMin(priceMin);
    setActivePriceMax(priceMax);
    setActiveSortBy(sortBy);
    setActiveFilterStatus(filterStatus);
    setFilterOpen(false);
  };

  const handleResetFilter = () => {
    setPriceMin("");
    setPriceMax("");
    setSortBy("default");
    setFilterStatus("available");
    setActivePriceMin("");
    setActivePriceMax("");
    setActiveSortBy("default");
    setActiveFilterStatus("available");
    setFilterOpen(false);
  };

  const handleAdvancedSearch = useCallback((params: { query: string; categories: string[]; priceMin: string; priceMax: string; sort: string }) => {
    if (params.query) {
      setSearchQuery(params.query);
    }
    if (params.categories.length > 0) {
      // Use first selected category
      setSelectedCategory(params.categories[0]);
    }
    if (params.priceMin) {
      setActivePriceMin(params.priceMin);
    }
    if (params.priceMax) {
      setActivePriceMax(params.priceMax);
    }
    if (params.sort && params.sort !== 'default') {
      setActiveSortBy(params.sort as typeof activeSortBy);
    }
    // Navigate to home if not already
    if (activePage !== 'home') {
      setActivePage('home');
    }
  }, [activePage]);

  const hasActiveFilter = activePriceMin !== "" || activePriceMax !== "" || activeSortBy !== "default" || activeFilterStatus !== "available";

  const statusBadgeVariant = (status: string) => {
    switch (status) { case "paid": case "success": return "default"; case "pending": return "secondary"; case "expired": return "destructive"; case "cancel": return "outline"; default: return "secondary"; }
  };
  const statusLabel = (status: string) => {
    switch (status) { case "paid": return "Dibayar"; case "success": return "Sukses"; case "pending": return "Menunggu"; case "expired": return "Kedaluwarsa"; case "cancel": return "Dibatalkan"; default: return status; }
  };

  const currentStepIndex = checkoutSteps.findIndex((s) => s.key === checkoutStep);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #170000, #230000, #110000)" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-3 border-[#ff2d2d] border-t-transparent" />
      </div>
    );
  }

  // ─── Maintenance Mode ────────────────────────────
  if (settings?.maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(180deg, #170000, #230000, #110000)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-6xl opacity-10 animate-pulse">🔧</div>
          <div className="absolute top-40 right-20 text-5xl opacity-10 animate-pulse">⚙️</div>
          <div className="absolute bottom-20 left-1/4 text-4xl opacity-10 animate-pulse">🛠️</div>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center relative z-10">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2d2d] to-[#8B0000] text-white shadow-lg shadow-[#ff2d2d]/30 overflow-hidden">
            {settings?.logoUrl && settings.logoUrl !== '/logo.svg' ? <img src={settings.logoUrl} alt={settings.siteName || "Logo"} className="w-full h-full object-cover" /> : <TreePine className="size-10" />}
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Sedang Dalam Perbaikan</h1>
          <p className="text-[#06b6d4] font-semibold text-lg mb-3">{settings.siteName || "RYYSENGTOR"}</p>
          <p className="text-[#8a8a8a] text-sm leading-relaxed mb-6">Website sedang dalam maintenance untuk perbaikan dan peningkatan layanan. Kami akan segera kembali! 🚀</p>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
            <motion.div className="h-full bg-gradient-to-r from-[#ff2d2d] to-[#ff6b00] rounded-full" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} style={{ width: "40%" }} />
          </div>
          {settings.whatsappNumber && (
            <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors">
              <MessageCircle className="size-4" />Hubungi Kami via WhatsApp
            </a>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col vexa-bg-gaming" style={{ background: selectedCategory !== "all" ? `linear-gradient(180deg, ${currentTheme.bgStart}, ${currentTheme.bgMid}, ${currentTheme.bgEnd})` : undefined }}>

      {/* ===== LOADING SCREEN ===== */}
      <AnimatePresence>
        {showLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#000000]"
          >
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#ff2d2d]" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#ff2d2d]" />

            {/* Top decorations */}
            <div className="absolute top-6 right-8 text-[#ff2d2d]/30">
              <Gamepad2 className="h-8 w-8" />
            </div>
            <div className="absolute top-6 left-8 text-[#ff2d2d]/30">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M9 7l8 8" /></svg>
            </div>

            {/* Center icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="relative mb-6"
            >
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Gamepad2 className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#ff2d2d] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">+</span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-1"
            >
              RYYSENGTOR
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xs sm:text-sm text-gray-400 tracking-[0.3em] uppercase mb-8"
            >
              GAME ACCOUNT MARKETPLACE
            </motion.p>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              transition={{ delay: 0.6 }}
              className="w-48 sm:w-64 mb-3"
            >
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.7, duration: 1.8, ease: "easeInOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #ff2d2d, #ff6b00)" }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-[#ff2d2d] tracking-widest font-bold">LOADING GAME DATA...</span>
                <LoadingProgress />
              </div>
            </motion.div>

            {/* Tip */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-[11px] text-gray-500 mt-4"
            >
              💡 TIP: Gunakan filter untuk mencari akun impianmu
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SEARCH OVERLAY ===== */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 p-4" style={{ background: "linear-gradient(180deg, #170000, #230000, #110000)" }}>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSearchOpen(false)} className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="flex-1 vexa-search flex items-center px-4">
                <Search className="h-4 w-4 text-[#8a8a8a] mr-2" />
                <Input placeholder="Cari akun game..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus
                  className="flex-1 bg-transparent border-0 text-white placeholder:text-[#8a8a8a] focus:ring-0 focus:outline-none h-10" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-[#8a8a8a] hover:text-white transition-colors"><X className="h-4 w-4" /></button>
                )}
              </div>
            </div>
            {searchQuery && (
              <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
                {isLoadingProducts ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="rounded-[18px] overflow-hidden bg-[#1a1a1a]" style={{ border: `1px solid ${DEFAULT_THEME.cardBorder}` }}>
                        <div className="vexa-skeleton" style={{ aspectRatio: "3/4" }} />
                        <div className="p-2.5 space-y-1.5"><div className="vexa-skeleton h-3 w-full" /><div className="vexa-skeleton h-5 w-16" /></div>
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <span className="text-4xl mb-3">🔍</span>
                    <h3 className="text-base font-semibold text-white">Tidak ditemukan</h3>
                    <p className="text-xs text-[#8a8a8a] mt-1">Coba kata kunci lain</p>
                  </div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible"
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 items-stretch">
                    {products.map((product) => (
                      <ProductCard key={product._id as string} product={product}
                        categoryInfo={product.category as { name: string; slug: string; icon: string } | undefined}
                        likeData={likeData} likingProducts={likingProducts} sessionId={sessionId}
                        onToggleLike={handleToggleLike} onClick={() => { handleProductClick(product); setSearchOpen(false); }}
                        theme={DEFAULT_THEME} />
                    ))}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== HEADER ===== */}
      <header ref={homeHeaderRef} className="sticky top-0 z-30 vexa-header">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            {/* Hamburger menu - opens sidebar */}
            <button onClick={() => setSidebarOpen(true)} className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95">
              <Menu className="h-5 w-5 text-white/80" />
            </button>
            {/* Logo from admin settings */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ff2d2d] to-[#8B0000] flex items-center justify-center overflow-hidden shadow-md shadow-[#ff2d2d]/20">
                {settings?.logoUrl && settings.logoUrl !== '/logo.svg' ? (
                  <img src={settings.logoUrl} alt={settings.siteName || "Logo"} className="w-full h-full object-cover" />
                ) : (
                  <Gamepad2 className="h-4 w-4 text-white" />
                )}
              </div>
              <h1 className="text-sm font-extrabold tracking-tight gold-text">{settings?.siteName || "RYYSENGTOR"}</h1>
            </div>
          </div>
          {/* Search bar in center (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="vexa-search flex items-center w-full px-4 py-2">
              <Search className="h-4 w-4 text-[#8a8a8a] mr-2" />
              <Input placeholder="Cari akun game..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 text-white placeholder:text-[#8a8a8a] focus:ring-0 focus:outline-none h-8 text-sm" />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="text-[#8a8a8a] hover:text-white transition-colors"><X className="h-4 w-4" /></button>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="md:hidden h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95">
              <Search className="h-4 w-4 text-[#8a8a8a]" />
            </button>
            <AdvancedSearch categories={categories} onSearch={handleAdvancedSearch} theme={currentTheme} />
            <NotificationCenter sessionId={sessionId} theme={currentTheme} />
            <button onClick={() => navigateTo("keranjang")} className="relative h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95">
              <ShoppingCart className="h-4 w-4 text-[#8a8a8a]" />
              {cartItems.length > 0 && <Badge className="absolute -top-1 -right-1 bg-[#ff2d2d] text-white min-w-4 h-4 px-1 border-0 text-[9px] font-bold">{cartItems.length}</Badge>}
            </button>
          </div>
        </div>
      </header>

      {/* ===== SIDEBAR NAVIGATION ===== */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 vexa-sidebar"
            >
              {/* Sidebar header with logo */}
              <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#ff2d2d] to-[#8B0000] flex items-center justify-center overflow-hidden shadow-lg shadow-[#ff2d2d]/30">
                  {settings?.logoUrl && settings.logoUrl !== '/logo.svg' ? (
                    <img src={settings.logoUrl} alt={settings.siteName || "Logo"} className="w-full h-full object-cover" />
                  ) : (
                    <Gamepad2 className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-extrabold" style={{ background: "linear-gradient(135deg, #06b6d4, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{settings?.siteName || "RYYSENGTOR"}</h2>
                  <p className="text-[10px] text-white/40 truncate">{settings?.siteSlogan || "Tempat Jual Beli Akun"}</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="h-4 w-4 text-white/60" />
                </button>
              </div>

              {/* Navigation items */}
              <nav className="flex-1 py-4 px-3 space-y-1">
                {[
                  { id: "home" as PageView, label: "Beranda", icon: Home },
                  { id: "cek-transaksi" as PageView, label: "Cek Pesanan", icon: ClipboardList },
                  { id: "keranjang" as PageView, label: "Cek Keranjang", icon: ShoppingCart, badge: cartItems.length },
                  { id: "bantuan" as PageView, label: "Bantuan", icon: HelpCircle },
                  { id: "tutorial" as PageView, label: "Tutorial Beli Akun", icon: BookOpen },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "text-white sidebar-nav-active"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                      style={isActive ? {
                        background: "linear-gradient(90deg, rgba(255,45,45,0.15), rgba(255,107,0,0.08))",
                        borderLeft: "3px solid #ff2d2d",
                      } : { borderLeft: "3px solid transparent" }}
                    >
                      <ItemIcon className={`h-5 w-5 ${isActive ? "text-[#ff2d2d]" : ""}`} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="vexa-badge min-w-5 h-5 px-1.5 text-[10px] flex items-center justify-center">{item.badge}</span>
                      )}
                      {isActive && <ChevronRight className="h-4 w-4 text-[#ff2d2d]/60" />}
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar footer - social links */}
              <div className="px-5 py-4 border-t border-white/10 mt-auto">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">IKUTI KAMI</p>
                <div className="flex items-center gap-3">
                  {settings?.whatsappNumber && (
                    <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-[#25D366]/15 flex items-center justify-center hover:bg-[#25D366]/30 transition-colors border border-[#25D366]/30" aria-label="WhatsApp">
                      <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                    </a>
                  )}
                  {settings?.telegramUsername && (
                    <a href={`https://t.me/${settings.telegramUsername.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-blue-500/15 flex items-center justify-center hover:bg-blue-500/30 transition-colors border border-blue-500/30" aria-label="Telegram">
                      <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </a>
                  )}
                  {settings?.instagramUrl && (
                    <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-pink-500/15 flex items-center justify-center hover:bg-pink-500/30 transition-colors border border-pink-500/30" aria-label="Instagram">
                      <svg className="h-4 w-4 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-white/30 mt-3">© 2025 {settings?.siteName || "RYYSENGTOR"}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 relative z-10 pb-16 sm:pb-0">
        <AnimatePresence mode="wait">
          {/* ===== HOME PAGE ===== */}
          {activePage === "home" && (
            <motion.div key="home" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
              {/* Banner Carousel - ONLY on home when no category selected and no search */}
              {selectedCategory === "all" && !searchQuery && (
                <section className="pt-3 pb-0">
                  <div className="px-3.5">
                    {isLoadingBanners ? (
                      <Skeleton className="w-full aspect-[3/1] rounded-xl bg-white/5" />
                    ) : banners.length > 0 ? (
                      <BannerCarousel banners={banners} />
                    ) : (
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0000] border border-[#ff2d2d]/15 py-10 sm:py-16 px-4 text-center">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                          <Badge className="mb-3 gap-1 bg-[#ff2d2d]/10 text-[#ff2d2d] border-[#ff2d2d]/20 px-3 py-1 text-xs">
                            <Zap className="h-3 w-3" />Jual Beli Akun Game Terpercaya #1
                          </Badge>
                          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{settings?.siteName || "RYYSENGTOR"}</h1>
                          <p className="mt-2 text-sm text-[#8a8a8a] max-w-md">{settings?.siteSlogan || "Tempat Jual Beli Akun"}</p>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ===== FLASH SALE SECTION ===== */}
              {selectedCategory === "all" && !searchQuery && (
                <FlashSaleSection
                  theme={currentTheme}
                  onProductClick={handleProductClick}
                />
              )}

              {/* ===== CATEGORY GRID (when selectedCategory === "all" and no search) ===== */}
              {selectedCategory === "all" && !searchQuery ? (
                <section className="py-6">
                  <div className="px-3.5">
                    <div className="mb-4">
                      <h2 className="text-sm font-bold flex items-center gap-2 text-white tracking-wide">
                        <Gamepad2 className="h-4 w-4 text-[#06b6d4]" />PILIH GAME
                      </h2>
                      <p className="text-[11px] text-[#8a8a8a] mt-0.5">Pilih game untuk melihat daftar akun yang tersedia</p>
                    </div>

                    {isLoadingCategories ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="rounded-2xl overflow-hidden bg-[#1a1a1a] border border-[#06b6d4]/10">
                            <div className="vexa-skeleton aspect-square" />
                            <div className="p-2"><div className="vexa-skeleton h-3 w-16 mx-auto" /></div>
                          </div>
                        ))}
                      </div>
                    ) : categories.length === 0 ? (
                      <div className="flex flex-col items-center py-12 text-center">
                        <span className="text-4xl mb-3">🎮</span>
                        <h3 className="text-base font-semibold text-white">Belum ada game</h3>
                        <p className="text-xs text-[#8a8a8a] mt-1">Game akan segera ditambahkan</p>
                      </div>
                    ) : (
                      <motion.div variants={containerVariants} initial="hidden" animate="visible"
                        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {categories.filter((c) => c.isActive).map((cat) => {
                          const catTheme = getTheme(cat.slug);
                          return (
                            <motion.div key={cat._id as string} variants={itemVariants}>
                              <motion.div
                                whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.95 }}
                                className="vexa-category-card group"
                                style={{ borderColor: "rgba(6,182,212,0.3)" }}
                                onClick={() => { setSelectedCategory(cat.slug); setSearchQuery(""); setCategorySearch(""); handleResetFilter(); }}
                              >
                                <div className="relative p-2 pb-0">
                                  <div className="relative aspect-square overflow-hidden rounded-xl">
                                    {cat.image ? (
                                      <img src={cat.image} alt={cat.name} className="vexa-game-image" loading="lazy" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${catTheme.bgStart}, ${catTheme.bgMid})` }}>
                                        <span className="text-3xl opacity-60">{cat.icon}</span>
                                      </div>
                                    )}
                                    {/* Hover glow overlay */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                      style={{ background: `radial-gradient(circle at center, ${catTheme.glow}, transparent 70%)` }} />
                                  </div>
                                  {categoryProductCounts[cat.slug] !== undefined && categoryProductCounts[cat.slug] > 0 && (
                                    <div className="absolute top-3 right-3 z-10">
                                      <span className="vexa-badge" style={{ background: "#06b6d4" }}>{categoryProductCounts[cat.slug]}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="px-2 pb-2 pt-1.5 text-center">
                                  <h3 className="text-[10px] sm:text-xs font-bold text-white line-clamp-1">{cat.name} Akun</h3>
                                </div>
                              </motion.div>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </div>
                </section>
              ) : (
                /* ===== PRODUCT LISTING (when category selected or search active) ===== */
                <section className="pt-3 pb-4">
                  <div className="px-3.5">
                    {/* Back button */}
                    <div className="flex items-center gap-2 mb-3">
                      <button onClick={() => { setSelectedCategory("all"); setSearchQuery(""); handleResetFilter(); }}
                        className="flex items-center gap-1.5 text-sm font-medium bg-white/5 hover:bg-white/10 rounded-full px-3 py-1.5 transition-colors"
                        style={{ color: currentTheme.accent }}>
                        <ArrowLeft className="h-4 w-4" />Kembali
                      </button>
                    </div>

                    {/* Product Banner (uploaded) or Game Banner (fallback) - ONLY on category pages */}
                    {selectedCategory !== "all" && !searchQuery && (() => {
                      const cat = categories.find((c) => c.slug === selectedCategory);
                      if (!cat) return null;

                      // If there are uploaded product banners for this category, show them
                      if (productBanners.length > 0) {
                        return (
                          <div className="mb-4">
                            {productBanners.length === 1 ? (
                              // Single banner - show full width
                              <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="relative w-full aspect-[4/1] rounded-2xl overflow-hidden group"
                                style={{ borderColor: currentTheme.border, boxShadow: `0 0 20px ${currentTheme.glow}` }}
                              >
                                {productBanners[0].link ? (
                                  <a href={productBanners[0].link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                    <img src={productBanners[0].imageUrl} alt={productBanners[0].title || cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                  </a>
                                ) : (
                                  <img src={productBanners[0].imageUrl} alt={productBanners[0].title || cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0000]/80 via-transparent to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: currentTheme.bannerGrad }} />
                                {(productBanners[0].title || productBanners[0].description) && (
                                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
                                    className="absolute bottom-3 left-4 right-4 sm:bottom-5 sm:left-6 sm:right-6">
                                    {productBanners[0].title && <h2 className="text-sm sm:text-xl font-bold text-white drop-shadow-lg line-clamp-1">{productBanners[0].title}</h2>}
                                    {productBanners[0].description && <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 line-clamp-1">{productBanners[0].description}</p>}
                                  </motion.div>
                                )}
                              </motion.div>
                            ) : (
                              // Multiple banners - carousel
                              <BannerCarousel banners={productBanners} />
                            )}
                          </div>
                        );
                      }

                      // Fallback to generated GameBanner
                      return <GameBanner theme={currentTheme} category={cat} productCount={products.length} />;
                    })()}

                    {/* Action buttons: Temukan Akun Lainnya + Tampilkan Filter */}
                    {selectedCategory !== "all" && !searchQuery && (
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => setSearchOpen(true)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                          style={{ background: "rgba(255,255,255,0.05)", color: "white", border: `1px solid ${currentTheme.border}` }}
                        >
                          <Search className="h-3.5 w-3.5" />Temukan Akun Lainnya
                        </button>
                        <button
                          onClick={() => setFilterOpen(true)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
                          style={{ background: `linear-gradient(90deg, ${currentTheme.btnFrom}, ${currentTheme.btnTo})`, boxShadow: `0 0 12px ${currentTheme.glow}` }}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />Tampilkan Filter
                          {hasActiveFilter && <span className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                        </button>
                      </div>
                    )}

                    {/* Search bar within category */}
                    {selectedCategory !== "all" && (
                      <div className="mb-4">
                        <div className="vexa-search flex items-center px-4 py-2.5 rounded-xl" style={{ borderColor: currentTheme.border }}>
                          <Search className="h-4 w-4 text-[#8a8a8a] mr-2 shrink-0" />
                          <Input
                            placeholder="Cari Judul Akun, Skin Senjata, dll"
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="flex-1 bg-transparent border-0 text-white placeholder:text-[#8a8a8a] focus:ring-0 focus:outline-none h-8 text-sm"
                          />
                          {categorySearch && (
                            <button onClick={() => setCategorySearch("")} className="text-[#8a8a8a] hover:text-white transition-colors shrink-0">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => { if (categorySearch) { setSearchQuery(categorySearch); } }}
                            className="ml-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white shrink-0 transition-all active:scale-[0.98]"
                            style={{ background: `linear-gradient(90deg, ${currentTheme.btnFrom}, ${currentTheme.btnTo})` }}
                          >
                            Cari
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ===== PRODUCT VARIATION TABS (Termurah/Termahal/Terpopuler/Terbaru) ===== */}
                    <div className="mb-3">
                      <ProductVariationTabs
                        activeSort={activeSortBy}
                        onSortChange={(v) => setActiveSortBy(v as typeof activeSortBy)}
                        theme={currentTheme}
                      />
                    </div>

                    {/* Quick filter bar - horizontal scrollable chips - always visible */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 overflow-x-auto scroll-x-smooth pb-1">
                        <span className="flex items-center gap-1 text-xs font-semibold text-white/50 shrink-0">
                          <Filter className="h-3.5 w-3.5" />Filter
                        </span>
                        {[
                          { key: "price_asc" as const, label: "Termurah", icon: ChevronUp },
                          { key: "price_desc" as const, label: "Termahal", icon: ChevronDown },
                          { key: "newest" as const, label: "Terbaru", icon: Clock },
                        ].map((opt) => {
                          const IconComp = opt.icon;
                          const isActive = activeSortBy === opt.key;
                          return (
                            <button
                              key={opt.key}
                              onClick={() => {
                                if (isActive) {
                                  setActiveSortBy("default");
                                } else {
                                  setActiveSortBy(opt.key);
                                }
                              }}
                              className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
                                isActive
                                  ? "text-white"
                                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                              }`}
                              style={isActive ? {
                                background: `linear-gradient(90deg, ${currentTheme.btnFrom}, ${currentTheme.btnTo})`,
                                boxShadow: `0 0 8px ${currentTheme.glow}`,
                              } : { border: `1px solid rgba(255,255,255,0.08)` }}
                            >
                              <IconComp className="h-3.5 w-3.5" />
                              {opt.label}
                            </button>
                          );
                        })}
                        {hasActiveFilter && (
                          <button
                            onClick={handleResetFilter}
                            className="flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                            style={{ border: `1px solid rgba(255,255,255,0.08)` }}
                          >
                            <X className="h-3.5 w-3.5" />
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() => setFilterOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                          style={{ border: `1px solid rgba(255,255,255,0.08)` }}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          Filter Lanjutan
                        </button>
                      </div>
                    </div>

                    {/* Product count + Active filter indicator */}
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs text-[#8a8a8a]">{products.length} akun tersedia</p>
                      {hasActiveFilter && (
                        <button onClick={handleResetFilter} className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors" style={{ color: currentTheme.accent }}>
                          <X className="h-2.5 w-2.5" />Hapus Filter
                        </button>
                      )}
                    </div>

                    {isLoadingProducts ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="rounded-[18px] overflow-hidden bg-[#1a1a1a]" style={{ border: `1px solid ${currentTheme.cardBorder}` }}>
                            <div className="vexa-skeleton" style={{ aspectRatio: "3/4" }} />
                            <div className="p-2.5 space-y-1.5"><div className="vexa-skeleton h-3 w-full" /><div className="vexa-skeleton h-3 w-2/3" /><div className="vexa-skeleton h-5 w-20" /></div>
                          </div>
                        ))}
                      </div>
                    ) : products.length === 0 ? (
                      <div className="flex flex-col items-center py-12 text-center">
                        <span className="text-4xl mb-3">🔍</span>
                        <h3 className="text-base font-semibold text-white">Akun tidak ditemukan</h3>
                        <p className="text-xs text-[#8a8a8a] mt-1">Coba ubah kategori atau kata kunci pencarian</p>
                        {selectedCategory !== "all" && (
                          <Button onClick={() => { setSelectedCategory("all"); setSearchQuery(""); handleResetFilter(); }}
                            className="mt-4 gap-2 text-white font-bold" style={{ background: `linear-gradient(90deg, ${currentTheme.btnFrom}, ${currentTheme.btnTo})`, boxShadow: `0 0 12px ${currentTheme.glow}` }}>
                            <ArrowLeft className="h-4 w-4" />Lihat Semua Game
                          </Button>
                        )}
                      </div>
                    ) : (
                      <motion.div variants={containerVariants} initial="hidden" animate="visible"
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 items-stretch">
                        {products.map((product) => (
                          <ProductCard key={product._id as string} product={product}
                            categoryInfo={product.category as { name: string; slug: string; icon: string } | undefined}
                            likeData={likeData} likingProducts={likingProducts} sessionId={sessionId}
                            onToggleLike={handleToggleLike} onClick={() => handleProductClick(product)}
                            theme={currentTheme} />
                        ))}
                      </motion.div>
                    )}
                  </div>
                </section>
              )}

              {/* Why Choose Us */}
              <section className="py-6 border-t border-white/5">
                <div className="px-3.5">
                  <h2 className="text-sm font-bold text-white text-center mb-4 tracking-wide">Kenapa Pilih Kami? 🔥</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <Zap className="h-4 w-4" />, title: "Proses Kilat", desc: "Pengiriman akun cepat" },
                      { icon: <Shield className="h-4 w-4" />, title: "Aman Terpercaya", desc: "Transaksi terjamin" },
                      { icon: <Clock className="h-4 w-4" />, title: "24/7 Support", desc: "Admin selalu siap" },
                      { icon: <BadgeCheck className="h-4 w-4" />, title: "QRIS Verified", desc: "Bayar mudah & aman" },
                    ].map((item, idx) => (
                      <div key={idx} className="rounded-xl bg-[#1a1a1a] border border-white/5 p-3 text-center">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff2d2d]/15 to-[#ff6b00]/15 text-[#ff2d2d] mb-2 border border-[#ff2d2d]/20">{item.icon}</div>
                        <h3 className="text-[11px] font-semibold text-white">{item.title}</h3>
                        <p className="text-[10px] text-[#8a8a8a] mt-0.5 leading-tight">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Visitor Stats Widget - NEW */}
                  <div className="mt-4">
                    <VisitorStats theme={currentTheme} />
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {/* ===== CEK TRANSAKSI PAGE ===== */}
          {activePage === "cek-transaksi" && (
            <motion.div key="cek-transaksi" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="py-6">
              <div className="px-3.5 max-w-lg mx-auto">
                <div className="text-center mb-6">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff2d2d]/10 mb-3">
                    <ClipboardList className="h-7 w-7 text-[#ff2d2d]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Cek Pesanan</h2>
                  <p className="text-sm text-[#8a8a8a] mt-1">Masukkan ID transaksi atau nomor WhatsApp</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-5">
                  <div className="flex gap-2">
                    <Input placeholder="ID Transaksi atau No. WhatsApp" value={checkInput} onChange={(e) => setCheckInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCheckTransaction()}
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-[#8a8a8a] focus:border-[#ff2d2d]/50 h-11 rounded-xl" />
                    <Button onClick={handleCheckTransaction} disabled={isCheckingTransaction}
                      className="gap-1.5 bg-gradient-to-r from-[#ff2d2d] to-[#ff6b00] text-white font-bold h-11 px-5 rounded-xl shadow-lg shadow-[#ff2d2d]/20">
                      {isCheckingTransaction ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw className="h-4 w-4" /></motion.div> : <Search className="h-4 w-4" />}
                      <span className="hidden sm:inline">Cek</span>
                    </Button>
                  </div>
                  <AnimatePresence>
                    {transactionResult && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4">
                        <Separator className="mb-4 bg-[#ff2d2d]/15" />
                        {Array.isArray(transactionResult) ? (
                          <div className="space-y-4">
                            {transactionResult.map((tx, idx) => (
                              <div key={idx} className="rounded-lg bg-[#0f0000] p-3 space-y-2 border border-white/5">
                                <div className="flex items-center justify-between"><span className="text-xs text-[#8a8a8a]">ID Transaksi</span><span className="font-mono text-xs text-white">{tx.transactionId}</span></div>
                                <div className="flex items-center justify-between"><span className="text-xs text-[#8a8a8a]">Produk</span><span className="text-xs text-white">{tx.productName}</span></div>
                                <div className="flex items-center justify-between"><span className="text-xs text-[#8a8a8a]">Total</span><span className="text-xs font-semibold text-[#ff2d2d]">{formatRupiah(tx.totalAmount)}</span></div>
                                <div className="flex items-center justify-between"><span className="text-xs text-[#8a8a8a]">Status</span><Badge variant={statusBadgeVariant(tx.status) as "default" | "secondary" | "destructive" | "outline"}>{statusLabel(tx.status)}</Badge></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between"><span className="text-sm text-[#8a8a8a]">ID Transaksi</span><span className="font-mono text-sm text-white">{transactionResult.transactionId}</span></div>
                            <div className="flex items-center justify-between"><span className="text-sm text-[#8a8a8a]">Produk</span><span className="text-sm text-white">{transactionResult.productName}</span></div>
                            <div className="flex items-center justify-between"><span className="text-sm text-[#8a8a8a]">Pelanggan</span><span className="text-sm text-white">{transactionResult.customerName}</span></div>
                            <div className="flex items-center justify-between"><span className="text-sm text-[#8a8a8a]">Total</span><span className="text-sm font-semibold text-[#ff2d2d]">{formatRupiah(transactionResult.totalAmount)}</span></div>
                            <div className="flex items-center justify-between"><span className="text-sm text-[#8a8a8a]">Status</span><Badge variant={statusBadgeVariant(transactionResult.status) as "default" | "secondary" | "destructive" | "outline"}>{statusLabel(transactionResult.status)}</Badge></div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== KERANJANG PAGE ===== */}
          {activePage === "keranjang" && (
            <motion.div key="keranjang" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="py-6">
              <div className="px-3.5 max-w-lg mx-auto">
                <div className="text-center mb-6">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff2d2d]/10 mb-3">
                    <ShoppingCart className="h-7 w-7 text-[#ff2d2d]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Keranjang</h2>
                  <p className="text-sm text-[#8a8a8a] mt-1">{cartItems.length > 0 ? `${cartItems.length} akun dalam keranjang` : "Keranjang kamu kosong"}</p>
                </div>
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <span className="text-5xl mb-3">🛒</span>
                    <p className="text-sm text-[#8a8a8a]">Belum ada produk di keranjang</p>
                    <Button onClick={() => navigateTo("home")} className="mt-4 gap-2 bg-gradient-to-r from-[#ff2d2d] to-[#ff6b00] text-white font-bold rounded-xl shadow-lg shadow-[#ff2d2d]/20">
                      <Home className="h-4 w-4" />Cari Akun Game
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => {
                      const hasDiscount = item.originalPrice && item.originalPrice > item.price;
                      const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
                      return (
                        <motion.div key={item._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}
                          className="flex gap-3 rounded-xl bg-[#1a1a1a] border border-white/5 p-3">
                          <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-[#0a0a0a]">
                            {firstImage ? <img src={firstImage} alt={item.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-2xl">🎮</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">{item.name}</h3>
                            <div className="mt-1">
                              {hasDiscount && <p className="text-[10px] text-[#ff2d2d] line-through">{formatRupiah(item.originalPrice!)}</p>}
                              <p className="text-sm font-extrabold text-white">{formatRupiah(item.price)}</p>
                            </div>
                          </div>
                          <button onClick={() => removeFromCart(item._id)} className="h-8 w-8 shrink-0 rounded-lg bg-[#ff2d2d]/10 flex items-center justify-center hover:bg-[#ff2d2d]/20 transition-colors self-center">
                            <Trash2 className="h-4 w-4 text-[#ff2d2d]" />
                          </button>
                        </motion.div>
                      );
                    })}
                    <div className="rounded-xl bg-[#1a1a1a] border border-white/5 p-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[#8a8a8a]">Total ({cartItems.length} item)</span>
                        <span className="text-lg font-extrabold text-white">{formatRupiah(cartTotal)}</span>
                      </div>
                      <Separator className="bg-[#ff2d2d]/15 mb-3" />
                      <p className="text-[10px] text-[#8a8a8a] mb-3">* Pembayaran dilakukan per item. Klik &quot;Beli Sekarang&quot; untuk memulai checkout.</p>
                      <div className="space-y-2">
                        {cartItems.map((item) => (
                          <Button key={item._id}
                            onClick={() => {
                              const prod = products.find((p) => (p._id as string) === item._id);
                              if (prod) { handleBuyNow(prod); } else {
                                handleBuyNow({ _id: item._id as any, name: item.name, slug: item.slug, category: "" as any, description: "", images: item.images, specs: [], price: item.price, originalPrice: item.originalPrice, views: 0, likes: 0, isActive: true, isFeatured: false, isSold: false, order: 0, createdAt: new Date(), updatedAt: new Date() });
                              }
                            }}
                            className="w-full gap-2 bg-gradient-to-r from-[#ff2d2d] to-[#ff6b00] text-white font-bold h-10 text-xs rounded-xl shadow-lg shadow-[#ff2d2d]/15">
                            <CreditCard className="h-4 w-4" />Beli &quot;{item.name.length > 25 ? item.name.substring(0, 25) + "..." : item.name}&quot;
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== BANTUAN PAGE ===== */}
          {activePage === "bantuan" && (
            <motion.div key="bantuan" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="py-6">
              <div className="px-3.5 max-w-lg mx-auto">
                <div className="text-center mb-6">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff2d2d]/10 mb-3">
                    <HelpCircle className="h-7 w-7 text-[#ff2d2d]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Pusat Bantuan</h2>
                  <p className="text-sm text-[#8a8a8a] mt-1">Butuh bantuan? Kami siap membantu kamu!</p>
                </div>

                {/* FAQ Section */}
                <div className="space-y-3 mb-6">
                  <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">Pertanyaan Umum</h3>
                  {[
                    { q: "Bagaimana cara membeli akun?", a: "Pilih akun game yang diinginkan → Klik \"Lihat Detail\" → Klik \"Order Sekarang\" → Isi data diri → Bayar via QRIS → Hubungi admin untuk mendapatkan data akun." },
                    { q: "Apakah akun yang dijual aman?", a: "Ya! Semua akun yang kami jual sudah terverifikasi dan dilengkapi garansi lifetime. Jika ada masalah, kamu bisa langsung menghubungi admin kami." },
                    { q: "Metode pembayaran apa yang tersedia?", a: "Saat ini kami menerima pembayaran melalui QRIS yang bisa digunakan dari berbagai e-wallet dan mobile banking." },
                    { q: "Bagaimana jika akun bermasalah?", a: "Segera hubungi admin melalui WhatsApp. Kami akan membantu menyelesaikan masalah dan memberikan penggantian jika diperlukan." },
                    { q: "Apakah bisa refund?", a: "Refund bisa dilakukan jika akun tidak sesuai deskripsi atau bermasalah. Hubungi admin dalam waktu 24 jam setelah pembelian." },
                  ].map((faq, idx) => (
                    <div key={idx} className="rounded-xl bg-[#1a1a1a] border border-white/5 overflow-hidden">
                      <details className="group">
                        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-semibold text-white hover:bg-white/5 transition-colors list-none">
                          <span className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 rounded-full bg-[#ff2d2d]/10 items-center justify-center text-[10px] font-bold text-[#ff2d2d] shrink-0">{idx + 1}</span>
                            {faq.q}
                          </span>
                          <ChevronDown className="h-4 w-4 text-white/40 group-open:rotate-180 transition-transform shrink-0" />
                        </summary>
                        <div className="px-4 pb-3 pt-0">
                          <p className="text-xs text-[#8a8a8a] leading-relaxed pl-8">{faq.a}</p>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>

                {/* Contact Section */}
                <div className="rounded-xl border border-[#ff2d2d]/20 bg-gradient-to-br from-[#1a1a1a] to-[#0f0000] p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Hubungi Kami</h3>
                  <p className="text-xs text-[#8a8a8a] mb-4">Masih butuh bantuan? Silakan hubungi admin kami melalui:</p>
                  <div className="space-y-3">
                    {settings?.whatsappNumber && (
                      <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/15 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                          <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">WhatsApp</p>
                          <p className="text-[10px] text-white/50">Chat langsung dengan admin</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/30 ml-auto" />
                      </a>
                    )}
                    {settings?.telegramUsername && (
                      <a href={`https://t.me/${settings.telegramUsername.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Telegram</p>
                          <p className="text-[10px] text-white/50">{settings.telegramUsername}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/30 ml-auto" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== TUTORIAL PAGE ===== */}
          {activePage === "tutorial" && (
            <motion.div key="tutorial" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="py-6">
              <div className="px-3.5 max-w-lg mx-auto">
                <div className="text-center mb-6">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff2d2d]/10 mb-3">
                    <BookOpen className="h-7 w-7 text-[#ff2d2d]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Tutorial Beli Akun</h2>
                  <p className="text-sm text-[#8a8a8a] mt-1">Ikuti langkah-langkah berikut untuk membeli akun game</p>
                </div>

                {/* Step-by-step tutorial */}
                <div className="space-y-4 mb-6">
                  {[
                    { step: 1, title: "Pilih Game", desc: "Pilih kategori game yang kamu inginkan dari halaman utama. Klik pada ikon game untuk melihat daftar akun yang tersedia.", icon: <Gamepad2 className="h-5 w-5" /> },
                    { step: 2, title: "Pilih Akun", desc: "Browse daftar akun yang tersedia. Gunakan filter untuk menyortir berdasarkan harga, status, atau yang terbaru. Klik \"Lihat Detail\" untuk info lengkap.", icon: <Search className="h-5 w-5" /> },
                    { step: 3, title: "Order Akun", desc: "Setelah menemukan akun yang diinginkan, klik \"Order Sekarang\". Isi data diri kamu (nama lengkap, nomor WhatsApp, email opsional).", icon: <ShoppingCart className="h-5 w-5" /> },
                    { step: 4, title: "Bayar via QRIS", desc: "Lakukan pembayaran menggunakan QRIS. Scan kode QR yang muncul menggunakan e-wallet atau mobile banking. Pastikan nominal sesuai.", icon: <QrCode className="h-5 w-5" /> },
                    { step: 5, title: "Hubungi Admin", desc: "Setelah pembayaran berhasil, hubungi admin melalui WhatsApp untuk mendapatkan data akun. Admin akan memverifikasi dan mengirimkan data akun kamu.", icon: <MessageCircle className="h-5 w-5" /> },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-4"
                    >
                      {/* Step number with line */}
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#ff2d2d] to-[#ff6b00] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#ff2d2d]/20 shrink-0">
                          {item.step}
                        </div>
                        {idx < 4 && <div className="w-0.5 flex-1 bg-gradient-to-b from-[#ff2d2d]/40 to-[#ff2d2d]/10 my-1" />}
                      </div>
                      {/* Step content */}
                      <div className="flex-1 pb-4">
                        <div className="rounded-xl bg-[#1a1a1a] border border-white/5 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#ff2d2d]">{item.icon}</span>
                            <h4 className="text-sm font-bold text-white">{item.title}</h4>
                          </div>
                          <p className="text-xs text-[#8a8a8a] leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Tips section */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-900/10 p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-amber-300">Tips Penting</h4>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Selalu cek detail akun sebelum membeli",
                      "Pastikan nomor WhatsApp yang dimasukkan aktif",
                      "Simpan bukti pembayaran sebagai referensi",
                      "Segera hubungi admin jika ada masalah",
                      "Jangan bagikan data akun ke orang lain",
                    ].map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-amber-200/70">
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA to start buying */}
                <div className="text-center">
                  <Button onClick={() => navigateTo("home")} className="gap-2 bg-gradient-to-r from-[#ff2d2d] to-[#ff6b00] text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-[#ff2d2d]/20 text-base">
                    <Gamepad2 className="h-5 w-5" />Mulai Beli Akun
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ===== FILTER MODAL ===== */}
      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        priceMin={priceMin} priceMax={priceMax} sortBy={sortBy} filterStatus={filterStatus}
        setPriceMin={setPriceMin} setPriceMax={setPriceMax} setSortBy={setSortBy} setFilterStatus={setFilterStatus}
        onApply={handleApplyFilter} onReset={handleResetFilter}
        onQuickSort={(v) => setActiveSortBy(v as typeof activeSortBy)}
        onQuickStatusChange={(v) => setActiveFilterStatus(v)}
        onQuickPriceChange={(min, max) => { setActivePriceMin(min); setActivePriceMax(max); }}
        theme={currentTheme}
      />

      {/* ===== LIVE CHAT WIDGET ===== */}
      <LiveChatWidget sessionId={sessionId} theme={currentTheme} />

      {/* ===== SITE THEME SWITCHER ===== */}
      <SiteThemeSwitcher />

      {/* ===== BOTTOM NAV BAR (simplified - just home indicator on mobile) ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-30 vexa-tab-bar sm:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {[
            { id: "home" as PageView, label: "Beranda", icon: Home },
            { id: "cek-transaksi" as PageView, label: "Pesanan", icon: ClipboardList },
            { id: "keranjang" as PageView, label: "Keranjang", icon: ShoppingCart, badge: cartItems.length },
            { id: "bantuan" as PageView, label: "Bantuan", icon: HelpCircle },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button key={tab.id} onClick={() => navigateTo(tab.id)} className={`vexa-tab-item ${activePage === tab.id ? "active" : ""}`}>
                <div className="relative">
                  <TabIcon className="h-5 w-5" />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 vexa-badge min-w-4 h-3 px-0.5 text-[8px] flex items-center justify-center">{tab.badge}</span>
                  )}
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[#ff2d2d]/15 bg-[#0a0000] mt-auto">
        <div className="px-4 py-5">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              {settings?.whatsappNumber && (
                <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#25D366]/10 transition-colors active:scale-95" aria-label="WhatsApp">
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                </a>
              )}
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-pink-500/10 transition-colors active:scale-95" aria-label="Instagram">
                  <svg className="h-4 w-4 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {settings?.tiktokUrl && (
                <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95" aria-label="TikTok">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52V6.94a4.85 4.85 0 0 1-1-.25z"/></svg>
                </a>
              )}
              {settings?.youtubeUrl && (
                <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-500/10 transition-colors active:scale-95" aria-label="YouTube">
                  <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              )}
              {settings?.telegramUsername && (
                <a href={`https://t.me/${settings.telegramUsername.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-blue-500/10 transition-colors active:scale-95" aria-label="Telegram">
                  <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </a>
              )}
            </div>
            <p className="text-xs text-[#8a8a8a]">© 2025 {settings?.siteName || "RYYSENGTOR"}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ===== PRODUCT DETAIL DIALOG ===== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0f0000] border-white/10 text-white p-0">
          {detailProduct && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{detailProduct.name}</DialogTitle>
                <DialogDescription>Detail produk {detailProduct.name}</DialogDescription>
              </DialogHeader>

              {/* Detail Images */}
              <div className="relative">
                {(detailProduct as any).detailImages && (detailProduct as any).detailImages.length > 0 ? (
                  <Carousel opts={{ align: "center" }} className="w-full">
                    <CarouselContent>
                      {(detailProduct as any).detailImages.map((img: string, idx: number) => (
                        <CarouselItem key={idx}>
                          <div className="relative aspect-[4/5] bg-[#0a0a0a]">
                            <img src={img} alt={`${detailProduct.name} - Detail ${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0000] via-transparent to-transparent" />
                            {idx === 0 && (
                              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="absolute bottom-0 left-0 right-0 p-4">
                                <h2 className="text-white font-bold text-lg leading-tight drop-shadow-lg">{detailProduct.name}</h2>
                                <p className="text-[#ff2d2d] font-extrabold text-xl mt-1 drop-shadow-lg">{detailProduct.price > 0 ? formatRupiah(detailProduct.price) : "Gratis"}</p>
                              </motion.div>
                            )}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {(detailProduct as any).detailImages.length > 1 && (
                      <><CarouselPrevious className="left-2 bg-black/40 backdrop-blur-sm border-white/10 text-white hover:bg-black/60 h-8 w-8" /><CarouselNext className="right-2 bg-black/40 backdrop-blur-sm border-white/10 text-white hover:bg-black/60 h-8 w-8" /></>
                    )}
                  </Carousel>
                ) : detailProduct.images && detailProduct.images.length > 0 ? (
                  <Carousel opts={{ align: "center" }} className="w-full">
                    <CarouselContent>
                      {detailProduct.images.map((img, idx) => (
                        <CarouselItem key={idx}>
                          <div className="relative aspect-[4/5] bg-[#0a0a0a]">
                            <img src={img} alt={`${detailProduct.name} - ${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0000] via-transparent to-transparent" />
                            {idx === 0 && (
                              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="absolute bottom-0 left-0 right-0 p-4">
                                <h2 className="text-white font-bold text-lg leading-tight drop-shadow-lg">{detailProduct.name}</h2>
                                <p className="text-[#ff2d2d] font-extrabold text-xl mt-1 drop-shadow-lg">{detailProduct.price > 0 ? formatRupiah(detailProduct.price) : "Gratis"}</p>
                              </motion.div>
                            )}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {detailProduct.images.length > 1 && (
                      <><CarouselPrevious className="left-2 bg-black/40 backdrop-blur-sm border-white/10 text-white hover:bg-black/60 h-8 w-8" /><CarouselNext className="right-2 bg-black/40 backdrop-blur-sm border-white/10 text-white hover:bg-black/60 h-8 w-8" /></>
                    )}
                  </Carousel>
                ) : (
                  <div className="relative aspect-[4/5] bg-[#0a0a0a] flex items-center justify-center">
                    <span className="text-6xl opacity-50">{(detailProduct.category as { icon?: string })?.icon || "🎮"}</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0000] via-transparent to-transparent" />
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="absolute bottom-0 left-0 right-0 p-4">
                      <h2 className="text-white font-bold text-lg leading-tight drop-shadow-lg">{detailProduct.name}</h2>
                      <p className="text-[#ff2d2d] font-extrabold text-xl mt-1 drop-shadow-lg">{detailProduct.price > 0 ? formatRupiah(detailProduct.price) : "Gratis"}</p>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Detail Content */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  {detailProduct.isSold ? (
                    <Badge className="bg-[#8B0000]/20 text-[#ff2d2d] border-[#ff2d2d]/30 text-xs gap-1 font-bold"><X className="h-3 w-3" /> Akun Terjual</Badge>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs gap-1 font-bold"><CheckCircle2 className="h-3 w-3" /> Akun Ready</Badge>
                  )}
                  {detailProduct.category && typeof detailProduct.category === "object" && (
                    <Badge className="bg-[#1e3a5f]/60 text-[#06b6d4] border-[#06b6d4]/30 text-xs gap-1 font-bold">
                      {(detailProduct.category as { icon?: string }).icon} {(detailProduct.category as { name: string }).name}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#8a8a8a]">
                  <span className="font-mono bg-[#1a1a1a] px-2 py-1 rounded border border-white/5">{detailProduct.slug}</span>
                </div>

                <div className="rounded-xl bg-[#1a1a1a] p-4 border border-[#06b6d4]/20">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      {detailProduct.originalPrice && detailProduct.originalPrice > detailProduct.price && (
                        <p className="text-sm text-[#ff2d2d]/60 line-through font-medium">{formatRupiah(detailProduct.originalPrice)}</p>
                      )}
                      <p className="text-2xl font-extrabold text-white"><span className="text-[#06b6d4] text-lg">Rp </span>{detailProduct.price > 0 ? formatRupiah(detailProduct.price).replace("Rp ", "") : "Gratis"}</p>
                    </div>
                    {detailProduct.originalPrice && detailProduct.originalPrice > detailProduct.price && (
                      <Badge className="bg-[#06b6d4]/15 text-[#06b6d4] border-[#06b6d4]/20 text-[10px] font-bold">
                        Hemat {formatRupiah(detailProduct.originalPrice - detailProduct.price)}
                      </Badge>
                    )}
                  </div>
                </div>

                {!detailProduct.isSold && (
                  <div className="flex items-center gap-3 justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                      <Shield className="h-4 w-4 text-amber-400" /><span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Lifetime Guaranteed</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                      <Lock className="h-4 w-4 text-amber-400" /><span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">No Hack</span>
                    </div>
                  </div>
                )}

                {detailProduct.specs && detailProduct.specs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">⚙️</span>
                      <h3 className="text-sm font-semibold text-white">Spesifikasi Akun</h3>
                    </div>
                    <div className="rounded-xl border border-white/5 overflow-hidden bg-[#1a1a1a]">
                      {detailProduct.specs.map((spec, idx) => {
                        const specIcons: { color: string; icon: React.ReactNode }[] = [
                          { color: "bg-[#ff2d2d]", icon: <Handshake className="h-3.5 w-3.5 text-[#ff2d2d]" /> },
                          { color: "bg-blue-400", icon: <CircleDot className="h-3.5 w-3.5 text-blue-400" /> },
                          { color: "bg-emerald-400", icon: <Key className="h-3.5 w-3.5 text-emerald-400" /> },
                          { color: "bg-amber-400", icon: <Banknote className="h-3.5 w-3.5 text-amber-400" /> },
                          { color: "bg-purple-400", icon: <MessageCircle className="h-3.5 w-3.5 text-purple-400" /> },
                          { color: "bg-[#8B0000]", icon: <Flame className="h-3.5 w-3.5 text-[#ff2d2d]" /> },
                        ];
                        const iconSet = specIcons[idx % specIcons.length];
                        return (
                          <div key={idx} className={`flex items-center justify-between px-4 py-2.5 ${idx !== detailProduct.specs.length - 1 ? "border-b border-white/5" : ""}`}>
                            <div className="flex items-center gap-2.5">
                              <div className={`size-2 rounded-full ${iconSet.color}`} />
                              <span className="text-xs text-[#8a8a8a]">{spec.label}</span>
                            </div>
                            <span className="text-xs font-semibold text-white text-right max-w-[60%]">{spec.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {detailProduct.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Deskripsi</h3>
                    <p className="text-sm text-[#8a8a8a] leading-relaxed whitespace-pre-line">{detailProduct.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button className={`flex items-center gap-1.5 text-sm transition-colors ${likeData.userLikes.includes(detailProduct._id as string) ? "text-[#ff2d2d]" : "text-[#8a8a8a] hover:text-[#ff2d2d]"}`}
                    onClick={() => handleToggleLike(detailProduct._id as string)}>
                    <Heart className={`h-5 w-5 ${likeData.userLikes.includes(detailProduct._id as string) ? "fill-[#ff2d2d]" : ""}`} />
                    <span className="font-medium">{likeData.counts[detailProduct._id as string] ?? detailProduct.likes ?? 0} Suka</span>
                  </button>
                  <span className="flex items-center gap-1.5 text-sm text-[#8a8a8a]">
                    <Eye className="h-5 w-5" /><span>{detailProduct.views || 0}x dilihat</span>
                  </span>
                </div>

                {/* ===== REVIEW SECTION ===== */}
                {detailProduct && (
                  <ReviewSection
                    productId={detailProduct._id as string}
                    sessionId={sessionId}
                    theme={currentTheme}
                  />
                )}

                <div className="space-y-2 pt-2">
                  {!detailProduct.isSold ? (
                    <>
                      <Button onClick={() => handleBuyNow()} className="w-full gap-2 bg-gradient-to-r from-[#06b6d4] to-[#0284c7] text-white font-bold h-12 text-base shadow-lg shadow-cyan-500/20 rounded-xl">
                        <CreditCard className="h-5 w-5" />Order Sekarang
                      </Button>
                      <Button onClick={(e) => addToCart(detailProduct, e)} variant="outline" className="w-full gap-2 border-[#06b6d4]/40 text-[#06b6d4] hover:bg-[#06b6d4]/10 h-10 rounded-xl" disabled={isInCart(detailProduct._id as string)}>
                        <ShoppingCart className="h-4 w-4" />{isInCart(detailProduct._id as string) ? "Sudah di Keranjang" : "Tambah ke Keranjang"}
                      </Button>
                    </>
                  ) : (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#8B0000]/10 border border-[#ff2d2d]/20">
                        <X className="size-5 text-[#ff2d2d]" /><span className="text-[#ff2d2d] font-bold text-sm">Akun Sudah Terjual</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== CHECKOUT DIALOG ===== */}
      <Dialog open={checkoutOpen} onOpenChange={(open) => {
        if (!open && paymentPollingRef.current) { clearInterval(paymentPollingRef.current); paymentPollingRef.current = null; }
        setCheckoutOpen(open);
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[#0f0000] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#ff2d2d]">Checkout</DialogTitle>
            <DialogDescription className="text-[#8a8a8a]">{selectedProduct?.name || "Pembayaran akun game"}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between px-2 py-3">
            {checkoutSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-gradient-to-r from-[#ff2d2d] to-[#ff6b00] text-white" : "bg-white/10 text-[#8a8a8a]"}`}>
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                    </div>
                    <span className={`text-[10px] ${isActive ? "text-[#ff2d2d] font-bold" : "text-[#8a8a8a]"}`}>{step.label}</span>
                  </div>
                  {idx < checkoutSteps.length - 1 && (
                    <div className={`h-[2px] w-6 sm:w-10 mx-1 mb-4 ${idx < currentStepIndex ? "bg-emerald-500" : "bg-white/10"}`} />
                  )}
                </div>
              );
            })}
          </div>

          <Separator className="bg-[#ff2d2d]/15" />

          <AnimatePresence mode="wait">
            {checkoutStep === "data" && (
              <motion.div key="data" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 py-2">
                {selectedProduct && (
                  <div className="flex items-center gap-3 rounded-xl bg-[#1a1a1a] p-3 border border-[#ff2d2d]/20">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#0f0000]">
                      {selectedProduct.images && selectedProduct.images.length > 0 ? <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xl">🎮</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white line-clamp-1">{selectedProduct.name}</p>
                      <p className="text-sm font-extrabold text-white">{formatRupiah(selectedProduct.price)}</p>
                    </div>
                  </div>
                )}
                {/* ===== COUPON/VOUCHER INPUT ===== */}
                {selectedProduct && (
                  <CouponInput
                    totalAmount={selectedProduct.price}
                    onDiscountApplied={(discount, code, type) => {
                      toast.success(`Voucher ${code} diterapkan! Hemat ${type === 'percentage' ? `${discount}%` : formatRupiah(discount)}`);
                    }}
                    theme={currentTheme}
                  />
                )}
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label className="text-sm text-[#8a8a8a]">Nama Lengkap</Label><Input placeholder="Masukkan nama" value={formData.customerName} onChange={(e) => setFormData((p) => ({ ...p, customerName: e.target.value }))} className="bg-white/5 border-white/10 text-white placeholder:text-[#8a8a8a] focus:border-[#ff2d2d]/50 h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label className="text-sm text-[#8a8a8a]">Nomor WhatsApp</Label><Input placeholder="08xxxxxxxxxx" value={formData.customerWhatsapp} onChange={(e) => setFormData((p) => ({ ...p, customerWhatsapp: e.target.value }))} className="bg-white/5 border-white/10 text-white placeholder:text-[#8a8a8a] focus:border-[#ff2d2d]/50 h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label className="text-sm text-[#8a8a8a]">Email (opsional)</Label><Input placeholder="email@example.com" value={formData.customerEmail} onChange={(e) => setFormData((p) => ({ ...p, customerEmail: e.target.value }))} className="bg-white/5 border-white/10 text-white placeholder:text-[#8a8a8a] focus:border-[#ff2d2d]/50 h-11 rounded-xl" /></div>
                </div>
                <Button onClick={handleCreateTransaction} disabled={isCreatingTransaction} className="w-full gap-2 bg-gradient-to-r from-[#ff2d2d] to-[#ff6b00] text-white font-bold h-12 text-base shadow-lg shadow-[#ff2d2d]/20 rounded-xl">
                  {isCreatingTransaction ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw className="h-5 w-5" /></motion.div> : <ArrowRight className="h-5 w-5" />}
                  Lanjut Bayar
                </Button>
              </motion.div>
            )}

            {checkoutStep === "qris" && transactionData && (
              <motion.div key="qris" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-2">
                <PaymentQRIS
                  transactionId={transactionData.transactionId} qrImageUrl={transactionData.qrImageUrl} totalAmount={transactionData.totalAmount}
                  originalAmount={transactionData.originalAmount} uniqueNominal={transactionData.uniqueNominal} expiredAt={transactionData.expiredAt}
                  productName={transactionData.productName} productImage={transactionData.productImage}
                  adminWhatsappNumber={settings?.whatsappNumber} onClose={() => setCheckoutOpen(false)}
                />
              </motion.div>
            )}

            {checkoutStep === "success" && transactionData && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-4 sm:py-6">
                {showConfetti && (
                  <div className="pointer-events-none fixed inset-0 z-50">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="confetti-piece" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)], borderRadius: Math.random() > 0.5 ? "50%" : "0", width: `${6 + Math.random() * 8}px`, height: `${6 + Math.random() * 8}px` }} />
                    ))}
                  </div>
                )}
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }} className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/30">
                    <PartyPopper className="h-12 w-12 text-white" />
                  </div>
                  <motion.div className="absolute inset-0 rounded-full border-2 border-emerald-400" initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center">
                  <h3 className="text-xl font-bold text-emerald-400">Pembayaran Berhasil! 🎉</h3>
                  <p className="text-sm text-[#8a8a8a] mt-1">Terima kasih, pembayaran kamu sudah dikonfirmasi</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full rounded-xl border border-emerald-800/50 bg-emerald-900/20 p-3 text-center">
                  <p className="text-xs text-emerald-400/70 mb-0.5">Kode Transaksi</p>
                  <p className="font-mono text-sm font-bold text-emerald-300 tracking-wide">{transactionData.transactionId}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex items-center gap-3 rounded-xl border border-amber-800/50 bg-amber-900/20 p-3 w-full">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-emerald-900/40">
                    {transactionData.productImage ? <img src={transactionData.productImage} alt={transactionData.productName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xl">🎮</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-emerald-400 truncate">{transactionData.productName}</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatRupiah(transactionData.totalAmount)}</p>
                  </div>
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500"><CheckCircle2 className="h-4 w-4 text-white" /></div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="w-full rounded-xl bg-amber-900/20 border border-amber-800/50 p-3">
                  <p className="text-sm text-amber-300 text-center leading-relaxed">
                    <span className="font-semibold">📱 Langkah selanjutnya:</span><br />Silakan chat admin untuk mendapatkan data akun yang sudah di-order
                  </p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="w-full space-y-2.5">
                  {settings?.whatsappNumber && (
                    <a href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Halo admin, saya sudah melakukan pembayaran untuk akun ${transactionData.productName} dengan kode transaksi ${transactionData.transactionId}. Mohon kirim data akun saya. Terima kasih!`)}`} target="_blank" rel="noopener noreferrer" className="flex w-full">
                      <Button className="gap-2 w-full h-12 text-base font-semibold bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg shadow-green-500/25 rounded-xl"><WhatsAppIcon className="h-5 w-5" />Chat Admin via WhatsApp</Button>
                    </a>
                  )}
                  <Button variant="outline" onClick={handleCopyTransactionId} className="gap-2 w-full h-10 border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/20 rounded-xl"><Copy className="h-4 w-4" />Salin Kode Transaksi</Button>
                  <Button onClick={() => setCheckoutOpen(false)} variant="secondary" className="gap-1.5 w-full h-10 rounded-xl"><CheckCircle2 className="h-4 w-4" /> Selesai</Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
