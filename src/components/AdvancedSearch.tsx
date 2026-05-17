"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Crown,
  Flame,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AdvancedSearchProps {
  categories: Array<{ _id: string; name: string; slug: string; icon: string; image?: string }>;
  onSearch: (params: {
    query: string;
    categories: string[];
    priceMin: string;
    priceMax: string;
    sort: string;
  }) => void;
  theme: {
    accent: string;
    glow: string;
    border: string;
    btnFrom: string;
    btnTo: string;
  };
}

const SORT_OPTIONS = [
  { key: "newest", label: "Terbaru", icon: Sparkles },
  { key: "price_asc", label: "Termurah", icon: TrendingDown },
  { key: "price_desc", label: "Termahal", icon: Crown },
  { key: "popular", label: "Terpopuler", icon: Flame },
] as const;

export default function AdvancedSearch({
  categories,
  onSearch,
  theme,
}: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };

  const handleSearch = () => {
    onSearch({
      query: query.trim(),
      categories: selectedCategories,
      priceMin,
      priceMax,
      sort,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setQuery("");
    setSelectedCategories([]);
    setPriceMin("");
    setPriceMax("");
    setSort("newest");
    onSearch({
      query: "",
      categories: [],
      priceMin: "",
      priceMax: "",
      sort: "newest",
    });
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label || "Terbaru";
  const CurrentSortIcon = SORT_OPTIONS.find((o) => o.key === sort)?.icon || Sparkles;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        aria-label="Pencarian lanjutan"
      >
        <SlidersHorizontal className="h-4 w-4 text-white/70" />
      </button>

      {/* Overlay + Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel - Bottom sheet on mobile, centered panel on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md"
            >
              <div
                className="w-full rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh]"
                style={{
                  background: "linear-gradient(180deg, #1a1a1a, #111)",
                  border: `1px solid ${theme.border}`,
                  boxShadow: `0 0 30px ${theme.glow}, 0 8px 30px rgba(0,0,0,0.5)`,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" style={{ color: theme.accent }} />
                    <span className="text-sm font-bold text-white">Pencarian Lanjutan</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-white/60" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
                  {/* Search Input */}
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cari Produk</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input
                        placeholder="Nama akun, game..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSearch();
                        }}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 h-10 pl-9 text-sm rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Category Filter Chips */}
                  {categories.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-white/70 mb-2 block">Kategori</label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => {
                          const isActive = selectedCategories.includes(cat.slug);
                          return (
                            <button
                              key={cat._id}
                              onClick={() => toggleCategory(cat.slug)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                isActive ? "text-white" : "text-white/50 hover:text-white/70"
                              }`}
                              style={
                                isActive
                                  ? {
                                      background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`,
                                      boxShadow: `0 0 8px ${theme.glow}`,
                                    }
                                  : {
                                      background: "rgba(255,255,255,0.04)",
                                      border: `1px solid rgba(255,255,255,0.08)`,
                                    }
                              }
                            >
                              <span className="text-sm">{cat.icon}</span>
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Price Range */}
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-2 block">Rentang Harga</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/40">Rp</span>
                          <Input
                            type="number"
                            placeholder="Minimal"
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 h-10 pl-9 text-sm rounded-xl"
                          />
                        </div>
                      </div>
                      <span className="text-white/25 text-xs">—</span>
                      <div className="flex-1">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/40">Rp</span>
                          <Input
                            type="number"
                            placeholder="Maksimal"
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 h-10 pl-9 text-sm rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Quick price presets */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        { label: "< 50K", min: "", max: "50000" },
                        { label: "50K-100K", min: "50000", max: "100000" },
                        { label: "100K-500K", min: "100000", max: "500000" },
                        { label: "500K+", min: "500000", max: "" },
                      ].map((preset) => {
                        const isActive = priceMin === preset.min && priceMax === preset.max;
                        return (
                          <button
                            key={preset.label}
                            onClick={() => {
                              if (isActive) {
                                setPriceMin("");
                                setPriceMax("");
                              } else {
                                setPriceMin(preset.min);
                                setPriceMax(preset.max);
                              }
                            }}
                            className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
                            style={
                              isActive
                                ? {
                                    background: theme.accent,
                                    color: "#fff",
                                    boxShadow: `0 0 6px ${theme.glow}`,
                                  }
                                : {
                                    background: "rgba(255,255,255,0.03)",
                                    color: "rgba(255,255,255,0.4)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                  }
                            }
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sort Dropdown */}
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-2 block">Urutkan</label>
                    <div className="relative">
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: `1px solid rgba(255,255,255,0.08)`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <CurrentSortIcon className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                          {currentSortLabel}
                        </div>
                        {showSortDropdown ? (
                          <ChevronUp className="h-4 w-4 text-white/40" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-white/40" />
                        )}
                      </button>
                      <AnimatePresence>
                        {showSortDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-10"
                            style={{
                              background: "#1a1a1a",
                              border: `1px solid ${theme.border}`,
                              boxShadow: `0 0 15px ${theme.glow}`,
                            }}
                          >
                            {SORT_OPTIONS.map((opt) => {
                              const Icon = opt.icon;
                              const isActive = sort === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  onClick={() => {
                                    setSort(opt.key);
                                    setShowSortDropdown(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors"
                                  style={{
                                    background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                                    color: isActive ? theme.accent : "rgba(255,255,255,0.6)",
                                  }}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  <span className={isActive ? "font-semibold" : "font-medium"}>{opt.label}</span>
                                  {isActive && (
                                    <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
                                  )}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/5 space-y-2 shrink-0">
                  <button
                    onClick={handleSearch}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`,
                      boxShadow: `0 0 16px ${theme.glow}`,
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Search className="h-4 w-4" />
                      Cari
                    </span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white/50 bg-white/3 hover:bg-white/5 transition-all"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
