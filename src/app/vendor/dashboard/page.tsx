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
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { VendorService, CreateProductInput, VendorCoupon, VendorFinancials } from '@/lib/services/VendorService';
import { PlatformSettingsService } from '@/lib/services/PlatformSettingsService';
import { Product, Store, SettlementLedgerEntry, VendorDailyRevenue, FlashSale } from '@/types/schema';

// ─── Constants ────────────────────────────────────────────────────────────────

type VendorTab = 'catalogue' | 'orders' | 'profile' | 'financials' | 'promotions';
type OrderStatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
type ProductStatusFilter = 'active' | 'archived' | 'all';

const SHEIN_CATEGORIES: Record<string, string[]> = {
  'Femmes': ['Tops & T-shirts', 'Robes', 'Jupes', 'Pantalons & Jeans', 'Maillots', 'Lingerie', 'Vêtements de nuit'],
  'Hommes': ['Chemises', 'T-shirts', 'Pantalons', 'Hoodies & Sweats', 'Vestes & Manteaux', 'Sous-vêtements'],
  'Enfants': ['Bébé (0-3 ans)', 'Garçons (4-12 ans)', 'Filles (4-12 ans)', 'Adolescents', 'Jouets & Jeux'],
  'Chaussures': ['Sandales', 'Sneakers', 'Escarpins', 'Bottes', 'Mocassins', 'Chaussons'],
  'Bijoux & Accessoires': ['Boucles d\'oreilles', 'Colliers & Bracelets', 'Lunettes', 'Sacs & Maroquinerie', 'Coiffure', 'Ceintures'],
  'Maison & Décoration': ['Décoration', 'Cuisine & Salle à manger', 'Rangement', 'Linge de maison', 'Électroménager'],
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

function formatCDF(n: number) {
  return Math.round(n).toLocaleString('fr-CD') + ' CDF';
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
  const [productFormTab, setProductFormTab] = useState<'info' | 'pricing' | 'attributes' | 'media' | 'delivery'>('info');
  const [newColorInput, setNewColorInput] = useState('');
  const [newSizeInput, setNewSizeInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setProductFormTab('info');
    setIsProductModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProductId(product.id);
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
    setSaving(true);
    try {
      await VendorService.requestStoreNameChange(store.id, pendingNameInput, pendingNameReason);
      setNameChangeModalOpen(false);
      setPendingNameInput('');
      setPendingNameReason('');
      showMessage('success', 'Demande de changement de nom soumise. En attente d\'approbation admin.');
      await loadData();
    } catch (err: any) {
      showMessage('error', err.message || 'Erreur.');
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
                  const priceCdf = product.price_cdf || Math.round(product.price_usd * exchangeRate);

                  return (
                    <div key={product.id} className={`bg-white border rounded-xl overflow-hidden flex flex-col shadow-card hover:shadow-hover transition-shadow ${product.status === 'archived' ? 'opacity-60' : ''}`} style={{ borderColor: '#E5E5E5' }}>
                      {/* Image */}
                      <div className="relative aspect-square bg-brand-lightGray overflow-hidden">
                        {product.images_urls[0] ? (
                          <Image src={product.images_urls[0]} alt={product.title} fill className="object-cover" sizes="300px" unoptimized />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-10 h-10 text-brand-border" />
                          </div>
                        )}
                        {product.images_urls.length > 1 && (
                          <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">+{product.images_urls.length - 1}</span>
                        )}
                        {/* Status badge overlay */}
                        <div className="absolute top-2 left-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                            product.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            product.status === 'archived' ? 'bg-neutral-200 text-neutral-600' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {product.status === 'active' ? 'ACTIF' : product.status === 'archived' ? 'ARCHIVÉ' : 'SUSPENDU'}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-3 flex flex-col gap-2 flex-1">
                        <div>
                          <p className="text-xs font-bold text-brand-black leading-tight line-clamp-2">{product.title}</p>
                          {product.category && (
                            <p className="text-[10px] text-brand-gray mt-0.5 uppercase tracking-wide">{product.category}</p>
                          )}
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-brand-black">{formatUSD(product.price_usd)}</span>
                          {product.compare_at_price && (
                            <span className="text-xs text-brand-gray line-through">{formatUSD(product.compare_at_price)}</span>
                          )}
                          <span className="text-[10px] text-brand-gray ml-auto">{formatCDF(priceCdf)}</span>
                        </div>

                        {/* Stock pill */}
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold self-start ${
                          isOutOfStock ? 'bg-red-100 text-red-700' :
                          isLowStock ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isOutOfStock ? <AlertTriangle className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
                          {isOutOfStock ? 'RUPTURE' : isLowStock ? `FAIBLE (${product.stock_count})` : `${product.stock_count} EN STOCK`}
                        </div>

                        {/* Sizes row */}
                        {sizes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {sizes.slice(0, 4).map(s => (
                              <span key={s} className="text-[9px] font-semibold px-1.5 py-0.5 border border-brand-border rounded text-brand-gray">{s}</span>
                            ))}
                            {sizes.length > 4 && <span className="text-[9px] text-brand-gray">+{sizes.length - 4}</span>}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-auto pt-2 border-t border-brand-border">
                          <button
                            id={`edit-product-${product.id}`}
                            onClick={() => openEditProduct(product)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-brand-lightGray text-brand-black text-[10px] font-bold uppercase tracking-wide rounded hover:bg-neutral-200 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" /> Modifier
                          </button>
                          <button
                            id={`archive-product-${product.id}`}
                            onClick={() => handleArchiveProduct(product)}
                            title={product.status === 'archived' ? 'Restaurer' : 'Archiver'}
                            className="p-1.5 border border-brand-border rounded hover:bg-brand-lightGray transition-colors"
                          >
                            {product.status === 'archived' ? <RotateCcw className="w-3 h-3 text-emerald-600" /> : <Archive className="w-3 h-3 text-brand-gray" />}
                          </button>
                          <button
                            id={`delete-product-${product.id}`}
                            onClick={() => setDeleteConfirmId(product.id)}
                            title="Supprimer définitivement"
                            className="p-1.5 border border-brand-border rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
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
                  onClick={() => { setPendingNameInput(store?.store_name || ''); setNameChangeModalOpen(true); }}
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

            {/* Flash Sales preview */}
            {flashSales.length > 0 && (
              <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-brand-border">
                  <h3 className="text-xs font-bold text-brand-black uppercase tracking-widest">Ventes Flash Actives</h3>
                </div>
                <div className="divide-y divide-brand-border">
                  {flashSales.map(sale => {
                    const product = sale.products;
                    const soldPercent = sale.stock_limit > 0 ? Math.min(100, Math.round((sale.items_sold / sale.stock_limit) * 100)) : 0;
                    const isActive = new Date(sale.end_time) > new Date();

                    return (
                      <div key={sale.id} className="flex items-center gap-4 px-5 py-3">
                        {product?.images_urls?.[0] && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-brand-border shrink-0 bg-brand-lightGray">
                            <Image src={product.images_urls[0]} alt={product.title} fill className="object-cover" sizes="48px" unoptimized />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-brand-black line-clamp-1">{product?.title}</p>
                          <p className="text-xs text-brand-black font-bold">{formatUSD(sale.flash_price_usd)} <span className="text-brand-gray font-normal text-[10px]">prix flash</span></p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-brand-lightGray rounded-full overflow-hidden">
                              <div className="h-full bg-brand-black rounded-full" style={{ width: `${soldPercent}%` }} />
                            </div>
                            <span className="text-[10px] text-brand-gray whitespace-nowrap">{sale.items_sold}/{sale.stock_limit} vendus</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                          {isActive ? 'EN COURS' : 'TERMINÉE'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

                    {/* Category */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-brand-gray uppercase tracking-wide mb-1.5">Catégorie *</label>
                      <button
                        type="button"
                        id="category-dropdown"
                        onClick={() => setCategoryMenuOpen(o => !o)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs border border-brand-border rounded-lg bg-white focus:outline-none"
                      >
                        <span className={productForm.category ? 'text-brand-black font-medium' : 'text-brand-gray'}>{productForm.category || 'Sélectionner une catégorie…'}</span>
                        {categoryMenuOpen ? <ChevronUp className="w-3.5 h-3.5 text-brand-gray" /> : <ChevronDown className="w-3.5 h-3.5 text-brand-gray" />}
                      </button>
                      {categoryMenuOpen && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-brand-border rounded-lg shadow-hover max-h-60 overflow-y-auto">
                          {Object.entries(SHEIN_CATEGORIES).map(([parent, subs]) => (
                            <div key={parent}>
                              <div className="px-3 py-1.5 bg-brand-lightGray text-[10px] font-bold uppercase tracking-wide text-brand-black sticky top-0">{parent}</div>
                              {subs.map(sub => (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => { setProductForm(f => ({ ...f, category: sub })); setCategoryMenuOpen(false); }}
                                  className={`w-full text-left px-4 py-2 text-xs hover:bg-brand-lightGray transition-colors ${productForm.category === sub ? 'bg-brand-black text-white hover:bg-brand-black font-semibold' : 'text-brand-black'}`}
                                >
                                  {sub}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
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
                    <p className="text-[10px] text-brand-gray">La première image est l'image principale (Hero). Ajoutez jusqu'à 8 images.</p>

                    {/* Image grid */}
                    {productForm.images_urls.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {productForm.images_urls.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-brand-border bg-brand-lightGray group">
                            <Image src={url} alt={`Image ${idx + 1}`} fill className="object-cover" sizes="120px" unoptimized />
                            {idx === 0 && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-1 text-center">
                                <span className="text-[8px] font-bold text-brand-accent uppercase">HERO</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setProductForm(f => ({ ...f, images_urls: f.images_urls.filter((_, i) => i !== idx) }))}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload buttons */}
                    <div className="flex gap-2">
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <button
                        type="button"
                        id="upload-image-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="flex items-center gap-2 px-4 py-2 border border-brand-border text-xs font-semibold rounded-lg hover:bg-brand-lightGray transition-colors disabled:opacity-50"
                      >
                        {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {uploadingImage ? 'Téléchargement…' : 'Uploader une photo'}
                      </button>
                    </div>

                    {/* URL input */}
                    <div className="flex gap-2">
                      <input
                        id="image-url-input"
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="URL directe (https://…)"
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
