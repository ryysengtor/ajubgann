"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Eye, Users, TrendingUp, Activity } from "lucide-react";

interface VisitorStatsProps {
  theme: {
    accent: string;
    glow: string;
    border: string;
    btnFrom: string;
    btnTo: string;
  };
}

interface StatsData {
  todayVisitors: number;
  totalVisitors: number;
  weeklyVisitors: number;
  onlineNow: number;
}

export default function VisitorStats({ theme }: VisitorStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    todayVisitors: 0,
    totalVisitors: 0,
    weeklyVisitors: 0,
    onlineNow: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/visitors");
      const data = await res.json();
      if (data.data) {
        setStats({
          todayVisitors: data.data.today || 0,
          totalVisitors: data.data.total || 0,
          weeklyVisitors: data.data.weekly || 0,
          onlineNow: data.data.online || 0,
        });
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const statItems = [
    { icon: Eye, label: "Hari Ini", value: stats.todayVisitors, color: theme.accent },
    { icon: Users, label: "Minggu Ini", value: stats.weeklyVisitors, color: "#10b981" },
    { icon: TrendingUp, label: "Total", value: stats.totalVisitors, color: "#f59e0b" },
    { icon: Activity, label: "Online", value: stats.onlineNow, color: "#3b82f6" },
  ];

  return (
    <div
      className="w-full rounded-xl p-4"
      style={{
        background: "linear-gradient(135deg, #1a1a1a, #111)",
        border: `1px solid ${theme.border}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4" style={{ color: theme.accent }} />
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          Statistik Pengunjung
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {statItems.map((item) => {
          const IconComp = item.icon;
          return (
            <motion.div
              key={item.label}
              className="flex flex-col items-center gap-1 p-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)" }}
              whileHover={{ scale: 1.05 }}
            >
              <IconComp className="h-3.5 w-3.5" style={{ color: item.color }} />
              <span className="text-base sm:text-lg font-extrabold text-white tabular-nums">
                {isLoading ? "—" : item.value}
              </span>
              <span className="text-[9px] text-white/40 text-center leading-tight">
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
