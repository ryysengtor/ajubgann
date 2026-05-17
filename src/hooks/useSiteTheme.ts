"use client";
import { useEffect, useCallback, useSyncExternalStore } from "react";

export const SITE_THEMES = {
  "crimson-blaze": {
    name: "Crimson Blaze",
    emoji: "🔥",
    accent: "#ff2d2d",
    glow: "rgba(255,45,45,0.3)",
    border: "rgba(255,80,80,0.35)",
    btnFrom: "#ff2d2d",
    btnTo: "#ff6b00",
    bgStart: "#170000",
    bgMid: "#230000",
    bgEnd: "#110000",
  },
  "purple-aurora": {
    name: "Purple Aurora",
    emoji: "💜",
    accent: "#a855f7",
    glow: "rgba(168,85,247,0.3)",
    border: "rgba(168,85,247,0.35)",
    btnFrom: "#a855f7",
    btnTo: "#7c3aed",
    bgStart: "#0e0520",
    bgMid: "#1a0d35",
    bgEnd: "#080315",
  },
  "emerald-forest": {
    name: "Emerald Forest",
    emoji: "🌿",
    accent: "#10b981",
    glow: "rgba(16,185,129,0.3)",
    border: "rgba(16,185,129,0.35)",
    btnFrom: "#10b981",
    btnTo: "#059669",
    bgStart: "#051510",
    bgMid: "#0d251a",
    bgEnd: "#030d08",
  },
  "ocean-blue": {
    name: "Ocean Blue",
    emoji: "🌊",
    accent: "#3b82f6",
    glow: "rgba(59,130,246,0.3)",
    border: "rgba(59,130,246,0.35)",
    btnFrom: "#3b82f6",
    btnTo: "#2563eb",
    bgStart: "#050b22",
    bgMid: "#101c45",
    bgEnd: "#050814",
  },
  "golden-sunset": {
    name: "Golden Sunset",
    emoji: "🌅",
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
    border: "rgba(245,158,11,0.35)",
    btnFrom: "#f59e0b",
    btnTo: "#d97706",
    bgStart: "#151510",
    bgMid: "#25230a",
    bgEnd: "#0d0c05",
  },
} as const;

export type SiteThemeKey = keyof typeof SITE_THEMES;
export const DEFAULT_SITE_THEME: SiteThemeKey = "crimson-blaze";

// Subscribe to storage events for cross-tab sync
let listeners: Array<() => void> = [];
function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
function emitChange() {
  for (const listener of listeners) listener();
}

function getSnapshot(): SiteThemeKey {
  const saved = localStorage.getItem("ryysengtor_site_theme") as SiteThemeKey | null;
  if (saved && SITE_THEMES[saved]) return saved;
  return DEFAULT_SITE_THEME;
}

function getServerSnapshot(): SiteThemeKey {
  return DEFAULT_SITE_THEME;
}

export function useSiteTheme() {
  const themeKey = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Apply CSS custom properties whenever themeKey changes
  useEffect(() => {
    const theme = SITE_THEMES[themeKey];
    const root = document.documentElement;
    root.style.setProperty("--theme-accent", theme.accent);
    root.style.setProperty("--theme-glow", theme.glow);
    root.style.setProperty("--theme-border", theme.border);
    root.style.setProperty("--theme-btn-from", theme.btnFrom);
    root.style.setProperty("--theme-btn-to", theme.btnTo);
  }, [themeKey]);

  const changeTheme = useCallback((key: SiteThemeKey) => {
    localStorage.setItem("ryysengtor_site_theme", key);
    emitChange();
  }, []);

  return { themeKey, theme: SITE_THEMES[themeKey], changeTheme, allThemes: SITE_THEMES };
}
