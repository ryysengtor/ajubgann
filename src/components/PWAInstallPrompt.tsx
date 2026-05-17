"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSAL_KEY = "ryysengtor_pwa_dismissed";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const hasListened = useRef(false);

  useEffect(() => {
    // Don't show if previously dismissed
    if (localStorage.getItem(DISMISSAL_KEY) === "true") return;

    // Only set up listener once
    if (hasListened.current) return;
    hasListened.current = true;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
    } catch {
      // silently fail
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(DISMISSAL_KEY, "true");
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center"
        >
          <div
            className="w-full flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(15,0,0,0.97), rgba(26,26,26,0.97))",
              borderBottom: "1px solid rgba(255,45,45,0.3)",
              boxShadow: "0 4px 20px rgba(255,45,45,0.15)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Left: icon + text */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #ff2d2d, #ff6b00)",
                  boxShadow: "0 0 12px rgba(255,45,45,0.3)",
                }}
              >
                <Download className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm text-white/90 leading-snug truncate">
                Install RYYSENGTOR di perangkatmu untuk akses lebih cepat! 🚀
              </p>
            </div>

            {/* Right: buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all active:scale-[0.97]"
                style={{
                  background: "linear-gradient(90deg, #ff2d2d, #ff6b00)",
                  boxShadow: "0 0 10px rgba(255,45,45,0.3)",
                }}
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Tutup"
              >
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
