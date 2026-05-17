"use client";

import { motion } from "framer-motion";
import { TrendingDown, Crown, Flame, Sparkles, LayoutGrid } from "lucide-react";

interface ProductVariationTabsProps {
  activeSort: string;
  onSortChange: (sort: string) => void;
  theme: {
    accent: string;
    glow: string;
    border: string;
    btnFrom: string;
    btnTo: string;
  };
}

const SORT_OPTIONS = [
  { key: "default", label: "Semua", icon: LayoutGrid },
  { key: "price_asc", label: "Termurah", icon: TrendingDown },
  { key: "price_desc", label: "Termahal", icon: Crown },
  { key: "popular", label: "Terpopuler", icon: Flame },
  { key: "newest", label: "Terbaru", icon: Sparkles },
] as const;

export default function ProductVariationTabs({
  activeSort,
  onSortChange,
  theme,
}: ProductVariationTabsProps) {
  return (
    <div className="w-full">
      <div className="scroll-x-smooth flex items-center gap-2 pb-1">
        {SORT_OPTIONS.map((opt) => {
          const IconComp = opt.icon;
          const isActive = activeSort === opt.key;

          return (
            <motion.button
              key={opt.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSortChange(opt.key)}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0"
              style={
                isActive
                  ? {
                      background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`,
                      color: "#fff",
                      boxShadow: `0 0 12px ${theme.glow}`,
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.55)",
                      border: `1px solid ${theme.border}`,
                    }
              }
            >
              <IconComp className="h-3.5 w-3.5" />
              <span>{opt.label}</span>
              {isActive && (
                <motion.div
                  layoutId="variationTabIndicator"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`,
                    zIndex: -1,
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
