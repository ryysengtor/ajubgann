'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, ShoppingBag, Package, Star, TrendingUp, TrendingDown,
  Eye, Heart, Loader2, BarChart3, ArrowUpRight, ArrowDownRight,
  CalendarDays,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// ─── Helpers ────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function formatDateChart(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(d);
}

// ─── Types ──────────────────────────────────────────────────────────

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCategories: number;
  totalReviews: number;
  revenueByDay: { date: string; revenue: number }[];
  topProducts: {
    _id: string;
    name: string;
    views: number;
    likes: number;
    price: number;
    category?: { name: string; slug: string };
  }[];
  recentTransactions: {
    _id: string;
    transactionId: string;
    productName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }[];
  visitorStats: { total: number; unique: number };
  period: string;
}

type Period = 'today' | 'week' | 'month';

interface PreviousPeriodData {
  totalRevenue: number;
  totalOrders: number;
}

// ─── API Helper ─────────────────────────────────────────────────────

async function adminFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  return res.json();
}

// ─── Status Badge ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    paid: { label: 'Paid', className: 'bg-[#ff2d2d]/10 text-[#ff2d2d] dark:bg-[#ff2d2d]/20 dark:text-[#ff2d2d] border-[#ff2d2d]/20 dark:border-[#ff2d2d]/30' },
    success: { label: 'Success', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' },
    expired: { label: 'Expired', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' },
    cancel: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
  };
  const v = variants[status] || { label: status, className: '' };
  return <Badge className={`${v.className} border font-medium`} variant="secondary">{v.label}</Badge>;
}

// ─── Skeleton ───────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a]">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="size-10 sm:size-12 rounded-xl bg-[#ff2d2d]/5 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-20 rounded bg-[#ff2d2d]/5 animate-pulse" />
            <div className="h-5 w-28 rounded bg-[#ff2d2d]/5 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonChart() {
  return (
    <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a]">
      <CardHeader className="pb-2">
        <div className="h-5 w-40 rounded bg-[#ff2d2d]/5 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full rounded-lg bg-[#ff2d2d]/5 animate-pulse" />
      </CardContent>
    </Card>
  );
}

function SkeletonTable() {
  return (
    <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a]">
      <CardHeader className="pb-2">
        <div className="h-5 w-40 rounded bg-[#ff2d2d]/5 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full rounded bg-[#ff2d2d]/5 animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Custom Tooltip ─────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#ff2d2d]/20 rounded-lg px-3 py-2 shadow-xl shadow-[#ff2d2d]/10">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-bold text-[#ff2d2d]">{formatRupiah(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

// ─── Main Component ─────────────────────────────────────────────────

export default function AnalyticsPanel() {
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousData, setPreviousData] = useState<PreviousPeriodData | null>(null);

  const fetchAnalytics = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/analytics?period=${p}`);
      if (res.data) {
        setData(res.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch previous period for trend comparison
  const fetchPreviousPeriod = useCallback(async (currentPeriod: Period) => {
    try {
      let prevPeriod: Period;
      switch (currentPeriod) {
        case 'today':
          prevPeriod = 'today'; // No easy previous "today", just skip
          return;
        case 'week':
          // Fetch month data and compare the first half vs second half
          prevPeriod = 'month';
          break;
        case 'month':
          prevPeriod = 'month';
          break;
        default:
          prevPeriod = 'week';
      }
      const res = await adminFetch(`/api/admin/analytics?period=${prevPeriod}`);
      if (res.data) {
        setPreviousData({
          totalRevenue: res.data.totalRevenue,
          totalOrders: res.data.totalOrders,
        });
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  useEffect(() => {
    fetchPreviousPeriod(period);
  }, [period, fetchPreviousPeriod]);

  // Calculate trend percentages
  const revenueTrend = previousData && data
    ? previousData.totalRevenue > 0
      ? ((data.totalRevenue - previousData.totalRevenue) / previousData.totalRevenue) * 100
      : data.totalRevenue > 0 ? 100 : 0
    : 0;

  const orderTrend = previousData && data
    ? previousData.totalOrders > 0
      ? ((data.totalOrders - previousData.totalOrders) / previousData.totalOrders) * 100
      : data.totalOrders > 0 ? 100 : 0
    : 0;

  // Average rating placeholder (API doesn't return avg rating, show total reviews)
  const avgRating = 0;

  const periodLabels: Record<Period, string> = {
    today: 'Hari Ini',
    week: 'Minggu Ini',
    month: 'Bulan Ini',
  };

  const periods: Period[] = ['today', 'week', 'month'];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-[#ff2d2d]" />
          <h2 className="text-lg font-semibold">Analytics Dashboard</h2>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0f0000] border border-[#ff2d2d]/10">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 min-h-[36px] ${
                period === p
                  ? 'bg-[#ff2d2d] text-[#0f0000] shadow-sm shadow-[#ff2d2d]/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[#ff2d2d]/5'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Pendapatan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a] hover:border-[#ff2d2d]/20 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 sm:size-12 items-center justify-center rounded-xl bg-[#ff2d2d]/10">
                    <DollarSign className="size-5 sm:size-6 text-[#ff2d2d]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Pendapatan</p>
                    <p className="text-lg sm:text-xl font-bold truncate">{formatRupiah(data?.totalRevenue || 0)}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {revenueTrend > 0 ? (
                        <>
                          <ArrowUpRight className="size-3 text-green-500" />
                          <span className="text-[10px] text-green-500 font-medium">+{revenueTrend.toFixed(1)}%</span>
                        </>
                      ) : revenueTrend < 0 ? (
                        <>
                          <ArrowDownRight className="size-3 text-red-500" />
                          <span className="text-[10px] text-red-500 font-medium">{revenueTrend.toFixed(1)}%</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Pesanan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a] hover:border-[#ff2d2d]/20 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 sm:size-12 items-center justify-center rounded-xl bg-green-500/10">
                    <ShoppingBag className="size-5 sm:size-6 text-green-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Pesanan</p>
                    <p className="text-xl sm:text-2xl font-bold">{data?.totalOrders || 0}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {orderTrend > 0 ? (
                        <>
                          <ArrowUpRight className="size-3 text-green-500" />
                          <span className="text-[10px] text-green-500 font-medium">+{orderTrend.toFixed(1)}%</span>
                        </>
                      ) : orderTrend < 0 ? (
                        <>
                          <ArrowDownRight className="size-3 text-red-500" />
                          <span className="text-[10px] text-red-500 font-medium">{orderTrend.toFixed(1)}%</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Produk */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a] hover:border-[#ff2d2d]/20 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 sm:size-12 items-center justify-center rounded-xl bg-blue-500/10">
                    <Package className="size-5 sm:size-6 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Produk</p>
                    <p className="text-xl sm:text-2xl font-bold">{data?.totalProducts || 0}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{data?.totalCategories || 0} kategori</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Review */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a] hover:border-[#ff2d2d]/20 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 sm:size-12 items-center justify-center rounded-xl bg-amber-500/10">
                    <Star className="size-5 sm:size-6 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Review</p>
                    <p className="text-xl sm:text-2xl font-bold">{data?.totalReviews || 0}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {avgRating > 0 ? (
                        <>
                          <Star className="size-3 text-amber-500 fill-amber-500" />
                          <span className="text-[10px] text-amber-500 font-medium">{avgRating.toFixed(1)} avg</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Belum ada rating</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Visitor Stats Row */}
      {!loading && data && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-[#0f0000] border border-[#ff2d2d]/10">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-[#ff2d2d]" />
              <span className="text-sm text-muted-foreground">Pengunjung {periodLabels[period]}:</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">{data.visitorStats?.total || 0}</span>
                <span className="text-xs text-muted-foreground">total</span>
              </div>
              <div className="w-px h-4 bg-[#ff2d2d]/10" />
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">{data.visitorStats?.unique || 0}</span>
                <span className="text-xs text-muted-foreground">unik</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Revenue Chart */}
      {loading ? (
        <SkeletonChart />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="size-5 text-[#ff2d2d]" />
                  Grafik Pendapatan
                </CardTitle>
                <span className="text-xs text-muted-foreground">{periodLabels[period]}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80 w-full">
                {(data?.revenueByDay && data.revenueByDay.length > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueByDay.map((d) => ({
                      ...d,
                      label: formatDateChart(d.date),
                    }))} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff2d2d" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ff2d2d" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ff2d2d" strokeOpacity={0.06} />
                      <XAxis
                        dataKey="label"
                        stroke="#666"
                        tick={{ fontSize: 11, fill: '#888' }}
                        axisLine={{ stroke: '#ff2d2d', strokeOpacity: 0.1 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#666"
                        tick={{ fontSize: 11, fill: '#888' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val: number) => {
                          if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                          if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                          return String(val);
                        }}
                        width={50}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#ff2d2d"
                        strokeWidth={2.5}
                        fill="url(#revenueGradient)"
                        dot={{ fill: '#ff2d2d', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#ff2d2d', stroke: '#0f0000', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <TrendingUp className="size-12 mb-2 opacity-20" />
                    <p className="text-sm">Belum ada data pendapatan untuk periode ini</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Two Column Layout: Top Products + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Products */}
        {loading ? (
          <SkeletonTable />
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Package className="size-5 text-[#ff2d2d]" />
                  Produk Terpopuler
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.topProducts && data.topProducts.length > 0) ? (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead className="text-center">Views</TableHead>
                            <TableHead className="text-center">Likes</TableHead>
                            <TableHead className="text-right">Harga</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.topProducts.map((prod, idx) => (
                            <TableRow key={prod._id || idx} className="hover:bg-[#ff2d2d]/5">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="flex size-6 items-center justify-center rounded-full bg-[#ff2d2d]/10 text-[10px] font-bold text-[#ff2d2d]">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm truncate max-w-[140px]">{prod.name}</p>
                                    {prod.category && typeof prod.category === 'object' && (
                                      <p className="text-[10px] text-muted-foreground">{prod.category.name}</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Eye className="size-3 text-muted-foreground" />
                                  <span className="text-sm">{prod.views || 0}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Heart className="size-3 text-muted-foreground" />
                                  <span className="text-sm">{prod.likes || 0}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm font-medium">{formatRupiah(prod.price)}</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-2 max-h-96 overflow-y-auto">
                      {data.topProducts.map((prod, idx) => (
                        <div key={prod._id || idx} className="flex items-center gap-3 p-3 rounded-lg bg-[#0f0000] border border-[#ff2d2d]/5">
                          <span className="flex size-7 items-center justify-center rounded-full bg-[#ff2d2d]/10 text-xs font-bold text-[#ff2d2d] shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{prod.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Eye className="size-3" /> {prod.views || 0}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Heart className="size-3" /> {prod.likes || 0}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-medium shrink-0">{formatRupiah(prod.price)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Package className="size-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Belum ada data produk</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Transactions */}
        {loading ? (
          <SkeletonTable />
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <ShoppingBag className="size-5 text-[#ff2d2d]" />
                  Transaksi Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.recentTransactions && data.recentTransactions.length > 0) ? (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tanggal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.recentTransactions.map((tx) => (
                            <TableRow key={tx._id} className="hover:bg-[#ff2d2d]/5">
                              <TableCell className="font-mono text-xs">{tx.transactionId?.slice(0, 8) || '-'}...</TableCell>
                              <TableCell className="max-w-[120px] truncate">{tx.productName}</TableCell>
                              <TableCell className="text-sm font-medium">{formatRupiah(tx.totalAmount)}</TableCell>
                              <TableCell><StatusBadge status={tx.status} /></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{formatDateShort(tx.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-2 max-h-96 overflow-y-auto">
                      {data.recentTransactions.map((tx) => (
                        <div key={tx._id} className="p-3 rounded-lg bg-[#0f0000] border border-[#ff2d2d]/5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{tx.productName}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{tx.transactionId?.slice(0, 12) || '-'}</p>
                            </div>
                            <StatusBadge status={tx.status} />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-bold text-[#ff2d2d]">{formatRupiah(tx.totalAmount)}</span>
                            <span className="text-[10px] text-muted-foreground">{formatDateShort(tx.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <ShoppingBag className="size-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Belum ada transaksi</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
