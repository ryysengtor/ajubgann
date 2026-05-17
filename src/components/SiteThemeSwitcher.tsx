"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette } from "lucide-react";
import { useSiteTheme, SITE_THEMES, type SiteThemeKey } from "@/hooks/useSiteTheme";

export default function SiteThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { themeKey, changeTheme } = useSiteTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const currentTheme = SITE_THEMES[themeKey];
  const themeEntries = Object.entries(SITE_THEMES) as [SiteThemeKey, (typeof SITE_THEMES)[SiteThemeKey]][];

  return (
    <div ref={panelRef} className="fixed bottom-20 left-4 z-50">
      {/* Theme popup panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-14 left-0 w-56 rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #1a1a1a, #111)",
              border: `1px solid ${currentTheme.border}`,
              boxShadow: `0 0 30px ${currentTheme.glow}, 0 8px 30px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Panel Header */}
            <div className="px-4 pt-3 pb-2 border-b border-white/5">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Site Theme
              </p>
            </div>

            {/* Theme options */}
            <div className="p-2 space-y-0.5">
              {themeEntries.map(([key, theme]) => {
                const isActive = key === themeKey;
                return (
                  <motion.button
                    key={key}
                    onClick={() => {
                      changeTheme(key);
                      // Don't close panel so user can preview multiple themes
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${theme.btnFrom}15, ${theme.btnTo}10)`
                        : "transparent",
                      border: isActive ? `1px solid ${theme.border}` : "1px solid transparent",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Color dot */}
                    <span
                      className="h-4 w-4 rounded-full shrink-0 ring-2 ring-white/10"
                      style={{
                        background: `linear-gradient(135deg, ${theme.btnFrom}, ${theme.btnTo})`,
                        boxShadow: isActive ? `0 0 8px ${theme.glow}` : "none",
                      }}
                    />
                    {/* Emoji + Name */}
                    <span className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-sm">{theme.emoji}</span>
                      <span
                        className={`text-sm truncate ${
                          isActive ? "font-bold text-white" : "font-medium text-white/60"
                        }`}
                      >
                        {theme.name}
                      </span>
                    </span>
                    {/* Active indicator */}
                    {isActive && (
                      <motion.span
                        layoutId="theme-active-dot"
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          background: theme.accent,
                          boxShadow: `0 0 6px ${theme.glow}`,
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-full flex items-center justify-center shadow-xl transition-all"
        style={{
          background: isOpen
            ? "rgba(255,255,255,0.1)"
            : `linear-gradient(135deg, ${currentTheme.btnFrom}, ${currentTheme.btnTo})`,
          boxShadow: `0 0 15px ${currentTheme.glow}, 0 4px 12px rgba(0,0,0,0.3)`,
        }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.08 }}
        aria-label="Switch site theme"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? "close" : "palette"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {isOpen ? (
              <span className="text-white text-sm font-bold">✕</span>
            ) : (
              <Palette className="h-4.5 w-4.5 text-white" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
