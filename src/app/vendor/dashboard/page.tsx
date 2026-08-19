'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Package, 
  ShoppingBag, 
  Store as StoreIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Loader2,
  X,
  Phone,
  MapPin,
  DollarSign
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { VendorService, CreateProductInput } from '@/lib/services/VendorService';
import { Product, Store } from '@/types/schema';

type VendorTab = 'products' | 'orders' | 'profile';

export default function VendorDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { formatPrice } = useCurrencyStore();

  const [activeTab, setActiveTab] = useState<VendorTab>('products');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Vendor Data State
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Search in products
  const [searchQuery, setSearchQuery] = useState('');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<CreateProductInput>({
    title: '',
    description: '',
    category: 'robes',
    price_usd: 25,
    price_cdf: 71250,
    compare_at_price: undefined,
    stock_count: 10,
    target_gender: 'women',
    images_urls: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80'],
    sizes: ['S', 'M', 'L'],
    colors: ['Noir', 'Blanc'],
  });
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');

  // Store Profile Form State
  const [storeForm, setStoreForm] = useState({
    store_name: '',
    description: '',
    city: 'Lubumbashi (Golf)',
    store_logo_url: '',
    momo_enabled: true,
  });

  // Load Vendor data
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedStore, fetchedProducts, fetchedOrders] = await Promise.all([
        VendorService.getStoreByVendor(user.id),
        VendorService.getVendorProducts(user.id),
        VendorService.getVendorOrders(user.id),
      ]);

      setStore(fetchedStore);
      if (fetchedStore) {
        setStoreForm({
          store_name: fetchedStore.store_name,
          description: fetchedStore.description || '',
          city: fetchedStore.city || 'Lubumbashi',
          store_logo_url: fetchedStore.store_logo_url || '',
          momo_enabled: fetchedStore.momo_enabled,
        });
      } else {
        setStoreForm({
          store_name: user.full_name ? `Boutique ${user.full_name}` : 'Ma Boutique Lubumbashi',
          description: 'Vêtements & articles de mode chic à Lubumbashi.',
          city: 'Lubumbashi (Centre-Ville)',
          store_logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop&q=80',
          momo_enabled: true,
        });
      }

      setProducts(fetchedProducts);
      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Error loading vendor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Store Name Change Request State
  const [isNameChangeModalOpen, setIsNameChangeModalOpen] = useState(false);
  const [proposedName, setProposedName] = useState('');
  const [nameChangeReason, setNameChangeReason] = useState('');

  // Handle Store Name Change Request
  const handleRequestStoreNameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id || !proposedName.trim()) return;
    setSaving(true);
    setMessage(null);

    try {
      await VendorService.requestStoreNameChange(store.id, proposedName, nameChangeReason);
      setMessage({
        type: 'success',
        text: `Demande de renommage soumise pour "${proposedName}". En attente de validation administrative.`,
      });
      setIsNameChangeModalOpen(false);
      setProposedName('');
      setNameChangeReason('');
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la soumission de la demande.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Toggle Archive Product
  const handleToggleArchiveProduct = async (productId: string, currentlyArchived: boolean) => {
    try {
      if (currentlyArchived) {
        await VendorService.updateProduct(productId, user!.id, { status: 'active' } as any);
        setMessage({ type: 'success', text: 'Article réactivé avec succès.' });
      } else {
        await VendorService.archiveProduct(productId);
        setMessage({ type: 'success', text: 'Article archivé/désactivé du catalogue.' });
      }
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur lors du changement de statut.' });
    }
  };

  // Handle Save Store Profile
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      const updated = await VendorService.updateStore(user.id, storeForm);
      setStore(updated);
      setMessage({ type: 'success', text: 'Profil de la boutique mis à jour avec succès !' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setSaving(false);
    }
  };

  // Open Create Product Modal
  const handleOpenCreateModal = () => {
    setEditingProductId(null);
    setProductForm({
      title: '',
      description: '',
      category: 'robes',
      price_usd: 25,
      price_cdf: 71250,
      compare_at_price: undefined,
      stock_count: 10,
      target_gender: 'women',
      images_urls: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80'],
      sizes: ['S', 'M', 'L'],
      colors: ['Noir', 'Blanc'],
    });
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (p: Product) => {
    setEditingProductId(p.id);
    let parsedSizes: string[] = [];
    if (p.sizes_json) {
      try {
        parsedSizes = JSON.parse(p.sizes_json);
      } catch {
        parsedSizes = [p.sizes_json];
      }
    }
    setProductForm({
      title: p.title,
      description: p.description || '',
      category: p.category || 'robes',
      price_usd: p.price_usd,
      price_cdf: p.price_cdf,
      compare_at_price: p.compare_at_price || undefined,
      stock_count: p.stock_count,
      target_gender: p.target_gender,
      images_urls: p.images_urls.length > 0 ? p.images_urls : ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80'],
      sizes: parsedSizes,
      colors: p.colors_json || [],
    });
    setIsProductModalOpen(true);
  };

  // Handle Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      if (editingProductId) {
        await VendorService.updateProduct(editingProductId, user.id, productForm);
        setMessage({ type: 'success', text: 'Article mis à jour avec succès !' });
      } else {
        await VendorService.createProduct(user.id, productForm);
        setMessage({ type: 'success', text: 'Nouvel article ajouté au catalogue !' });
      }
      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (productId: string) => {
    if (!user || !confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
    try {
      await VendorService.deleteProduct(productId, user.id);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setMessage({ type: 'success', text: 'Article supprimé du catalogue.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la suppression.' });
    }
  };

  // Handle Order Status Change
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await VendorService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
      );
      setMessage({ type: 'success', text: `Statut de la commande mis à jour : ${newStatus}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du statut.' });
    }
  };

  // Filter products by search
  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-brand-black">
              {store?.store_name || 'Tableau de Bord Boutique'}
            </h1>
            {store?.is_verified && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Vérifié
              </span>
            )}
          </div>
          <p className="text-xs text-brand-gray mt-0.5">
            Gérez votre catalogue, suivez vos commandes et configurez vos coordonnées à Lubumbashi.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNameChangeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-brand-border text-brand-black text-xs font-semibold rounded-lg hover:bg-neutral-50 transition shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Modifier le nom commercial</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-black text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-charcoal transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un article</span>
          </button>
        </div>
      </div>

      {/* Pending Store Name Change Alert */}
      {store?.pending_name && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p>
              Demande de modification de nom commercial en cours : <strong className="font-bold">"{store.pending_name}"</strong>.
              {store.pending_name_reason && <span className="text-neutral-600"> (Motif: {store.pending_name_reason})</span>}
              {' '}— <span className="text-amber-800 italic">En attente d'approbation par l'administration Zando Yetu.</span>
            </p>
          </div>
        </div>
      )}

      {/* Feedback Message */}
      {message && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center justify-between animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button type="button" onClick={() => setMessage(null)} className="text-neutral-500 hover:text-black">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-brand-border">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-brand-black text-brand-black font-bold'
              : 'border-transparent text-brand-gray hover:text-brand-black'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catalogue & Stock ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-brand-black text-brand-black font-bold'
              : 'border-transparent text-brand-gray hover:text-brand-black'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Commandes Reçues ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-brand-black text-brand-black font-bold'
              : 'border-transparent text-brand-gray hover:text-brand-black'
          }`}
        >
          <StoreIcon className="w-4 h-4" />
          <span>Profil Boutique & Coordonnées</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-brand-gray">
          <Loader2 className="w-8 h-8 animate-spin text-brand-black mb-2" />
          <p className="text-xs">Chargement de votre espace vendeur...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: PRODUCTS MANAGER */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Filter / Search Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par titre ou catégorie..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                  />
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-brand-gray" />
                </div>
                <span className="text-xs text-brand-gray">{filteredProducts.length} article(s)</span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-lg border border-dashed border-brand-border">
                  <Package className="w-10 h-10 text-brand-gray mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-brand-black">Aucun article dans votre catalogue</p>
                  <p className="text-xs text-brand-gray mt-1">Commencez à publier vos articles pour les vendre sur Zando Yetu.</p>
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="mt-4 px-4 py-2 bg-brand-black text-white text-xs font-semibold rounded-lg"
                  >
                    Publier mon premier article
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-brand-border overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-brand-lightGray text-brand-gray uppercase text-[10px] tracking-wider border-b border-brand-border">
                        <tr>
                          <th className="py-3 px-4">Article</th>
                          <th className="py-3 px-4">Catégorie / Rayon</th>
                          <th className="py-3 px-4">Prix USD</th>
                          <th className="py-3 px-4">Stock Restant</th>
                          <th className="py-3 px-4">Statut</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {filteredProducts.map((p) => {
                          const img = p.images_urls?.[0] || 'https://placehold.co/100x120/png?text=Item';
                          const isArchived = p.status === 'archived';

                          return (
                            <tr key={p.id} className="hover:bg-brand-offWhite transition">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-12 h-14 rounded bg-brand-lightGray overflow-hidden flex-shrink-0 border border-brand-border">
                                    <Image src={img} alt={p.title} fill className="object-cover" sizes="48px" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`font-semibold truncate max-w-[200px] ${isArchived ? 'line-through text-neutral-400' : 'text-brand-black'}`}>
                                      {p.title}
                                    </p>
                                    <span className="text-[10px] text-brand-gray uppercase">{p.target_gender}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 capitalize text-neutral-700">
                                {p.category || 'Mode'}
                              </td>

                              <td className="py-3 px-4 font-bold text-brand-black">
                                {formatPrice(p.price_usd)}
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    p.stock_count > 3
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.stock_count > 0
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {p.stock_count} en stock
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                                    isArchived
                                      ? 'bg-neutral-200 text-neutral-600'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(p)}
                                    className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded transition"
                                    title="Modifier l'article"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleArchiveProduct(p.id, isArchived)}
                                    className={`p-1.5 rounded transition ${
                                      isArchived
                                        ? 'text-emerald-600 hover:bg-emerald-50'
                                        : 'text-amber-600 hover:bg-amber-50'
                                    }`}
                                    title={isArchived ? 'Réactiver l\'article' : 'Désactiver / Archiver l\'article'}
                                  >
                                    {isArchived ? (
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    ) : (
                                      <AlertCircle className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                    title="Supprimer définitivement"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORDERS MANAGER */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-lg border border-dashed border-brand-border">
                  <ShoppingBag className="w-10 h-10 text-brand-gray mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-brand-black">Aucune commande enregistrée</p>
                  <p className="text-xs text-brand-gray mt-1">Les commandes passées sur vos articles apparaîtront ici en temps réel.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => {
                    const product = o.products;
                    const img = product?.images_urls?.[0] || 'https://placehold.co/100x120/png?text=Cmd';

                    return (
                      <div
                        key={o.id}
                        className="bg-white border border-brand-border rounded-lg p-4 sm:p-5 shadow-sm space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-border">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-brand-black">
                                CMD #{o.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className="text-[10px] text-brand-gray">
                                • {new Date(o.timestamp || o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-brand-black mt-1">
                              Client : <strong className="font-semibold">{o.users?.full_name || 'Client Lubumbashi'}</strong>
                              {o.users?.phone && <span className="text-neutral-500"> ({o.users.phone})</span>}
                            </p>
                          </div>

                          {/* Status update selector */}
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] uppercase font-bold text-brand-gray">Statut de traitement :</label>
                            <select
                              value={o.order_status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              className="text-xs font-semibold px-2.5 py-1 border border-brand-border rounded-md bg-white focus:outline-none focus:border-brand-black cursor-pointer"
                            >
                              <option value="pending">En attente (Pending)</option>
                              <option value="processing">En préparation (Processing)</option>
                              <option value="shipped">Prêt / En cours de livraison</option>
                              <option value="completed">Livrée & Terminée</option>
                              <option value="cancelled">Annulée (Support Admin)</option>
                            </select>
                          </div>
                        </div>

                        {/* Article and Delivery address details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-brand-offWhite p-3 rounded-lg items-center">
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-10 h-12 bg-white rounded overflow-hidden flex-shrink-0 border border-brand-border">
                              <Image src={img} alt={product?.title || 'Article'} fill className="object-cover" sizes="40px" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-brand-black truncate">{product?.title || 'Article boutique'}</p>
                              <p className="text-[10px] text-brand-gray">Quantité : {o.quantity || 1}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase font-bold text-brand-gray">Lieu de livraison</p>
                            <p className="font-semibold text-brand-black mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />
                              <span>{o.commune || 'Lubumbashi'} • {o.nearest_landmark || o.delivery_address || 'Adresse standard'}</span>
                            </p>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-[10px] uppercase font-bold text-brand-gray">Total Commande</p>
                            <p className="text-sm font-bold text-brand-black mt-0.5">
                              {formatPrice(o.total_usd)} <span className="text-[10px] text-brand-gray">({o.total_cdf?.toLocaleString()} CDF)</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STORE PROFILE & WHATSAPP */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveStore} className="bg-white rounded-lg border border-brand-border p-6 shadow-sm max-w-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <h3 className="font-serif text-base font-bold text-brand-black">
                  Coordonnées & Visibilité de la Boutique
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNameChangeModalOpen(true)}
                  className="text-xs font-semibold text-brand-black hover:underline inline-flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Demander un changement de nom</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1">
                  Nom Commercial Actuel de la Boutique
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled
                    value={storeForm.store_name}
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg bg-neutral-100 text-neutral-600 cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setIsNameChangeModalOpen(true)}
                    className="px-3 py-2 bg-brand-black text-white text-xs font-semibold rounded-lg hover:bg-brand-charcoal whitespace-nowrap"
                  >
                    Changer le nom
                  </button>
                </div>
                <p className="text-[10px] text-brand-gray mt-1">
                  Le nom commercial de votre boutique nécessite une approbation administrative.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1">
                  Description & Spécialités
                </label>
                <textarea
                  rows={3}
                  value={storeForm.description}
                  onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                  placeholder="Ex: Créations sur mesure en Wax, costumes et robes de soirée..."
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1">
                    Commune & Localisation (Lubumbashi)
                  </label>
                  <input
                    type="text"
                    value={storeForm.city}
                    onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                    placeholder="Ex: Golf Les Bâtisseurs, Lubumbashi"
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1">
                    URL du Logo / Enseigne
                  </label>
                  <input
                    type="url"
                    value={storeForm.store_logo_url}
                    onChange={(e) => setStoreForm({ ...storeForm, store_logo_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-brand-border">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="momo_enabled"
                    checked={storeForm.momo_enabled}
                    onChange={(e) => setStoreForm({ ...storeForm, momo_enabled: e.target.checked })}
                    className="w-4 h-4 text-brand-black rounded"
                  />
                  <label htmlFor="momo_enabled" className="text-xs font-semibold text-brand-black cursor-pointer">
                    Accepter les paiements Mobile Money (M-Pesa, Airtel, Orange)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-brand-black text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-charcoal transition shadow flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Enregistrer les coordonnées</span>
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* STORE NAME CHANGE MODAL */}
      {isNameChangeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-brand-border p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h3 className="font-serif text-base font-bold text-brand-black">
                Demande de Changement de Nom
              </h3>
              <button
                type="button"
                onClick={() => setIsNameChangeModalOpen(false)}
                className="p-1 text-brand-gray hover:text-brand-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestStoreNameChange} className="space-y-4">
              <div className="p-3 bg-neutral-50 rounded-lg text-xs text-neutral-600 border border-neutral-200">
                <p>
                  Nom actuel : <strong className="text-brand-black font-semibold">{store?.store_name}</strong>
                </p>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Toute modification de nom doit être validée par les administrateurs pour préserver la confiance des acheteurs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1">
                  Nouveau Nom Proposé *
                </label>
                <input
                  type="text"
                  required
                  value={proposedName}
                  onChange={(e) => setProposedName(e.target.value)}
                  placeholder="Ex: Katanga Luxury & Fashion"
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1">
                  Motif du changement (optionnel)
                </label>
                <textarea
                  rows={2}
                  value={nameChangeReason}
                  onChange={(e) => setNameChangeReason(e.target.value)}
                  placeholder="Ex: Rebranding de notre boutique physique à Lubumbashi"
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsNameChangeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !proposedName.trim()}
                  className="px-4 py-2 bg-brand-black text-white text-xs font-semibold rounded-lg hover:bg-brand-charcoal transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Soumettre la demande</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-brand-border p-6">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h3 className="font-serif text-lg font-bold text-brand-black">
                {editingProductId ? 'Modifier l\'article' : 'Publier un nouvel article'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-brand-gray hover:text-brand-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1">
                  Titre de l'article *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  placeholder="Ex: Robe de soirée en soie Katanga"
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1">
                    Rayon / Catégorie *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                  >
                    <option value="robes">Robes & Combinaisons</option>
                    <option value="hauts">Hauts & Chemisiers</option>
                    <option value="costumes">Costumes & Blazers</option>
                    <option value="chemises">Chemises & Polos</option>
                    <option value="chaussures">Chaussures</option>
                    <option value="sacs">Sacs & Maroquinerie</option>
                    <option value="enfants">Enfants & Bébés</option>
                    <option value="createurs">Créateurs Katangais</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1">
                    Genre Cible *
                  </label>
                  <select
                    value={productForm.target_gender}
                    onChange={(e) => setProductForm({ ...productForm, target_gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                  >
                    <option value="women">Femmes</option>
                    <option value="men">Hommes</option>
                    <option value="mixte">Mixte / Unisexe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1">
                    Prix (USD) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={productForm.price_usd}
                    onChange={(e) => setProductForm({ ...productForm, price_usd: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1">
                    Ancien Prix (Barré)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={productForm.compare_at_price || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        compare_at_price: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ex: 35"
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1">
                    Stock Disponible *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock_count}
                    onChange={(e) => setProductForm({ ...productForm, stock_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                  />
                </div>
              </div>

              {/* Image URL / preview */}
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1">
                  URL de l'image principale
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput || productForm.images_urls[0] || ''}
                    onChange={(e) => {
                      setImageUrlInput(e.target.value);
                      setProductForm({ ...productForm, images_urls: [e.target.value] });
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                  />
                </div>
              </div>

              {/* Sizes Chips */}
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1">
                  Tailles disponibles (Ex: S, M, L, XL, 40, 42)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {productForm.sizes.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-lightGray border border-brand-border text-brand-black rounded text-xs font-semibold"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm({
                            ...productForm,
                            sizes: productForm.sizes.filter((item) => item !== s),
                          })
                        }
                        className="text-brand-gray hover:text-black"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    placeholder="Ajouter une taille (ex: XL)"
                    className="flex-1 px-3 py-1.5 text-xs border border-brand-border rounded-lg focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (sizeInput.trim() && !productForm.sizes.includes(sizeInput.trim())) {
                        setProductForm({
                          ...productForm,
                          sizes: [...productForm.sizes, sizeInput.trim()],
                        });
                        setSizeInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-neutral-200 text-black text-xs font-semibold rounded-lg hover:bg-neutral-300"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1">
                  Description détaillée
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Matières, coupe, conseils d'entretien..."
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-black"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-brand-border text-brand-black text-xs font-semibold rounded-lg hover:bg-brand-lightGray"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-black text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-charcoal transition flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProductId ? 'Mettre à jour' : 'Publier l\'article'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
