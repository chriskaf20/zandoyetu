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
  Package
} from 'lucide-react';
import { AdminService, PlatformMetrics, PlatformSettings } from '@/lib/services/AdminService';
import { HeroBanner } from '@/types/schema';

type AdminTab = 'analytics' | 'stores' | 'products' | 'requests' | 'settings' | 'banners_flash';

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
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);

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
      const [m, s, reqs, prods, sett, b, f] = await Promise.all([
        AdminService.getPlatformMetrics(),
        AdminService.getAllStores(),
        AdminService.getStoreNameRequests(),
        AdminService.getProductsByStore(selectedVendorId),
        AdminService.getPlatformSettings(),
        AdminService.getHeroBanners(),
        AdminService.getFlashSales(),
      ]);

      setMetrics(m);
      setStores(s);
      setNameRequests(reqs);
      setProducts(prods);
      setSettings(sett);
      setBanners(b);
      setFlashSales(f);
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

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    try {
      await AdminService.updatePlatformSettings(settings);
      setMessage({ type: 'success', text: 'Paramètres plateforme et taux de change mis à jour avec succès !' });
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
      setMessage({ type: 'success', text: 'Bannière promotionnelle enregistrée !' });
      setIsBannerModalOpen(false);
      const b = await AdminService.getHeroBanners();
      setBanners(b);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout de la bannière.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Banner
  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Supprimer cette bannière ?')) return;
    try {
      await AdminService.deleteHeroBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      setMessage({ type: 'success', text: 'Bannière supprimée.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">
            Tableau de Bord Administrateur
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Supervision globale, modération des vendeurs, vérification des boutiques et taux de change Lubumbashi.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 text-neutral-200 text-xs font-semibold rounded-lg hover:bg-neutral-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
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
          <span>Articles par Boutique ({products.length})</span>
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
          <ImageIcon className="w-4 h-4" />
          <span>Bannières & Flash Sales</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-2" />
          <p className="text-xs">Chargement des données administratives...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: ANALYTICS & GMV */}
          {activeTab === 'analytics' && metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Total GMV USD */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Volume d'Affaires (USD)</span>
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white mt-2">
                    ${metrics.totalGmvUsd.toLocaleString()}
                  </h3>
                  <p className="text-[10px] text-emerald-400 mt-1">
                    ≈ {metrics.totalGmvCdf.toLocaleString()} CDF
                  </p>
                </div>

                {/* Metric 2: Orders Count */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Total Commandes</span>
                    <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white mt-2">
                    {metrics.totalOrders}
                  </h3>
                  <p className="text-[10px] text-neutral-400 mt-1">Commandes enregistrées</p>
                </div>

                {/* Metric 3: Customers & Vendors */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Comptes Utilisateurs</span>
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white mt-2">
                    {metrics.totalCustomers + metrics.totalVendors}
                  </h3>
                  <p className="text-[10px] text-amber-400 mt-1">
                    {metrics.totalVendors} Vendeurs • {metrics.totalCustomers} Clients
                  </p>
                </div>

                {/* Metric 4: Active Products */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Catalogue Articles</span>
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                      <Store className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white mt-2">
                    {metrics.totalProducts}
                  </h3>
                  <p className="text-[10px] text-neutral-400 mt-1">Articles en vente</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORES MODERATION & VERIFICATION */}
          {activeTab === 'stores' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow space-y-4">
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Boutiques et Créateurs Inscrits</h3>
                  <p className="text-xs text-neutral-400">Attribuez le badge officiel et modérez l'accès des vendeurs.</p>
                </div>
                <span className="text-xs text-neutral-400">{stores.length} boutiques</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Boutique</th>
                      <th className="py-3 px-4">Propriétaire / Vendeur</th>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS BY STORE VIEW */}
          {activeTab === 'products' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow space-y-4">
              <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Gestion du Catalogue par Boutique</h3>
                  <p className="text-xs text-neutral-400">Consultez et désactivez/archivez les articles par boutique.</p>
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
                        <th className="py-3 px-4">Catégorie</th>
                        <th className="py-3 px-4">Prix USD</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {products.map((p) => {
                        const img = p.images_urls?.[0] || 'https://placehold.co/100x120/png?text=Item';
                        const isArchived = p.status === 'archived';

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
                            <td className="py-3 px-4 capitalize text-neutral-300">
                              {p.category || 'Mode'}
                            </td>
                            <td className="py-3 px-4 font-bold text-white">
                              ${p.price_usd}
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
                              <button
                                type="button"
                                onClick={() => handleToggleProductArchive(p.id, isArchived)}
                                className={`px-3 py-1 rounded text-[11px] font-semibold transition ${
                                  isArchived
                                    ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                                    : 'bg-neutral-800 text-amber-400 hover:bg-amber-950'
                                }`}
                              >
                                {isArchived ? 'Réactiver' : 'Archiver / Désactiver'}
                              </button>
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

          {/* TAB 4: STORE NAME CHANGE REQUESTS */}
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

          {/* TAB 5: PLATFORM SETTINGS */}
          {activeTab === 'settings' && settings && (
            <form onSubmit={handleSaveSettings} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow max-w-2xl space-y-4">
              <h3 className="font-serif text-base font-bold text-white border-b border-neutral-800 pb-3">
                Paramètres Monétaires & Lignes Mobile Money (Lubumbashi)
              </h3>

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

          {/* TAB 6: HERO BANNERS & FLASH SALES */}
          {activeTab === 'banners_flash' && (
            <div className="space-y-6">
              {/* Hero Banners */}
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
