'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  LayoutDashboard, Package, FolderOpen, Receipt,
  Database, LogOut, Menu, X, Plus, Pencil, Trash2, Search,
  ChevronLeft, ChevronRight, Eye, RefreshCw, TrendingUp, DollarSign,
  Clock, CheckCircle2, ShieldCheck, Loader2, Moon, Sun, TreePine,
  ImagePlus, Upload, Star, Tag, ToggleLeft, AlertTriangle,
  ImageIcon, ExternalLink, Filter, Users, ShoppingBag, Zap,
  Instagram, Youtube, Facebook, Twitter, MessageCircle, Send,
  Bell, BellRing, QrCode, Wrench, Globe, Phone, AtSign, Palette,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import AnalyticsPanel from '@/components/admin/AnalyticsPanel';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// ─── Helpers ────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ─── Types ──────────────────────────────────────────────────────────

type Page = 'dashboard' | 'analytics' | 'products' | 'categories' | 'banners' | 'transactions' | 'flash-sales' | 'coupons' | 'reviews' | 'chat' | 'identitas' | 'kontak' | 'media-sosial' | 'notifikasi' | 'pembayaran' | 'maintenance';

interface CategoryData {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  description: string;
  order: number;
  isActive: boolean;
  accentColor: string;
  bgColor: string;
  bannerColor: string;
  glowColor: string;
  borderColor: string;
  theme: string;
  createdAt: string;
}

interface SpecItem {
  label: string;
  value: string;
}

interface ProductData {
  _id: string;
  name: string;
  slug: string;
  category: string | { _id: string; name: string; slug: string; icon: string };
  description: string;
  images: string[];
  detailImages: string[];
  specs: SpecItem[];
  price: number;
  originalPrice?: number;
  isActive: boolean;
  isFeatured: boolean;
  isSold: boolean;
  order: number;
  createdAt: string;
}

interface BannerData {
  _id: string;
  imageUrl: string;
  title: string;
  description: string;
  link: string;
  order: number;
  isActive: boolean;
  type: 'home' | 'product';
  category: string;
  createdAt: string;
}

interface TransactionData {
  _id: string;
  transactionId: string;
  cashifyTransactionId: string;
  productId: string | { _id: string; name: string; slug: string; images: string[] };
  productName: string;
  productImage: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerWhatsapp: string;
  originalAmount: number;
  totalAmount: number;
  uniqueNominal: number;
  status: 'pending' | 'paid' | 'success' | 'expired' | 'cancel';
  qrString?: string;
  qrImageUrl?: string;
  expiredAt: string;
  paidAt?: string;
  canceledAt?: string;
  createdAt: string;
}

interface SettingsData {
  _id: string;
  siteName: string;
  siteDescription: string;
  siteSlogan: string;
  logoUrl: string;
  ogImageUrl: string;
  whatsappNumber: string;
  telegramUsername: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  notifyWhatsApp: boolean;
  notifyTelegram: boolean;
  notifyOnPending: boolean;
  notifyOnSuccess: boolean;
  notifyOnExpired: boolean;
  notifyOnCancel: boolean;
  maintenanceMode: boolean;
  qrisExpiredMinutes: number;
}

interface DashboardStats {
  totalProducts: number;
  totalTransactions: number;
  totalRevenue: number;
  pendingTransactions: number;
}

// ─── API Helper ─────────────────────────────────────────────────────

async function adminFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

// ─── Image Upload Component (Enhanced) ──────────────────────────────

function ImageUploader({
  images,
  onImagesChange,
  maxImages = 6,
  aspect = 'square',
  label,
}: {
  images: string[];
  onImagesChange: (imgs: string[]) => void;
  maxImages?: number;
  aspect?: 'square' | 'wide' | 'portrait';
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectLabel = aspect === 'wide' ? '1080x1350' : '1080x1350';
  const displayLabel = label || (aspect === 'wide' ? 'Foto Detail (1080x1350)' : 'Foto Produk (1080x1350)');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > maxImages) {
      toast.error(`Maksimal ${maxImages} foto`);
      return;
    }
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await adminFetch('/api/upload', { method: 'POST', body: formData });
        if (res.data?.url) {
          newUrls.push(res.data.url);
        }
      }
      onImagesChange([...images, ...newUrls]);
      toast.success(`${newUrls.length} foto berhasil diupload`);
    } catch {
      toast.error('Gagal mengupload foto');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const url = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    try {
      await adminFetch(`/api/upload?file=${encodeURIComponent(url)}`, { method: 'DELETE' });
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="gap-2 min-h-[44px] w-full sm:w-auto border-[#ff2d2d]/30 hover:bg-[#ff2d2d]/10"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? 'Uploading...' : `Upload ${displayLabel}`}
        </Button>
        <span className="text-xs text-muted-foreground">{images.length}/{maxImages} foto — Aspect {aspectLabel}</span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleUpload}
      />
      {images.length > 0 && (
        <div className={`grid gap-3 ${aspect === 'square' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {images.map((img, i) => (
            <div key={i} className={`relative group rounded-lg overflow-hidden border border-border bg-muted aspect-[4/5]`}>
              <img src={img} alt={`${displayLabel} ${i + 1}`} className="w-full h-full object-cover" />
              {/* Always visible delete button overlay on mobile, hover on desktop */}
              <div className="absolute inset-0 bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="size-11"
                  onClick={() => removeImage(i)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              {i === 0 && (
                <Badge className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 bg-[#ff2d2d] text-[#0f0000] border-0">Utama</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single Image Uploader (for logo, banner) ───────────────────────

function SingleImageUploader({
  value,
  onChange,
  label = 'Upload Gambar',
  aspect = 'wide',
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: 'square' | 'wide' | 'banner';
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      const res = await adminFetch('/api/upload', { method: 'POST', body: formData });
      if (res.data?.url) {
        // Delete old image if replacing
        if (value) {
          try {
            await adminFetch(`/api/upload?file=${encodeURIComponent(value)}`, { method: 'DELETE' });
          } catch { /* silently fail */ }
        }
        onChange(res.data.url);
        toast.success('Gambar berhasil diupload');
      }
    } catch {
      toast.error('Gagal mengupload gambar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = async () => {
    if (value) {
      try {
        await adminFetch(`/api/upload?file=${encodeURIComponent(value)}`, { method: 'DELETE' });
      } catch { /* silently fail */ }
    }
    onChange('');
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="gap-2 min-h-[44px] w-full sm:w-auto border-[#ff2d2d]/30 hover:bg-[#ff2d2d]/10"
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {uploading ? 'Uploading...' : label}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleUpload}
      />
      {value && (
        <div className={`relative group rounded-lg overflow-hidden border border-border bg-muted ${aspect === 'square' ? 'w-32 h-32' : aspect === 'banner' ? 'w-full aspect-[4/1]' : 'w-full max-w-sm aspect-[20/9]'}`}>
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="size-11"
              onClick={removeImage}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Specs Editor Component ─────────────────────────────────────────

function SpecsEditor({ specs, onSpecsChange }: {
  specs: SpecItem[];
  onSpecsChange: (s: SpecItem[]) => void;
}) {
  const addSpec = () => onSpecsChange([...specs, { label: '', value: '' }]);
  const removeSpec = (i: number) => onSpecsChange(specs.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: 'label' | 'value', val: string) => {
    const updated = [...specs];
    updated[i] = { ...updated[i], [field]: val };
    onSpecsChange(updated);
  };

  return (
    <div className="space-y-3">
      {specs.map((spec, i) => (
        <div key={i} className="flex items-start gap-2 sm:items-center">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <Input
              placeholder="Label (contoh: Rank)"
              value={spec.label}
              onChange={(e) => updateSpec(i, 'label', e.target.value)}
              className="flex-1 min-h-[44px]"
            />
            <Input
              placeholder="Value (contoh: Mythic)"
              value={spec.value}
              onChange={(e) => updateSpec(i, 'value', e.target.value)}
              className="flex-1 min-h-[44px]"
            />
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0 text-[#ff2d2d] hover:text-[#b81c1c]" onClick={() => removeSpec(i)}>
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addSpec} className="gap-2 min-h-[44px] w-full sm:w-auto">
        <Plus className="size-4" /> Tambah Spesifikasi
      </Button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function AdminPanel() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Scroll state — using direct DOM manipulation (no React state for zero re-renders)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  // Data states
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Pagination for products
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(1);

  // Transaction filters
  const [txStatus, setTxStatus] = useState<string>('all');
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Product form
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', slug: '', category: '', description: '', price: 0, originalPrice: 0,
    isActive: true, isFeatured: false, isSold: false, order: 0,
  });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productDetailImages, setProductDetailImages] = useState<string[]>([]);
  const [productSpecs, setProductSpecs] = useState<SpecItem[]>([]);

  // Category form
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '', slug: '', icon: '🎮', image: '', description: '', order: 0, isActive: true,
    accentColor: '#ff2d2d', bgColor: '#170000', bannerColor: '#ff2d2d', glowColor: 'rgba(255,45,45,0.3)', borderColor: 'rgba(255,80,80,0.35)', theme: 'default',
  });

  // Banner form
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    imageUrl: '', title: '', description: '', link: '', order: 0, isActive: true,
    type: 'home' as 'home' | 'product', category: '',
  });
  const [bannerTab, setBannerTab] = useState<'home' | 'product'>('home');

  // Transaction detail
  const [txDetailOpen, setTxDetailOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionData | null>(null);
  const [txStatusUpdate, setTxStatusUpdate] = useState('');

  // Real-time polling
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTxStatusesRef = useRef<Record<string, string>>({});
  const liveIndicatorRef = useRef<HTMLDivElement | null>(null);
  const selectedTxRef = useRef<TransactionData | null>(null);
  const txDetailOpenRef = useRef(false);
  const txStatusUpdateRef = useRef('');
  const lastTxHashRef = useRef<string>('');

  // Keep refs in sync
  useEffect(() => { selectedTxRef.current = selectedTx; }, [selectedTx]);
  useEffect(() => { txDetailOpenRef.current = txDetailOpen; }, [txDetailOpen]);
  useEffect(() => { txStatusUpdateRef.current = txStatusUpdate; }, [txStatusUpdate]);

  // Scroll listener for admin content area — use ref + DOM class toggle for zero re-renders
  const headerRef = useRef<HTMLElement | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!token) return;
    const el = scrollAreaRef.current;
    if (el) {
      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            const scrolled = el.scrollTop > 10;
            if (headerRef.current) {
              headerRef.current.classList.toggle('admin-scrolled', scrolled);
            }
            ticking = false;
          });
        }
      };
      el.addEventListener('scroll', handleScroll, { passive: true });
      scrollHandlerRef.current = handleScroll;
      return () => {
        el.removeEventListener('scroll', handleScroll);
        scrollHandlerRef.current = null;
      };
    }
  }, [token, currentPage]);

  // Delete confirmations
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'category' | 'banner'; id: string; name: string } | null>(null);

  // Seed confirm
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

  // Settings loading
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Public settings for login screen & branding (fetched before auth)
  const [publicSettings, setPublicSettings] = useState<{ siteName: string; logoUrl: string }>({ siteName: 'Craig Of The Creek', logoUrl: '/logo.svg' });

  // ─── Mount check ──────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem('admin_token');
    setToken(t);
    setIsLoading(false);
    // Fetch public settings for branding (no auth needed)
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setPublicSettings({
            siteName: data.data.siteName || 'Craig Of The Creek',
            logoUrl: data.data.logoUrl || '/logo.svg',
          });
        }
      })
      .catch(() => {});
  }, []);

  // ─── Login ─────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await adminFetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      if (res.data?.token) {
        localStorage.setItem('admin_token', res.data.token);
        setToken(res.data.token);
        toast.success('Login berhasil!', { description: 'Selamat datang di Admin Panel' });
      } else {
        toast.error('Login gagal', { description: res.error || 'Username atau password salah' });
      }
    } catch {
      toast.error('Login gagal', { description: 'Terjadi kesalahan koneksi' });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    toast.success('Berhasil logout');
  };

  // ─── Fetch Dashboard ───────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    try {
      const [txRes, prodRes] = await Promise.all([
        adminFetch('/api/admin/transactions?limit=1000'),
        adminFetch('/api/admin/products?limit=1000'),
      ]);
      const allTx: TransactionData[] = txRes.data?.transactions || [];
      const allProd: ProductData[] = prodRes.data?.products || [];
      const totalRevenue = allTx.filter((t: TransactionData) => t.status === 'paid' || t.status === 'success').reduce((sum: number, t: TransactionData) => sum + t.totalAmount, 0);
      const pendingTx = allTx.filter((t: TransactionData) => t.status === 'pending').length;
      setDashboardStats({
        totalProducts: allProd.length,
        totalTransactions: allTx.length,
        totalRevenue,
        pendingTransactions: pendingTx,
      });
      setTransactions(allTx.slice(0, 10));
    } catch {
      // silently fail
    }
  }, []);

  // ─── Fetch Products ────────────────────────────────────
  const fetchProducts = useCallback(async (page = 1) => {
    try {
      const res = await adminFetch(`/api/admin/products?page=${page}&limit=10`);
      setProducts(res.data?.products || []);
      setProductTotal(res.data?.pagination?.total || 0);
      setProductTotalPages(res.data?.pagination?.totalPages || 1);
      setProductPage(page);
    } catch {
      // silently fail
    }
  }, []);

  // ─── Fetch Categories ──────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/categories');
      setCategories(res.data || []);
    } catch {
      // silently fail
    }
  }, []);

  // ─── Fetch Banners ─────────────────────────────────────
  const fetchBanners = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/banners');
      setBanners(res.data || []);
    } catch {
      // silently fail
    }
  }, []);

  // ─── Fetch Transactions ────────────────────────────────
  const fetchTransactions = useCallback(async (page = 1, status = 'all', search = '') => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (status && status !== 'all') params.set('status', status);
      if (search) params.set('search', search);
      const res = await adminFetch(`/api/admin/transactions?${params.toString()}`);
      setTransactions(res.data?.transactions || []);
      setTxTotal(res.data?.pagination?.total || 0);
      setTxTotalPages(res.data?.pagination?.totalPages || 1);
      setTxPage(page);
    } catch {
      // silently fail
    }
  }, []);

  // ─── Fetch Settings ────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/settings');
      setSettings(res.data);
    } catch {
      // silently fail
    }
  }, []);

  // ─── Real-time polling for transactions ────────────────
  // Use refs for values needed in polling to keep callback stable
  const currentPageRef = useRef(currentPage);
  const txPageRef = useRef(txPage);
  const txStatusRef = useRef(txStatus);
  const txSearchRef = useRef(txSearch);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => { txPageRef.current = txPage; }, [txPage]);
  useEffect(() => { txStatusRef.current = txStatus; }, [txStatus]);
  useEffect(() => { txSearchRef.current = txSearch; }, [txSearch]);

  const pollTransactions = useCallback(async () => {
    if (!token) return;
    // Only poll when on dashboard or transactions page
    const page = currentPageRef.current;
    if (page !== 'dashboard' && page !== 'transactions') return;
    try {
      // Fetch all transactions for status change detection + stats
      const res = await adminFetch('/api/admin/transactions?limit=1000');
      const allTx: TransactionData[] = res.data?.transactions || [];

      // Detect status changes
      const currentStatuses: Record<string, string> = {};
      allTx.forEach((tx: TransactionData) => {
        currentStatuses[tx._id] = tx.status;
      });

      const prevStatuses = prevTxStatusesRef.current;
      // Check for status changes (only if we have previous data)
      if (Object.keys(prevStatuses).length > 0) {
        allTx.forEach((tx: TransactionData) => {
          const prevStatus = prevStatuses[tx._id];
          const newStatus = tx.status;
          if (prevStatus && prevStatus !== newStatus) {
            const statusLabels: Record<string, string> = {
              pending: 'Pending', paid: 'Paid', success: 'Sukses', expired: 'Expired', cancel: 'Dibatalkan',
            };
            const statusEmoji: Record<string, string> = {
              pending: '⏳', paid: '💰', success: '✅', expired: '⌛', cancel: '❌',
            };
            const newStatusEmoji = statusEmoji[newStatus] || '🔄';
            if (newStatus === 'paid' || newStatus === 'success') {
              toast.success(`${newStatusEmoji} Transaksi ${tx.transactionId.slice(0, 12)}...: ${statusLabels[prevStatus]} → ${statusLabels[newStatus]}`, {
                description: `${tx.productName} - ${tx.customerName} - ${formatRupiah(tx.totalAmount)}`,
                duration: 8000,
              });
            } else if (newStatus === 'expired') {
              toast.warning(`${newStatusEmoji} Transaksi ${tx.transactionId.slice(0, 12)}...: ${statusLabels[prevStatus]} → ${statusLabels[newStatus]}`, {
                description: `${tx.productName} - ${tx.customerName}`,
                duration: 6000,
              });
            } else if (newStatus === 'cancel') {
              toast.error(`${newStatusEmoji} Transaksi ${tx.transactionId.slice(0, 12)}...: ${statusLabels[prevStatus]} → ${statusLabels[newStatus]}`, {
                description: `${tx.productName} - ${tx.customerName}`,
                duration: 6000,
              });
            } else {
              toast.info(`${newStatusEmoji} Transaksi ${tx.transactionId.slice(0, 12)}...: ${statusLabels[prevStatus]} → ${statusLabels[newStatus]}`, {
                description: `${tx.productName} - ${tx.customerName}`,
                duration: 6000,
              });
            }
          }
        });
      }
      prevTxStatusesRef.current = currentStatuses;

      // Only update state if data actually changed
      const totalRevenue = allTx.filter((t: TransactionData) => t.status === 'paid' || t.status === 'success').reduce((sum: number, t: TransactionData) => sum + t.totalAmount, 0);
      const pendingTx = allTx.filter((t: TransactionData) => t.status === 'pending').length;

      setDashboardStats(prev => {
        if (prev &&
          prev.totalTransactions === allTx.length &&
          prev.totalRevenue === totalRevenue &&
          prev.pendingTransactions === pendingTx
        ) return prev; // Skip re-render if nothing changed
        return {
          totalProducts: prev?.totalProducts || 0,
          totalTransactions: allTx.length,
          totalRevenue,
          pendingTransactions: pendingTx,
        };
      });

      // Create a lightweight hash to check if transaction data actually changed
      const txHash = allTx.map(t => `${t._id}:${t.status}`).join('|');
      const dataChanged = txHash !== lastTxHashRef.current;
      lastTxHashRef.current = txHash;

      // Update the transactions list based on current page — only if data changed
      if (dataChanged) {
        if (page === 'dashboard') {
          setTransactions(allTx.slice(0, 10));
        } else if (page === 'transactions') {
          const currentStatus = txStatusRef.current;
          const currentSearch = txSearchRef.current;
          const currentPageNum = txPageRef.current;
          // Apply filters locally from the already-fetched allTx
          let filtered = [...allTx];
          if (currentStatus && currentStatus !== 'all') {
            filtered = filtered.filter((t: TransactionData) => t.status === currentStatus);
          }
          if (currentSearch) {
            const q = currentSearch.toLowerCase();
            filtered = filtered.filter((t: TransactionData) =>
              t.transactionId.toLowerCase().includes(q) ||
              (t.cashifyTransactionId || '').toLowerCase().includes(q) ||
              t.customerName.toLowerCase().includes(q) ||
              (t.customerPhone || '').toLowerCase().includes(q) ||
              t.productName.toLowerCase().includes(q)
            );
          }
          const total = filtered.length;
          const totalPages = Math.ceil(total / 10) || 1;
          const paged = filtered.slice((currentPageNum - 1) * 10, currentPageNum * 10);
          setTransactions(paged);
          setTxTotal(total);
          setTxTotalPages(totalPages);
        }
      }

      // Update selectedTx in detail dialog if open (use refs to avoid dependency issues)
      if (txDetailOpenRef.current && selectedTxRef.current) {
        const updatedTx = allTx.find((t: TransactionData) => t._id === selectedTxRef.current!._id);
        if (updatedTx && updatedTx.status !== selectedTxRef.current.status) {
          setSelectedTx(updatedTx);
          if (updatedTx.status !== txStatusUpdateRef.current) {
            setTxStatusUpdate(updatedTx.status);
          }
        }
      }

      // Flash live indicator briefly via DOM (zero React re-renders)
      const liveEl = liveIndicatorRef.current;
      if (liveEl) {
        liveEl.classList.add('live-active');
        setTimeout(() => liveEl.classList.remove('live-active'), 500);
      }
    } catch {
      // silent
    }
  }, [token]); // Stable dependency — only token changes

  // Start/stop polling
  useEffect(() => {
    if (!token) return;
    pollTransactions();
    pollingRef.current = setInterval(pollTransactions, 8000); // 8 seconds instead of 5
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [token, pollTransactions]);

  // ─── Load data based on page ───────────────────────────
  useEffect(() => {
    if (!token) return;
    if (currentPage === 'dashboard') fetchDashboard();
    else if (currentPage === 'products') { fetchProducts(1); fetchCategories(); }
    else if (currentPage === 'categories') fetchCategories();
    else if (currentPage === 'banners') { fetchBanners(); fetchCategories(); }
    else if (currentPage === 'transactions') fetchTransactions(1, txStatus, txSearch);
    else if (['identitas', 'kontak', 'media-sosial', 'notifikasi', 'pembayaran', 'maintenance'].includes(currentPage)) fetchSettings();
  }, [token, currentPage]);

  // ─── Product CRUD ──────────────────────────────────────
  const openProductForm = (product?: ProductData) => {
    if (product) {
      setEditingProduct(product);
      const catId = typeof product.category === 'object' ? product.category._id : product.category;
      setProductForm({
        name: product.name,
        slug: product.slug,
        category: catId,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice || 0,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isSold: product.isSold,
        order: product.order,
      });
      setProductImages([...(product.images || [])]);
      setProductDetailImages([...(product.detailImages || [])]);
      setProductSpecs([...product.specs]);
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '', slug: '', category: '', description: '', price: 0, originalPrice: 0,
        isActive: true, isFeatured: false, isSold: false, order: 0,
      });
      setProductImages([]);
      setProductDetailImages([]);
      setProductSpecs([{ label: '', value: '' }]);
    }
    setProductDialogOpen(true);
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.slug || !productForm.category || !productForm.price) {
      toast.error('Mohon isi field wajib: Nama, Slug, Kategori, Harga');
      return;
    }
    setSavingProduct(true);
    try {
      const payload = {
        ...productForm,
        images: productImages,
        detailImages: productDetailImages,
        specs: productSpecs.filter(s => s.label && s.value),
      };
      if (editingProduct) {
        await adminFetch('/api/admin/products', { method: 'PUT', body: JSON.stringify({ id: editingProduct._id, ...payload }) });
        toast.success('Produk berhasil diupdate');
      } else {
        await adminFetch('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Produk berhasil ditambahkan');
      }
      setProductDialogOpen(false);
      fetchProducts(productPage);
    } catch (err) {
      toast.error('Gagal menyimpan produk', { description: String(err) });
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await adminFetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      toast.success('Produk berhasil dihapus');
      setDeleteTarget(null);
      fetchProducts(productPage);
    } catch (err) {
      toast.error('Gagal menghapus produk', { description: String(err) });
    }
  };

  // ─── Category CRUD ─────────────────────────────────────
  const openCategoryForm = (category?: CategoryData) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name, slug: category.slug, icon: category.icon, image: category.image, description: category.description, order: category.order, isActive: category.isActive,
        accentColor: category.accentColor || '#ff2d2d', bgColor: category.bgColor || '#170000', bannerColor: category.bannerColor || '#ff2d2d', glowColor: category.glowColor || 'rgba(255,45,45,0.3)', borderColor: category.borderColor || 'rgba(255,80,80,0.35)', theme: category.theme || 'default',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', slug: '', icon: '🎮', image: '', description: '', order: 0, isActive: true,
        accentColor: '#ff2d2d', bgColor: '#170000', bannerColor: '#ff2d2d', glowColor: 'rgba(255,45,45,0.3)', borderColor: 'rgba(255,80,80,0.35)', theme: 'default',
      });
    }
    setCategoryDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name || !categoryForm.slug) {
      toast.error('Mohon isi Nama dan Slug');
      return;
    }
    setSavingCategory(true);
    try {
      if (editingCategory) {
        await adminFetch('/api/admin/categories', { method: 'PUT', body: JSON.stringify({ id: editingCategory._id, ...categoryForm }) });
        toast.success('Kategori berhasil diupdate');
      } else {
        await adminFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify(categoryForm) });
        toast.success('Kategori berhasil ditambahkan');
      }
      setCategoryDialogOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error('Gagal menyimpan kategori', { description: String(err) });
    } finally {
      setSavingCategory(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await adminFetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      toast.success('Kategori berhasil dihapus');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error('Gagal menghapus kategori', { description: String(err) });
    }
  };

  // ─── Banner CRUD ───────────────────────────────────────
  const openBannerForm = (banner?: BannerData) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({ imageUrl: banner.imageUrl, title: banner.title, description: banner.description, link: banner.link, order: banner.order, isActive: banner.isActive, type: banner.type || 'home', category: banner.category || '' });
    } else {
      setEditingBanner(null);
      setBannerForm({ imageUrl: '', title: '', description: '', link: '', order: 0, isActive: true, type: bannerTab, category: '' });
    }
    setBannerDialogOpen(true);
  };

  const saveBanner = async () => {
    if (!bannerForm.imageUrl) {
      toast.error('Mohon upload gambar banner');
      return;
    }
    if (bannerForm.type === 'product' && !bannerForm.category) {
      toast.error('Pilih kategori untuk banner produk');
      return;
    }
    setSavingBanner(true);
    try {
      if (editingBanner) {
        await adminFetch('/api/admin/banners', { method: 'PUT', body: JSON.stringify({ id: editingBanner._id, ...bannerForm }) });
        toast.success('Banner berhasil diupdate');
      } else {
        await adminFetch('/api/admin/banners', { method: 'POST', body: JSON.stringify(bannerForm) });
        toast.success('Banner berhasil ditambahkan');
      }
      setBannerDialogOpen(false);
      fetchBanners();
    } catch (err) {
      toast.error('Gagal menyimpan banner', { description: String(err) });
    } finally {
      setSavingBanner(false);
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      await adminFetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
      toast.success('Banner berhasil dihapus');
      setDeleteTarget(null);
      fetchBanners();
    } catch (err) {
      toast.error('Gagal menghapus banner', { description: String(err) });
    }
  };

  // ─── Transaction actions ───────────────────────────────
  const openTxDetail = (tx: TransactionData) => {
    setSelectedTx(tx);
    setTxStatusUpdate(tx.status);
    setTxDetailOpen(true);
  };

  const updateTxStatus = async () => {
    if (!selectedTx || !txStatusUpdate) return;
    try {
      await adminFetch('/api/admin/transactions', { method: 'PUT', body: JSON.stringify({ id: selectedTx._id, status: txStatusUpdate }) });
      toast.success('Status transaksi berhasil diupdate');
      setTxDetailOpen(false);
      if (currentPage === 'transactions') fetchTransactions(txPage, txStatus, txSearch);
      else fetchDashboard();
    } catch (err) {
      toast.error('Gagal mengupdate status', { description: String(err) });
    }
  };

  // ─── Settings save ─────────────────────────────────────
  const saveSettings = async () => {
    if (!settings) return;
    setSettingsLoading(true);
    try {
      const { _id, createdAt, updatedAt, ...rest } = settings as SettingsData & { createdAt?: string; updatedAt?: string };
      void _id; void createdAt; void updatedAt;
      await adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(rest) });
      toast.success('Pengaturan berhasil disimpan');
      fetchSettings();
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan', { description: String(err) });
    } finally {
      setSettingsLoading(false);
    }
  };

  // ─── Seed DB ───────────────────────────────────────────
  const seedDatabase = async () => {
    setSeedLoading(true);
    try {
      const res = await adminFetch('/api/seed', { method: 'POST' });
      if (res.status === 201 || res.status === 200) {
        toast.success('Database berhasil di-seed!', { description: `${res.data?.categories} kategori, ${res.data?.products} produk` });
      } else {
        toast.error('Gagal seed database', { description: res.error || 'Unknown error' });
      }
    } catch (err) {
      toast.error('Gagal seed database', { description: String(err) });
    } finally {
      setSeedLoading(false);
      setSeedDialogOpen(false);
    }
  };

  // ─── Refresh current page data ─────────────────────────
  const refreshCurrentPage = () => {
    if (currentPage === 'dashboard') fetchDashboard();
    else if (currentPage === 'products') fetchProducts(productPage);
    else if (currentPage === 'categories') fetchCategories();
    else if (currentPage === 'banners') { fetchBanners(); fetchCategories(); }
    else if (currentPage === 'transactions') fetchTransactions(txPage, txStatus, txSearch);
    else if (['identitas', 'kontak', 'media-sosial', 'notifikasi', 'pembayaran', 'maintenance'].includes(currentPage)) fetchSettings();
  };

  // ─── Loading ───────────────────────────────────────────
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <TreePine className="size-10 text-[#ff2d2d] animate-pulse" />
          <Loader2 className="size-6 animate-spin text-[#ff2d2d]" />
        </div>
      </div>
    );
  }

  // ─── Login Screen ──────────────────────────────────────
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f0000] via-[#1a1a1a] to-[#0f0000] p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-6xl opacity-10 animate-pulse">✨</div>
          <div className="absolute top-40 right-20 text-5xl opacity-10 animate-pulse">🌟</div>
          <div className="absolute bottom-20 left-1/4 text-4xl opacity-10 animate-pulse">💫</div>
          <div className="absolute bottom-40 right-1/3 text-5xl opacity-10 animate-pulse">⭐</div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="shadow-2xl border border-[#ff2d2d]/20 overflow-hidden bg-[#1a1a1a] shadow-[#ff2d2d]/10">
            <div className="h-2 bg-gradient-to-r from-[#ff2d2d] via-[#ff6b00] to-[#ff6b00]" />
            <CardHeader className="text-center pb-2 pt-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2d2d] to-[#ff6b00] text-[#0f0000] shadow-lg shadow-[#ff2d2d]/30 overflow-hidden"
              >
                {publicSettings.logoUrl && publicSettings.logoUrl !== '/logo.svg' ? (
                  <img src={publicSettings.logoUrl} alt={publicSettings.siteName} className="w-full h-full object-cover" />
                ) : (
                  <TreePine className="size-8" />
                )}
              </motion.div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#ff2d2d] to-[#ff6b00] bg-clip-text text-transparent">
                {publicSettings.siteName}
              </CardTitle>
              <CardDescription className="text-sm mt-1">Admin Panel — Adventure Management</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Masukkan username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-[#ff2d2d]/30 min-h-[44px]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-[#ff2d2d]/30 min-h-[44px]"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000] shadow-lg shadow-[#ff2d2d]/25 hover:shadow-[#ff2d2d]/40 transition-all duration-300 min-h-[44px]"
                  disabled={loginLoading}
                >
                  {loginLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <ShieldCheck className="size-4 mr-2" />}
                  Masuk
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ─── Sidebar Config ────────────────────────────────────
  const sidebarItems: { key: Page; label: string; icon: React.ReactNode; isLabel?: boolean }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
    { key: 'analytics', label: 'Analytics', icon: <TrendingUp className="size-4" /> },
    { key: 'products', label: 'Produk', icon: <Package className="size-4" /> },
    { key: 'categories', label: 'Kategori', icon: <FolderOpen className="size-4" /> },
    { key: 'banners', label: 'Banner', icon: <ImageIcon className="size-4" /> },
    { key: 'transactions', label: 'Transaksi', icon: <Receipt className="size-4" /> },
    { key: 'flash-sales', label: 'Flash Sale', icon: <Zap className="size-4" /> },
    { key: 'coupons', label: 'Kupon', icon: <Tag className="size-4" /> },
    { key: 'reviews', label: 'Review', icon: <Star className="size-4" /> },
    { key: 'chat', label: 'Live Chat', icon: <MessageCircle className="size-4" /> },
    { key: 'label-pengaturan' as Page, label: 'PENGATURAN', icon: null, isLabel: true },
    { key: 'identitas', label: 'Identitas', icon: <Globe className="size-4" /> },
    { key: 'kontak', label: 'Kontak', icon: <Phone className="size-4" /> },
    { key: 'media-sosial', label: 'Media Sosial', icon: <AtSign className="size-4" /> },
    { key: 'notifikasi', label: 'Notifikasi', icon: <Bell className="size-4" /> },
    { key: 'pembayaran', label: 'Pembayaran', icon: <QrCode className="size-4" /> },
    { key: 'maintenance', label: 'Maintenance', icon: <Wrench className="size-4" /> },
  ];

  const pageLabels: Record<Page, string> = {
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    products: 'Produk',
    categories: 'Kategori',
    banners: 'Banner (Home & Produk)',
    transactions: 'Transaksi',
    'flash-sales': 'Flash Sale',
    coupons: 'Kupon & Voucher',
    reviews: 'Review Produk',
    chat: 'Live Chat',
    identitas: 'Identitas Website',
    kontak: 'Kontak',
    'media-sosial': 'Media Sosial',
    notifikasi: 'Notifikasi',
    pembayaran: 'Pembayaran',
    maintenance: 'Mode Maintenance',
  };

  const getCategoryName = (cat: string | { _id: string; name: string }) => {
    if (typeof cat === 'object') return cat.name;
    const found = categories.find(c => c._id === cat);
    return found?.name || cat;
  };

  // ─── Render Dashboard ──────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Realtime Info Banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/10">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-green-500" />
        </span>
        <span className="text-xs text-green-400 font-medium">Real-time Sync Aktif</span>
        <span className="text-[10px] text-muted-foreground">— Transaksi otomatis diperbarui setiap 5 detik</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 sm:size-12 items-center justify-center rounded-xl bg-[#ff2d2d]/10">
                  <Package className="size-5 sm:size-6 text-[#ff2d2d]" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Produk</p>
                  <p className="text-xl sm:text-2xl font-bold">{dashboardStats?.totalProducts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 sm:size-12 items-center justify-center rounded-xl bg-green-500/10">
                  <Receipt className="size-5 sm:size-6 text-green-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Transaksi</p>
                  <p className="text-xl sm:text-2xl font-bold">{dashboardStats?.totalTransactions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 sm:size-12 items-center justify-center rounded-xl bg-[#ff2d2d]/10">
                  <DollarSign className="size-5 sm:size-6 text-[#ff2d2d]" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Revenue</p>
                  <p className="text-lg sm:text-xl font-bold">{formatRupiah(dashboardStats?.totalRevenue || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-[#ff2d2d]/10 bg-gradient-to-br from-[#0f0000] to-[#1a1a1a]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 sm:size-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <Clock className="size-5 sm:size-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold">{dashboardStats?.pendingTransactions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <Card className="border-[#ff2d2d]/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Transaksi Terbaru</CardTitle>
            <Button variant="ghost" size="sm" className="min-h-[36px] text-[#ff2d2d]" onClick={() => setCurrentPage('transactions')}>
              Lihat Semua <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada transaksi</TableCell></TableRow>
                ) : transactions.map((tx) => (
                  <TableRow key={tx._id} className="cursor-pointer hover:bg-[#ff2d2d]/5" onClick={() => openTxDetail(tx)}>
                    <TableCell className="font-mono text-xs">{tx.transactionId.slice(0, 8)}...</TableCell>
                    <TableCell>{tx.productName}</TableCell>
                    <TableCell>{tx.customerName}</TableCell>
                    <TableCell>{formatRupiah(tx.totalAmount)}</TableCell>
                    <TableCell><StatusBadge status={tx.status} /></TableCell>
                    <TableCell className="text-xs">{formatDate(tx.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Belum ada transaksi</p>
            ) : transactions.map((tx) => (
              <Card key={tx._id} className="border-[#ff2d2d]/10 cursor-pointer active:bg-[#ff2d2d]/5 transition-colors" onClick={() => openTxDetail(tx)}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {tx.productImage && <img src={tx.productImage} alt="" className="size-10 rounded object-cover shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{tx.productName}</p>
                        <p className="text-xs text-muted-foreground">{tx.customerName}</p>
                      </div>
                    </div>
                    <StatusBadge status={tx.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-[#ff2d2d]">{formatRupiah(tx.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button variant="outline" className="min-h-[48px] gap-2 border-[#ff2d2d]/20 hover:bg-[#ff2d2d]/10" onClick={() => setCurrentPage('products')}>
          <Package className="size-4" /> Produk
        </Button>
        <Button variant="outline" className="min-h-[48px] gap-2 border-[#ff2d2d]/20 hover:bg-[#ff2d2d]/10" onClick={() => setCurrentPage('categories')}>
          <FolderOpen className="size-4" /> Kategori
        </Button>
        <Button variant="outline" className="min-h-[48px] gap-2 border-[#ff2d2d]/20 hover:bg-[#ff2d2d]/10" onClick={() => setCurrentPage('banners')}>
          <ImageIcon className="size-4" /> Banner
        </Button>
        <Button variant="outline" className="min-h-[48px] gap-2 border-[#ff2d2d]/20 hover:bg-[#ff2d2d]/10" onClick={() => setSeedDialogOpen(true)}>
          <Database className="size-4" /> Seed DB
        </Button>
      </div>
    </div>
  );

  // ─── Render Products ───────────────────────────────────
  const renderProducts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{productTotal} produk total</p>
        </div>
        <Button onClick={() => openProductForm()} className="gap-2 min-h-[44px] bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000] hidden sm:flex">
          <Plus className="size-4" /> Tambah Produk
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card className="border-[#ff2d2d]/10">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Foto</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada produk</TableCell></TableRow>
                ) : products.map((prod) => (
                  <TableRow key={prod._id}>
                    <TableCell>
                      {prod.images?.[0] ? (
                        <img src={prod.images[0]} alt="" className="size-10 rounded object-cover" />
                      ) : (
                        <div className="size-10 rounded bg-muted flex items-center justify-center"><ImageIcon className="size-4 text-muted-foreground" /></div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{prod.name}</p>
                        <p className="text-xs text-muted-foreground">/{prod.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryName(prod.category)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatRupiah(prod.price)}</p>
                        {prod.originalPrice && prod.originalPrice > prod.price && (
                          <p className="text-xs text-muted-foreground line-through">{formatRupiah(prod.originalPrice)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {prod.isActive && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]">Aktif</Badge>}
                        {prod.isFeatured && <Badge className="bg-[#ff2d2d]/10 text-[#ff2d2d] border-0 text-[10px]">Featured</Badge>}
                        {prod.isSold && <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px]">Terjual</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-9" onClick={() => openProductForm(prod)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-9 text-[#ff2d2d] hover:text-[#b81c1c]" onClick={() => setDeleteTarget({ type: 'product', id: prod._id, name: prod.name })}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {products.length === 0 ? (
          <Card className="border-[#ff2d2d]/10">
            <CardContent className="py-8 text-center text-muted-foreground">Belum ada produk</CardContent>
          </Card>
        ) : products.map((prod) => (
          <Card key={prod._id} className="border-[#ff2d2d]/10">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                {prod.images?.[0] ? (
                  <img src={prod.images[0]} alt="" className="size-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="size-16 rounded-lg bg-muted flex items-center justify-center shrink-0"><ImageIcon className="size-6 text-muted-foreground" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{prod.name}</p>
                  <p className="text-xs text-muted-foreground mb-1">{getCategoryName(prod.category)}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-[#ff2d2d]">{formatRupiah(prod.price)}</p>
                    {prod.originalPrice && prod.originalPrice > prod.price && (
                      <p className="text-xs text-muted-foreground line-through">{formatRupiah(prod.originalPrice)}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {prod.isActive && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]">Aktif</Badge>}
                    {prod.isFeatured && <Badge className="bg-[#ff2d2d]/10 text-[#ff2d2d] border-0 text-[10px]">Featured</Badge>}
                    {prod.isSold && <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px]">Terjual</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/50">
                <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5" onClick={() => openProductForm(prod)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5 text-[#ff2d2d] border-[#ff2d2d]/20 dark:border-[#ff2d2d]/30 hover:bg-[#ff2d2d]/10 dark:hover:bg-[#ff2d2d]/20" onClick={() => setDeleteTarget({ type: 'product', id: prod._id, name: prod.name })}>
                  <Trash2 className="size-3.5" /> Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {productTotalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={productPage <= 1} onClick={() => fetchProducts(productPage - 1)} className="min-h-[40px]">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-2">Hal {productPage} / {productTotalPages}</span>
          <Button variant="outline" size="sm" disabled={productPage >= productTotalPages} onClick={() => fetchProducts(productPage + 1)} className="min-h-[40px]">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );

  // ─── Render Categories ─────────────────────────────────
  const renderCategories = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{categories.length} kategori</p>
        <Button onClick={() => openCategoryForm()} className="gap-2 min-h-[44px] bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000] hidden sm:flex">
          <Plus className="size-4" /> Tambah Kategori
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="border-[#ff2d2d]/10">
          <CardContent className="py-8 text-center text-muted-foreground">Belum ada kategori</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat._id} className="border-[#ff2d2d]/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="size-16 rounded-xl overflow-hidden shrink-0 bg-[#ff2d2d]/10">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">{cat.icon || '🎮'}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                    {cat.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      {cat.isActive ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]">Aktif</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400 border-0 text-[10px]">Nonaktif</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">Order: {cat.order}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/50">
                  <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5" onClick={() => openCategoryForm(cat)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5 text-[#ff2d2d] border-[#ff2d2d]/20 dark:border-[#ff2d2d]/30 hover:bg-[#ff2d2d]/10 dark:hover:bg-[#ff2d2d]/20" onClick={() => setDeleteTarget({ type: 'category', id: cat._id, name: cat.name })}>
                    <Trash2 className="size-3.5" /> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Render Banners ────────────────────────────────────
  const renderBanners = () => {
    const homeBanners = banners.filter((b) => !b.type || b.type === 'home');
    const productBanners = banners.filter((b) => b.type === 'product');
    const currentBanners = bannerTab === 'home' ? homeBanners : productBanners;

    // Group product banners by category
    const productBannersByCategory: Record<string, BannerData[]> = {};
    productBanners.forEach((b) => {
      const cat = b.category || 'uncategorized';
      if (!productBannersByCategory[cat]) productBannersByCategory[cat] = [];
      productBannersByCategory[cat].push(b);
    });

    const getCategoryName = (slug: string) => {
      const cat = categories.find((c) => c.slug === slug);
      return cat ? cat.name : slug;
    };

    return (
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBannerTab('home')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              bannerTab === 'home'
                ? 'bg-[#ff2d2d] text-white shadow-md shadow-[#ff2d2d]/20'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
          >
            🏠 Banner Home
          </button>
          <button
            onClick={() => setBannerTab('product')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              bannerTab === 'product'
                ? 'bg-[#ff2d2d] text-white shadow-md shadow-[#ff2d2d]/20'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
          >
            🎮 Banner Produk
          </button>
        </div>

        {/* Tab Description */}
        {bannerTab === 'home' && (
          <div className="px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <p className="text-xs text-blue-400">Banner Home ditampilkan di halaman utama sebagai carousel. Ukuran: <strong>1080×400px</strong></p>
          </div>
        )}
        {bannerTab === 'product' && (
          <div className="px-3 py-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
            <p className="text-xs text-purple-400">Banner Produk ditampilkan saat user membuka kategori game tertentu. Setiap game bisa punya banner berbeda! Ukuran: <strong>1080×270px</strong></p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {bannerTab === 'home' ? `${homeBanners.length} banner home` : `${productBanners.length} banner produk`}
          </p>
          <Button onClick={() => openBannerForm()} className="gap-2 min-h-[44px] bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000]">
            <Plus className="size-4" /> Tambah Banner {bannerTab === 'home' ? 'Home' : 'Produk'}
          </Button>
        </div>

        {currentBanners.length === 0 ? (
          <Card className="border-[#ff2d2d]/10">
            <CardContent className="py-10 text-center">
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="size-10 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  {bannerTab === 'home' ? 'Belum ada banner home' : 'Belum ada banner produk'}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {bannerTab === 'home'
                    ? 'Tambahkan banner yang akan ditampilkan di halaman utama'
                    : 'Tambahkan banner yang akan ditampilkan saat user membuka kategori game'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : bannerTab === 'home' ? (
          /* Home Banners - Simple list */
          <div className="grid gap-4">
            {homeBanners.map((banner) => (
              <Card key={banner._id} className="border-[#ff2d2d]/10 overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-64 aspect-[20/9] sm:aspect-auto sm:h-28 shrink-0 bg-muted">
                    <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-4 flex-1">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{banner.title || 'Tanpa Judul'}</p>
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px]">Home</Badge>
                      </div>
                      {banner.description && <p className="text-sm text-muted-foreground line-clamp-2">{banner.description}</p>}
                      {banner.link && (
                        <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#ff2d2d] flex items-center gap-1 hover:underline">
                          <ExternalLink className="size-3" /> {banner.link}
                        </a>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {banner.isActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]">Aktif</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400 border-0 text-[10px]">Nonaktif</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">Order: {banner.order}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5" onClick={() => openBannerForm(banner)}>
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5 text-[#ff2d2d] border-[#ff2d2d]/20 dark:border-[#ff2d2d]/30 hover:bg-[#ff2d2d]/10 dark:hover:bg-[#ff2d2d]/20" onClick={() => setDeleteTarget({ type: 'banner', id: banner._id, name: banner.title || 'Banner' })}>
                        <Trash2 className="size-3.5" /> Hapus
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Product Banners - Grouped by category */
          <div className="space-y-6">
            {Object.entries(productBannersByCategory).map(([catSlug, catBanners]) => (
              <div key={catSlug}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-1 rounded-full bg-[#ff2d2d]" />
                  <h3 className="text-sm font-bold">{getCategoryName(catSlug)}</h3>
                  <span className="text-xs text-muted-foreground">({catBanners.length} banner)</span>
                </div>
                <div className="grid gap-3">
                  {catBanners.map((banner) => (
                    <Card key={banner._id} className="border-[#ff2d2d]/10 overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-64 aspect-[4/1] sm:aspect-auto sm:h-16 shrink-0 bg-muted">
                          <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                        </div>
                        <CardContent className="p-4 flex-1">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{banner.title || 'Tanpa Judul'}</p>
                              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px]">Produk</Badge>
                              <Badge className="bg-[#ff2d2d]/10 text-[#ff2d2d] border-[#ff2d2d]/20 text-[9px]">{getCategoryName(catSlug)}</Badge>
                            </div>
                            {banner.description && <p className="text-sm text-muted-foreground line-clamp-2">{banner.description}</p>}
                            {banner.link && (
                              <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#ff2d2d] flex items-center gap-1 hover:underline">
                                <ExternalLink className="size-3" /> {banner.link}
                              </a>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {banner.isActive ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]">Aktif</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400 border-0 text-[10px]">Nonaktif</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">Order: {banner.order}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/50">
                            <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5" onClick={() => openBannerForm(banner)}>
                              <Pencil className="size-3.5" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5 text-[#ff2d2d] border-[#ff2d2d]/20 dark:border-[#ff2d2d]/30 hover:bg-[#ff2d2d]/10 dark:hover:bg-[#ff2d2d]/20" onClick={() => setDeleteTarget({ type: 'banner', id: banner._id, name: banner.title || 'Banner' })}>
                              <Trash2 className="size-3.5" /> Hapus
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Render Transactions ───────────────────────────────
  const renderTransactions = () => (
    <div className="space-y-4">
      {/* Realtime Info Banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/10">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-green-500" />
        </span>
        <span className="text-xs text-green-400 font-medium">Real-time Sync Aktif</span>
        <span className="text-[10px] text-muted-foreground">— Status transaksi diperbarui otomatis setiap 5 detik</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi..."
            value={txSearch}
            onChange={(e) => { setTxSearch(e.target.value); }}
            onKeyDown={(e) => { if (e.key === 'Enter') fetchTransactions(1, txStatus, txSearch); }}
            className="pl-10 min-h-[44px]"
          />
        </div>
        <Select value={txStatus} onValueChange={(val) => { setTxStatus(val); fetchTransactions(1, val, txSearch); }}>
          <SelectTrigger className="w-full sm:w-40 min-h-[44px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancel">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{txTotal} transaksi</p>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card className="border-[#ff2d2d]/10">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Transaksi</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada transaksi</TableCell></TableRow>
                ) : transactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="font-mono text-xs">{tx.transactionId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.productImage && <img src={tx.productImage} alt="" className="size-8 rounded object-cover" />}
                        <span className="truncate max-w-[150px]">{tx.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{tx.customerName}</p>
                        <p className="text-xs text-muted-foreground">{tx.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatRupiah(tx.totalAmount)}</TableCell>
                    <TableCell><StatusBadge status={tx.status} /></TableCell>
                    <TableCell className="text-xs">{formatDate(tx.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="min-h-[36px] gap-1" onClick={() => openTxDetail(tx)}>
                        <Eye className="size-3.5" /> Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {transactions.length === 0 ? (
          <Card className="border-[#ff2d2d]/10">
            <CardContent className="py-8 text-center text-muted-foreground">Tidak ada transaksi</CardContent>
          </Card>
        ) : transactions.map((tx) => (
          <Card key={tx._id} className="border-[#ff2d2d]/10 cursor-pointer active:bg-[#ff2d2d]/5 transition-colors" onClick={() => openTxDetail(tx)}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {tx.productImage && <img src={tx.productImage} alt="" className="size-10 rounded object-cover shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{tx.productName}</p>
                    <p className="text-xs text-muted-foreground">{tx.customerName}</p>
                  </div>
                </div>
                <StatusBadge status={tx.status} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm font-bold text-[#ff2d2d]">{formatRupiah(tx.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {txTotalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={txPage <= 1} onClick={() => fetchTransactions(txPage - 1, txStatus, txSearch)} className="min-h-[40px]">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-2">Hal {txPage} / {txTotalPages}</span>
          <Button variant="outline" size="sm" disabled={txPage >= txTotalPages} onClick={() => fetchTransactions(txPage + 1, txStatus, txSearch)} className="min-h-[40px]">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );

  // ─── Render Identitas ──────────────────────────────────
  const renderIdentitas = () => {
    if (!settings) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-[#ff2d2d]" />
        </div>
      );
    }
    const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    return (
      <div className="space-y-6 max-w-3xl">
        <Card className="border-[#ff2d2d]/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="size-4 text-[#ff2d2d]" />
              Identitas Website
            </CardTitle>
            <CardDescription>Atur nama, slogan, deskripsi, dan logo website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama Website</Label>
                <Input
                  value={settings.siteName}
                  onChange={(e) => updateSetting('siteName', e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Slogan</Label>
                <Input
                  value={settings.siteSlogan}
                  onChange={(e) => updateSetting('siteSlogan', e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Website</Label>
              <Textarea
                value={settings.siteDescription}
                onChange={(e) => updateSetting('siteDescription', e.target.value)}
                rows={3}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <SingleImageUploader
                value={settings.logoUrl}
                onChange={(url) => updateSetting('logoUrl', url)}
                label="Upload Logo"
                aspect="square"
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button onClick={saveSettings} disabled={settingsLoading} className="min-h-[44px] bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000] shadow-lg shadow-[#ff2d2d]/20">
            {settingsLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
            Simpan Identitas
          </Button>
        </div>
      </div>
    );
  };

  // ─── Render Kontak ─────────────────────────────────────
  const renderKontak = () => {
    if (!settings) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-[#ff2d2d]" />
        </div>
      );
    }
    const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    return (
      <div className="space-y-6 max-w-3xl">
        <Card className="border-[#ff2d2d]/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="size-4 text-[#ff2d2d]" />
              Kontak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nomor WhatsApp</Label>
                <Input
                  value={settings.whatsappNumber}
                  onChange={(e) => updateSetting('whatsappNumber', e.target.value)}
                  placeholder="6283856801224"
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Username Telegram</Label>
                <Input
                  value={settings.telegramUsername}
                  onChange={(e) => updateSetting('telegramUsername', e.target.value)}
                  placeholder="@craigofthecreek"
                  className="min-h-[44px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button onClick={saveSettings} disabled={settingsLoading} className="min-h-[44px] bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000] shadow-lg shadow-[#ff2d2d]/20">
            {settingsLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
            Simpan Kontak
          </Button>
        </div>
      </div>
    );
  };

  // ─── Render Media Sosial ───────────────────────────────
  const renderMediaSosial = () => {
    if (!settings) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-[#ff2d2d]" />
        </div>
      );
    }
    const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    return (
      <div className="space-y-6 max-w-3xl">
        <Card className="border-[#ff2d2d]/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <AtSign className="size-4 text-[#ff2d2d]" />
              Media Sosial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Instagram className="size-4" /> Instagram URL</Label>
              <Input
                value={settings.instagramUrl}
                onChange={(e) => updateSetting('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/..."
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46 6.28 6.28 0 001.86-4.48V8.73a8.26 8.26 0 004.84 1.56V6.84a4.84 4.84 0 01-1.12-.15z"/></svg> TikTok URL</Label>
              <Input
                value={settings.tiktokUrl}
                onChange={(e) => updateSetting('tiktokUrl', e.target.value)}
                placeholder="https://tiktok.com/..."
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Youtube className="size-4" /> YouTube URL</Label>
              <Input
                value={settings.youtubeUrl}
                onChange={(e) => updateSetting('youtubeUrl', e.target.value)}
                placeholder="https://youtube.com/..."
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Facebook className="size-4" /> Facebook URL</Label>
              <Input
                value={settings.facebookUrl}
                onChange={(e) => updateSetting('facebookUrl', e.target.value)}
                placeholder="https://facebook.com/..."
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Twitter className="size-4" /> Twitter URL</Label>
              <Input
                value={settings.twitterUrl}
                onChange={(e) => updateSetting('twitterUrl', e.target.value)}
                placeholder="https://twitter.com/..."
                className="min-h-[44px]"
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button onClick={saveSettings} disabled={settingsLoading} className="min-h-[44px] bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000] shadow-lg shadow-[#ff2d2d]/20">
            {settingsLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
            Simpan Media Sosial
          </Button>
        </div>
      </div>
    );
  };

  // ─── Render Notifikasi ─────────────────────────────────
  const renderNotifikasi = () => {
    if (!settings) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-[#ff2d2d]" />
        </div>
      );
    }
    const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    return (
      <div className="space-y-6 max-w-3xl">
        <Card className="border-[#ff2d2d]/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="size-4 text-[#ff2d2d]" />
              Notifikasi
            </CardTitle>
            <CardDescription>Atur notifikasi yang dikirim saat ada perubahan status transaksi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notification Channels */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Channel Notifikasi</h4>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
                    <MessageCircle className="size-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Kirim notifikasi via WhatsApp</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifyWhatsApp}
                  onCheckedChange={(val) => updateSetting('notifyWhatsApp', val)}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Send className="size-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Telegram</p>
                    <p className="text-xs text-muted-foreground">Kirim notifikasi via Telegram</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifyTelegram}
                  onCheckedChange={(val) => updateSetting('notifyTelegram', val)}
                />
              </div>
            </div>

            <Separator className="bg-[#ff2d2d]/10" />

            {/* Status Notifications */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notifikasi Per Status</h4>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <Clock className="size-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pending</p>
                    <p className="text-xs text-muted-foreground">Saat transaksi baru menunggu pembayaran</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifyOnPending}
                  onCheckedChange={(val) => updateSetting('notifyOnPending', val)}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
                    <CheckCircle2 className="size-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sukses</p>
                    <p className="text-xs text-muted-foreground">Saat pembayaran berhasil dikonfirmasi</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifyOnSuccess}
                  onCheckedChange={(val) => updateSetting('notifyOnSuccess', val)}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#ff2d2d]/15">
                    <AlertTriangle className="size-5 text-[#ff2d2d]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Expired</p>
                    <p className="text-xs text-muted-foreground">Saat transaksi melewati batas waktu</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifyOnExpired}
                  onCheckedChange={(val) => updateSetting('notifyOnExpired', val)}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gray-500/10">
                    <X className="size-5 text-[#a08080]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dibatalkan</p>
                    <p className="text-xs text-muted-foreground">Saat transaksi dibatalkan</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifyOnCancel}
                  onCheckedChange={(val) => updateSetting('notifyOnCancel', val)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button onClick={saveSettings} disabled={settingsLoading} className="min-h-[44px] bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000] shadow-lg shadow-[#ff2d2d]/20">
            {settingsLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
            Simpan Notifikasi
          </Button>
        </div>
      </div>
    );
  };

  // ─── Render Pembayaran ─────────────────────────────────
  const renderPembayaran = () => {
    if (!settings) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-[#ff2d2d]" />
        </div>
      );
    }
    const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    return (
      <div className="space-y-6 max-w-3xl">
        <Card className="border-[#ff2d2d]/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="size-4 text-[#ff2d2d]" />
              Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>QRIS Expired (menit)</Label>
              <Input
                type="number"
                value={settings.qrisExpiredMinutes}
                onChange={(e) => updateSetting('qrisExpiredMinutes', parseInt(e.target.value) || 15)}
                min={1}
                max={60}
                className="min-h-[44px] max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground">Waktu batas pembayaran QRIS dalam menit (1-60)</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button onClick={saveSettings} disabled={settingsLoading} className="min-h-[44px] bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000] shadow-lg shadow-[#ff2d2d]/20">
            {settingsLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
            Simpan Pembayaran
          </Button>
        </div>
      </div>
    );
  };

  // ─── Render Maintenance ────────────────────────────────
  const renderMaintenance = () => {
    if (!settings) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-[#ff2d2d]" />
        </div>
      );
    }
    const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    return (
      <div className="space-y-6 max-w-3xl">
        <Card className="border-[#ff2d2d]/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="size-4 text-[#ff2d2d]" />
              Mode Maintenance
            </CardTitle>
            <CardDescription>Aktifkan mode maintenance untuk menutup website sementara</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className={`flex size-10 items-center justify-center rounded-lg ${settings.maintenanceMode ? 'bg-[#ff2d2d]/15' : 'bg-green-500/10'}`}>
                  {settings.maintenanceMode ? (
                    <AlertTriangle className="size-5 text-[#ff2d2d]" />
                  ) : (
                    <CheckCircle2 className="size-5 text-green-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{settings.maintenanceMode ? 'Website Dalam Maintenance' : 'Website Aktif'}</p>
                  <p className="text-xs text-muted-foreground">{settings.maintenanceMode ? 'Pengunjung tidak bisa mengakses website' : 'Website dapat diakses normal'}</p>
                </div>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(val) => updateSetting('maintenanceMode', val)}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button onClick={saveSettings} disabled={settingsLoading} className="min-h-[44px] bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000] shadow-lg shadow-[#ff2d2d]/20">
            {settingsLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
            Simpan Maintenance
          </Button>
        </div>
      </div>
    );
  };

  // ─── Render Flash Sales ──────────────────────────────────
  const renderFlashSales = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">⚡ Flash Sale</h2>
          <p className="text-sm text-muted-foreground">Kelola penawaran flash sale dengan hitungan mundur</p>
        </div>
        <Button className="gap-2 bg-[#ff2d2d] hover:bg-[#ff2d2d]/80 text-white" onClick={() => toast.info('Fitur tambah flash sale tersedia di API /api/admin/flash-sales')}>
          <Plus className="size-4" /> Tambah Flash Sale
        </Button>
      </div>
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6 text-center">
        <Zap className="size-12 mx-auto text-[#ff2d2d]/30 mb-3" />
        <p className="text-sm text-muted-foreground">Kelola flash sale melalui API endpoint</p>
        <p className="text-xs text-muted-foreground mt-1">POST /api/admin/flash-sales untuk membuat flash sale baru</p>
      </div>
    </div>
  );

  // ─── Render Coupons ──────────────────────────────────────
  const renderCoupons = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">🎁 Kupon & Voucher</h2>
          <p className="text-sm text-muted-foreground">Kelola kode kupon diskon untuk pelanggan</p>
        </div>
        <Button className="gap-2 bg-[#ff2d2d] hover:bg-[#ff2d2d]/80 text-white" onClick={() => toast.info('Fitur tambah kupon tersedia di API /api/admin/coupons')}>
          <Plus className="size-4" /> Tambah Kupon
        </Button>
      </div>
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6 text-center">
        <Tag className="size-12 mx-auto text-[#ff2d2d]/30 mb-3" />
        <p className="text-sm text-muted-foreground">Kelola kupon melalui API endpoint</p>
        <p className="text-xs text-muted-foreground mt-1">POST /api/admin/coupons untuk membuat kupon baru</p>
      </div>
    </div>
  );

  // ─── Render Reviews ──────────────────────────────────────
  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">⭐ Review Produk</h2>
          <p className="text-sm text-muted-foreground">Lihat dan kelola review dari pelanggan</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6 text-center">
        <Star className="size-12 mx-auto text-[#ff2d2d]/30 mb-3" />
        <p className="text-sm text-muted-foreground">Review akan tampil setelah pelanggan memberikan rating</p>
        <p className="text-xs text-muted-foreground mt-1">GET /api/admin/reviews untuk melihat semua review</p>
      </div>
    </div>
  );

  // ─── Render Chat ─────────────────────────────────────────
  const renderChat = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">💬 Live Chat</h2>
          <p className="text-sm text-muted-foreground">Balas pesan chat dari pengunjung</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6 text-center">
        <MessageCircle className="size-12 mx-auto text-[#ff2d2d]/30 mb-3" />
        <p className="text-sm text-muted-foreground">Chat akan muncul ketika pengunjung mengirim pesan</p>
        <p className="text-xs text-muted-foreground mt-1">GET /api/admin/chat untuk melihat sesi chat aktif</p>
      </div>
    </div>
  );

  // ─── Render page content ───────────────────────────────
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard': return renderDashboard();
      case 'analytics': return <AnalyticsPanel />;
      case 'products': return renderProducts();
      case 'categories': return renderCategories();
      case 'banners': return renderBanners();
      case 'transactions': return renderTransactions();
      case 'flash-sales': return renderFlashSales();
      case 'coupons': return renderCoupons();
      case 'reviews': return renderReviews();
      case 'chat': return renderChat();
      case 'identitas': return renderIdentitas();
      case 'kontak': return renderKontak();
      case 'media-sosial': return renderMediaSosial();
      case 'notifikasi': return renderNotifikasi();
      case 'pembayaran': return renderPembayaran();
      case 'maintenance': return renderMaintenance();
      default: return renderDashboard();
    }
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="admin-panel flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-gradient-to-b from-[#0f0000] via-[#0f0000] to-[#0f0000]
        border-r border-[#ff2d2d]/10
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#ff2d2d]/10">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff2d2d] to-[#ff6b00] text-[#0f0000] shadow-md shadow-[#ff2d2d]/20 overflow-hidden">
            {(settings?.logoUrl || publicSettings.logoUrl) && (settings?.logoUrl || publicSettings.logoUrl) !== '/logo.svg' ? (
              <img src={settings?.logoUrl || publicSettings.logoUrl} alt={settings?.siteName || publicSettings.siteName} className="w-full h-full object-cover" />
            ) : (
              <TreePine className="size-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm truncate bg-gradient-to-r from-[#ff2d2d] to-[#ff6b00] bg-clip-text text-transparent">{settings?.siteName || publicSettings.siteName}</h2>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden size-11" onClick={() => setSidebarOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>

        {/* Nav Items */}
        <ScrollArea className="flex-1">
          <nav className="px-3 py-4 space-y-1">
            {sidebarItems.map((item) => {
              if (item.isLabel) {
                return (
                  <div key={item.key} className="px-3 pt-4 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{item.label}</p>
                  </div>
                );
              }
              return (
                <button
                  key={item.key}
                  onClick={() => { setCurrentPage(item.key); setSidebarOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative min-h-[44px]
                    ${currentPage === item.key
                      ? 'bg-[#ff2d2d]/10 text-[#b81c1c] dark:text-[#ff2d2d] shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                  `}
                >
                  {currentPage === item.key && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-[#ff2d2d] to-[#ff6b00]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
            {/* Seed DB button */}
            <button
              onClick={() => { setSeedDialogOpen(true); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground min-h-[44px]"
            >
              <Database className="size-4" />
              Seed Database
            </button>
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="px-3 py-4 border-t border-[#ff2d2d]/10 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground min-h-[44px]"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-[#ff2d2d] hover:text-[#b81c1c] hover:bg-[#ff2d2d]/10 dark:hover:bg-[#ff2d2d]/20 min-h-[44px]"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile FAB - Floating Action Button */}
      {(currentPage === 'products' || currentPage === 'categories' || currentPage === 'banners') && (
        <div className="fixed bottom-6 right-6 z-30 sm:hidden">
          <Button
            onClick={() => {
              if (currentPage === 'products') openProductForm();
              else if (currentPage === 'categories') openCategoryForm();
              else if (currentPage === 'banners') openBannerForm();
            }}
            className="size-14 rounded-full bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000] shadow-xl shadow-[#ff2d2d]/30"
          >
            <Plus className="size-6" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar — uses CSS class for scroll state (zero re-renders) */}
        <header ref={headerRef} className="admin-header flex items-center gap-3 px-4 border-b border-[#ff2d2d]/10 backdrop-blur-md shrink-0 transition-all duration-300 py-3 bg-[#1a1a1a]/80">
          <Button variant="ghost" size="icon" className="lg:hidden size-11 transition-all" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-5 transition-all" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex size-8 items-center justify-center rounded-lg bg-[#ff2d2d]/10 text-[#ff2d2d] dark:text-[#ff2d2d] transition-all">
              {sidebarItems.find(i => i.key === currentPage && !i.isLabel)?.icon}
            </div>
            <h1 className="text-lg font-semibold transition-all">{pageLabels[currentPage]}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Real-time Live Indicator */}
            <div ref={liveIndicatorRef} className="live-indicator flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 bg-green-500/10 text-green-500/60">
              <span className="size-1.5 rounded-full bg-green-500/40" />
              LIVE
            </div>
            <Button variant="outline" size="icon" className="size-10 transition-all" onClick={refreshCurrentPage}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </header>

        {/* Page Content — native scroll for smooth performance */}
        <div className="flex-1 overflow-y-auto scroll-smooth" ref={scrollAreaRef} style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="p-4 sm:p-6 pb-24 sm:pb-6">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderPageContent()}
            </motion.div>
          </div>
        </div>
      </main>

      {/* ─── Product Dialog ──────────────────────────────── */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Ubah informasi produk' : 'Isi form berikut untuk menambah produk baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Produk *</Label>
                  <Input
                    value={productForm.name}
                    onChange={(e) => {
                      setProductForm(prev => ({ ...prev, name: e.target.value, slug: slugify(e.target.value) }));
                    }}
                    placeholder="Nama produk"
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    value={productForm.slug}
                    onChange={(e) => setProductForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="slug-produk"
                    className="min-h-[44px]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select value={productForm.category} onValueChange={(val) => setProductForm(prev => ({ ...prev, category: val }))}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>{cat.icon} {cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi produk..."
                  rows={3}
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Tag className="size-4 text-[#ff2d2d]" /> Harga
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Harga (Rp) *</Label>
                  <Input
                    type="number"
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="0"
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Harga Asli (Rp) <span className="text-muted-foreground">- diskon</span></Label>
                  <Input
                    type="number"
                    value={productForm.originalPrice || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                    placeholder="0"
                    className="min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Product Images (1080x1350) */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="size-4 text-[#ff2d2d]" /> Foto Produk (1080x1350)
              </h4>
              <p className="text-xs text-muted-foreground">Foto thumbnail produk dengan rasio 1080x1350 (portrait 4:5)</p>
              <ImageUploader
                images={productImages}
                onImagesChange={setProductImages}
                maxImages={6}
                aspect="square"
                label="Foto Produk (1080x1350)"
              />
            </div>

            <Separator />

            {/* Detail Images (1080x1350) */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="size-4 text-[#ff2d2d]" /> Foto Detail (1080x1350)
              </h4>
              <p className="text-xs text-muted-foreground">Foto detail produk dengan rasio 1080x1350 (portrait 4:5)</p>
              <ImageUploader
                images={productDetailImages}
                onImagesChange={setProductDetailImages}
                maxImages={6}
                aspect="square"
                label="Foto Detail (1080x1350)"
              />
            </div>

            <Separator />

            {/* Specs */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Star className="size-4 text-[#ff2d2d]" /> Spesifikasi
              </h4>
              <SpecsEditor specs={productSpecs} onSpecsChange={setProductSpecs} />
            </div>

            <Separator />

            {/* Toggles & Order */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ToggleLeft className="size-4 text-[#ff2d2d]" /> Status & Pengaturan
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm">Aktif</Label>
                  <Switch checked={productForm.isActive} onCheckedChange={(val) => setProductForm(prev => ({ ...prev, isActive: val }))} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm">Featured</Label>
                  <Switch checked={productForm.isFeatured} onCheckedChange={(val) => setProductForm(prev => ({ ...prev, isFeatured: val }))} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm">Terjual</Label>
                  <Switch checked={productForm.isSold} onCheckedChange={(val) => setProductForm(prev => ({ ...prev, isSold: val }))} />
                </div>
                <div className="space-y-2">
                  <Label>Urutan</Label>
                  <Input
                    type="number"
                    value={productForm.order || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                    className="min-h-[44px] max-w-[150px]"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setProductDialogOpen(false)} className="min-h-[44px] w-full sm:w-auto">
              Batal
            </Button>
            <Button
              onClick={saveProduct}
              disabled={savingProduct}
              className="min-h-[44px] w-full sm:w-auto bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000]"
            >
              {savingProduct ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
              {editingProduct ? 'Update Produk' : 'Tambah Produk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Category Dialog ─────────────────────────────── */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Ubah informasi kategori' : 'Isi form berikut untuk menambah kategori baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama *</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => {
                    setCategoryForm(prev => ({ ...prev, name: e.target.value, slug: slugify(e.target.value) }));
                  }}
                  placeholder="Nama kategori"
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="slug-kategori"
                  className="min-h-[44px]"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Icon (Emoji)</Label>
                <Input
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🎮"
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  value={categoryForm.order || ''}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                  className="min-h-[44px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gambar Kategori</Label>
              <SingleImageUploader
                value={categoryForm.image}
                onChange={(url) => setCategoryForm(prev => ({ ...prev, image: url }))}
                label="Upload Gambar Kategori"
                aspect="square"
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi kategori..."
                rows={2}
                className="min-h-[44px]"
              />
            </div>

            {/* ─── Theme Selector ──────────────────────────── */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Palette className="size-4 text-[#ff2d2d]" />
                <Label className="text-base font-semibold">Theme & Warna</Label>
              </div>
              <p className="text-xs text-muted-foreground">Pilih tema game untuk kategori ini, atau kustomisasi warna secara manual.</p>

              {/* Theme Picker Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[
                  { id: 'default', name: 'Red Fire', emoji: '🔥', accent: '#ff2d2d', bg: '#170000' },
                  { id: 'free-fire', name: 'Free Fire', emoji: '🔫', accent: '#ff2d2d', bg: '#170000' },
                  { id: 'mobile-legends', name: 'Mobile Legends', emoji: '⚔️', accent: '#3b82f6', bg: '#050b22' },
                  { id: 'pubg', name: 'PUBG', emoji: '🪖', accent: '#22c55e', bg: '#101510' },
                  { id: 'valorant', name: 'Valorant', emoji: '🎯', accent: '#f43f5e', bg: '#120b10' },
                  { id: 'genshin-impact', name: 'Genshin Impact', emoji: '⭐', accent: '#8b5cf6', bg: '#0e1024' },
                  { id: 'roblox', name: 'Roblox', emoji: '🧱', accent: '#f59e0b', bg: '#151515' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const themeMap: Record<string, { accentColor: string; bgColor: string; bannerColor: string; glowColor: string; borderColor: string }> = {
                        'default': { accentColor: '#ff2d2d', bgColor: '#170000', bannerColor: '#ff2d2d', glowColor: 'rgba(255,45,45,0.3)', borderColor: 'rgba(255,80,80,0.35)' },
                        'free-fire': { accentColor: '#ff2d2d', bgColor: '#170000', bannerColor: '#ff2d2d', glowColor: 'rgba(255,45,45,0.3)', borderColor: 'rgba(255,80,80,0.35)' },
                        'mobile-legends': { accentColor: '#3b82f6', bgColor: '#050b22', bannerColor: '#3b82f6', glowColor: 'rgba(59,130,246,0.3)', borderColor: 'rgba(59,130,246,0.35)' },
                        'pubg': { accentColor: '#22c55e', bgColor: '#101510', bannerColor: '#22c55e', glowColor: 'rgba(34,197,94,0.3)', borderColor: 'rgba(34,197,94,0.35)' },
                        'valorant': { accentColor: '#f43f5e', bgColor: '#120b10', bannerColor: '#f43f5e', glowColor: 'rgba(244,63,94,0.3)', borderColor: 'rgba(244,63,94,0.35)' },
                        'genshin-impact': { accentColor: '#8b5cf6', bgColor: '#0e1024', bannerColor: '#8b5cf6', glowColor: 'rgba(139,92,246,0.3)', borderColor: 'rgba(139,92,246,0.35)' },
                        'roblox': { accentColor: '#f59e0b', bgColor: '#151515', bannerColor: '#f59e0b', glowColor: 'rgba(245,158,11,0.3)', borderColor: 'rgba(245,158,11,0.35)' },
                      };
                      const vals = themeMap[t.id];
                      setCategoryForm(prev => ({ ...prev, theme: t.id, ...vals }));
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                      categoryForm.theme === t.id
                        ? 'border-[#ff2d2d] shadow-lg scale-105'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                    style={{ backgroundColor: t.bg }}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    <span className="text-[9px] leading-tight text-center text-white/80 truncate w-full">{t.name}</span>
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.accent }} />
                  </button>
                ))}
              </div>

              {/* Color Preview Card */}
              <div className="rounded-lg p-3 border-2 transition-all duration-300"
                style={{
                  backgroundColor: categoryForm.bgColor,
                  borderColor: categoryForm.borderColor,
                  boxShadow: `0 0 20px ${categoryForm.glowColor}, inset 0 1px 0 ${categoryForm.borderColor}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-sm"
                    style={{ backgroundColor: categoryForm.accentColor + '20', color: categoryForm.accentColor }}
                  >
                    {categoryForm.icon || '🎮'}
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: categoryForm.accentColor }}>{categoryForm.name || 'Nama Kategori'}</p>
                    <p className="text-[10px]" style={{ color: categoryForm.accentColor + '80' }}>/{categoryForm.slug || 'slug'}</p>
                  </div>
                </div>
                <div className="h-1 rounded-full" style={{ background: `linear-gradient(to right, ${categoryForm.accentColor}, ${categoryForm.bannerColor})` }} />
                <p className="text-[10px] mt-1.5" style={{ color: categoryForm.accentColor + '60' }}>{categoryForm.description || 'Preview deskripsi kategori...'}</p>
              </div>

              {/* Individual Color Fields */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={categoryForm.accentColor}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
                    />
                    <Input
                      value={categoryForm.accentColor}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="min-h-[36px] text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={categoryForm.bgColor}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, bgColor: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
                    />
                    <Input
                      value={categoryForm.bgColor}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, bgColor: e.target.value }))}
                      className="min-h-[36px] text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Banner Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={categoryForm.bannerColor}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, bannerColor: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
                    />
                    <Input
                      value={categoryForm.bannerColor}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, bannerColor: e.target.value }))}
                      className="min-h-[36px] text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Theme</Label>
                  <Input
                    value={categoryForm.theme}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, theme: e.target.value }))}
                    className="min-h-[36px] text-xs font-mono"
                    placeholder="default"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Glow Color</Label>
                  <Input
                    value={categoryForm.glowColor}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, glowColor: e.target.value }))}
                    className="min-h-[36px] text-xs font-mono"
                    placeholder="rgba(255,45,45,0.3)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Border Color</Label>
                  <Input
                    value={categoryForm.borderColor}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, borderColor: e.target.value }))}
                    className="min-h-[36px] text-xs font-mono"
                    placeholder="rgba(255,80,80,0.35)"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>Aktif</Label>
              <Switch checked={categoryForm.isActive} onCheckedChange={(val) => setCategoryForm(prev => ({ ...prev, isActive: val }))} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} className="min-h-[44px] w-full sm:w-auto">
              Batal
            </Button>
            <Button
              onClick={saveCategory}
              disabled={savingCategory}
              className="min-h-[44px] w-full sm:w-auto bg-[#ff2d2d] hover:bg-[#b81c1c] text-white"
            >
              {savingCategory ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
              {editingCategory ? 'Update Kategori' : 'Tambah Kategori'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Banner Dialog ───────────────────────────────── */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Edit Banner' : `Tambah Banner ${bannerForm.type === 'home' ? 'Home' : 'Produk'}`}</DialogTitle>
            <DialogDescription>
              {editingBanner ? 'Ubah informasi banner' : `Upload gambar dan isi form untuk menambah banner ${bannerForm.type === 'home' ? 'home' : 'produk'} baru`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Banner Type Selector */}
            <div className="space-y-2">
              <Label>Tipe Banner *</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBannerForm(prev => ({ ...prev, type: 'home', category: '' }))}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    bannerForm.type === 'home'
                      ? 'bg-[#ff2d2d] text-white shadow-md shadow-[#ff2d2d]/20'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-border'
                  }`}
                >
                  🏠 Home
                </button>
                <button
                  type="button"
                  onClick={() => setBannerForm(prev => ({ ...prev, type: 'product' }))}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    bannerForm.type === 'product'
                      ? 'bg-[#ff2d2d] text-white shadow-md shadow-[#ff2d2d]/20'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-border'
                  }`}
                >
                  🎮 Produk
                </button>
              </div>
              {bannerForm.type === 'home' && (
                <p className="text-[11px] text-blue-400">Banner akan ditampilkan di halaman utama sebagai carousel</p>
              )}
              {bannerForm.type === 'product' && (
                <p className="text-[11px] text-purple-400">Banner akan ditampilkan saat user membuka kategori game tertentu</p>
              )}
            </div>

            {/* Category Selector - only for product banners */}
            {bannerForm.type === 'product' && (
              <div className="space-y-2">
                <Label>Kategori Game *</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('banner-category-select');
                      if (el) el.focus();
                    }}
                    className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2.5 text-sm min-h-[44px] hover:bg-white/5 transition-colors"
                  >
                    <span className={bannerForm.category ? 'text-foreground' : 'text-muted-foreground'}>
                      {bannerForm.category
                        ? `${categories.find(c => c.slug === bannerForm.category)?.icon || ''} ${categories.find(c => c.slug === bannerForm.category)?.name || 'Pilih kategori...'}`
                        : 'Pilih kategori game...'}
                    </span>
                    <svg className="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <select
                    id="banner-category-select"
                    value={bannerForm.category}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, category: e.target.value }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="">Pilih kategori game...</option>
                    {categories.filter(c => c.isActive).map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                {bannerForm.category && (() => {
                  const selectedCat = categories.find(c => c.slug === bannerForm.category);
                  return selectedCat ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ff2d2d]/5 border border-[#ff2d2d]/10">
                      {selectedCat.image && <img src={selectedCat.image} alt={selectedCat.name} className="h-6 w-6 rounded object-cover" />}
                      <span className="text-xs text-[#ff2d2d]">Banner akan tampil di halaman {selectedCat.name}</span>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div className="space-y-2">
              <Label>Gambar Banner * <span className="text-muted-foreground font-normal text-xs">
                {bannerForm.type === 'product' ? '(Ukuran: 1080×270px)' : '(Ukuran: 1080×400px)'}
              </span></Label>
              <SingleImageUploader
                value={bannerForm.imageUrl}
                onChange={(url) => setBannerForm(prev => ({ ...prev, imageUrl: url }))}
                label="Upload Gambar Banner"
                aspect={bannerForm.type === 'product' ? 'banner' : 'wide'}
              />
              {bannerForm.imageUrl && (
                <div className={`mt-2 rounded-lg overflow-hidden border border-border bg-muted ${bannerForm.type === 'product' ? 'w-full aspect-[4/1]' : 'max-w-sm aspect-[20/9]'}`}>
                  <img src={bannerForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={bannerForm.title}
                onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Judul banner"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={bannerForm.description}
                onChange={(e) => setBannerForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi banner..."
                rows={2}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Link</Label>
              <Input
                value={bannerForm.link}
                onChange={(e) => setBannerForm(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://..."
                className="min-h-[44px]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  value={bannerForm.order || ''}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                  className="min-h-[44px]"
                />
              </div>
              <div className="flex items-center justify-between py-2 sm:pt-6">
                <Label>Aktif</Label>
                <Switch checked={bannerForm.isActive} onCheckedChange={(val) => setBannerForm(prev => ({ ...prev, isActive: val }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setBannerDialogOpen(false)} className="min-h-[44px] w-full sm:w-auto">
              Batal
            </Button>
            <Button
              onClick={saveBanner}
              disabled={savingBanner}
              className="min-h-[44px] w-full sm:w-auto bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000]"
            >
              {savingBanner ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
              {editingBanner ? 'Update Banner' : 'Tambah Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Transaction Detail Dialog ───────────────────── */}
      <Dialog open={txDetailOpen} onOpenChange={setTxDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>ID: {selectedTx?.transactionId}</DialogDescription>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4 py-2">
              {/* Product Info */}
              <div className="flex items-center gap-3">
                {selectedTx.productImage && (
                  <img src={selectedTx.productImage} alt="" className="size-14 rounded-lg object-cover shrink-0" />
                )}
                <div>
                  <p className="font-medium">{selectedTx.productName}</p>
                  <p className="text-xs text-muted-foreground">Cashify ID: {selectedTx.cashifyTransactionId || '-'}</p>
                </div>
              </div>

              <Separator />

              {/* Customer Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2"><Users className="size-4" /> Customer</h4>
                <div className="grid gap-1 text-sm">
                  <p><span className="text-muted-foreground">Nama:</span> {selectedTx.customerName}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedTx.customerEmail || '-'}</p>
                  <p><span className="text-muted-foreground">Telepon:</span> {selectedTx.customerPhone}</p>
                  <p><span className="text-muted-foreground">WhatsApp:</span> {selectedTx.customerWhatsapp || '-'}</p>
                </div>
              </div>

              <Separator />

              {/* Payment Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2"><DollarSign className="size-4" /> Pembayaran</h4>
                <div className="grid gap-1 text-sm">
                  <p><span className="text-muted-foreground">Harga Asli:</span> {formatRupiah(selectedTx.originalAmount)}</p>
                  <p><span className="text-muted-foreground">Kode Unik:</span> {formatRupiah(selectedTx.uniqueNominal)}</p>
                  <p className="font-medium"><span className="text-muted-foreground">Total Bayar:</span> <span className="text-[#ff2d2d]">{formatRupiah(selectedTx.totalAmount)}</span></p>
                </div>
              </div>

              <Separator />

              {/* QRIS Info */}
              {selectedTx.qrImageUrl && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2"><QrCode className="size-4" /> QRIS</h4>
                  <img src={selectedTx.qrImageUrl} alt="QRIS" className="max-w-[200px] mx-auto rounded-lg border border-border" />
                </div>
              )}

              <Separator />

              {/* Status & Dates */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Status & Waktu</h4>
                <div className="grid gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <StatusBadge status={selectedTx.status} />
                  </div>
                  <p><span className="text-muted-foreground">Dibuat:</span> {formatDate(selectedTx.createdAt)}</p>
                  <p><span className="text-muted-foreground">Expired:</span> {formatDate(selectedTx.expiredAt)}</p>
                  {selectedTx.paidAt && <p><span className="text-muted-foreground">Dibayar:</span> {formatDate(selectedTx.paidAt)}</p>}
                  {selectedTx.canceledAt && <p><span className="text-muted-foreground">Dibatalkan:</span> {formatDate(selectedTx.canceledAt)}</p>}
                </div>
              </div>

              <Separator />

              {/* Change Status */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Ubah Status</h4>
                <Select value={txStatusUpdate} onValueChange={setTxStatusUpdate}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancel">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setTxDetailOpen(false)} className="min-h-[44px] w-full sm:w-auto">
              Tutup
            </Button>
            <Button
              onClick={updateTxStatus}
              className="min-h-[44px] w-full sm:w-auto bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000]"
            >
              <CheckCircle2 className="size-4 mr-2" />
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────── */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah kamu yakin ingin menghapus <strong>{deleteTarget?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="min-h-[44px]">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[44px] bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === 'product') deleteProduct(deleteTarget.id);
                else if (deleteTarget.type === 'category') deleteCategory(deleteTarget.id);
                else if (deleteTarget.type === 'banner') deleteBanner(deleteTarget.id);
              }}
            >
              <Trash2 className="size-4 mr-2" />
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Seed DB Dialog ──────────────────────────────── */}
      <AlertDialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed Database</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan menambahkan data contoh (kategori &amp; produk) ke database. Data yang sudah ada tidak akan dihapus.
              Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="min-h-[44px]">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[44px] bg-[#ff2d2d] hover:bg-[#b81c1c] text-[#0f0000]"
              onClick={seedDatabase}
              disabled={seedLoading}
            >
              {seedLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Database className="size-4 mr-2" />}
              Seed Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
