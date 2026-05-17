"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, User, Headphones } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LiveChatWidgetProps {
  sessionId: string;
  theme: {
    accent: string;
    glow: string;
    border: string;
    btnFrom: string;
    btnTo: string;
  };
}

interface ChatMessage {
  _id: string;
  sender: "visitor" | "admin";
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function LiveChatWidget({ sessionId, theme }: LiveChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<string>("");

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      const afterParam = lastFetchRef.current ? `&after=${lastFetchRef.current}` : "";
      const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(sessionId)}${afterParam}`);
      const data = await res.json();
      if (data.data) {
        const newMsgs: ChatMessage[] = data.data;
        if (newMsgs.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m._id));
            const filtered = newMsgs.filter((m: ChatMessage) => !existingIds.has(m._id));
            return [...prev, ...filtered];
          });
          lastFetchRef.current = newMsgs[newMsgs.length - 1].createdAt;

          // Count unread admin messages when chat is closed
          if (!isOpen) {
            const unreadAdmin = newMsgs.filter(
              (m: ChatMessage) => m.sender === "admin" && !m.isRead
            ).length;
            if (unreadAdmin > 0) {
              setUnreadCount((prev) => prev + unreadAdmin);
            }
          }
        }
      }
    } catch {
      // silent
    }
  }, [sessionId, isOpen]);

  // Initial fetch
  useEffect(() => {
    if (sessionId) fetchMessages();
  }, [sessionId, fetchMessages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [sessionId, fetchMessages]);

  // Reset unread on open
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          sender: "visitor",
          message: newMessage.trim(),
        }),
      });
      if (res.ok) {
        setNewMessage("");
        // Fetch immediately to show the sent message
        setTimeout(fetchMessages, 300);
      }
    } catch {
      // silent
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full flex items-center justify-center shadow-xl transition-all"
        style={{
          background: `linear-gradient(135deg, ${theme.btnFrom}, ${theme.btnTo})`,
          boxShadow: `0 0 20px ${theme.glow}, 0 4px 15px rgba(0,0,0,0.3)`,
        }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        aria-label="Buka chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-5 w-5 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="relative">
              <MessageCircle className="h-5 w-5 text-white" />
              {/* Pulse animation */}
              <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: theme.accent }} />
              {/* Unread badge */}
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-36 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[360px] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(180deg, #1a1a1a, #111)",
              border: `1px solid ${theme.border}`,
              boxShadow: `0 0 30px ${theme.glow}, 0 8px 30px rgba(0,0,0,0.5)`,
              maxHeight: "min(480px, 70vh)",
            }}
          >
            {/* Chat Header */}
            <div
              className="flex items-center justify-between p-3 shrink-0"
              style={{
                background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`,
              }}
            >
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-white" />
                <span className="text-sm font-bold text-white">Chat Admin</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[200px]">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <MessageCircle className="h-8 w-8 text-white/10 mb-2" />
                  <p className="text-xs text-white/30">Mulai percakapan dengan admin</p>
                </div>
              )}
              {messages.map((msg) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      msg.sender === "visitor" ? "rounded-br-md" : "rounded-bl-md"
                    }`}
                    style={
                      msg.sender === "visitor"
                        ? {
                            background: `linear-gradient(135deg, ${theme.btnFrom}, ${theme.btnTo})`,
                          }
                        : {
                            background: "rgba(255,255,255,0.06)",
                            border: `1px solid rgba(255,255,255,0.06)`,
                          }
                    }
                  >
                    {msg.sender === "admin" && (
                      <div className="flex items-center gap-1 mb-1">
                        <User className="h-3 w-3 text-green-400" />
                        <span className="text-[10px] font-bold text-green-400">Admin</span>
                      </div>
                    )}
                    <p className="text-xs text-white leading-relaxed">{msg.message}</p>
                    <p className={`text-[9px] mt-1 ${msg.sender === "visitor" ? "text-white/50" : "text-white/25"}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 shrink-0 border-t border-white/5">
              <div className="flex gap-2">
                <Input
                  placeholder="Ketik pesan..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 h-9 text-sm rounded-xl flex-1"
                  disabled={isSending}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-[0.95] disabled:opacity-40"
                  style={{
                    background: `linear-gradient(135deg, ${theme.btnFrom}, ${theme.btnTo})`,
                    boxShadow: `0 0 10px ${theme.glow}`,
                  }}
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
