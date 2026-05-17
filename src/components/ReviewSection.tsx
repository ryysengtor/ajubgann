"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, BadgeCheck, ChevronDown, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ReviewSectionProps {
  productId: string;
  sessionId: string;
  theme: {
    accent: string;
    glow: string;
    border: string;
    btnFrom: string;
    btnTo: string;
  };
}

interface ReviewItem {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

export default function ReviewSection({
  productId,
  sessionId,
  theme,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formName, setFormName] = useState("");
  const [formComment, setFormComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const PER_PAGE = 5;

  const fetchReviews = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}&page=${pageNum}&limit=${PER_PAGE}`);
      const data = await res.json();
      if (data.data) {
        if (append) {
          setReviews((prev) => [...prev, ...data.data.reviews]);
        } else {
          setReviews(data.data.reviews);
        }
        setAvgRating(data.data.averageRating || 0);
        setTotalReviews(data.data.total || 0);
        setRatingDistribution(data.data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        setHasMore(data.data.reviews.length === PER_PAGE);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const handleSubmitReview = async () => {
    if (!formName.trim() || !formComment.trim() || formRating === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          sessionId,
          customerName: formName.trim(),
          rating: formRating,
          comment: formComment.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        setFormRating(0);
        setFormName("");
        setFormComment("");
        fetchReviews(1);
      } else {
        alert(data.error || "Gagal mengirim review");
      }
    } catch {
      alert("Gagal mengirim review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const maxDistCount = Math.max(...Object.values(ratingDistribution), 1);

  return (
    <div className="w-full">
      {/* Rating Overview */}
      <div className="flex flex-col sm:flex-row gap-6 mb-6">
        {/* Big Rating Number */}
        <div className="flex flex-col items-center justify-center min-w-[100px]">
          <span className="text-4xl font-extrabold text-white">{avgRating.toFixed(1)}</span>
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`}
              />
            ))}
          </div>
          <span className="text-xs text-white/40 mt-1">{totalReviews} review</span>
        </div>

        {/* Rating Distribution Bars */}
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            const barWidth = maxDistCount > 0 ? (count / maxDistCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[11px] text-white/50 w-4 text-right">{star}</span>
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})` }}
                  />
                </div>
                <span className="text-[11px] text-white/40 w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review Button */}
      <Button
        onClick={() => setShowForm(!showForm)}
        className="w-full mb-4 rounded-xl font-bold text-sm h-10"
        style={{
          background: showForm ? "rgba(255,255,255,0.05)" : `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`,
          color: "#fff",
          boxShadow: showForm ? "none" : `0 0 12px ${theme.glow}`,
          border: showForm ? `1px solid ${theme.border}` : "none",
        }}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {showForm ? "Tutup Form" : "Tulis Review"}
      </Button>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-4"
          >
            <div
              className="p-4 rounded-xl space-y-4"
              style={{
                background: "linear-gradient(135deg, #1a1a1a, #111)",
                border: `1px solid ${theme.border}`,
              }}
            >
              {/* Star Rating */}
              <div>
                <label className="text-xs font-semibold text-white/70 mb-2 block">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          s <= (hoverRating || formRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-white/20"
                        }`}
                      />
                    </button>
                  ))}
                  {formRating > 0 && (
                    <span className="text-xs text-white/50 ml-2">{formRating}/5</span>
                  )}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="text-xs font-semibold text-white/70 mb-1.5 block">Nama</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    placeholder="Nama kamu"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 h-10 pl-9 text-sm rounded-xl"
                  />
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-xs font-semibold text-white/70 mb-1.5 block">Komentar</label>
                <Textarea
                  placeholder="Tulis pengalaman kamu..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 text-sm rounded-xl min-h-[80px] resize-none"
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmitting || !formName.trim() || !formComment.trim() || formRating === 0}
                className="w-full rounded-xl font-bold text-sm h-10"
                style={{
                  background: `linear-gradient(90deg, ${theme.btnFrom}, ${theme.btnTo})`,
                  color: "#fff",
                  boxShadow: `0 0 12px ${theme.glow}`,
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Mengirim..." : "Kirim Review"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="vexa-skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-10 w-10 text-white/15 mx-auto mb-2" />
          <p className="text-sm text-white/40">Belum ada review</p>
          <p className="text-xs text-white/25">Jadilah yang pertama memberikan review!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review, idx) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #1a1a1a, #111)",
                border: `1px solid ${theme.border}`,
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${theme.btnFrom}, ${theme.btnTo})` }}
                  >
                    {review.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">{review.customerName}</span>
                      {review.isVerified && (
                        <BadgeCheck className="h-3.5 w-3.5 text-green-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-white/15"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-white/30">{formatDate(review.createdAt)}</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{review.comment}</p>
            </motion.div>
          ))}

          {/* Load More */}
          {hasMore && (
            <button
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchReviews(nextPage, true);
              }}
              className="w-full py-3 rounded-xl text-xs font-semibold text-white/60 flex items-center justify-center gap-1.5 transition-all hover:text-white/80"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${theme.border}`,
              }}
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Lihat Lagi
            </button>
          )}
        </div>
      )}
    </div>
  );
}
