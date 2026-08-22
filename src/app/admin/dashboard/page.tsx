'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  BarChart3, 
  Store, 
  Settings, 
  Flame, 
  Image as ImageIcon, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Edit, 
  Save, 
  Loader2, 
  X,
  Phone,
  RefreshCw,
  BadgeCheck,
  Check,
  Ban,
  Filter,
  Package,
  Clock,
  MapPin,
  Percent,
  Search,
  Sparkles,
  CreditCard,
  Wallet,
  MessageSquare,
  Send,
  Archive,
  Tag,
  Tv,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { 
  AdminService, 
  PlatformMetrics, 
  PlatformSettings,
  FinancialLedger,
  MerchantApplication,
  PaymentTransaction,
  TicketThread,
  TicketMessage,
  PendingCoupon
} from '@/lib/services/AdminService';
import { HeroBanner, Product, OrderStatus } from '@/types/schema';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';

type AdminTab = 
  | 'general'
  | 'orders'
  | 'users'
  | 'moderation'
  | 'accounting'
  | 'support'
  | 'coupons'
  | 'banners';

type UserSubTab = 'clients' | 'boutiques';

export default function AdminDashboardPage() {
  const { user: sessionUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('general');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // General & Ledger Data
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [ledger, setLedger] = useState<FinancialLedger>({
    gmvUsd: 0,
    gmvCdf: 0,
    commissionUsd: 0,
    commissionCdf: 0,
    escrowUsd: 0,
    escrowCdf: 0,
    totalOrders: 0,
    codOrders: 0,
    pickupOrders: 0,
  });
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [merchantApps, setMerchantApps] = useState<MerchantApplication[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);

  // Settings form states
  const [exchangeRateInput, setExchangeRateInput] = useState('2850');
  const [commissionRateInput, setCommissionRateInput] = useState('10');
  const [mobileMoneyActive, setMobileMoneyActive] = useState(true);
  const [mpesaNumberInput, setMpesaNumberInput] = useState('+243810000000');
  const [orangeNumberInput, setOrangeNumberInput] = useState('+243890000000');
  const [airtelNumberInput, setAirtelNumberInput] = useState('+243970000000');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Users & Stores State
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [userSubTab, setUserSubTab] = useState<UserSubTab>('clients');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  // Products Moderation State
  const [products, setProducts] = useState<Product[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [productModerationTab, setProductModerationTab] = useState<'active' | 'archived'>('active');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [processingProductId, setProcessingProductId] = useState<string | null>(null);

  // Accounting State
  const [awaitingPayments, setAwaitingPayments] = useState<PaymentTransaction[]>([]);
  const [approvingPaymentId, setApprovingPaymentId] = useState<string | null>(null);

  // Support Ticketing State
  const [supportThreads, setSupportThreads] = useState<TicketThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<TicketMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Coupons State
  const [allCoupons, setAllCoupons] = useState<PendingCoupon[]>([]);
  const [pendingCoupons, setPendingCoupons] = useState<PendingCoupon[]>([]);
  const [couponSubTab, setCouponSubTab] = useState<'all' | 'pending'>('all');
  const [processingCouponId, setProcessingCouponId] = useState<string | null>(null);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_percent: 15,
    store_id: 'global',
  });

  // Banners State
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    media_url: '',
    click_action_route: '/?gender=women',
    sort_order: 1,
    is_active: true,
  });
  const [addingBanner, setAddingBanner] = useState(false);

  // Load all platform data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        m,
        led,
        sett,
        apps,
        ords,
        usrList,
        strList,
        prods,
        archProds,
        pmts,
        threads,
        coupsPending,
        coupsAll,
        banns
      ] = await Promise.all([
        AdminService.getPlatformMetrics(),
        AdminService.getFinancialLedger(),
        AdminService.getPlatformSettings(),
        AdminService.getMerchantApplications(),
        AdminService.getAllOrders(),
        AdminService.getAllUsers(),
        AdminService.getAllStores(),
        AdminService.getAllProductsAdmin('all'),
        AdminService.getArchivedProducts(),
        AdminService.getAwaitingPayments(),
        AdminService.getSupportThreads(),
        AdminService.getPendingCoupons(),
        AdminService.getAllCouponsAdmin(),
        AdminService.getHeroBanners(),
      ]);

      setMetrics(m);
      setLedger(led);
      if (sett) {
        setSettings(sett);
        setExchangeRateInput(sett.exchange_rate?.toString() || '2850');
        setCommissionRateInput(sett.commission_rate?.toString() || '10');
        setMobileMoneyActive(sett.mobile_money_active === 1);
        setMpesaNumberInput(sett.mpesa_number || '+243810000000');
        setOrangeNumberInput(sett.orange_number || '+243890000000');
        setAirtelNumberInput(sett.airtel_number || '+243970000000');
      }
      setMerchantApps(apps);
      setOrders(ords);
      setUsers(usrList);
      setStores(strList);
      setProducts(prods);
      setArchivedProducts(archProds);
      setAwaitingPayments(pmts);
      setSupportThreads(threads);
      setPendingCoupons(coupsPending);
      setAllCoupons(coupsAll);
      setBanners(banns);
    } catch (err) {
      console.error('[AdminDashboard] Error loading platform data:', err);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données d’administration.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Real-time subscriptions for orders and transactions
    const channel = supabase
      .channel('admin-realtime-sync')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'orders' }, async () => {
        const ords = await AdminService.getAllOrders();
        const led = await AdminService.getFinancialLedger();
        setOrders(ords);
        setLedger(led);
      })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'payment_transactions' }, async () => {
        const pmts = await AdminService.getAwaitingPayments();
        setAwaitingPayments(pmts);
      })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'ticket_messages' }, async (payload: any) => {
        if (payload.new && activeThreadId && payload.new.thread_id === activeThreadId) {
          const msgs = await AdminService.getThreadMessages(activeThreadId);
          setChatMessages(msgs);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, activeThreadId]);

  // Load chat messages when active ticket changes
  useEffect(() => {
    if (!activeThreadId) return;
    AdminService.getThreadMessages(activeThreadId).then((msgs) => {
      setChatMessages(msgs);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [activeThreadId]);

  // Reload products when store filter changes in moderation tab
  const handleVendorFilterChange = async (vendorId: string) => {
    setSelectedVendorFilter(vendorId);
    try {
      const prods = await AdminService.getAllProductsAdmin(vendorId);
      setProducts(prods);
    } catch (err) {
      console.error('Error filtering products by store:', err);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const rateVal = parseFloat(exchangeRateInput) || 2850;
      const commVal = parseFloat(commissionRateInput) || 10;
      const ok = await AdminService.savePlatformSettings({
        exchange_rate: rateVal,
        commission_rate: commVal,
        mobile_money_active: mobileMoneyActive ? 1 : 0,
        mpesa_number: mpesaNumberInput,
        orange_number: orangeNumberInput,
        airtel_number: airtelNumberInput,
      });

      if (ok) {
        setMessage({ type: 'success', text: 'Paramètres financiers et passerelles sauvegardés.' });
        loadData(true);
      } else {
        setMessage({ type: 'error', text: 'Échec de la sauvegarde des paramètres.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur inconnue.' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle store MoMo
  const handleToggleStoreMomo = async (storeId: string, currentMomo: boolean) => {
    const newVal = !currentMomo;
    setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, momo_enabled: newVal } : s)));
    const ok = await AdminService.toggleStoreMomo(storeId, currentMomo);
    if (!ok) {
      setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, momo_enabled: currentMomo } : s)));
      setMessage({ type: 'error', text: 'Impossible de modifier la passerelle MoMo de la boutique.' });
    }
  };

  // Merchant Application Approvals
  const handleApproveApp = async (app: MerchantApplication) => {
    if (!app.user_id) return;
    setProcessingAppId(app.id);
    try {
      const ok = await AdminService.approveMerchantApplication(
        app.id,
        app.user_id,
        app.store_name,
        app.operational_city,
        app.product_focus
      );
      if (ok) {
        setMerchantApps((prev) => prev.filter((a) => a.id !== app.id));
        setMessage({ type: 'success', text: `Boutique "${app.store_name}" validée et compte vendeur activé !` });
        loadData(true);
      } else {
        setMessage({ type: 'error', text: 'Échec de la validation de la demande marchande.' });
      }
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleRejectApp = async (appId: string) => {
    setProcessingAppId(appId);
    try {
      const ok = await AdminService.rejectMerchantApplication(appId);
      if (ok) {
        setMerchantApps((prev) => prev.filter((a) => a.id !== appId));
        setMessage({ type: 'success', text: 'Demande marchande refusée.' });
      }
    } finally {
      setProcessingAppId(null);
    }
  };

  // Order Status Handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const ok = await AdminService.updateOrderStatus(orderId, newStatus);
      if (ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o)));
        setMessage({ type: 'success', text: `Statut de la commande mis à jour vers: ${newStatus}` });
      } else {
        setMessage({ type: 'error', text: 'Impossible de mettre à jour le statut.' });
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // User Actions
  const handleToggleUserStatus = async (userId: string, currentStatus: string, email: string) => {
    setProcessingUserId(userId);
    try {
      const ok = await AdminService.toggleUserStatus(userId, currentStatus);
      if (ok) {
        const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)));
        setMessage({ type: 'success', text: `Compte ${email || 'utilisateur'} ${nextStatus === 'suspended' ? 'suspendu' : 'réactivé'}.` });
      }
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Supprimer définitivement le compte ${email || 'de cet utilisateur'} ?`)) return;
    setProcessingUserId(userId);
    try {
      const ok = await AdminService.deleteUser(userId);
      if (ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setMessage({ type: 'success', text: 'Compte utilisateur supprimé.' });
      }
    } finally {
      setProcessingUserId(null);
    }
  };

  // Store Archive
  const handleArchiveStore = async (storeId: string, vendorId: string, storeName: string) => {
    if (!confirm(`Archiver la boutique "${storeName}" ? Ses articles seront suspendus et le vendeur rétrogradé en client simple.`)) return;
    const ok = await AdminService.archiveStore(storeId, vendorId);
    if (ok) {
      setMessage({ type: 'success', text: `Boutique "${storeName}" archivée.` });
      loadData(true);
    }
  };

  // Store Verification Toggle
  const handleToggleStoreVerification = async (storeId: string, currentVerified: boolean) => {
    const ok = await AdminService.toggleStoreVerification(storeId, !currentVerified);
    if (ok) {
      setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, is_verified: !currentVerified } : s)));
      setMessage({ type: 'success', text: `Badge officiel ${!currentVerified ? 'accordé' : 'retiré'}.` });
    }
  };

  // Product Actions
  const handleToggleTrending = async (productId: string, currentTrending: boolean) => {
    const ok = await AdminService.toggleProductTrending(productId, !currentTrending);
    if (ok) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, is_trending: !currentTrending } : p)));
      setMessage({ type: 'success', text: `Article ${!currentTrending ? 'mis en tendance 🔥' : 'retiré des tendances'}.` });
    }
  };

  const handleToggleProductSuspension = async (productId: string, currentStatus: string) => {
    setProcessingProductId(productId);
    try {
      const ok = await AdminService.suspendProduct(productId, currentStatus);
      if (ok) {
        const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: nextStatus as any } : p)));
        setMessage({ type: 'success', text: `Article ${nextStatus === 'suspended' ? 'suspendu de la vente' : 'réactivé'}.` });
      }
    } finally {
      setProcessingProductId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Voulez-vous archiver ou supprimer cet article du catalogue ?')) return;
    setProcessingProductId(productId);
    try {
      const ok = await AdminService.deleteProduct(productId);
      if (ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setMessage({ type: 'success', text: 'Article supprimé du catalogue actif.' });
      }
    } finally {
      setProcessingProductId(null);
    }
  };

  // Accounting / Payment Approval
  const handleApprovePayment = async (txn: PaymentTransaction) => {
    if (!confirm(`Confirmer la réception de $${txn.amount_usd.toFixed(2)} (${Math.round(txn.amount_cdf).toLocaleString()} CDF) pour les commandes liées ?`)) return;
    setApprovingPaymentId(txn.id);
    try {
      const ok = await AdminService.approvePayment(txn);
      if (ok) {
        setAwaitingPayments((prev) => prev.filter((p) => p.id !== txn.id));
        setMessage({ type: 'success', text: 'Paiement validé et commandes marquées comme approuvées !' });
        loadData(true);
      }
    } finally {
      setApprovingPaymentId(null);
    }
  };

  // Support Reply Sender
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || !chatInput.trim()) return;
    setChatSending(true);
    try {
      const ok = await AdminService.sendAdminMessage(
        activeThreadId,
        sessionUser?.id || 'admin',
        chatInput.trim()
      );
      if (ok) {
        setChatInput('');
        const msgs = await AdminService.getThreadMessages(activeThreadId);
        setChatMessages(msgs);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } finally {
      setChatSending(false);
    }
  };

  const handleCloseThread = async (threadId: string) => {
    const ok = await AdminService.closeSupportThread(threadId);
    if (ok) {
      setSupportThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, status: 'closed' } : t)));
      setMessage({ type: 'success', text: 'Ticket de support marqué comme résolu et fermé.' });
    }
  };

  // Coupons Approval & Creation
  const handleApproveCoupon = async (couponId: string) => {
    setProcessingCouponId(couponId);
    try {
      const ok = await AdminService.approveCoupon(couponId);
      if (ok) {
        setPendingCoupons((prev) => prev.filter((c) => c.id !== couponId));
        setAllCoupons((prev) => prev.map((c) => c.id === couponId ? { ...c, status: 'active' } : c));
        setMessage({ type: 'success', text: 'Code promo approuvé et activé sur la plateforme !' });
      }
    } finally {
      setProcessingCouponId(null);
    }
  };

  const handleRejectCoupon = async (couponId: string) => {
    setProcessingCouponId(couponId);
    try {
      const ok = await AdminService.rejectCoupon(couponId);
      if (ok) {
        setPendingCoupons((prev) => prev.filter((c) => c.id !== couponId));
        setAllCoupons((prev) => prev.map((c) => c.id === couponId ? { ...c, status: 'rejected' } : c));
        setMessage({ type: 'success', text: 'Code promo rejeté.' });
      }
    } finally {
      setProcessingCouponId(null);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Supprimer définitivement ce code promotionnel ?')) return;
    setProcessingCouponId(couponId);
    try {
      const ok = await AdminService.deleteCoupon(couponId);
      if (ok) {
        setAllCoupons((prev) => prev.filter((c) => c.id !== couponId));
        setPendingCoupons((prev) => prev.filter((c) => c.id !== couponId));
        setMessage({ type: 'success', text: 'Code promo supprimé.' });
      }
    } finally {
      setProcessingCouponId(null);
    }
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;
    setCreatingCoupon(true);
    try {
      const result = await AdminService.createAdminCoupon({
        code: couponForm.code,
        discount_percent: couponForm.discount_percent,
        store_id: couponForm.store_id === 'global' ? null : couponForm.store_id,
        status: 'active',
        created_by: sessionUser?.id,
      });

      if (result.success) {
        setMessage({ type: 'success', text: `Code promo "${couponForm.code.toUpperCase()}" activé avec succès (-${couponForm.discount_percent}%) !` });
        setShowCreateCouponModal(false);
        setCouponForm({ code: '', discount_percent: 15, store_id: 'global' });
        const [cAll, cPend] = await Promise.all([
          AdminService.getAllCouponsAdmin(),
          AdminService.getPendingCoupons(),
        ]);
        setAllCoupons(cAll);
        setPendingCoupons(cPend);
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la création du code promo.' });
      }
    } finally {
      setCreatingCoupon(false);
    }
  };

  // Banner Actions
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim() || !bannerForm.media_url.trim()) return;
    setAddingBanner(true);
    try {
      const ok = await AdminService.upsertHeroBanner({
        title: bannerForm.title.trim(),
        media_url: bannerForm.media_url.trim(),
        click_action_route: bannerForm.click_action_route.trim() || '/',
        sort_order: Number(bannerForm.sort_order) || 1,
        is_active: bannerForm.is_active,
      });
      if (ok) {
        setMessage({ type: 'success', text: 'Bannière créée avec succès.' });
        setBannerForm({ title: '', media_url: '', click_action_route: '/?gender=women', sort_order: 1, is_active: true });
        const b = await AdminService.getHeroBanners();
        setBanners(b);
      }
    } finally {
      setAddingBanner(false);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Supprimer cette bannière ?')) return;
    const ok = await AdminService.deleteHeroBanner(bannerId);
    if (ok) {
      setBanners((prev) => prev.filter((b) => b.id !== bannerId));
      setMessage({ type: 'success', text: 'Bannière supprimée.' });
    }
  };

  const handleToggleBanner = async (banner: HeroBanner) => {
    const ok = await AdminService.upsertHeroBanner({
      id: banner.id,
      title: banner.title,
      media_url: banner.media_url,
      click_action_route: banner.click_action_route || '/',
      sort_order: banner.sort_order,
      is_active: !banner.is_active,
    });
    if (ok) {
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, is_active: !banner.is_active } : b)));
    }
  };

  // Filtered lists
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderStatusFilter === 'all' || o.order_status === orderStatusFilter;
    const q = orderSearchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.users?.full_name?.toLowerCase().includes(q) ||
      o.users?.email?.toLowerCase().includes(q) ||
      o.users?.phone?.toLowerCase().includes(q) ||
      o.products?.title?.toLowerCase().includes(q) ||
      o.commune?.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  const filteredClients = users.filter((u) => {
    if (u.role === 'vendor' || u.role === 'admin') return false;
    const q = userSearchQuery.toLowerCase();
    return !q || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q);
  });

  const filteredStores = stores.filter((s) => {
    const q = storeSearchQuery.toLowerCase();
    return !q || s.store_name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q) || s.users?.full_name?.toLowerCase().includes(q);
  });

  const filteredProducts = (productModerationTab === 'active' ? products : archivedProducts).filter((p) => {
    const matchesVendor = selectedVendorFilter === 'all' || p.vendor_id === selectedVendorFilter;
    const q = productSearchQuery.toLowerCase();
    const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    return matchesVendor && matchesQuery;
  });

  const filteredCoupons = (couponSubTab === 'all' ? allCoupons : pendingCoupons);

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------

  return (
    <div className="min-h-screen bg-brand-black text-neutral-100 pb-20">
      {/* Header Bar */}
      <div className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-serif tracking-tight text-white">Administration Centrale</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Katanga
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Grand livre, modération, commandes, comptabilité & support</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition flex items-center gap-2 border border-neutral-700 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Rafraîchir</span>
          </button>
        </div>

        {/* 8-Tab Horizontal Scrollable Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-neutral-800/60">
          {[
            { key: 'general', label: 'Général', icon: BarChart3, badge: merchantApps.length || undefined },
            { key: 'orders', label: 'Commandes', icon: ShoppingBag, badge: orders.length || undefined },
            { key: 'users', label: 'Utilisateurs', icon: Users, badge: users.length || undefined },
            { key: 'moderation', label: 'Modération', icon: Package, badge: products.length || undefined },
            { key: 'accounting', label: 'Comptabilité', icon: Wallet, badge: awaitingPayments.length || undefined },
            { key: 'support', label: 'Support', icon: MessageSquare, badge: supportThreads.filter((t) => t.status !== 'closed').length || undefined },
            { key: 'coupons', label: 'Coupons', icon: Tag, badge: pendingCoupons.length || undefined },
            { key: 'banners', label: 'Bannières', icon: Tv, badge: banners.length || undefined },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as AdminTab)}
                className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'border-amber-400 text-amber-400 font-bold bg-amber-400/5'
                    : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-neutral-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Toast Message Feedback */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-lg ${
              message.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : 'bg-red-950/80 text-red-300 border border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
              <span>{message.text}</span>
            </div>
            <button type="button" onClick={() => setMessage(null)} className="text-neutral-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-24 text-center text-neutral-400 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm font-semibold">Synchronisation des registres administratifs...</p>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* TAB 1: GÉNÉRAL & GRAND LIVRE */}
            {/* ========================================================================= */}
            {activeTab === 'general' && (
              <div className="space-y-8">
                {/* 1. Grand Livre Financier */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Grand Livre Financier</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">GMV Globale (Volume Brut)</p>
                      <div className="text-2xl font-bold text-white mt-1">
                        ${ledger.gmvUsd.toFixed(2)}
                      </div>
                      <p className="text-xs font-mono text-amber-400 mt-0.5">≈ {ledger.gmvCdf.toLocaleString()} CDF</p>
                      <p className="text-[10px] text-neutral-500 mt-2">Volume total des ventes validées</p>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Commissions Acquises (Plateforme)</p>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">
                        ${ledger.commissionUsd.toFixed(2)}
                      </div>
                      <p className="text-xs font-mono text-emerald-400/80 mt-0.5">≈ {ledger.commissionCdf.toLocaleString()} CDF</p>
                      <p className="text-[10px] text-neutral-500 mt-2">{settings?.commission_rate ?? 10}% de commission perçue</p>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Fonds en Séquestre (Escrow)</p>
                      <div className="text-2xl font-bold text-blue-400 mt-1">
                        ${ledger.escrowUsd.toFixed(2)}
                      </div>
                      <p className="text-xs font-mono text-blue-400/80 mt-0.5">≈ {ledger.escrowCdf.toLocaleString()} CDF</p>
                      <p className="text-[10px] text-neutral-500 mt-2">En transit / En cours de livraison</p>
                    </div>
                  </div>
                </div>

                {/* 2. Répartition Mode de Livraison */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-neutral-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Répartition Mode de Livraison</h2>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-xl text-center">
                      <div className="text-xl font-bold text-white">{ledger.totalOrders}</div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 mt-1">TOTAL COMMANDES</p>
                    </div>
                    <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-xl text-center">
                      <div className="text-xl font-bold text-amber-400">{ledger.codOrders}</div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 mt-1">CASH ON DELIVERY</p>
                    </div>
                    <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-xl text-center">
                      <div className="text-xl font-bold text-blue-400">{ledger.pickupOrders}</div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 mt-1">IN-STORE PICKUP</p>
                    </div>
                  </div>
                </div>

                {/* 3. Configuration Générale FX & Paiement */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-white">Configuration Générale FX & Paiement</h2>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                          Taux de Change (USD / CDF)
                        </label>
                        <input
                          type="number"
                          value={exchangeRateInput}
                          onChange={(e) => setExchangeRateInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                          Commission Plateforme (%)
                        </label>
                        <input
                          type="number"
                          value={commissionRateInput}
                          onChange={(e) => setCommissionRateInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                          N° M-Pesa Destinataire
                        </label>
                        <input
                          type="text"
                          value={mpesaNumberInput}
                          onChange={(e) => setMpesaNumberInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                          N° Orange Money
                        </label>
                        <input
                          type="text"
                          value={orangeNumberInput}
                          onChange={(e) => setOrangeNumberInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                          N° Airtel Money
                        </label>
                        <input
                          type="text"
                          value={airtelNumberInput}
                          onChange={(e) => setAirtelNumberInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-neutral-950 rounded-lg border border-neutral-800">
                      <div>
                        <p className="text-xs font-bold text-white uppercase">Passerelle Mobile Money Globale</p>
                        <p className="text-[11px] text-neutral-400">Activer les paiements via carriers locaux (M-Pesa, Orange, Airtel)</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMobileMoneyActive(!mobileMoneyActive)}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                          mobileMoneyActive ? 'bg-amber-400' : 'bg-neutral-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-black transition-transform ${mobileMoneyActive ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition flex items-center gap-2 shadow"
                    >
                      {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Sauvegarder les Paramètres
                    </button>
                  </form>
                </div>

                {/* 4. Contrôle de Passerelle par Boutique */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-blue-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white">Contrôle de Passerelle par Boutique</h2>
                    </div>
                    <span className="text-[11px] text-neutral-400">{stores.length} boutiques</span>
                  </div>

                  <div className="divide-y divide-neutral-800 max-h-72 overflow-y-auto pr-1">
                    {stores.map((s) => (
                      <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{s.store_name}</p>
                          <p className="text-[10px] text-neutral-400">{s.city || 'Lubumbashi'} • {s.momo_enabled !== false ? 'MoMo Actif' : 'MoMo Désactivé'}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleStoreMomo(s.id, s.momo_enabled !== false)}
                          className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                            s.momo_enabled !== false ? 'bg-emerald-400' : 'bg-neutral-800'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-black transition-transform ${s.momo_enabled !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Demandes d'Approbation Vendeurs */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                      Demandes d'Approbation Vendeurs ({merchantApps.length})
                    </h2>
                  </div>

                  {merchantApps.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400 text-xs flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400/60" />
                      <p>Aucune demande marchande en attente de validation.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {merchantApps.map((app) => (
                        <div key={app.id} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-white text-xs">{app.full_name}</p>
                              <p className="text-amber-400 text-sm font-bold mt-0.5">{app.store_name}</p>
                            </div>
                            <span className="text-[10px] text-neutral-500">
                              {new Date(app.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-[11px] space-y-1 text-neutral-300">
                            <p><span className="text-neutral-500">Ville :</span> {app.operational_city}</p>
                            <p><span className="text-neutral-500">Focus :</span> {app.product_focus}</p>
                            <p><span className="text-neutral-500">Livraison :</span> {app.fulfillment_type}</p>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                            <button
                              type="button"
                              onClick={() => handleApproveApp(app)}
                              disabled={processingAppId === app.id}
                              className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold uppercase rounded-lg transition flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approuver
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectApp(app.id)}
                              disabled={processingAppId === app.id}
                              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase rounded-lg transition flex items-center justify-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              Refuser
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: COMMANDES */}
            {/* ========================================================================= */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {/* 8-Status Filter Sub-Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {[
                    { key: 'all', label: 'TOUT' },
                    { key: 'pending_payment', label: 'ATTENTE PAYE' },
                    { key: 'awaiting_admin_clearance', label: 'VÉRIF' },
                    { key: 'pending', label: 'PAYÉ/PRÉP' },
                    { key: 'approved', label: 'APPROUVÉES' },
                    { key: 'processing', label: 'LIVRAISON' },
                    { key: 'completed', label: 'TERMINÉES' },
                    { key: 'cancelled', label: 'ANNULÉES' },
                  ].map((sub) => {
                    const isActive = orderStatusFilter === sub.key;
                    const count = sub.key === 'all' ? orders.length : orders.filter((o) => o.order_status === sub.key).length;
                    return (
                      <button
                        key={sub.key}
                        type="button"
                        onClick={() => setOrderStatusFilter(sub.key)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-amber-400 text-black shadow'
                            : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                        }`}
                      >
                        <span>{sub.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${isActive ? 'bg-black text-amber-400' : 'bg-neutral-800 text-neutral-300'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Rechercher par référence (CMD-XXXX), client, produit, commune..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                  <div className="py-16 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-neutral-800">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold">Aucune commande trouvée.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredOrders.map((o) => {
                      const deliveryCode = `CMD-${o.id.slice(0, 6).toUpperCase()}`;
                      const isPending = o.order_status === 'pending' || o.order_status === 'pending_payment' || o.order_status === 'awaiting_admin_clearance';
                      const isApprovedOrProcessing = o.order_status === 'approved' || o.order_status === 'processing';
                      const isFinal = o.order_status === 'completed' || o.order_status === 'cancelled';
                      const product = o.products;
                      const img = product?.images_urls?.[0] || 'https://placehold.co/100x120/png?text=Cmd';

                      return (
                        <div key={o.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between">
                          <div>
                            {/* Card Top */}
                            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-neutral-800">
                              <div>
                                <span className="font-mono font-bold text-amber-400 text-sm block">{deliveryCode}</span>
                                <span className="text-[10px] text-neutral-400">
                                  {new Date(o.timestamp || o.created_at).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                o.order_status === 'completed'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : o.order_status === 'cancelled'
                                  ? 'bg-red-950 text-red-300 border border-red-800'
                                  : o.order_status === 'shipped' || o.order_status === 'processing'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}>
                                {o.order_status}
                              </span>
                            </div>

                            {/* Card Body Details */}
                            <div className="py-2 space-y-2 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="relative w-10 h-12 bg-black rounded overflow-hidden flex-shrink-0 border border-neutral-800">
                                  <Image src={img} alt={product?.title || 'Article'} fill className="object-cover" sizes="40px" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate">{product?.title || 'Article commandé'}</p>
                                  <p className="text-[10px] text-neutral-400">Quantité : {o.quantity || 1}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/60 text-[11px]">
                                <div>
                                  <p className="text-neutral-500 text-[10px] uppercase font-bold">Client</p>
                                  <p className="font-semibold text-white truncate">{o.users?.full_name || 'Client Lubumbashi'}</p>
                                  <p className="text-neutral-400 text-[10px] truncate">{o.users?.phone || o.users?.email || 'Sans contact'}</p>
                                </div>
                                <div>
                                  <p className="text-neutral-500 text-[10px] uppercase font-bold">Total</p>
                                  <p className="font-bold text-amber-400">${o.total_usd}</p>
                                  <p className="text-neutral-400 text-[10px] font-mono">({o.total_cdf?.toLocaleString()} FC)</p>
                                </div>
                              </div>

                              <div className="text-[11px] pt-1 text-neutral-300">
                                <div className="flex items-center gap-1 font-medium text-white">
                                  <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                  <span>{o.commune || 'Lubumbashi'} • {o.nearest_landmark || 'Centre-ville'}</span>
                                </div>
                                <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{o.shipping_address || o.delivery_address || 'Adresse standard'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
                            <select
                              value={o.order_status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              disabled={updatingOrderId === o.id}
                              className="text-[11px] font-semibold px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                            >
                              <option value="pending">pending</option>
                              <option value="pending_payment">pending_payment</option>
                              <option value="awaiting_admin_clearance">awaiting_admin_clearance</option>
                              <option value="approved">approved</option>
                              <option value="processing">processing</option>
                              <option value="shipped">shipped</option>
                              <option value="completed">completed</option>
                              <option value="cancelled">cancelled</option>
                            </select>

                            <div className="flex items-center gap-1.5">
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(o.id, 'approved')}
                                  disabled={updatingOrderId === o.id}
                                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold rounded transition"
                                >
                                  Approuver
                                </button>
                              )}

                              {isApprovedOrProcessing && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(o.id, 'completed')}
                                  disabled={updatingOrderId === o.id}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded transition"
                                >
                                  Terminer
                                </button>
                              )}

                              {!isFinal && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(o.id, 'cancelled')}
                                  disabled={updatingOrderId === o.id}
                                  className="px-2 py-1 text-[11px] text-red-400 hover:bg-red-950/50 rounded transition border border-red-900/40"
                                >
                                  Annuler
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: UTILISATEURS (CLIENTS & BOUTIQUES) */}
            {/* ========================================================================= */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {/* Sub-Tabs: Clients vs Boutiques */}
                <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setUserSubTab('clients')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                      userSubTab === 'clients' ? 'bg-amber-400 text-black' : 'text-neutral-400 hover:text-white bg-neutral-900'
                    }`}
                  >
                    Clients Enregistrés ({filteredClients.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserSubTab('boutiques')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                      userSubTab === 'boutiques' ? 'bg-amber-400 text-black' : 'text-neutral-400 hover:text-white bg-neutral-900'
                    }`}
                  >
                    Boutiques & Vendeurs ({filteredStores.length})
                  </button>
                </div>

                {/* Sub-Tab 1: Clients */}
                {userSubTab === 'clients' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Rechercher un client par email, nom, téléphone..."
                        className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredClients.map((u) => {
                        const isSuspended = u.status === 'suspended';
                        return (
                          <div key={u.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-amber-400 flex-shrink-0">
                                {(u.full_name?.[0] || u.email?.[0] || 'U').toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="font-bold text-white text-xs truncate">{u.full_name || 'Client'}</p>
                                  <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase ${
                                    isSuspended ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  }`}>
                                    {isSuspended ? 'SUSPENDU' : 'ACTIF'}
                                  </span>
                                </div>
                                <p className="text-neutral-400 text-[11px] truncate mt-0.5">{u.email}</p>
                                <p className="text-neutral-500 text-[10px] truncate">{u.phone || 'Sans téléphone'}</p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u.id, u.status, u.email)}
                                disabled={processingUserId === u.id}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded transition border ${
                                  isSuspended
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                                }`}
                              >
                                {isSuspended ? 'Réactiver' : 'Suspendre'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                disabled={processingUserId === u.id}
                                className="px-2 py-1 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-Tab 2: Boutiques */}
                {userSubTab === 'boutiques' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={storeSearchQuery}
                        onChange={(e) => setStoreSearchQuery(e.target.value)}
                        placeholder="Rechercher une boutique par nom, ville, propriétaire..."
                        className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredStores.map((s) => (
                        <div key={s.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center font-bold text-amber-400">
                                <Store className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-bold text-white text-sm uppercase">{s.store_name}</h3>
                                  {s.is_verified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
                                </div>
                                <p className="text-xs text-neutral-400">{s.city || 'Lubumbashi'} • Proprio : {s.users?.full_name || 'Vendeur'}</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleStoreVerification(s.id, !!s.is_verified)}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                                s.is_verified ? 'bg-blue-950 text-blue-300 border-blue-800' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                              }`}
                            >
                              {s.is_verified ? 'Certifié' : 'Non certifié'}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-950 p-2.5 rounded-lg">
                            <div>
                              <p className="text-[10px] uppercase text-neutral-500 font-bold">Catalogue</p>
                              <p className="font-bold text-white">{s.product_count || 0} Articles</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-neutral-500 font-bold">Abonnés</p>
                              <p className="font-bold text-amber-400">{s.follower_count || 0} Followers</p>
                            </div>
                          </div>

                          {s.description && (
                            <p className="text-xs text-neutral-400 line-clamp-2">{s.description}</p>
                          )}

                          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                            <span className={`text-[10px] font-bold ${s.is_archived ? 'text-red-400' : 'text-emerald-400'}`}>
                              {s.is_archived ? 'Boutique Archivée' : 'Boutique Active'}
                            </span>

                            {!s.is_archived && (
                              <button
                                type="button"
                                onClick={() => handleArchiveStore(s.id, s.vendor_id, s.store_name)}
                                className="px-2.5 py-1 text-[11px] font-bold text-red-400 hover:bg-red-950/40 rounded transition border border-red-900/40"
                              >
                                Archiver la boutique
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: MODÉRATION (CATALOGUE PRODUITS) */}
            {/* ========================================================================= */}
            {activeTab === 'moderation' && (
              <div className="space-y-4">
                {/* Controls Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProductModerationTab('active')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                        productModerationTab === 'active' ? 'bg-amber-400 text-black shadow' : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      Catalogue Actif ({products.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModerationTab('archived')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                        productModerationTab === 'archived' ? 'bg-amber-400 text-black shadow' : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      Archivés ({archivedProducts.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <select
                      value={selectedVendorFilter}
                      onChange={(e) => handleVendorFilterChange(e.target.value)}
                      className="px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="all">Toutes les boutiques ({stores.length})</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.vendor_id}>{s.store_name} ({s.city || 'L’shi'})</option>
                      ))}
                    </select>

                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        placeholder="Rechercher par titre, catégorie..."
                        className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="py-16 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-neutral-800">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50 text-amber-400" />
                    <p className="text-sm font-semibold">Aucun article trouvé dans cette vue.</p>
                    <p className="text-xs text-neutral-500 mt-1">Sélectionnez une autre boutique ou ajustez vos termes de recherche.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((p) => {
                      const img = p.images_urls?.[0] || 'https://placehold.co/200x250/png?text=Article';
                      const isSuspended = p.status === 'suspended';
                      const storeName = p.stores?.store_name || stores.find((s) => s.vendor_id === p.vendor_id)?.store_name || 'Boutique';

                      return (
                        <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-neutral-700 transition">
                          <div>
                            <div className="flex gap-3">
                              <div className="relative w-20 h-24 bg-black rounded-lg overflow-hidden flex-shrink-0 border border-neutral-800">
                                <Image src={img} alt={p.title} fill className="object-cover" sizes="80px" />
                                {p.is_trending && (
                                  <span className="absolute top-1 left-1 bg-amber-500 text-black text-[8px] font-bold px-1 rounded shadow">
                                    HOT 🔥
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-1">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700 truncate max-w-[120px]">
                                    {storeName}
                                  </span>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                    isSuspended ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  }`}>
                                    {isSuspended ? 'SUSPENDU' : 'ACTIF'}
                                  </span>
                                </div>

                                <h4 className="font-bold text-white text-xs truncate mt-1.5">{p.title}</h4>
                                <p className="text-[10px] text-neutral-400">{p.category || 'Mode'} • <strong className="text-white">{p.stock_count}</strong> en stock</p>
                                
                                <div className="mt-1 flex items-baseline gap-1.5">
                                  <span className="text-sm font-bold text-amber-400">${p.price_usd}</span>
                                  <span className="text-[10px] text-neutral-400 font-mono">({p.price_cdf?.toLocaleString()} FC)</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-neutral-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/products/${p.id}`}
                                target="_blank"
                                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold rounded transition flex items-center gap-1"
                                title="Voir la page article"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Voir</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleToggleTrending(p.id, p.is_trending)}
                                className={`px-2 py-1 text-[10px] font-bold rounded border transition ${
                                  p.is_trending ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                                }`}
                              >
                                {p.is_trending ? '★ En Tendance' : '☆ Tendance'}
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleProductSuspension(p.id, p.status)}
                                disabled={processingProductId === p.id}
                                className={`px-2 py-1 text-[10px] font-bold rounded transition ${
                                  isSuspended ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                }`}
                              >
                                {isSuspended ? 'Réactiver' : 'Suspendre'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id)}
                                disabled={processingProductId === p.id}
                                className="p-1 text-red-400 hover:bg-red-950/40 rounded transition"
                                title="Supprimer / Archiver"
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

            {/* ========================================================================= */}
            {/* TAB 5: COMPTABILITÉ (VÉRIFICATION DES PAIEMENTS) */}
            {/* ========================================================================= */}
            {activeTab === 'accounting' && (
              <div className="space-y-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-white">File de Vérification des Paiements</h2>
                    <p className="text-xs text-neutral-400">Transactions Mobile Money manuelles en attente de vérification et validation du cash.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-400 text-black text-xs font-bold rounded-lg">
                    {awaitingPayments.length} en attente
                  </span>
                </div>

                {awaitingPayments.length === 0 ? (
                  <div className="py-16 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-neutral-800">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400/60" />
                    <p className="text-sm font-semibold">Toutes les transactions sont à jour !</p>
                    <p className="text-xs text-neutral-500 mt-1">Aucune transaction en attente de vérification manuelle.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {awaitingPayments.map((txn) => (
                      <div key={txn.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Montant Reçu</span>
                            <div className="text-xl font-bold text-white mt-0.5">
                              ${txn.amount_usd.toFixed(2)}
                            </div>
                            <p className="text-xs font-mono text-amber-400">≈ {Math.round(txn.amount_cdf).toLocaleString()} CDF</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            {txn.payment_method || 'Mobile Money'}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 bg-neutral-950 p-3 rounded-lg text-neutral-300">
                          <p><span className="text-neutral-500">Réf Opérateur :</span> <strong className="font-mono text-white">{txn.provider_reference || 'N/A'}</strong></p>
                          <p><span className="text-neutral-500">N° Expéditeur :</span> <strong className="font-mono text-white">{txn.sender_phone || 'N/A'}</strong></p>
                          <p><span className="text-neutral-500">Date :</span> {new Date(txn.created_at).toLocaleDateString()} {new Date(txn.created_at).toLocaleTimeString()}</p>
                          {txn.order_ids && txn.order_ids.length > 0 && (
                            <div className="pt-1 flex items-center gap-1 flex-wrap">
                              <span className="text-neutral-500">Commandes :</span>
                              {txn.order_ids.map((id) => (
                                <span key={id} className="px-1.5 py-0.2 bg-neutral-800 text-[10px] font-mono text-amber-400 rounded">
                                  CMD-{id.slice(0, 6).toUpperCase()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApprovePayment(txn)}
                          disabled={approvingPaymentId === txn.id}
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2 shadow"
                        >
                          {approvingPaymentId === txn.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Confirmer la Réception & Valider
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: SUPPORT (TICKETS & CHAT) */}
            {/* ========================================================================= */}
            {activeTab === 'support' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
                {/* Threads List */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <h3 className="text-xs font-bold uppercase text-white">Tickets Support ({supportThreads.length})</h3>
                  </div>

                  {supportThreads.length === 0 ? (
                    <p className="text-xs text-neutral-500 py-8 text-center">Aucun ticket ouvert.</p>
                  ) : (
                    supportThreads.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveThreadId(t.id)}
                        className={`w-full text-left p-3 rounded-lg border transition ${
                          activeThreadId === t.id
                            ? 'bg-amber-400/10 border-amber-400/50 text-white'
                            : 'bg-neutral-950 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-bold text-xs truncate">{t.users?.full_name || t.users?.email || 'Client'}</p>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            t.status === 'open' ? 'bg-amber-950 text-amber-300' :
                            t.status === 'in_progress' ? 'bg-blue-950 text-blue-300' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate mt-1">{t.subject}</p>
                      </button>
                    ))
                  )}
                </div>

                {/* Chat Panel */}
                <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col justify-between overflow-hidden">
                  {activeThreadId ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">Discussion Support</p>
                          <p className="text-[10px] text-neutral-400">Réf Thread: {activeThreadId}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCloseThread(activeThreadId)}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold rounded transition"
                        >
                          Fermer le ticket
                        </button>
                      </div>

                      {/* Messages Box */}
                      <div className="p-4 flex-1 overflow-y-auto space-y-3">
                        {chatMessages.length === 0 ? (
                          <p className="text-xs text-neutral-500 text-center py-8">Aucun message pour le moment.</p>
                        ) : (
                          chatMessages.map((m) => {
                            const isAdmin = m.sender_role === 'admin';
                            return (
                              <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-3 rounded-xl text-xs ${
                                  isAdmin ? 'bg-amber-400 text-black font-medium' : 'bg-neutral-800 text-white'
                                }`}>
                                  <p className="text-[9px] uppercase font-bold opacity-60 mb-1">{isAdmin ? 'Support Zando Yetu' : 'Client'}</p>
                                  <p className="leading-relaxed">{m.message_body}</p>
                                  <p className="text-[9px] opacity-60 text-right mt-1">{new Date(m.created_at).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Reply Input Bar */}
                      <form onSubmit={handleSendReply} className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Écrire une réponse au client..."
                          className="flex-1 px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="submit"
                          disabled={chatSending || !chatInput.trim()}
                          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                        >
                          {chatSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Envoyer</span>
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-xs gap-2">
                      <MessageSquare className="w-8 h-8 opacity-40" />
                      <p>Sélectionnez un ticket à gauche pour afficher les échanges.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 7: COUPONS */}
            {/* ========================================================================= */}
            {activeTab === 'coupons' && (
              <div className="space-y-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-white">Gestion & Validation des Codes Promo</h2>
                    <p className="text-xs text-neutral-400">Créez des remises administratives et approuvez les codes soumis par les vendeurs.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateCouponModal(true)}
                      className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold uppercase rounded-lg transition flex items-center gap-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Ajouter un Code Promo</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs: Tous vs En Attente */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCouponSubTab('all')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      couponSubTab === 'all' ? 'bg-amber-400 text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    Tous les Codes ({allCoupons.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCouponSubTab('pending')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                      couponSubTab === 'pending' ? 'bg-amber-400 text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    <span>En Attente d'Approbation</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-neutral-800 text-amber-300">
                      {pendingCoupons.length}
                    </span>
                  </button>
                </div>

                {/* Coupons List */}
                {filteredCoupons.length === 0 ? (
                  <div className="py-16 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-neutral-800">
                    <Tag className="w-8 h-8 mx-auto mb-2 text-amber-400 opacity-50" />
                    <p className="text-sm font-semibold">Aucun code promo trouvé dans cette catégorie.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCoupons.map((c) => {
                      const isPending = c.status === 'pending';
                      const isActive = c.status === 'active';
                      const storeName = c.stores?.store_name || c.stores?.name || stores.find((s) => s.id === c.store_id)?.store_name || 'Plateforme Globale';

                      return (
                        <div key={c.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono text-base font-bold text-amber-400 tracking-wider block">{c.code}</span>
                                <span className="text-xs text-emerald-400 font-bold">-{c.discount_percent}% de remise</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                isPending ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-red-950 text-red-300 border border-red-800'
                              }`}>
                                {c.status}
                              </span>
                            </div>

                            <p className="text-xs text-neutral-300 mt-2">Boutique : <strong className="text-white">{storeName}</strong></p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Créé le : {new Date(c.created_at).toLocaleDateString()}</p>
                          </div>

                          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveCoupon(c.id)}
                                  disabled={processingCouponId === c.id}
                                  className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold uppercase rounded-lg transition"
                                >
                                  Approuver
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectCoupon(c.id)}
                                  disabled={processingCouponId === c.id}
                                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase rounded-lg transition"
                                >
                                  Refuser
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(c.id)}
                                disabled={processingCouponId === c.id}
                                className="w-full py-1.5 text-xs text-red-400 hover:bg-red-950/40 rounded transition border border-red-900/40 flex items-center justify-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Supprimer le Code</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Modal: Create Admin Coupon */}
                {showCreateCouponModal && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-amber-400" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nouveau Code Promo Plateforme</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreateCouponModal(false)}
                          className="text-neutral-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleCreateCouponSubmit} className="space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                            Code Promo (ex. LUBUM2026)
                          </label>
                          <input
                            type="text"
                            value={couponForm.code}
                            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                            placeholder="CODEPROMO"
                            className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-amber-400 font-mono font-bold tracking-widest focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] uppercase font-bold text-neutral-400">
                              Pourcentage de Réduction
                            </label>
                            <span className="text-xs font-bold text-emerald-400">
                              {couponForm.discount_percent}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={90}
                            value={couponForm.discount_percent}
                            onChange={(e) => setCouponForm({ ...couponForm, discount_percent: parseInt(e.target.value) || 10 })}
                            className="w-full accent-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                            Boutique Éligible
                          </label>
                          <select
                            value={couponForm.store_id}
                            onChange={(e) => setCouponForm({ ...couponForm, store_id: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                          >
                            <option value="global">Toutes les boutiques / Plateforme Globale</option>
                            {stores.map((s) => (
                              <option key={s.id} value={s.id}>{s.store_name} ({s.city || 'Lubumbashi'})</option>
                            ))}
                          </select>
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCreateCouponModal(false)}
                            className="flex-1 py-2 text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 rounded-lg transition"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            disabled={creatingCoupon || !couponForm.code.trim()}
                            className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {creatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>Créer & Activer</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 8: BANNIÈRES */}
            {/* ========================================================================= */}
            {activeTab === 'banners' && (
              <div className="space-y-6">
                {/* Add Banner Form */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-6 shadow-sm">
                  <h3 className="text-xs font-bold uppercase text-white tracking-wider mb-4">Créer une Nouvelle Bannière Hero</h3>
                  
                  <form onSubmit={handleCreateBanner} className="space-y-4 max-w-2xl">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Titre de la Bannière</label>
                      <input
                        type="text"
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                        placeholder="Ex. Mode Urbaine & Streetwear Katanga"
                        className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">URL du Média (Image CDN ou Vidéo MP4)</label>
                      <input
                        type="text"
                        value={bannerForm.media_url}
                        onChange={(e) => setBannerForm({ ...bannerForm, media_url: e.target.value })}
                        placeholder="https://images.unsplash.com/... ou URL .mp4"
                        className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Route d'Action au Clic</label>
                        <input
                          type="text"
                          value={bannerForm.click_action_route}
                          onChange={(e) => setBannerForm({ ...bannerForm, click_action_route: e.target.value })}
                          placeholder="/?gender=women"
                          className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Ordre de Tri</label>
                        <input
                          type="number"
                          value={bannerForm.sort_order}
                          onChange={(e) => setBannerForm({ ...bannerForm, sort_order: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={addingBanner}
                      className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition flex items-center gap-2 shadow"
                    >
                      {addingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Créer la Bannière
                    </button>
                  </form>
                </div>

                {/* Banners List */}
                <div>
                  <h3 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-3">Bannières Configuréess ({banners.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {banners.map((b) => (
                      <div key={b.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="relative w-full h-32 bg-black">
                          <Image src={b.media_url} alt={b.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                            <span className="font-bold text-white text-xs truncate">{b.title}</span>
                            <span className="text-[10px] text-amber-400 font-mono">Ordre: {b.sort_order}</span>
                          </div>
                        </div>

                        <div className="p-3 flex items-center justify-between gap-2 text-xs">
                          <span className="text-[10px] text-neutral-400 truncate max-w-[200px] font-mono">{b.click_action_route}</span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleBanner(b)}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                b.is_active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-neutral-800 text-neutral-400'
                              }`}
                            >
                              {b.is_active ? 'Active' : 'Désactivée'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteBanner(b.id)}
                              className="p-1 text-red-400 hover:bg-red-950/40 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
