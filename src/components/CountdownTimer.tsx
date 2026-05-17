"use client";

import { useEffect, useState, useCallback } from "react";
import { Progress } from "@/components/ui/progress";

interface CountdownTimerProps {
  expiredAt: string | Date;
  onExpired?: () => void;
}

export default function CountdownTimer({
  expiredAt,
  onExpired,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [progressValue, setProgressValue] = useState(100);
  const [remainingSec, setRemainingSec] = useState(0);
  const [totalSec, setTotalSec] = useState(0);
  const [hasExpired, setHasExpired] = useState(false);

  const calculateTime = useCallback(() => {
    const expired = new Date(expiredAt);
    const now = new Date();
    const diff = expired.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeLeft({ minutes: 0, seconds: 0 });
      setProgressValue(0);
      setRemainingSec(0);
      setHasExpired((prev) => {
        if (!prev) {
          onExpired?.();
        }
        return true;
      });
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const remaining = diff / 1000;
    setTimeLeft({ minutes, seconds });
    setRemainingSec(remaining);
    setTotalSec((prev) => (prev > 0 ? prev : remaining));
  }, [expiredAt, onExpired]);

  useEffect(() => {
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [calculateTime]);

  const progress =
    totalSec > 0 ? (remainingSec / totalSec) * 100 : progressValue;
  const isUrgent = remainingSec > 0 && remainingSec < 60;
  const isWarning = remainingSec >= 60 && remainingSec < 180;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Waktu tersisa:</span>
        <span
          className={`font-mono text-lg font-bold tabular-nums ${
            isUrgent
              ? "countdown-urgent"
              : isWarning
                ? "countdown-warning"
                : "text-primary"
          }`}
        >
          {String(timeLeft.minutes).padStart(2, "0")}:
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>
      <Progress
        value={progress}
        className={`h-2 ${
          isUrgent
            ? "[&>div]:bg-red-500"
            : isWarning
              ? "[&>div]:bg-amber-500"
              : "[&>div]:bg-emerald-500"
        }`}
      />
    </div>
  );
}
