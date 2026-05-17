"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  CreditCard,
  Zap,
  Tag,
  Info,
  CheckCheck,
} from "lucide-react";

interface NotificationCenterProps {
  sessionId: string;
  theme: {
    accent: string;
    glow: string;
    border: string;
    btnFrom: string;
    btnTo: string;
  };
}

interface NotificationItem {
  _id: string;
  type: "transaction" | "flash_sale" | "coupon" | "system";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  transaction: CreditCard,
  flash_sale: Zap,
  coupon: Tag,
  system: Info,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  transaction: "#3b82f6",
  flash_sale: "#f59e0b",
  coupon: "#10b981",
  system: "#8b5cf6",
};

export default function NotificationCenter({ sessionId, theme }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/notifications?sessionId=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      if (data.data) {
        setNotifications(data.data);
        const unread = data.data.filter((n: NotificationItem) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) fetchNotifications();
  }, [sessionId, fetchNotifications]);

  // Poll every 15 seconds
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [sessionId, fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n._id);
      await Promise.all(unreadIds.map((id) => markAsRead(id)));
    } catch {
      // silent
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        aria-label="Notifikasi"
      >
        <Bell className="h-4 w-4 text-white/70" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1"
            style={{ background: theme.accent }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-[360px] max-h-[420px] rounded-2xl overflow-hidden flex flex-col z-50"
            style={{
              background: "linear-gradient(180deg, #1a1a1a, #111)",
              border: `1px solid ${theme.border}`,
              boxShadow: `0 0 20px ${theme.glow}, 0 8px 30px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" style={{ color: theme.accent }} />
                <span className="text-sm font-bold text-white">Notifikasi</span>
                {unreadCount > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: theme.accent }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 transition-colors"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Tandai semua dibaca
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="h-3 w-3 text-white/50" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="vexa-skeleton h-16 rounded-xl" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-10 w-10 text-white/10 mb-2" />
                  <p className="text-sm text-white/40">Tidak ada notifikasi</p>
                  <p className="text-xs text-white/20">Notifikasi akan muncul di sini</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notif, idx) => {
                    const IconComp = NOTIFICATION_ICONS[notif.type] || Info;
                    const iconColor = NOTIFICATION_COLORS[notif.type] || theme.accent;

                    return (
                      <motion.div
                        key={notif._id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => {
                          if (!notif.isRead) markAsRead(notif._id);
                          if (notif.link) window.open(notif.link, "_blank");
                        }}
                        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/3 transition-colors relative"
                        style={{
                          borderLeft: notif.isRead ? "none" : `3px solid ${theme.accent}`,
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${iconColor}15` }}
                        >
                          <IconComp className="h-4 w-4" style={{ color: iconColor }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-semibold leading-tight ${notif.isRead ? "text-white/60" : "text-white"}`}>
                              {notif.title}
                            </p>
                            <span className="text-[9px] text-white/25 shrink-0 mt-0.5">{formatTime(notif.createdAt)}</span>
                          </div>
                          <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                        </div>

                        {/* Unread dot */}
                        {!notif.isRead && (
                          <div className="absolute top-3 right-3 h-2 w-2 rounded-full" style={{ background: theme.accent }} />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
