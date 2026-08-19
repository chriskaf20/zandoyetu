'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Sparkles
} from 'lucide-react';
import { AdminService, PlatformMetrics, PlatformSettings } from '@/lib/services/AdminService';
import { HeroBanner } from '@/types/schema';

type AdminTab = 'analytics' | 'stores' | 'products' | 'orders' | 'requests' | 'settings' | 'banners_flash';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Data State
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [nameRequests, setNameRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);

  // Flash Sale Modal for specific product
  const [flashProductModal, setFlashProductModal] = useState<any | null>(null);
  const [flashDiscountPercent, setFlashDiscountPercent] = useState<number>(20);

  // Order Search & Filter
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Banner Form Modal
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    media_url: '',
    click_action_route: '/?gender=women',
    sort_order: 1,
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, s, reqs, prods, sett, b, f, ords] = await Promise.all([
        AdminService.getPlatformMetrics(),
        AdminService.getAllStores(),
        AdminService.getStoreNameRequests(),
        AdminService.getProductsByStore(selectedVendorId),
        AdminService.getPlatformSettings(),
        AdminService.getHeroBanners(),
        AdminService.getFlashSales(),
        AdminService.getAllOrders(),
      ]);

      setMetrics(m);
      setStores(s);
      setNameRequests(reqs);
      setProducts(prods);
      setSettings(sett);
      setBanners(b);
      setFlashSales(f);
      setOrders(ords);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter products when store changes
  const handleStoreFilterChange = async (vendorId: string) => {
    setSelectedVendorId(vendorId);
    try {
      const filtered = await AdminService.getProductsByStore(vendorId);
      setProducts(filtered);
    } catch (err) {
      console.error('Error filtering products:', err);
    }
  };

  // Handle Toggle Store Archive Status
  const handleToggleStoreStatus = async (storeId: string, currentArchived: boolean) => {
    try {
      await AdminService.toggleStoreStatus(storeId, !currentArchived);
      setStores((prev) =>
        prev.map((s) => (s.id === storeId ? { ...s, is_archived: !currentArchived } : s))
      );
      setMessage({
        type: 'success',
        text: `Statut de la boutique mis à jour (${!currentArchived ? 'Désactivée' : 'Réactivée'}).`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour.' });
    }
  };

  // Handle Toggle Store Verification Badge
  const handleToggleVerification = async (storeId: string, currentVerified: boolean) => {
    try {
      await AdminService.toggleStoreVerification(storeId, !currentVerified);
      setStores((prev) =>
        prev.map((s) => (s.id === storeId ? { ...s, is_verified: !currentVerified } : s))
      );
      setMessage({
        type: 'success',
        text: `Badge de vérification boutique ${!currentVerified ? 'accordé (Officiel)' : 'retiré'}.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur lors du changement de badge vérifié.' });
    }
  };

  // Handle Approve Vendor Application
  const handleApproveVendor = async (storeId: string, vendorId: string) => {
    try {
      await AdminService.approveVendor(storeId, vendorId);
      setMessage({ type: 'success', text: 'Candidature vendeur validée et boutique vérifiée avec succès !' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la validation du vendeur.' });
    }
  };

  // Handle Reject Vendor Application
  const handleRejectVendor = async (storeId: string) => {
    try {
      await AdminService.rejectVendor(storeId);
      setMessage({ type: 'success', text: 'Candidature vendeur rejetée.' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors du rejet.' });
    }
  };

  // Handle Approve Store Name Change
  const handleApproveNameChange = async (storeId: string, approvedName: string) => {
    try {
      await AdminService.approveStoreNameChange(storeId, approvedName);
      setMessage({
        type: 'success',
        text: `Nom commercial approuvé et mis à jour : "${approvedName}".`,
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'approbation du nom.' });
    }
  };

  // Handle Reject Store Name Change
  const handleRejectNameChange = async (storeId: string) => {
    try {
      await AdminService.rejectStoreNameChange(storeId);
      setMessage({
        type: 'success',
        text: 'Demande de modification de nom rejetée.',
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors du rejet.' });
    }
  };

  // Handle Toggle Product Archive
  const handleToggleProductArchive = async (productId: string, isCurrentlyArchived: boolean) => {
    try {
      await AdminService.toggleProductArchive(productId, !isCurrentlyArchived);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: !isCurrentlyArchived ? 'archived' : 'active' } : p))
      );
      setMessage({
        type: 'success',
        text: `Article ${!isCurrentlyArchived ? 'archivé / désactivé' : 'réactivé'} avec succès.`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors du changement de statut de l\'article.' });
    }
  };

  // Apply Product Flash Sale
  const handleApplyFlashSale = async () => {
    if (!flashProductModal) return;
    setSaving(true);
    try {
      await AdminService.setProductFlashSale(flashProductModal, flashDiscountPercent);
      setMessage({
        type: 'success',
        text: `Vente Flash appliquée (-${flashDiscountPercent}%) sur "${flashProductModal.title}".`,
      });
      setFlashProductModal(null);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'application de la vente flash.' });
    } finally {
      setSaving(false);
    }
  };

  // Remove Product Flash Sale
  const handleRemoveFlashSale = async (product: any) => {
    try {
      await AdminService.removeProductFlashSale(product);
      setMessage({
        type: 'success',
        text: `Vente Flash retirée sur "${product.title}" (Prix initial restauré).`,
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors du retrait de la vente flash.' });
    }
  };

  // Handle Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await AdminService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
      );
      setMessage({
        type: 'success',
        text: `Statut de la commande CMD-${orderId.slice(0, 6).toUpperCase()} mis à jour : ${newStatus}.`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour de la commande.' });
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    try {
      await AdminService.updatePlatformSettings(settings);
      setMessage({ type: 'success', text: 'Paramètres plateforme, taux de change et Mobile Money mis à jour !' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement des paramètres.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Hero Banner
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await AdminService.upsertHeroBanner(bannerForm);
      setMessage({ type: 'success', text: 'Bannière publicitaire enregistrée avec succès !' });
      setIsBannerModalOpen(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement de la bannière.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Hero Banner
  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Supprimer cette bannière ?')) return;
    try {
      await AdminService.deleteHeroBanner(id);
      setMessage({ type: 'success', text: 'Bannière supprimée avec succès.' });
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression.' });
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (o.users?.full_name && o.users.full_name.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
      (o.users?.phone && o.users.phone.includes(orderSearchQuery)) ||
      (o.commune && o.commune.toLowerCase().includes(orderSearchQuery.toLowerCase()));

    const matchesStatus = orderStatusFilter === 'all' || o.order_status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Administration Générale Zando Yetu
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-400/30">
              Lubumbashi & Kolwezi
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Supervision du catalogue, validation des vendeurs, contrôle des commandes et gestion des ventes flash.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 bg-neutral-800 text-neutral-200 text-xs font-semibold rounded-lg hover:bg-neutral-700 transition flex items-center gap-2 border border-neutral-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Rafraîchir</span>
        </button>
      </div>

      {/* Message feedback */}
      {message && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center justify-between animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              : 'bg-red-950/80 text-red-300 border border-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{message.text}</span>
          </div>
          <button type="button" onClick={() => setMessage(null)} className="text-neutral-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-neutral-800 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-amber-400 text-amber-400 font-bold'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Vue d'ensemble & Stats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-amber-400 text-amber-400 font-bold'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Commandes & Livraisons ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stores')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'stores'
              ? 'border-amber-400 text-amber-400 font-bold'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Boutiques & Vendeurs ({stores.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-amber-400 text-amber-400 font-bold'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Articles & Ventes Flash ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'requests'
              ? 'border-amber-400 text-amber-400 font-bold'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Edit className="w-4 h-4" />
          <span>Demandes de Renommage</span>
          {nameRequests.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] font-bold rounded-full">
              {nameRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-amber-400 text-amber-400 font-bold'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Taux de Change & MoMo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banners_flash')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'banners_flash'
              ? 'border-amber-400 text-amber-400 font-bold'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Bannières du Carrousel ({banners.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-neutral-400 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-xs">Chargement des données de gestion...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'analytics' && metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Volume d'Affaires (GMV)</span>
                    <DollarSign className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">${metrics.totalGmvUsd.toLocaleString()}</div>
                  <p className="text-[11px] text-neutral-400 mt-1">{metrics.totalGmvCdf.toLocaleString()} CDF</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Commandes Totales</span>
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{orders.length || metrics.totalOrders}</div>
                  <p className="text-[11px] text-emerald-400 mt-1">Plateforme active</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Boutiques Partenaires</span>
                    <Store className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stores.length}</div>
                  <p className="text-[11px] text-neutral-400 mt-1">{stores.filter((s) => s.is_verified).length} boutiques vérifiées</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Catalogue Articles</span>
                    <Package className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{products.length}</div>
                  <p className="text-[11px] text-neutral-400 mt-1">En vente à Lubumbashi</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS & DELIVERIES MANAGER */}
          {activeTab === 'orders' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow space-y-4">
              <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Gestion des Commandes & Livraisons</h3>
                  <p className="text-xs text-neutral-400">Suivez le statut de livraison et les codes de confirmation des clients.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Rechercher par ID, client..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="processing">En préparation</option>
                    <option value="shipped">En cours de livraison</option>
                    <option value="completed">Livrée & Terminée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center text-neutral-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">Aucune commande ne correspond aux filtres.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                      <tr>
                        <th className="py-3 px-4">Commande & Code</th>
                        <th className="py-3 px-4">Client & Tél</th>
                        <th className="py-3 px-4">Adresse / Commune</th>
                        <th className="py-3 px-4">Montant Total</th>
                        <th className="py-3 px-4">Mode de Paiement</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {filteredOrders.map((o) => {
                        const deliveryCode = `CMD-${o.id.slice(0, 6).toUpperCase()}`;
                        const isCancelled = o.order_status === 'cancelled';

                        return (
                          <tr key={o.id} className="hover:bg-neutral-800/40 transition">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-amber-400 block">{deliveryCode}</span>
                              <span className="text-[10px] text-neutral-400">
                                {new Date(o.timestamp || o.created_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <p className="font-semibold text-white">{o.users?.full_name || 'Client Lubumbashi'}</p>
                              <p className="text-[10px] text-neutral-400">{o.users?.phone || o.users?.email || 'Sans téléphone'}</p>
                            </td>

                            <td className="py-3 px-4 text-neutral-300">
                              <div className="flex items-center gap-1 font-medium text-white">
                                <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                <span>{o.commune || 'Lubumbashi'}</span>
                              </div>
                              {o.nearest_landmark && (
                                <p className="text-[10px] text-neutral-400 mt-0.5">{o.nearest_landmark}</p>
                              )}
                            </td>

                            <td className="py-3 px-4 font-bold text-white">
                              ${o.total_usd} <span className="text-[10px] font-normal text-neutral-400">({o.total_cdf} FC)</span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700">
                                {o.delivery_type || 'Cash on Delivery'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <select
                                value={o.order_status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className={`text-[11px] font-semibold px-2 py-1 rounded border focus:outline-none ${
                                  o.order_status === 'completed'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                    : o.order_status === 'cancelled'
                                    ? 'bg-red-950 text-red-300 border-red-800'
                                    : o.order_status === 'shipped'
                                    ? 'bg-blue-950 text-blue-300 border-blue-800'
                                    : 'bg-amber-950 text-amber-300 border-amber-800'
                                }`}
                              >
                                <option value="pending">En attente</option>
                                <option value="processing">En préparation</option>
                                <option value="shipped">En livraison</option>
                                <option value="completed">Livrée & Terminée</option>
                                <option value="cancelled">Annulée</option>
                              </select>
                            </td>

                            <td className="py-3 px-4 text-right">
                              {!isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(o.id, 'cancelled')}
                                  className="px-2.5 py-1 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded transition border border-red-900/40"
                                >
                                  Annuler
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STORES & VENDOR APPLICATIONS */}
          {activeTab === 'stores' && (
            <div className="space-y-6">
              {/* Stores Table */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow">
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base font-bold text-white">Boutiques et Créateurs Partenaires</h3>
                    <p className="text-xs text-neutral-400">Validez les comptes officiels et gérez l'état des boutiques.</p>
                  </div>
                  <span className="text-xs text-neutral-400 font-medium">{stores.length} boutique(s) enregistrée(s)</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                      <tr>
                        <th className="py-3 px-4">Boutique</th>
                        <th className="py-3 px-4">Propriétaire</th>
                        <th className="py-3 px-4">Ville / Commune</th>
                        <th className="py-3 px-4">Badge Officiel</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {stores.map((st) => (
                        <tr key={st.id} className="hover:bg-neutral-800/40 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{st.store_name}</span>
                              {st.is_verified && (
                                <span title="Boutique Officielle Vérifiée">
                                  <BadgeCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                </span>
                              )}
                            </div>
                            {st.pending_name && (
                              <span className="text-[10px] text-amber-400 block mt-0.5">
                                Demande en attente : "{st.pending_name}"
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-neutral-300">
                            <p>{st.users?.full_name || 'Vendeur'}</p>
                            <p className="text-[10px] text-neutral-400">{st.users?.email || st.users?.phone}</p>
                          </td>
                          <td className="py-3 px-4 text-neutral-300">
                            {st.city || 'Lubumbashi'}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleVerification(st.id, st.is_verified)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 transition ${
                                st.is_verified
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              <BadgeCheck className="w-3 h-3" />
                              <span>{st.is_verified ? 'Vérifié' : 'Non Vérifié'}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                !st.is_archived
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {!st.is_archived ? 'Active' : 'Suspendue'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!st.is_verified && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveVendor(st.id, st.vendor_id)}
                                  className="px-2.5 py-1 bg-emerald-500 text-black text-[10px] font-bold rounded hover:bg-emerald-400 transition"
                                >
                                  Valider Vendeur
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleToggleStoreStatus(st.id, st.is_archived)}
                                className={`px-3 py-1 rounded text-[11px] font-semibold transition ${
                                  st.is_archived
                                    ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                                    : 'bg-neutral-800 text-red-400 hover:bg-red-950'
                                }`}
                              >
                                {st.is_archived ? 'Réactiver' : 'Suspendre'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTS & FLASH SALES CALCULATOR */}
          {activeTab === 'products' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow space-y-4">
              <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Catalogue & Ventes Flash du Jour</h3>
                  <p className="text-xs text-neutral-400">
                    Appliquez instantanément des remises flash (%) avec calcul automatique du prix promo.
                  </p>
                </div>

                {/* Store Filter Selector */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-neutral-400" />
                  <select
                    value={selectedVendorId}
                    onChange={(e) => handleStoreFilterChange(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">Toutes les boutiques ({stores.length})</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.vendor_id}>
                        {s.store_name} ({s.city || 'Lubumbashi'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="py-16 text-center text-neutral-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">Aucun article trouvé pour cette sélection.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                      <tr>
                        <th className="py-3 px-4">Article</th>
                        <th className="py-3 px-4">Boutique</th>
                        <th className="py-3 px-4">Prix USD</th>
                        <th className="py-3 px-4">Statut Vente Flash</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right">Actions Flash / Catalogue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {products.map((p) => {
                        const img = p.images_urls?.[0] || 'https://placehold.co/100x120/png?text=Item';
                        const isArchived = p.status === 'archived';
                        const isFlash = p.compare_at_price && p.compare_at_price > p.price_usd;

                        return (
                          <tr key={p.id} className="hover:bg-neutral-800/40 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-12 rounded bg-neutral-950 overflow-hidden flex-shrink-0 border border-neutral-800">
                                  <Image src={img} alt={p.title} fill className="object-cover" sizes="40px" />
                                </div>
                                <div>
                                  <p className={`font-semibold ${isArchived ? 'line-through text-neutral-500' : 'text-white'}`}>
                                    {p.title}
                                  </p>
                                  <span className="text-[10px] text-neutral-400 uppercase">{p.target_gender}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-neutral-300 font-medium">
                              {p.stores?.store_name || 'Boutique'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-baseline gap-1.5">
                                <strong className="text-white text-sm">${p.price_usd}</strong>
                                {isFlash && (
                                  <span className="text-[10px] text-neutral-500 line-through">${p.compare_at_price}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {isFlash ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  <Flame className="w-3 h-3 fill-current" />
                                  <span>Flash (-{Math.round((1 - p.price_usd / p.compare_at_price) * 100)}%)</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-neutral-500">Prix standard</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.stock_count > 3 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                              }`}>
                                {p.stock_count} dispo
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                                isArchived ? 'bg-neutral-800 text-neutral-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isFlash ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFlashSale(p)}
                                    className="px-2.5 py-1 bg-neutral-800 text-neutral-300 text-[10px] font-semibold rounded hover:text-white transition"
                                  >
                                    Retirer Flash
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFlashProductModal(p);
                                      setFlashDiscountPercent(25);
                                    }}
                                    className="px-2.5 py-1 bg-amber-400 text-black text-[10px] font-bold uppercase rounded hover:bg-amber-300 transition flex items-center gap-1 shadow-sm"
                                  >
                                    <Flame className="w-3 h-3 fill-current" />
                                    <span>Vente Flash</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleToggleProductArchive(p.id, isArchived)}
                                  className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${
                                    isArchived
                                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                                      : 'bg-neutral-800 text-amber-400 hover:bg-amber-950'
                                  }`}
                                >
                                  {isArchived ? 'Réactiver' : 'Archiver'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STORE NAME CHANGE REQUESTS */}
          {activeTab === 'requests' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow space-y-4">
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Demandes de Modification de Nom Commercial</h3>
                  <p className="text-xs text-neutral-400">Validez ou refusez les demandes de renommage soumises par les vendeurs.</p>
                </div>
                <span className="text-xs text-amber-400 font-bold">{nameRequests.length} demande(s) en attente</span>
              </div>

              {nameRequests.length === 0 ? (
                <div className="py-16 text-center text-neutral-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">Aucune demande en attente</p>
                  <p className="text-xs text-neutral-400 mt-1">Toutes les demandes de renommage ont été traitées.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800">
                  {nameRequests.map((req) => (
                    <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-800/30 transition">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-neutral-400 line-through">
                            {req.store_name}
                          </span>
                          <span className="text-sm font-bold text-amber-400">
                            ➔ {req.pending_name}
                          </span>
                        </div>

                        {req.pending_name_reason && (
                          <p className="text-xs text-neutral-300 italic">
                            Motif : "{req.pending_name_reason}"
                          </p>
                        )}

                        <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-1">
                          <span>Vendeur : <strong className="text-neutral-200">{req.users?.full_name || 'Vendeur'}</strong></span>
                          <span>• {req.users?.phone || req.users?.email}</span>
                          <span>• {req.city || 'Lubumbashi'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleRejectNameChange(req.id)}
                          className="px-3.5 py-1.5 bg-neutral-800 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-950 transition flex items-center gap-1.5"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Rejeter</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveNameChange(req.id, req.pending_name)}
                          className="px-4 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition flex items-center gap-1.5 shadow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approuver</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PLATFORM SETTINGS & MOBILE MONEY */}
          {activeTab === 'settings' && settings && (
            <form onSubmit={handleSaveSettings} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow max-w-2xl space-y-4">
              <h3 className="font-serif text-base font-bold text-white border-b border-neutral-800 pb-3">
                Paramètres Monétaires & Lignes Mobile Money (Lubumbashi)
              </h3>

              {/* Mobile Money Activation Toggle */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Activer les Paiements Mobile Money</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Permet aux clients de payer directement via M-Pesa, Airtel Money et Orange Money.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.mobile_money_active === 1}
                  onChange={(e) => setSettings({ ...settings, mobile_money_active: e.target.checked ? 1 : 0 })}
                  className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Taux de change (1 USD en CDF) *
                  </label>
                  <input
                    type="number"
                    required
                    value={settings.exchange_rate}
                    onChange={(e) => setSettings({ ...settings, exchange_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Actuellement : 1$ = {settings.exchange_rate} CDF</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Taux de Commission Plateforme (%) *
                  </label>
                  <input
                    type="number"
                    required
                    value={settings.commission_rate}
                    onChange={(e) => setSettings({ ...settings, commission_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Prélevé sur chaque commande terminée</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-neutral-200">Numéros Marchands Mobile Money (Lubumbashi)</p>
                
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-0.5">Numéro M-Pesa (Vodacom)</label>
                  <input
                    type="text"
                    value={settings.mpesa_number || ''}
                    onChange={(e) => setSettings({ ...settings, mpesa_number: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-0.5">Numéro Airtel Money</label>
                  <input
                    type="text"
                    value={settings.airtel_number || ''}
                    onChange={(e) => setSettings({ ...settings, airtel_number: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-0.5">Numéro Orange Money</label>
                  <input
                    type="text"
                    value={settings.orange_number || ''}
                    onChange={(e) => setSettings({ ...settings, orange_number: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-amber-300 transition shadow flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Enregistrer les paramètres</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 7: HERO BANNERS */}
          {activeTab === 'banners_flash' && (
            <div className="space-y-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div>
                    <h3 className="font-serif text-base font-bold text-white">Bannières Page d'Accueil</h3>
                    <p className="text-xs text-neutral-400">Gérez les slides promotionnels du carrousel principal.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBannerForm({
                        title: '',
                        media_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&auto=format&fit=crop&q=80',
                        click_action_route: '/?gender=women',
                        sort_order: banners.length + 1,
                        is_active: true,
                      });
                      setIsBannerModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-amber-400 text-black text-xs font-semibold rounded-lg hover:bg-amber-300 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une bannière</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {banners.map((b) => (
                    <div key={b.id} className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shadow">
                      <div className="relative h-32 w-full">
                        <Image src={b.media_url} alt={b.title} fill className="object-cover" sizes="300px" />
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-xs text-white truncate">{b.title}</h4>
                        <p className="text-[10px] text-neutral-400 mt-0.5 truncate">Lien : {b.click_action_route}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-amber-400 font-bold">Ordre : #{b.sort_order}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-1 text-red-400 hover:text-red-300"
                            title="Supprimer"
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

      {/* FLASH SALE MODAL FOR PRODUCT */}
      {flashProductModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 fill-current" />
                <h3 className="font-serif text-base font-bold">Configurer Vente Flash</h3>
              </div>
              <button type="button" onClick={() => setFlashProductModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-neutral-300 font-semibold">{flashProductModal.title}</p>
              <p className="text-[11px] text-neutral-400">
                Prix d'origine : <strong className="text-white">${flashProductModal.compare_at_price || flashProductModal.price_usd}</strong>
              </p>
            </div>

            {/* Discount Percentage Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Pourcentage de réduction (%)
              </label>
              <div className="flex items-center gap-2">
                {[15, 25, 35, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setFlashDiscountPercent(pct)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      flashDiscountPercent === pct
                        ? 'bg-amber-400 text-black shadow'
                        : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="5"
                max="90"
                value={flashDiscountPercent}
                onChange={(e) => setFlashDiscountPercent(Number(e.target.value))}
                className="w-full mt-3 px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                placeholder="Ou entrez un % personnalisé"
              />
            </div>

            {/* Price Preview */}
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-xs flex items-center justify-between">
              <div>
                <span className="text-neutral-400 block text-[10px]">Nouveau Prix Flash :</span>
                <span className="text-base font-bold text-amber-400">
                  ${(
                    ((flashProductModal.compare_at_price || flashProductModal.price_usd) *
                      (100 - flashDiscountPercent)) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-400 block text-[10px]">Équivalent CDF :</span>
                <span className="text-xs font-bold text-white">
                  {(
                    (((flashProductModal.compare_at_price || flashProductModal.price_usd) *
                      (100 - flashDiscountPercent)) /
                      100) *
                    2850
                  ).toLocaleString()}{' '}
                  FC
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFlashProductModal(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleApplyFlashSale}
                className="px-4 py-2 bg-amber-400 text-black text-xs font-bold uppercase rounded-lg hover:bg-amber-300 transition shadow flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Activer la Vente Flash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER MODAL */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-serif text-base font-bold">Ajouter une bannière</h3>
              <button type="button" onClick={() => setIsBannerModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Titre de la bannière *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="Ex: Collection Été Lubumbashi 2026"
                  className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">URL de l'image *</label>
                <input
                  type="url"
                  required
                  value={bannerForm.media_url}
                  onChange={(e) => setBannerForm({ ...bannerForm, media_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Lien de redirection</label>
                <input
                  type="text"
                  value={bannerForm.click_action_route}
                  onChange={(e) => setBannerForm({ ...bannerForm, click_action_route: e.target.value })}
                  placeholder="/?gender=women"
                  className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-amber-400 text-black text-xs font-bold uppercase rounded-lg hover:bg-amber-300 transition"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
