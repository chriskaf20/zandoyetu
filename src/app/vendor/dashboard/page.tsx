'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Package,
  ShoppingBag,
  Store as StoreIcon,
  BarChart2,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Upload,
  Save,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
  X,
  Phone,
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  Star,
  Shield,
  Wallet,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  Check,
  Clock,
  Truck,
  ShoppingCart,
  AlertTriangle,
  Info,
  Sparkles,
  Wand2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { VendorService, CreateProductInput, VendorCoupon, VendorFinancials } from '@/lib/services/VendorService';
import { PlatformSettingsService } from '@/lib/services/PlatformSettingsService';
import { Product, Store, SettlementLedgerEntry, VendorDailyRevenue, FlashSale } from '@/types/schema';

// ─── Constants ────────────────────────────────────────────────────────────────

type VendorTab = 'catalogue' | 'orders' | 'profile' | 'financials' | 'promotions';
type OrderStatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
type ProductStatusFilter = 'active' | 'archived' | 'all';

const HIERARCHICAL_TAXONOMY: Record<string, { label: string; gender: 'women' | 'men' | 'mixte'; subs: string[] }> = {
  'femme': {
    label: 'Mode Femme',
    gender: 'women',
    subs: ['Robes & Ensembles', 'Hauts & Chemisiers', 'Pantalons & Jupes', 'Lingerie & Nuit', 'Créateurs & Wax', 'Tops & T-shirts', 'Jupes', 'Maillots'],
  },
  'homme': {
    label: 'Mode Homme',
    gender: 'men',
    subs: ['Chemises & Polos', 'Pantalons & Jeans', 'Costumes & Blazers', 'Streetwear & T-shirts', 'Hoodies & Sweats', 'Vestes & Manteaux', 'Sous-vêtements'],
  },
  'chaussures': {
    label: 'Chaussures',
    gender: 'mixte',
    subs: ['Baskets & Sneakers', 'Escarpins & Talons', 'Sandales & Mules', 'Mocassins & Cuir', 'Bottes & Bottines', 'Chaussons'],
  },
  'sacs': {
    label: 'Sacs & Maroquinerie',
    gender: 'mixte',
    subs: ['Sacs à main', 'Sacs à dos & Randonnée', 'Pochettes & Soirée', 'Portefeuilles & Porte-cartes', 'Valises & Voyage'],
  },
  'accessoires': {
    label: 'Accessoires & Bijoux',
    gender: 'mixte',
    subs: ['Montres de Luxe & Smart', 'Bijoux, Colliers & Boucles', 'Lunettes de Soleil', 'Ceintures en Cuir', 'Chapeaux & Casquettes'],
  },
  'beaute': {
    label: 'Beauté & Soins',
    gender: 'mixte',
    subs: ['Parfums & Brumes', 'Maquillage & Teint', 'Soins Visage & Corps', 'Soins Capillaires & Perruques'],
  },
};

const QUICK_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'Taille Unique'];
const SHOE_SIZES = ['37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const QUICK_COLORS = ['Noir', 'Blanc', 'Rouge', 'Bleu', 'Vert', 'Doré', 'Argenté', 'Rose', 'Beige', 'Marron', 'Gris', 'Jaune'];

const LUBUMBASHI_COMMUNES = ['Lubumbashi', 'Annexe', 'Kampemba', 'Katuba', 'Kenya', 'Kamalondo', 'Ruashi'];

const DELIVERY_TIMES = ['24h - 48h', '2 - 3 jours', '3 - 5 jours', '5 - 7 jours', 'Sur commande (7+ jours)'];

const ORDER_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:                   { label: 'En attente',    bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200' },
  pending_payment:           { label: 'Paiement att.', bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200' },
  awaiting_admin_clearance:  { label: 'Admin review',  bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200' },
  approved:                  { label: 'Confirmée',     bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
  processing:                { label: 'En préparation',bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-200' },
  shipped:                   { label: 'En livraison',  bg: 'bg-sky-50',     text: 'text-sky-700',    border: 'border-sky-200' },
  completed:                 { label: 'Livrée',        bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200' },
  cancelled:                 { label: 'Annulée',       bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200' },
};

const SETTLEMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  escrow:   { label: 'En séquestre', className: 'bg-amber-100 text-amber-800' },
  released: { label: 'Débloqué',     className: 'bg-blue-100 text-blue-800' },
  paid:     { label: 'Payé',         className: 'bg-emerald-100 text-emerald-800' },
};

// ─── Empty product form defaults ──────────────────────────────────────────────

function emptyProductForm(): CreateProductInput {
  return {
    title: '',
    description: '',
    category: '',
    price_usd: 0,
    price_cdf: 0,
    compare_at_price: null,
    stock_count: 0,
    target_gender: 'women',
    images_urls: [],
    sizes: [],
    colors: [],
    material_info: '',
    security_specs: '',
    delivery_time: '',
    delivery_fee_usd: null,
    has_free_return: false,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSizes(sizesJson: string | null): string[] {
  if (!sizesJson) return [];
  try { return JSON.parse(sizesJson); } catch { return []; }
}

function parseColors(colorsJson: any): string[] {
  if (!colorsJson) return [];
  if (Array.isArray(colorsJson)) return colorsJson;
  try {
    const parsed = typeof colorsJson === 'string' ? JSON.parse(colorsJson) : colorsJson;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const COLOR_HEX_MAP: Record<string, string> = {
  noir: '#171717',
  black: '#171717',
  blanc: '#FFFFFF',
  white: '#FFFFFF',
  rouge: '#EF4444',
  red: '#EF4444',
  bleu: '#3B82F6',
  blue: '#3B82F6',
  vert: '#10B981',
  green: '#10B981',
  jaune: '#F59E0B',
  yellow: '#F59E0B',
  doré: '#D4AF37',
  gold: '#D4AF37',
  argenté: '#9CA3AF',
  silver: '#9CA3AF',
  rose: '#EC4899',
  pink: '#EC4899',
  beige: '#D4B996',
  marron: '#78350F',
  brown: '#78350F',
  gris: '#6B7280',
  gray: '#6B7280',
  grey: '#6B7280',
  orange: '#F97316',
  violet: '#8B5CF6',
  purple: '#8B5CF6',
};

function getColorHex(name: string): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  return COLOR_HEX_MAP[key] || null;
}

function formatCDF(n: number) {
  return Math.round(n).toLocaleString('fr-FR') + ' CDF';
}

function formatUSD(n: number) {
  return '$' + n.toFixed(2);
}

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function shortOrderRef(id: string) {
  return 'CMD-' + id.toUpperCase().slice(-6);
}

function parseDeliveryAddress(raw: string | null) {
  if (!raw) return { commune: '', landmark: '', details: '' };
  const parts = raw.split(' | ');
  let commune = '', landmark = '', details = '';
  for (const p of parts) {
    if (p.startsWith('Commune: ')) commune = p.slice(9);
    else if (p.startsWith('Landmark: ')) landmark = p.slice(10);
    else if (p.startsWith('Adresse: ')) details = p.slice(9);
    else if (!landmark && !commune) details = p;
  }
  return { commune, landmark, details };
}

// ─── SVG Revenue Chart ────────────────────────────────────────────────────────

function RevenueChart({ data, mode }: { data: VendorDailyRevenue[]; mode: 'usd' | 'cdf' | 'all' }) {
  const W = 700, H = 160, PL = 60, PR = 16, PT = 12, PB = 36;
  const cw = W - PL - PR;
  const ch = H - PT - PB;

  const values = data.map(d => mode === 'cdf' ? d.cdf : mode === 'usd' ? d.usd : d.usd);
  const cdfValues = data.map(d => d.cdf);
  const maxVal = Math.max(...values, 1);
  const maxCdf = Math.max(...cdfValues, 1);

  const n = data.length;
  const pts = values.map((v, i) => ({
    x: PL + (i / Math.max(n - 1, 1)) * cw,
    y: PT + ch - (v / maxVal) * ch,
    v,
  }));
  const ptsCdf = cdfValues.map((v, i) => ({
    x: PL + (i / Math.max(n - 1, 1)) * cw,
    y: PT + ch - (v / maxCdf) * ch,
  }));

  const toPath = (points: { x: number; y: number }[]) =>
    points.length < 2 ? '' :
    points.map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
    }).join(' ');

  const usdPath = toPath(pts);
  const cdfPath = mode === 'all' ? toPath(ptsCdf) : '';

  // Grid
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: PT + ch - f * ch,
    val: maxVal * f,
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* Grid lines */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={PL} y1={g.y} x2={W - PR} y2={g.y} stroke="#E5E7EB" strokeWidth="1" />
          <text x={PL - 6} y={g.y + 4} fontSize="9" fill="#9CA3AF" textAnchor="end">
            {mode === 'cdf' ? `${(g.val / 1000).toFixed(0)}K` : `$${g.val.toFixed(0)}`}
          </text>
        </g>
      ))}

      {/* Gradient fill USD */}
      <defs>
        <linearGradient id="usdGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#111111" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#111111" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cdfGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D97706" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
        </linearGradient>
      </defs>

      {pts.length >= 2 && (
        <path
          d={`${usdPath} L ${pts[pts.length - 1].x} ${PT + ch} L ${pts[0].x} ${PT + ch} Z`}
          fill="url(#usdGrad)"
        />
      )}

      {/* USD Line */}
      {usdPath && <path d={usdPath} fill="none" stroke="#111111" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}

      {/* CDF overlay line */}
      {mode === 'all' && cdfPath && (
        <path d={cdfPath} fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* Dots + tooltips */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#111111" />
          <circle cx={p.x} cy={p.y} r={2} fill="#fff" />
        </g>
      ))}

      {/* X Labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={PL + (i / Math.max(n - 1, 1)) * cw}
          y={H - 6}
          fontSize="9"
          fill="#9CA3AF"
          textAnchor="middle"
        >
          {d.dayLabel}
        </text>
      ))}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VendorDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<VendorTab>('catalogue');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Dynamic Admin Exchange Rate ──
  const [exchangeRate, setExchangeRate] = useState<number>(2850);

  // ── Core state ──
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [financials, setFinancials] = useState<VendorFinancials | null>(null);
  const [chartData, setChartData] = useState<VendorDailyRevenue[]>([]);
  const [ledger, setLedger] = useState<SettlementLedgerEntry[]>([]);
  const [coupons, setCoupons] = useState<VendorCoupon[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);

  // ── Catalogue filters ──
  const [searchQuery, setSearchQuery] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<ProductStatusFilter>('active');

  // ── Order filters ──
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('all');

  // ── Chart mode ──
  const [chartMode, setChartMode] = useState<'usd' | 'cdf' | 'all'>('usd');

  // ── Product modal ──
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<CreateProductInput>(emptyProductForm());
  const [selectedUniverse, setSelectedUniverse] = useState<string>('femme');
  const [productFormTab, setProductFormTab] = useState<'info' | 'pricing' | 'attributes' | 'media' | 'delivery'>('info');
  const [newColorInput, setNewColorInput] = useState('');
  const [newSizeInput, setNewSizeInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [enhancingImageIdx, setEnhancingImageIdx] = useState<number | 'new' | null>(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studioFileInputRef = useRef<HTMLInputElement>(null);

  // ── Store profile form ──
  const [storeForm, setStoreForm] = useState({
    store_name: '',
    description: '',
    city: 'Lubumbashi',
    store_logo_url: '',
    momo_enabled: true,
    phone: '',
  });
  const [nameChangeModalOpen, setNameChangeModalOpen] = useState(false);
  const [pendingNameInput, setPendingNameInput] = useState('');
  const [pendingNameReason, setPendingNameReason] = useState('');

  // ── Coupon form ──
  const [promoCode, setPromoCode] = useState('');
  const [promoPercent, setPromoPercent] = useState('');
  const [submittingPromo, setSubmittingPromo] = useState(false);

  // ── Delete confirmation ──
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Gemini Vision AI Auto-Fill ──
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Data Loading ────────────────────────────────────────────────────────

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedStore, fetchedProducts, fetchedAllProducts, fetchedOrders, fetchedSettings] = await Promise.all([
        VendorService.getStoreByVendor(user.id),
        VendorService.getVendorProducts(user.id, false),
        VendorService.getVendorProducts(user.id, true),
        VendorService.getVendorOrders(user.id),
        PlatformSettingsService.getSettings(),
      ]);

      if (fetchedSettings?.exchange_rate) {
        setExchangeRate(fetchedSettings.exchange_rate);
      }

      setStore(fetchedStore);
      setProducts(fetchedProducts);
      setAllProducts(fetchedAllProducts);
      setOrders(fetchedOrders);

      if (fetchedStore) {
        setStoreForm({
          store_name: fetchedStore.store_name,
          description: fetchedStore.description || '',
          city: fetchedStore.city || 'Lubumbashi',
          store_logo_url: fetchedStore.store_logo_url || '',
          momo_enabled: fetchedStore.momo_enabled,
          phone: fetchedStore.phone || '',
        });

        // Load store-specific data in parallel
        const [fetchedCoupons, fetchedFlash] = await Promise.all([
          VendorService.getVendorCoupons(fetchedStore.id),
          VendorService.getVendorFlashSales(user.id),
        ]);
        setCoupons(fetchedCoupons);
        setFlashSales(fetchedFlash);
      }
    } catch (err) {
      console.error('[VendorDashboard] Load error:', err);
      showMessage('error', 'Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadFinancials = useCallback(async () => {
    if (!user) return;
    try {
      const [fin, chart, ledgerData] = await Promise.all([
        VendorService.getVendorFinancials(user.id),
        VendorService.getVendorSalesChart(user.id),
        VendorService.getVendorSettlementLedger(user.id),
      ]);
      setFinancials(fin);
      setChartData(chart);
      setLedger(ledgerData);
    } catch (err) {
      console.error('[VendorDashboard] Financials error:', err);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'financials') loadFinancials();
  }, [activeTab, loadFinancials]);

  // ─── Derived Filtered Lists ────────────────────────────────────────────────

  const displayedProducts = (productStatusFilter === 'archived' ? allProducts : products).filter((p) => {
    if (productStatusFilter === 'archived') return p.status === 'archived';
    if (productStatusFilter === 'active') return p.status === 'active';
    return true;
  }).filter((p) =>
    !searchQuery ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orderStatusFilter === 'all'
    ? orders
    : orders.filter((o) => o.order_status === orderStatusFilter);

  // ─── Product Modal ────────────────────────────────────────────────────────

  const openAddProduct = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm());
    setSelectedUniverse('femme');
    setProductFormTab('info');
    setIsProductModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    const matchedUniverse = Object.entries(HIERARCHICAL_TAXONOMY).find(([key, u]) =>
      u.subs.some(s => s.toLowerCase() === (product.category || '').toLowerCase())
    )?.[0] || (product.target_gender === 'men' ? 'homme' : 'femme');
    setSelectedUniverse(matchedUniverse);

    setProductForm({
      title: product.title,
      description: product.description || '',
      category: product.category || '',
      price_usd: product.price_usd,
      price_cdf: product.price_cdf || Math.round(product.price_usd * exchangeRate),
      compare_at_price: product.compare_at_price ?? null,
      stock_count: product.stock_count,
      target_gender: product.target_gender,
      images_urls: product.images_urls || [],
      sizes: parseSizes(product.sizes_json),
      colors: product.colors_json || [],
      material_info: product.material_info || '',
      security_specs: product.security_specs || '',
      delivery_time: product.delivery_time || '',
      delivery_fee_usd: product.delivery_fee_usd ?? null,
      has_free_return: !!product.has_free_return,
    });
    setProductFormTab('info');
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!productForm.title.trim()) { showMessage('error', 'Le nom du produit est requis.'); return; }
    if (productForm.price_usd <= 0) { showMessage('error', 'Le prix USD est requis.'); return; }
    if (productForm.stock_count < 0) { showMessage('error', 'Le stock ne peut pas être négatif.'); return; }
    if (!productForm.category) { showMessage('error', 'Veuillez sélectionner une catégorie.'); return; }

    setSaving(true);
    try {
      const finalForm = {
        ...productForm,
        price_cdf: Math.round(productForm.price_usd * exchangeRate),
      };

      if (editingProductId) {
        await VendorService.updateProduct(editingProductId, user.id, finalForm);
        showMessage('success', 'Article mis à jour avec succès.');
      } else {
        await VendorService.createProduct(user.id, finalForm);
        showMessage('success', 'Article publié avec succès.');
      }
      setIsProductModalOpen(false);
      await loadData();
    } catch (err: any) {
      showMessage('error', err.message || 'Erreur lors de la sauvegarde de l\'article.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveProduct = async (product: Product) => {
    if (!user) return;
    const newStatus = product.status === 'archived' ? 'active' : 'archived';
    try {
      await VendorService.updateProductStatus(product.id, user.id, newStatus);
      showMessage('success', newStatus === 'archived' ? 'Article archivé.' : 'Article restauré.');
      await loadData();
    } catch (err: any) {
      showMessage('error', err.message || 'Erreur.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user) return;
    try {
      await VendorService.deleteProduct(productId, user.id);
      setDeleteConfirmId(null);
      showMessage('success', 'Article supprimé définitivement.');
      await loadData();
    } catch (err: any) {
      showMessage('error', err.message || 'Erreur lors de la suppression.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await VendorService.uploadImage(file, user?.id);
      setProductForm(f => ({ ...f, images_urls: [...f.images_urls, url] }));
    } catch (err: any) {
      showMessage('error', err.message || 'Erreur lors du téléchargement de l\'image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Gemini Vision AI: Analyze image and auto-fill product fields ──────────
  const handleAiAnalyzeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiAnalyzing(true);
    setAiError(null);

    try {
      // 1. Upload image to Supabase Storage for persistent URL
      const imageUrl = await VendorService.uploadImage(file, user?.id);
      setProductForm(f => ({ ...f, images_urls: f.images_urls.includes(imageUrl) ? f.images_urls : [imageUrl, ...f.images_urls] }));

      // 2. Read file as base64 for Gemini Vision
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 3. Call Gemini Vision API
      const res = await fetch('/api/ai/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type || 'image/jpeg' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Analyse IA échouée');
      }

      const d = json.data;
      const suggestedPriceUsd = Number(d.suggested_price_usd) || 0;

      if (d.universe_slug && HIERARCHICAL_TAXONOMY[d.universe_slug]) {
        setSelectedUniverse(d.universe_slug);
      } else if (d.target_gender === 'men') {
        setSelectedUniverse('homme');
      }

      // 4. Auto-populate form fields
      setProductForm(f => ({
        ...f,
        title: d.title || d.title_fr || f.title,
        title_fr: d.title_fr || d.title || f.title_fr,
        title_en: d.title_en || f.title_en,
        title_sw: d.title_sw || f.title_sw,
        description: d.description || d.desc_fr || f.description,
        desc_fr: d.desc_fr || d.description || f.desc_fr,
        desc_en: d.desc_en || f.desc_en,
        desc_sw: d.desc_sw || f.desc_sw,
        category: d.category || f.category,
        target_gender: (['women', 'men', 'mixte'].includes(d.target_gender) ? d.target_gender : f.target_gender) as 'women' | 'men' | 'mixte',
        price_usd: suggestedPriceUsd > 0 ? suggestedPriceUsd : f.price_usd,
        price_cdf: suggestedPriceUsd > 0 ? Math.round(suggestedPriceUsd * exchangeRate) : f.price_cdf,
        sizes: Array.isArray(d.sizes) && d.sizes.length > 0 ? d.sizes : f.sizes,
        colors: Array.isArray(d.colors) && d.colors.length > 0 ? d.colors : f.colors,
        material_info: d.material_info || f.material_info,
        security_specs: d.security_specs || f.security_specs,
      }));

      showMessage('success', '✨ Fiche article remplie automatiquement par Gemini Vision !');
      // Jump to Info tab to let vendor review fields
      setProductFormTab('info');
    } catch (err: any) {
      setAiError(err.message || 'Erreur lors de l\'analyse IA.');
      showMessage('error', err.message || 'Erreur lors de l\'analyse IA.');
    } finally {
      setAiAnalyzing(false);
      if (aiFileInputRef.current) aiFileInputRef.current.value = '';
    }
  };

  // ── Studio Pro: Background Cleanup & 3:4 Standardization ─────────────────
  const handleEnhanceExistingImage = async (idx: number, imageUrl: string) => {
    if (enhancingImageIdx !== null) return;
    setEnhancingImageIdx(idx);
    try {
      const res = await fetch('/api/ai/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors du nettoyage Studio');
      }

      // Upload clean WebP to Supabase Storage
      const newStudioUrl = await VendorService.uploadBase64Image(json.imageBase64, user?.id);

      setProductForm(f => {
        const nextImages = [...f.images_urls];
        nextImages[idx] = newStudioUrl;
        return { ...f, images_urls: nextImages };
      });

      showMessage('success', '✨ Photo détourée et sublimée en qualité Studio 3:4 !');
    } catch (err: any) {
      showMessage('error', err.message || 'Erreur lors de la transformation Studio Pro.');
    } finally {
      setEnhancingImageIdx(null);
    }
  };

  const handleStudioProUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEnhancingImageIdx('new');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/ai/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type || 'image/jpeg' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors du nettoyage Studio');
      }

      const studioUrl = await VendorService.uploadBase64Image(json.imageBase64, user?.id);
      setProductForm(f => ({ ...f, images_urls: [...f.images_urls, studioUrl] }));
      showMessage('success', '✨ Photo importée et sublimée en qualité Studio 3:4 !');
    } catch (err: any) {
      showMessage('error', err.message || 'Erreur lors de l\'import Studio Pro.');
    } finally {
      setEnhancingImageIdx(null);
      if (studioFileInputRef.current) studioFileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setProductForm(f => ({ ...f, images_urls: [...f.images_urls, url] }));
    setImageUrlInput('');
  };

  // ─── Order Status Fulfillment (Vendor marks ready/shipped) ──────────────────

  const handleOrderFulfillment = async (orderId: string, newStatus: string) => {
    try {
      await VendorService.updateOrderStatus(orderId, newStatus);
      showMessage('success', 'Statut de livraison mis à jour.');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
    } catch {
      showMessage('error', 'Erreur lors de la mise à jour du statut.');
    }
  };

  // ─── Store Profile ─────────────────────────────────────────────────────────

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!storeForm.store_name.trim()) { showMessage('error', 'Le nom de la boutique est requis.'); return; }
    setSaving(true);
    try {
      const updated = await VendorService.updateStore(user.id, {
        description: storeForm.description,
        city: storeForm.city,
        store_logo_url: storeForm.store_logo_url,
        momo_enabled: storeForm.momo_enabled,
        phone: storeForm.phone,
      });
      setStore(updated);
      showMessage('success', 'Profil boutique mis à jour.');
    } catch (err: any) {
      showMessage('error', err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestNameChange = async () => {
    if (!store || !pendingNameInput.trim()) return;
    if (pendingNameInput.trim() === store.store_name) {
      showMessage('error', 'Le nom proposé doit être différent du nom actuel de la boutique.');
      return;
    }
    setSaving(true);
    try {
      await VendorService.requestStoreNameChange(store.id, pendingNameInput, pendingNameReason);
      const proposed = pendingNameInput.trim();
      const reason = pendingNameReason.trim();
      setNameChangeModalOpen(false);
      setPendingNameInput('');
      setPendingNameReason('');
      setStore(prev => prev ? { ...prev, pending_name: proposed, pending_name_reason: reason } : prev);
      showMessage('success', 'Demande de changement de nom soumise. En attente d\'approbation admin.');
      await loadData();
    } catch (err: any) {
      showMessage('error', err.message || 'Erreur lors de la soumission.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Coupon ────────────────────────────────────────────────────────────────

  const handleSubmitCoupon = async () => {
    if (!store || !user) { showMessage('error', 'Aucune boutique associée.'); return; }
    const code = promoCode.trim().toUpperCase();
    const percent = parseInt(promoPercent, 10);
    if (!code) { showMessage('error', 'Veuillez entrer un code promo.'); return; }
    if (isNaN(percent) || percent < 1 || percent > 100) { showMessage('error', 'Pourcentage invalide (1-100).'); return; }

    setSubmittingPromo(true);
    try {
      await VendorService.submitCouponRequest(store.id, user.id, code, percent);
      setPromoCode('');
      setPromoPercent('');
      showMessage('success', 'Code promo soumis pour approbation.');
      const updated = await VendorService.getVendorCoupons(store.id);
      setCoupons(updated);
    } catch (err: any) {
      showMessage('error', err.message || 'Erreur lors de la soumission.');
    } finally {
      setSubmittingPromo(false);
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-black" />
          <p className="text-sm text-brand-gray font-medium">Chargement du tableau de bord…</p>
        </div>
      </div>
    );
  }

  // ─── Tabs Config ───────────────────────────────────────────────────────────

  const TABS: { id: VendorTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'catalogue',   label: 'Catalogue',        icon: <Package className="w-3.5 h-3.5" />,   count: products.length },
    { id: 'orders',      label: 'Commandes',        icon: <ShoppingBag className="w-3.5 h-3.5" />, count: orders.filter(o => o.order_status === 'pending' || o.order_status === 'processing').length },
    { id: 'profile',     label: 'Boutique',         icon: <StoreIcon className="w-3.5 h-3.5" /> },
    { id: 'financials',  label: 'Statistiques',     icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'promotions',  label: 'Promotions',       icon: <Tag className="w-3.5 h-3.5" />,       count: coupons.filter(c => c.status === 'active').length },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-brand-offWhite">
      {/* ── Header ── */}
      <div className="bg-white border-b border-brand-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <div>
              <h1 className="text-sm font-bold text-brand-black uppercase tracking-widest">Tableau de Bord Vendeur</h1>
              {store && (
                <p className="text-xs text-brand-gray mt-0.5">
                  {store.store_name}
                  {store.is_verified && (
                    <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                      <Shield className="w-3 h-3" /><span className="font-semibold text-[10px]">VÉRIFIÉ</span>
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {message && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {message.text}
                </div>
              )}
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`vendor-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-black text-brand-black'
                    : 'border-transparent text-brand-gray hover:text-brand-charcoal'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-brand-black text-white' : 'bg-brand-lightGray text-brand-gray'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ════════════════════════════════════════════════════════════════
            TAB 1: CATALOGUE & STOCK
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'catalogue' && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray" />
                <input
                  id="product-search"
                  type="text"
                  placeholder="Rechercher un article…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black bg-white"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex gap-1.5">
                {([['active', 'Actifs'], ['archived', 'Archivés'], ['all', 'Tous']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    id={`product-filter-${val}`}
                    onClick={() => setProductStatusFilter(val)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                      productStatusFilter === val
                        ? 'bg-brand-black text-white border-brand-black'
                        : 'bg-white text-brand-gray border-brand-border hover:border-brand-charcoal'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                id="add-product-btn"
                onClick={openAddProduct}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-brand-charcoal transition-colors ml-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter un Article
              </button>
            </div>

            {/* Product Grid */}
            {displayedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="w-12 h-12 text-brand-border mb-3" />
                <p className="text-sm font-semibold text-brand-black">Aucun article trouvé</p>
                <p className="text-xs text-brand-gray mt-1">
                  {productStatusFilter === 'archived' ? 'Aucun article archivé.' : 'Commencez par ajouter votre premier article.'}
                </p>
                {productStatusFilter !== 'archived' && (
                  <button onClick={openAddProduct} className="mt-4 px-5 py-2 bg-brand-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-brand-charcoal transition-colors">
                    <Plus className="w-3.5 h-3.5 inline mr-1.5" /> Ajouter un Article
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedProducts.map((product) => {
                  const isLowStock = product.stock_count > 0 && product.stock_count <= 3;
                  const isOutOfStock = product.stock_count <= 0;
                  const sizes = parseSizes(product.sizes_json);
                  const colors = parseColors(product.colors_json);
                  const priceCdf = product.price_cdf || Math.round(product.price_usd * exchangeRate);
                  const discountPercent = product.compare_at_price && product.compare_at_price > product.price_usd
                    ? Math.round(((product.compare_at_price - product.price_usd) / product.compare_at_price) * 100)
                    : null;
                  const genderLabel = product.target_gender === 'women' ? 'Femme' : product.target_gender === 'men' ? 'Homme' : 'Mixte';

                  return (
                    <div
                      key={product.id}
                      className={`group bg-white border border-neutral-200/90 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                        product.status === 'archived' ? 'opacity-65' : ''
                      }`}
                    >
                      {/* Image container with subtle zoom */}
                      <div className="relative aspect-square bg-gradient-to-b from-neutral-100 to-neutral-50 overflow-hidden">
                        {product.images_urls[0] ? (
                          <Image
                            src={product.images_urls[0]}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-10 h-10 text-neutral-300" />
                          </div>
                        )}

                        {/* Top-Left: Glassmorphic Status Pill */}
                        <div className="absolute top-2.5 left-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase backdrop-blur-md shadow-xs border ${
                              product.status === 'active'
                                ? 'bg-white/95 text-emerald-800 border-emerald-200/60'
                                : product.status === 'archived'
                                ? 'bg-neutral-800/90 text-white border-neutral-700'
                                : 'bg-rose-500/90 text-white border-rose-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                product.status === 'active'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : product.status === 'archived'
                                  ? 'bg-neutral-400'
                                  : 'bg-white'
                              }`}
                            />
                            {product.status === 'active' ? 'ACTIF' : product.status === 'archived' ? 'ARCHIVÉ' : 'SUSPENDU'}
                          </span>
                        </div>

                        {/* Top-Right: Image Counter & Storefront Link */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          {product.images_urls.length > 1 && (
                            <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              +{product.images_urls.length - 1}
                            </span>
                          )}
                          <a
                            href={`/products/${product.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Voir l'article sur la boutique"
                            className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-md text-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110 hover:text-black shadow-md"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Discount floating badge if any */}
                        {discountPercent && (
                          <div className="absolute bottom-2.5 left-2.5">
                            <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                              -{discountPercent}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
                        {/* Category & Gender Pill Tag */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md truncate max-w-[70%]">
                            {product.category || 'Général'}
                          </span>
                          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                            {genderLabel}
                          </span>
                        </div>

                        {/* Product Title */}
                        <p className="text-xs font-bold text-neutral-900 leading-snug line-clamp-2 min-h-[2rem] group-hover:text-amber-700 transition-colors">
                          {product.title}
                        </p>

                        {/* Pricing Block */}
                        <div className="bg-neutral-50/90 rounded-xl p-2 border border-neutral-100 space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-neutral-950 tracking-tight">
                              {formatUSD(product.price_usd)}
                            </span>
                            {product.compare_at_price && product.compare_at_price > product.price_usd && (
                              <span className="text-xs text-neutral-400 line-through font-medium">
                                {formatUSD(product.compare_at_price)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-amber-700 tracking-tight">
                              ≈ {formatCDF(priceCdf)}
                            </span>
                          </div>
                        </div>

                        {/* Stock Status Pill */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold self-start ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isOutOfStock ? (
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                          ) : (
                            <Check className="w-3 h-3 text-emerald-600" />
                          )}
                          <span>
                            {isOutOfStock
                              ? 'Rupture de stock'
                              : isLowStock
                              ? `Stock faible (${product.stock_count})`
                              : `${product.stock_count} en stock`}
                          </span>
                        </div>

                        {/* Sizes & Colors row */}
                        {(sizes.length > 0 || colors.length > 0) && (
                          <div className="flex flex-col gap-1.5 pt-1">
                            {/* Sizes */}
                            {sizes.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                {sizes.slice(0, 5).map((s) => (
                                  <span
                                    key={s}
                                    className="text-[9px] font-bold px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-neutral-600 shadow-2xs"
                                  >
                                    {s}
                                  </span>
                                ))}
                                {sizes.length > 5 && (
                                  <span className="text-[9px] font-medium text-neutral-400">
                                    +{sizes.length - 5}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Color dots */}
                            {colors.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                {colors.slice(0, 5).map((col) => {
                                  const hex = getColorHex(col);
                                  return hex ? (
                                    <span
                                      key={col}
                                      title={col}
                                      className="w-3 h-3 rounded-full border border-neutral-300 shadow-2xs"
                                      style={{ backgroundColor: hex }}
                                    />
                                  ) : (
                                    <span
                                      key={col}
                                      className="text-[9px] font-medium text-neutral-500 px-1 bg-neutral-100 rounded"
                                    >
                                      {col}
                                    </span>
                                  );
                                })}
                                {colors.length > 5 && (
                                  <span className="text-[9px] font-medium text-neutral-400">
                                    +{colors.length - 5}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card Action Buttons */}
                        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-neutral-100">
                          <button
                            id={`edit-product-${product.id}`}
                            onClick={() => openEditProduct(product)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-neutral-900 text-white hover:bg-neutral-800 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs active:scale-[0.98]"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Modifier</span>
                          </button>
                          <button
                            id={`archive-product-${product.id}`}
                            onClick={() => handleArchiveProduct(product)}
                            title={product.status === 'archived' ? 'Restaurer au catalogue' : 'Archiver l\'article'}
                            className="p-2 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                          >
                            {product.status === 'archived' ? (
                              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Archive className="w-3.5 h-3.5 text-neutral-500" />
                            )}
                          </button>
                          <button
                            id={`delete-product-${product.id}`}
                            onClick={() => setDeleteConfirmId(product.id)}
                            title="Supprimer définitivement"
                            className="p-2 border border-neutral-200 rounded-xl text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 2: COMMANDES REÇUES (No accept/reject approval buttons)
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div>
            {/* Status Filter Bar */}
            <div className="flex flex-wrap gap-2 mb-5">
              {([
                ['all', 'Toutes', orders.length],
                ['pending', 'En attente', orders.filter(o => o.order_status === 'pending').length],
                ['processing', 'En préparation', orders.filter(o => o.order_status === 'processing').length],
                ['shipped', 'En livraison', orders.filter(o => o.order_status === 'shipped').length],
                ['completed', 'Livrées', orders.filter(o => o.order_status === 'completed').length],
                ['cancelled', 'Annulées', orders.filter(o => o.order_status === 'cancelled').length],
              ] as [OrderStatusFilter, string, number][]).map(([val, label, count]) => (
                <button
                  key={val}
                  id={`order-filter-${val}`}
                  onClick={() => setOrderStatusFilter(val)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                    orderStatusFilter === val
                      ? 'bg-brand-black text-white border-brand-black'
                      : 'bg-white text-brand-gray border-brand-border hover:border-brand-charcoal'
                  }`}
                >
                  {label}
                  {count > 0 && <span className={`text-[10px] font-bold px-1 rounded-full ${orderStatusFilter === val ? 'bg-white/20 text-white' : 'bg-brand-lightGray text-brand-gray'}`}>{count}</span>}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShoppingBag className="w-12 h-12 text-brand-border mb-3" />
                <p className="text-sm font-semibold text-brand-black">Aucune commande</p>
                <p className="text-xs text-brand-gray mt-1">Les commandes passées par vos clients apparaîtront ici.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredOrders.map((order) => {
                  const cfg = ORDER_STATUS_CONFIG[order.order_status] || ORDER_STATUS_CONFIG.pending;
                  const addr = parseDeliveryAddress(order.delivery_address || order.shipping_address);
                  const customer = order.customer;
                  const product = order.products;
                  const orderCdf = order.total_cdf > 0 ? order.total_cdf : Math.round(order.total_usd * exchangeRate);

                  // Vendor fulfillment buttons (Only for marking shipped / completed, NO accept/reject gate)
                  let actions: { label: string; status: string; icon: React.ReactNode }[] = [];
                  if (order.order_status === 'processing') {
                    actions = [
                      { label: 'Prêt / Expédier la commande', status: 'shipped', icon: <Truck className="w-3.5 h-3.5" /> },
                    ];
                  } else if (order.order_status === 'shipped') {
                    actions = [
                      { label: 'Confirmer Livraison', status: 'completed', icon: <CheckCircle className="w-3.5 h-3.5" /> },
                    ];
                  }

                  return (
                    <div key={order.id} className="bg-white border border-brand-border rounded-xl p-4 shadow-subtle hover:shadow-card transition-shadow">
                      {/* Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-brand-black font-mono">{shortOrderRef(order.id)}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-brand-gray">{formatShortDate(order.timestamp)}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Left: Customer + Delivery */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-brand-gray uppercase tracking-wide">Client</p>
                          <p className="text-xs font-semibold text-brand-black">{customer?.full_name || 'Client anonyme'}</p>
                          {customer?.phone && (
                            <p className="text-xs text-brand-gray flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</p>
                          )}
                          {customer?.email && (
                            <p className="text-xs text-brand-gray">{customer.email}</p>
                          )}

                          <div className="pt-1.5 border-t border-brand-border">
                            <p className="text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1">Mode de Réception</p>
                            <p className="text-xs text-brand-black font-medium">
                              {order.delivery_type === 'In-Store Pickup' ? '🏪 Retrait en boutique' : '📦 Livraison à domicile / adresse'}
                            </p>
                            {addr.commune && (
                              <p className="text-xs text-brand-gray flex items-start gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                {[addr.commune, addr.landmark, addr.details].filter(Boolean).join(' — ')}
                              </p>
                            )}
                            {!addr.commune && (order.shipping_address || order.delivery_address) && (
                              <p className="text-xs text-brand-gray">{order.shipping_address || order.delivery_address}</p>
                            )}
                          </div>
                        </div>

                        {/* Right: Product + Total */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-brand-gray uppercase tracking-wide">Article Commandé</p>
                          {product && (
                            <div className="flex items-center gap-2">
                              {product.images_urls?.[0] && (
                                <div className="relative w-10 h-10 rounded border border-brand-border overflow-hidden shrink-0 bg-brand-lightGray">
                                  <Image src={product.images_urls[0]} alt={product.title} fill className="object-cover" sizes="40px" unoptimized />
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-semibold text-brand-black line-clamp-1">{product.title}</p>
                                <p className="text-[10px] text-brand-gray">{product.category}</p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-brand-gray pt-1">
                            <div><span className="font-medium">Quantité :</span> {order.quantity || 1} article(s)</div>
                            <div><span className="font-medium">Frais liv. :</span> {order.delivery_fee ? formatUSD(order.delivery_fee) : 'Inclus'}</div>
                            {order.payment_reference && (
                              <div className="col-span-2"><span className="font-medium">Paiement :</span> Mobile Money ({order.payment_reference})</div>
                            )}
                          </div>

                          <div className="pt-1.5 border-t border-brand-border">
                            <p className="text-[10px] font-bold text-brand-gray uppercase tracking-wide">Montant Total</p>
                            <p className="text-base font-bold text-brand-black">{formatUSD(order.total_usd)}</p>
                            <p className="text-xs text-brand-gray">{formatCDF(orderCdf)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Fulfillment Actions (Only for status progression) */}
                      {actions.length > 0 && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-brand-border">
                          {actions.map(action => (
                            <button
                              key={action.status}
                              id={`order-action-${order.id}-${action.status}`}
                              onClick={() => handleOrderFulfillment(order.id, action.status)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold uppercase tracking-wide bg-brand-black text-white hover:bg-brand-charcoal transition-colors"
                            >
                              {action.icon}{action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 3: PROFIL BOUTIQUE
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Verification Status Banner */}
            {store?.is_verified ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Boutique Officielle Vérifiée</p>
                  <p className="text-[10px] text-amber-600">Votre boutique bénéficie du badge de vérification officielle.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 border border-brand-border rounded-xl">
                <Info className="w-5 h-5 text-brand-gray shrink-0" />
                <div>
                  <p className="text-xs font-bold text-brand-black uppercase tracking-wide">Badge de Vérification</p>
                  <p className="text-[10px] text-brand-gray">Contactez l'administration pour soumettre votre dossier de vérification.</p>
                </div>
              </div>
            )}

            {/* Pending name change notice */}
            {store?.pending_name && (
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                <Clock className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-800">Demande de Changement de Nom en Attente</p>
                  <p className="text-[10px] text-blue-600">
                    Nom proposé : <strong>"{store.pending_name}"</strong>
                    {store.pending_name_reason && ` — Raison : ${store.pending_name_reason}`}
                  </p>
                </div>
              </div>
            )}

            {/* Store Name Section */}
            <div className="bg-white border border-brand-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-brand-black uppercase tracking-widest">Nom Commercial</h3>
                <button
                  id="request-name-change-btn"
                  onClick={() => { setPendingNameInput(''); setPendingNameReason(''); setNameChangeModalOpen(true); }}
                  className="text-xs font-semibold text-brand-black underline underline-offset-2"
                >
                  Demander modification
                </button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-lightGray rounded-lg">
                {store?.store_logo_url ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-border shrink-0">
                    <Image src={store.store_logo_url} alt={store.store_name} fill className="object-cover" sizes="48px" unoptimized />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-brand-charcoal flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">{(store?.store_name || 'B')[0]}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-brand-black">{store?.store_name || 'Boutique sans nom'}</p>
                  {store?.city && <p className="text-xs text-brand-gray">{store.city}</p>}
                </div>
              </div>
            </div>

            {/* Main Store Profile Form */}
            <form onSubmit={handleSaveStore} className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-brand-black uppercase tracking-widest border-b border-brand-border pb-2">Paramètres de la Boutique</h3>

              {/* Logo URL */}
              <div>
                <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Logo (URL ou lien image)</label>
                <div className="flex gap-2 items-center">
                  <input
                    id="store-logo-url"
                    type="url"
                    value={storeForm.store_logo_url}
                    onChange={(e) => setStoreForm(f => ({ ...f, store_logo_url: e.target.value }))}
                    placeholder="https://…"
                    className="flex-1 px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                  />
                  {storeForm.store_logo_url && (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-border shrink-0">
                      <Image src={storeForm.store_logo_url} alt="Logo" fill className="object-cover" sizes="40px" unoptimized />
                    </div>
                  )}
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Commune / Ville</label>
                <select
                  id="store-city"
                  value={storeForm.city}
                  onChange={(e) => setStoreForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black bg-white"
                >
                  {LUBUMBASHI_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Autre">Autre</option>
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Téléphone / WhatsApp</label>
                <input
                  id="store-phone"
                  type="tel"
                  value={storeForm.phone}
                  onChange={(e) => setStoreForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+243 9XX XXX XXX"
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Description de la Boutique</label>
                <textarea
                  id="store-description"
                  rows={3}
                  value={storeForm.description}
                  onChange={(e) => setStoreForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Présentez votre boutique et vos produits…"
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black resize-none"
                />
              </div>

              {/* MoMo Toggle */}
              <div className="flex items-center justify-between p-3 bg-brand-lightGray rounded-lg">
                <div>
                  <p className="text-xs font-bold text-brand-black">Accepter Mobile Money</p>
                  <p className="text-[10px] text-brand-gray">Permettre les paiements via M-Pesa, Orange Money, Airtel</p>
                </div>
                <button
                  id="momo-toggle"
                  type="button"
                  onClick={() => setStoreForm(f => ({ ...f, momo_enabled: !f.momo_enabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${storeForm.momo_enabled ? 'bg-emerald-500' : 'bg-neutral-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${storeForm.momo_enabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <button
                id="save-store-btn"
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-brand-charcoal transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Enregistrer les Paramètres
              </button>
            </form>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 4: STATISTIQUES & GRAND LIVRE
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            {!financials ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-brand-gray" />
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Chiffre d\'Affaires (USD)', value: formatUSD(financials.gmv_usd), sub: formatCDF(financials.gmv_cdf), icon: <DollarSign className="w-4 h-4" />, highlight: true },
                    { label: 'Commission Plateforme (10%)', value: formatUSD(financials.commission_usd), sub: `Taux : ${financials.commission_rate}%`, icon: <TrendingUp className="w-4 h-4" /> },
                    { label: 'Net Vendeur Estimé', value: formatUSD(financials.net_payout_usd), sub: 'Après commission', icon: <Wallet className="w-4 h-4" />, highlight: true },
                    { label: 'Total Commandes', value: `${financials.total_orders}`, sub: `${financials.completed_orders} livrées`, icon: <ShoppingCart className="w-4 h-4" /> },
                    { label: 'Abonnés Boutique', value: `${financials.follower_count}`, sub: 'Followers', icon: <Users className="w-4 h-4" /> },
                    { label: 'Articles Actifs', value: `${financials.product_count}`, sub: 'En catalogue', icon: <Package className="w-4 h-4" /> },
                    { label: 'Note Moyenne', value: financials.average_rating > 0 ? `${financials.average_rating} / 5 ⭐` : '—', sub: `${financials.review_count} avis`, icon: <Star className="w-4 h-4" /> },
                  ].map((kpi, i) => (
                    <div key={i} className={`bg-white border rounded-xl p-4 shadow-subtle ${kpi.highlight ? 'border-brand-black' : 'border-brand-border'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-brand-gray">{kpi.icon}</span>
                        <span className="text-[10px] font-bold text-brand-gray uppercase tracking-wide">{kpi.label}</span>
                      </div>
                      <p className="text-lg font-bold text-brand-black">{kpi.value}</p>
                      <p className="text-[10px] text-brand-gray mt-0.5">{kpi.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue Chart */}
                <div className="bg-white border border-brand-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-brand-black uppercase tracking-widest">Revenus — 7 Derniers Jours</h3>
                    <div className="flex gap-1.5">
                      {(['usd', 'cdf', 'all'] as const).map(m => (
                        <button
                          key={m}
                          id={`chart-mode-${m}`}
                          onClick={() => setChartMode(m)}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${
                            chartMode === m ? 'bg-brand-black text-white border-brand-black' : 'bg-white text-brand-gray border-brand-border hover:border-brand-charcoal'
                          }`}
                        >
                          {m === 'all' ? 'USD+CDF' : m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  {chartData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <RevenueChart data={chartData} mode={chartMode} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-brand-gray text-xs">Aucune donnée de vente disponible.</div>
                  )}
                  {chartMode === 'all' && (
                    <div className="flex gap-4 mt-3 text-[10px]">
                      <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-brand-black inline-block" /> USD</span>
                      <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-brand-accent inline-block" style={{ background: '#D97706' }} /> CDF (taux {exchangeRate})</span>
                    </div>
                  )}
                </div>

                {/* Settlement Ledger */}
                <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-brand-border">
                    <h3 className="text-xs font-bold text-brand-black uppercase tracking-widest">Grand Livre des Règlements</h3>
                    <p className="text-[10px] text-brand-gray mt-0.5">Historique des reversements par commande</p>
                  </div>
                  {ledger.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-brand-gray text-xs">
                      Aucun règlement enregistré pour l'instant.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-brand-border bg-brand-offWhite">
                            {['Réf. Commande', 'Brut USD', 'Brut CDF', 'Commission', 'Net Vendeur USD', 'Net CDF', 'Statut', 'Date'].map(h => (
                              <th key={h} className="px-4 py-2.5 text-[10px] font-bold text-brand-gray uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                          {ledger.map((entry) => {
                            const sc = SETTLEMENT_STATUS_CONFIG[entry.status] || SETTLEMENT_STATUS_CONFIG.escrow;
                            return (
                              <tr key={entry.id} className="hover:bg-brand-offWhite transition-colors">
                                <td className="px-4 py-2.5 font-mono font-bold text-brand-black whitespace-nowrap">{shortOrderRef(entry.order_id)}</td>
                                <td className="px-4 py-2.5 text-brand-black">{formatUSD(entry.gross_usd)}</td>
                                <td className="px-4 py-2.5 text-brand-gray">{formatCDF(entry.gross_cdf)}</td>
                                <td className="px-4 py-2.5 text-red-600">-{formatUSD(entry.commission_usd)}</td>
                                <td className="px-4 py-2.5 font-bold text-emerald-700">{formatUSD(entry.net_usd)}</td>
                                <td className="px-4 py-2.5 text-brand-gray">{formatCDF(entry.net_cdf)}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sc.className}`}>{sc.label}</span>
                                </td>
                                <td className="px-4 py-2.5 text-brand-gray whitespace-nowrap">{formatShortDate(entry.created_at)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 5: PROMOTIONS & VENTES FLASH
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'promotions' && (
          <div className="space-y-6 max-w-3xl">
            {/* Coupon creation form */}
            <div className="bg-white border border-brand-border rounded-xl p-5">
              <h3 className="text-xs font-bold text-brand-black uppercase tracking-widest mb-4">Créer un Code Promo Boutique</h3>
              <p className="text-[10px] text-brand-gray mb-4">Soumettez un code promo pour approbation par l'administration. Il sera activé après validation.</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Code Promo *</label>
                  <input
                    id="promo-code-input"
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Ex: LUSHOIS15"
                    maxLength={20}
                    className="w-full px-3 py-2 text-xs font-mono border border-brand-border rounded-lg focus:outline-none focus:border-brand-black uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Réduction (%) *</label>
                  <input
                    id="promo-percent-input"
                    type="number"
                    min={1}
                    max={100}
                    value={promoPercent}
                    onChange={(e) => setPromoPercent(e.target.value)}
                    placeholder="Ex: 15"
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                  />
                </div>
              </div>

              {!store && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">Vous devez d'abord configurer votre profil boutique.</p>
                </div>
              )}

              <button
                id="submit-promo-btn"
                onClick={handleSubmitCoupon}
                disabled={submittingPromo || !store}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-brand-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                Soumettre pour Approbation
              </button>
            </div>

            {/* Existing coupons */}
            <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-brand-border">
                <h3 className="text-xs font-bold text-brand-black uppercase tracking-widest">Mes Codes Promo</h3>
              </div>
              {coupons.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-brand-gray text-xs">
                  Aucun code promo soumis.
                </div>
              ) : (
                <div className="divide-y divide-brand-border">
                  {coupons.map(coupon => (
                    <div key={coupon.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-brand-black tracking-widest">{coupon.code}</span>
                        <span className="text-xs text-brand-gray">{coupon.discount_percent}% de réduction</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-brand-gray">{formatShortDate(coupon.created_at)}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          coupon.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          coupon.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {coupon.status === 'active' ? 'ACTIF' : coupon.status === 'rejected' ? 'REJETÉ' : 'EN ATTENTE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Flash Sales Info & Read-Only List */}
            <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-brand-black uppercase tracking-widest flex items-center gap-2">
                    <span className="text-red-600 font-black">⚡</span>
                    <span>Mes Articles en Ventes Flash (Lecture Seule)</span>
                  </h3>
                  <p className="text-[10px] text-brand-gray mt-0.5">
                    Sélectionnés et programmés par l'administration centrale Zando Yetu pour booster votre visibilité.
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-bold rounded">
                  {flashSales.length} programmés
                </span>
              </div>

              {flashSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-brand-gray text-xs">
                  <p className="font-semibold text-neutral-600">Aucun de vos articles n'est actuellement en vente flash.</p>
                  <p className="text-[10px] text-neutral-400 mt-1 max-w-md">
                    L'équipe commerciale Zando Yetu sélectionne régulièrement les meilleurs articles pour les mettre en avant lors des campagnes flash.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-brand-border">
                  {flashSales.map((sale) => {
                    const product = sale.products;
                    const soldPercent = sale.stock_limit > 0 ? Math.min(100, Math.round(((sale.items_sold || 0) / sale.stock_limit) * 100)) : 0;
                    const now = new Date();
                    const start = new Date(sale.start_time);
                    const end = new Date(sale.end_time);
                    const isLive = now >= start && now < end;
                    const isUpcoming = now < start;

                    return (
                      <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {product?.images_urls?.[0] && (
                            <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-brand-border shrink-0 bg-brand-lightGray">
                              <Image src={product.images_urls[0]} alt={product.title} fill className="object-cover" sizes="48px" unoptimized />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-brand-black line-clamp-1">{product?.title}</p>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-xs text-brand-black font-bold">{formatUSD(sale.flash_price_usd)}</span>
                              {product && product.price_usd > sale.flash_price_usd && (
                                <span className="text-[10px] text-brand-gray line-through">{formatUSD(product.price_usd)}</span>
                              )}
                              <span className="text-[9px] text-neutral-400 font-mono">
                                ≈ {Math.round(sale.flash_price_usd * 2850).toLocaleString()} CDF
                              </span>
                            </div>
                            <div className="text-[9px] text-brand-gray mt-1 font-mono">
                              Période : {new Date(sale.start_time).toLocaleDateString()} {new Date(sale.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(sale.end_time).toLocaleDateString()} {new Date(sale.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isLive ? 'bg-emerald-100 text-emerald-700' : isUpcoming ? 'bg-sky-100 text-sky-700' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {isLive ? '🟢 EN COURS' : isUpcoming ? '🔵 PLANIFIÉE' : '⚪ TERMINÉE'}
                          </span>
                          <div className="w-28 text-right">
                            <div className="w-full h-1.5 bg-brand-lightGray rounded-full overflow-hidden mt-1">
                              <div className="h-full bg-brand-black rounded-full" style={{ width: `${soldPercent}%` }} />
                            </div>
                            <span className="text-[9px] text-brand-gray whitespace-nowrap block mt-0.5">
                              {sale.items_sold || 0}/{sale.stock_limit} vendus
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          PRODUCT MODAL (Clean, single language input with automatic translations & FX calc)
      ═══════════════════════════════════════════════════════════════════════ */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h2 className="text-sm font-bold text-brand-black uppercase tracking-widest">
                {editingProductId ? 'Modifier l\'Article' : 'Ajouter un Nouvel Article'}
              </h2>
              <button id="close-product-modal" onClick={() => setIsProductModalOpen(false)} className="p-1.5 rounded hover:bg-brand-lightGray transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex border-b border-brand-border px-6 overflow-x-auto no-scrollbar">
              {([
                ['info', 'Informations'],
                ['pricing', 'Prix & Stock'],
                ['attributes', 'Tailles & Couleurs'],
                ['media', 'Galerie Photos'],
                ['delivery', 'Livraison'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  id={`product-tab-${id}`}
                  onClick={() => setProductFormTab(id)}
                  className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                    productFormTab === id ? 'border-brand-black text-brand-black' : 'border-transparent text-brand-gray hover:text-brand-charcoal'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleProductSubmit}>
              <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

                {/* ── Info Tab ── */}
                {productFormTab === 'info' && (
                  <div className="space-y-4">
                    {/* Genre (gender) */}
                    <div>
                      <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Genre Cible *</label>
                      <div className="flex border border-brand-border rounded-lg overflow-hidden">
                        {(['women', 'men', 'mixte'] as const).map(g => (
                          <button
                            key={g}
                            type="button"
                            id={`gender-${g}`}
                            onClick={() => setProductForm(f => ({ ...f, target_gender: g }))}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              productForm.target_gender === g ? 'bg-brand-black text-white' : 'bg-white text-brand-gray hover:bg-brand-lightGray'
                            }`}
                          >
                            {g === 'women' ? 'Femmes' : g === 'men' ? 'Hommes' : 'Mixte'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Titre du produit */}
                    <div>
                      <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Nom de l'article *</label>
                      <input
                        id="product-title"
                        type="text"
                        required
                        value={productForm.title}
                        onChange={(e) => setProductForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Ex: Robe de Soirée Satinée, Sneakers Cuir…"
                        className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                      />
                    </div>

                    {/* Double Menu Déroulant Lié (Univers -> Type de Produit) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">
                          1. Univers Macro *
                        </label>
                        <select
                          id="product-universe-select"
                          value={selectedUniverse}
                          onChange={(e) => {
                            const uKey = e.target.value;
                            setSelectedUniverse(uKey);
                            const u = HIERARCHICAL_TAXONOMY[uKey];
                            if (u) {
                              setProductForm(f => ({
                                ...f,
                                target_gender: u.gender,
                                category: u.subs[0] || f.category,
                              }));
                            }
                          }}
                          className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg bg-white focus:outline-none focus:border-brand-black"
                        >
                          {Object.entries(HIERARCHICAL_TAXONOMY).map(([key, u]) => (
                            <option key={key} value={key}>{u.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">
                          2. Type d'Article / Sous-Catégorie *
                        </label>
                        <select
                          id="product-category-select"
                          value={productForm.category}
                          onChange={(e) => setProductForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg bg-white focus:outline-none focus:border-brand-black font-semibold text-brand-black"
                        >
                          <option value="">-- Choisir le type d'article --</option>
                          {(HIERARCHICAL_TAXONOMY[selectedUniverse]?.subs || []).map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Description de l'article</label>
                      <textarea
                        id="product-desc"
                        rows={4}
                        value={productForm.description || ''}
                        onChange={(e) => setProductForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Présentation de l'article, coupe, style, conseils…"
                        className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* ── Pricing Tab ── */}
                {productFormTab === 'pricing' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Prix en USD ($) *</label>
                        <input
                          id="product-price-usd"
                          type="number" min={0} step={0.5} required
                          value={productForm.price_usd || ''}
                          onChange={(e) => {
                            const usd = Number(e.target.value);
                            setProductForm(f => ({
                              ...f,
                              price_usd: usd,
                              price_cdf: Math.round(usd * exchangeRate),
                            }));
                          }}
                          placeholder="0.00"
                          className="w-full px-3 py-2 text-xs font-bold text-brand-black border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Prix en CDF (Calculé)</label>
                        <div className="px-3 py-2 bg-brand-lightGray border border-brand-border rounded-lg text-xs font-bold text-brand-black">
                          {formatCDF(Math.round((productForm.price_usd || 0) * exchangeRate))}
                        </div>
                        <p className="text-[10px] text-brand-gray mt-1">Taux officiel plateforme : 1 $ = {exchangeRate.toLocaleString()} CDF</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Ancien Prix (Barré USD)</label>
                        <input
                          id="product-compare-price"
                          type="number" min={0} step={0.5}
                          value={productForm.compare_at_price || ''}
                          onChange={(e) => setProductForm(f => ({ ...f, compare_at_price: e.target.value ? Number(e.target.value) : null }))}
                          placeholder="Ex: 35.00"
                          className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                        />
                        <p className="text-[10px] text-brand-gray mt-1">Optionnel pour afficher une réduction</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Quantité en Stock *</label>
                        <input
                          id="product-stock"
                          type="number" min={0} required
                          value={productForm.stock_count || ''}
                          onChange={(e) => setProductForm(f => ({ ...f, stock_count: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                        />
                      </div>
                    </div>

                    {/* Material & Security */}
                    <div>
                      <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Matière / Composition</label>
                      <input
                        id="product-material"
                        type="text"
                        value={productForm.material_info || ''}
                        onChange={(e) => setProductForm(f => ({ ...f, material_info: e.target.value }))}
                        placeholder="Ex: 100% Coton Bio, Soie, Cuir véritable…"
                        className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Conseils d'Entretien / Sécurité</label>
                      <input
                        id="product-security"
                        type="text"
                        value={productForm.security_specs || ''}
                        onChange={(e) => setProductForm(f => ({ ...f, security_specs: e.target.value }))}
                        placeholder="Ex: Lavage à froid 30°C, repassage doux…"
                        className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                      />
                    </div>
                  </div>
                )}

                {/* ── Attributes Tab ── */}
                {productFormTab === 'attributes' && (
                  <div className="space-y-5">
                    {/* Sizes */}
                    <div>
                      <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-2">Tailles Disponibles</label>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {[...QUICK_SIZES, ...SHOE_SIZES].map(s => (
                          <button
                            key={s} type="button"
                            id={`size-pill-${s}`}
                            onClick={() => setProductForm(f => ({
                              ...f,
                              sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s],
                            }))}
                            className={`px-2.5 py-1 text-[10px] font-bold border rounded transition-colors ${
                              productForm.sizes.includes(s) ? 'bg-brand-black text-white border-brand-black' : 'bg-white text-brand-gray border-brand-border hover:border-brand-charcoal'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      {/* Custom size input */}
                      <div className="flex gap-2">
                        <input
                          id="custom-size-input"
                          type="text"
                          value={newSizeInput}
                          onChange={(e) => setNewSizeInput(e.target.value)}
                          placeholder="Taille personnalisée (ex: 36.5)"
                          className="flex-1 px-3 py-1.5 text-xs border border-brand-border rounded-lg focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newSizeInput.trim()) {
                                setProductForm(f => ({ ...f, sizes: [...f.sizes, newSizeInput.trim()] }));
                                setNewSizeInput('');
                              }
                            }
                          }}
                        />
                        <button type="button" onClick={() => { if (newSizeInput.trim()) { setProductForm(f => ({ ...f, sizes: [...f.sizes, newSizeInput.trim()] })); setNewSizeInput(''); } }} className="px-3 py-1.5 bg-brand-lightGray text-brand-black text-xs font-semibold rounded-lg hover:bg-neutral-200">
                          +
                        </button>
                      </div>
                      {productForm.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {productForm.sizes.map(s => (
                            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-black text-white text-[10px] font-bold rounded">
                              {s}
                              <button type="button" onClick={() => setProductForm(f => ({ ...f, sizes: f.sizes.filter(x => x !== s) }))} className="opacity-60 hover:opacity-100">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Colors */}
                    <div>
                      <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-2">Couleurs Disponibles</label>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {QUICK_COLORS.map(c => (
                          <button
                            key={c} type="button"
                            id={`color-pill-${c}`}
                            onClick={() => setProductForm(f => ({
                              ...f,
                              colors: f.colors.includes(c) ? f.colors.filter(x => x !== c) : [...f.colors, c],
                            }))}
                            className={`px-2.5 py-1 text-[10px] font-bold border rounded transition-colors ${
                              productForm.colors.includes(c) ? 'bg-brand-black text-white border-brand-black' : 'bg-white text-brand-gray border-brand-border hover:border-brand-charcoal'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          id="custom-color-input"
                          type="text"
                          value={newColorInput}
                          onChange={(e) => setNewColorInput(e.target.value)}
                          placeholder="Couleur personnalisée (ex: Turquoise)"
                          className="flex-1 px-3 py-1.5 text-xs border border-brand-border rounded-lg focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newColorInput.trim()) {
                                setProductForm(f => ({ ...f, colors: [...f.colors, newColorInput.trim()] }));
                                setNewColorInput('');
                              }
                            }
                          }}
                        />
                        <button type="button" onClick={() => { if (newColorInput.trim()) { setProductForm(f => ({ ...f, colors: [...f.colors, newColorInput.trim()] })); setNewColorInput(''); } }} className="px-3 py-1.5 bg-brand-lightGray text-brand-black text-xs font-semibold rounded-lg hover:bg-neutral-200">
                          +
                        </button>
                      </div>
                      {productForm.colors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {productForm.colors.map(c => (
                            <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-black text-white text-[10px] font-bold rounded">
                              {c}
                              <button type="button" onClick={() => setProductForm(f => ({ ...f, colors: f.colors.filter(x => x !== c) }))} className="opacity-60 hover:opacity-100">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Media Tab ── */}
                {productFormTab === 'media' && (
                  <div className="space-y-4">

                    {/* ✨ AI Auto-Fill Banner */}
                    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-violet-900">✨ Remplissage Automatique par IA</p>
                          <p className="text-[11px] text-violet-600 mt-0.5 leading-relaxed">
                            Uploadez une photo de votre article — Gemini Vision analysera l'image et remplira automatiquement le titre, la description, la catégorie, le genre, les tailles, couleurs, matière et le prix suggéré.
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <input
                          ref={aiFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleAiAnalyzeImage}
                        />
                        <button
                          type="button"
                          id="ai-autofill-btn"
                          onClick={() => aiFileInputRef.current?.click()}
                          disabled={aiAnalyzing}
                          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm w-full justify-center"
                        >
                          {aiAnalyzing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Analyse Gemini Vision en cours…</span>
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              <span>Analyser une image avec l'IA</span>
                            </>
                          )}
                        </button>

                        {aiError && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-600">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{aiError}</span>
                          </div>
                        )}

                        {aiAnalyzing && (
                          <div className="mt-3 flex items-center gap-2 text-[11px] text-violet-600 bg-violet-50 rounded-lg px-3 py-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Gemini Vision analyse votre produit et génère la fiche article complète…</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-brand-gray">La première image est l'image principale (Hero). Format recommandé : 3:4 portrait (1200×1600px). Ajoutez jusqu'à 8 images.</p>

                    {/* Image grid */}
                    {productForm.images_urls.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {productForm.images_urls.map((url, idx) => {
                          const isEnhancing = enhancingImageIdx === idx;
                          return (
                            <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-brand-border bg-brand-lightGray group shadow-xs">
                              <Image src={url} alt={`Image ${idx + 1}`} fill className="object-cover" sizes="160px" unoptimized />
                              
                              {/* Hero Badge */}
                              {idx === 0 && (
                                <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-extrabold text-amber-400 uppercase tracking-wider z-10">
                                  HERO
                                </div>
                              )}

                              {/* Studio Cleanup Ongoing Overlay */}
                              {isEnhancing && (
                                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2 z-20">
                                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin mb-1" />
                                  <span className="text-[9px] font-bold text-white uppercase tracking-tight">Studio Pro en cours...</span>
                                  <span className="text-[7px] text-neutral-300">Détourage & cadrage 3:4</span>
                                </div>
                              )}

                              {/* Studio Pro Transform Button */}
                              {!isEnhancing && (
                                <button
                                  type="button"
                                  id={`enhance-image-btn-${idx}`}
                                  title="Nettoyer l'Arrière-Plan & Sublimer en Studio 3:4"
                                  onClick={() => handleEnhanceExistingImage(idx, url)}
                                  disabled={enhancingImageIdx !== null}
                                  className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 hover:bg-black text-amber-300 text-[8px] font-bold tracking-tight opacity-90 group-hover:opacity-100 transition flex items-center gap-1 shadow-sm z-10"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                  <span>Studio Pro</span>
                                </button>
                              )}

                              {/* Delete Photo Button */}
                              <button
                                type="button"
                                onClick={() => setProductForm(f => ({ ...f, images_urls: f.images_urls.filter((_, i) => i !== idx) }))}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Upload actions bar */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {/* Studio Pro Clean Upload */}
                      <input ref={studioFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleStudioProUpload} />
                      <button
                        type="button"
                        id="upload-studio-btn"
                        onClick={() => studioFileInputRef.current?.click()}
                        disabled={uploadingImage || aiAnalyzing || enhancingImageIdx !== null}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                      >
                        {enhancingImageIdx === 'new' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Nettoyage Studio 3:4 en cours…</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                            <span>✨ Nettoyer l'Arrière-Plan (Studio Pro)</span>
                          </>
                        )}
                      </button>

                      {/* Standard Upload */}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <button
                        type="button"
                        id="upload-image-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage || aiAnalyzing || enhancingImageIdx !== null}
                        className="flex items-center gap-2 px-3.5 py-2 border border-brand-border text-xs font-semibold rounded-lg hover:bg-brand-lightGray transition-colors disabled:opacity-50"
                      >
                        {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {uploadingImage ? 'Téléchargement…' : 'Ajouter photo standard'}
                      </button>
                    </div>

                    {/* URL input */}
                    <div className="flex gap-2">
                      <input
                        id="image-url-input"
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="Ou collez une URL directe (https://…)"
                        className="flex-1 px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                      />
                      <button
                        type="button"
                        id="add-image-url-btn"
                        onClick={handleAddImageUrl}
                        disabled={!imageUrlInput.trim()}
                        className="px-3 py-2 bg-brand-lightGray text-brand-black text-xs font-semibold rounded-lg hover:bg-neutral-200 disabled:opacity-50"
                      >
                        Ajouter URL
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Delivery Tab ── */}
                {productFormTab === 'delivery' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Délai de Livraison Estimé</label>
                      <select
                        id="product-delivery-time"
                        value={productForm.delivery_time || ''}
                        onChange={(e) => setProductForm(f => ({ ...f, delivery_time: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black bg-white"
                      >
                        <option value="">Sélectionner…</option>
                        {DELIVERY_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Frais de Livraison (USD)</label>
                      <input
                        id="product-delivery-fee"
                        type="number" min={0} step={0.5}
                        value={productForm.delivery_fee_usd || ''}
                        onChange={(e) => setProductForm(f => ({ ...f, delivery_fee_usd: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="Ex: 2.50 (laisser vide = gratuit)"
                        className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                      />
                    </div>

                    {/* Free return toggle */}
                    <div className="flex items-center justify-between p-3 bg-brand-lightGray rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-brand-black">Retours Gratuits</p>
                        <p className="text-[10px] text-brand-gray">Le client peut retourner l'article sans frais</p>
                      </div>
                      <button
                        id="free-return-toggle"
                        type="button"
                        onClick={() => setProductForm(f => ({ ...f, has_free_return: !f.has_free_return }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${productForm.has_free_return ? 'bg-emerald-500' : 'bg-neutral-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${productForm.has_free_return ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-brand-border bg-brand-offWhite rounded-b-2xl">
                <div className="flex gap-2">
                  {(['info', 'pricing', 'attributes', 'media', 'delivery'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setProductFormTab(tab)}
                      className={`w-2 h-2 rounded-full transition-colors ${productFormTab === tab ? 'bg-brand-black' : 'bg-brand-border'}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 border border-brand-border text-brand-black text-xs font-semibold rounded-lg hover:bg-brand-lightGray"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    id="submit-product-btn"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 bg-brand-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-brand-charcoal transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {editingProductId ? 'Mettre à jour' : 'Publier l\'Article'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          NAME CHANGE MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {nameChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-brand-black uppercase tracking-widest">Demander un Changement de Nom</h2>
              <button onClick={() => setNameChangeModalOpen(false)} className="p-1.5 rounded hover:bg-brand-lightGray">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-brand-gray mb-4">Ce changement sera soumis à l'équipe d'administration pour approbation.</p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Nouveau Nom Souhaité *</label>
                <input
                  id="pending-name-input"
                  type="text"
                  value={pendingNameInput}
                  onChange={(e) => setPendingNameInput(e.target.value)}
                  placeholder="Nom commercial souhaité"
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Raison / Justification</label>
                <textarea
                  id="pending-name-reason"
                  rows={2}
                  value={pendingNameReason}
                  onChange={(e) => setPendingNameReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous souhaitez changer de nom…"
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setNameChangeModalOpen(false)} className="flex-1 py-2 border border-brand-border text-brand-black text-xs font-semibold rounded-lg hover:bg-brand-lightGray">
                Annuler
              </button>
              <button
                id="submit-name-change-btn"
                onClick={handleRequestNameChange}
                disabled={saving || !pendingNameInput.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-brand-black text-white text-xs font-bold rounded-lg hover:bg-brand-charcoal disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Soumettre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-sm font-bold text-brand-black mb-2">Supprimer Définitivement ?</h3>
            <p className="text-xs text-brand-gray mb-5">Cette action est irréversible. L'article sera supprimé de votre catalogue et de la plateforme.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2 border border-brand-border text-brand-black text-xs font-semibold rounded-lg hover:bg-brand-lightGray">
                Annuler
              </button>
              <button
                id="confirm-delete-btn"
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
