import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartFlashPrice, CartItem } from '@/types/cart';
import { Product, Coupon, FlashSale } from '@/types/schema';
import { supabase } from '@/lib/supabase/client';
import { DeliveryZone, deliveryFeeForZone } from '@/lib/services/DeliveryZoneService';

/** 1 point de fidélité = 0,20 $ (même valeur que rpc_process_checkout) */
export const POINT_VALUE_USD = 0.2;

export type FulfillmentType = 'Cash on Delivery' | 'In-Store Pickup';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Prix unitaire affiché : prix flash tant que la vente court, sinon prix catalogue */
export function cartUnitPriceUsd(item: CartItem, now = Date.now()): number {
  if (item.flash && new Date(item.flash.end_time).getTime() > now) {
    return item.flash.price_usd;
  }
  return item.product.price_usd;
}

export function flashFromSale(sale: FlashSale | null | undefined): CartFlashPrice | null {
  if (!sale) return null;
  return { flash_sale_id: sale.id, price_usd: sale.flash_price_usd, end_time: sale.end_time };
}

interface CartState {
  items: CartItem[];
  activeCoupon: Coupon | null;
  pointsToRedeem: number;
  /** Livraison à domicile ou retrait en boutique */
  deliveryType: FulfillmentType;
  deliveryZone: DeliveryZone | null;
  isCartDrawerOpen: boolean;
  setCartDrawerOpen: (isOpen: boolean) => void;
  addItem: (product: Product, size?: string, color?: string, quantity?: number, flash?: CartFlashPrice | null) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryType: (type: FulfillmentType) => void;
  setDeliveryZone: (zone: DeliveryZone | null) => void;
  setPointsToRedeem: (points: number) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  /** Remplace les instantanés produit/flash par les données serveur (prix, stock, statut) */
  syncWithCatalog: (products: Product[], activeFlash: Map<string, FlashSale>) => { removed: number; changed: number };
  getItemCount: () => number;
  getSubtotalUsd: () => number;
  getDeliveryFeeUsd: () => number;
  getPromoDiscountUsd: () => number;
  getPointsUsed: () => number;
  getPointsDiscountUsd: () => number;
  getTotalUsd: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      activeCoupon: null,
      pointsToRedeem: 0,
      deliveryType: 'Cash on Delivery',
      deliveryZone: null,
      isCartDrawerOpen: false,

      setCartDrawerOpen: (isCartDrawerOpen) => set({ isCartDrawerOpen }),

      addItem: (product, size, color, quantity = 1, flash = null) => {
        set((state) => {
          let defaultSize = 'Unique';
          try {
            defaultSize = product.sizes_json ? JSON.parse(product.sizes_json)[0] || 'Unique' : 'Unique';
          } catch {
            // sizes_json mal formé : taille unique
          }
          const selectedSize = size || defaultSize;
          const selectedColor = color || (product.colors_json && product.colors_json[0]) || 'Standard';
          const itemId = `${product.id}-${selectedSize}-${selectedColor}`;

          const existingIndex = state.items.findIndex((i) => i.id === itemId);

          const currentTotalQuantityForProduct = state.items
            .filter((i) => i.product.id === product.id)
            .reduce((sum, i) => sum + i.quantity, 0);

          if (currentTotalQuantityForProduct + quantity > product.stock_count) {
            return state;
          }

          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex] = {
              ...updated[existingIndex],
              product,
              quantity: updated[existingIndex].quantity + quantity,
              flash: flash ?? updated[existingIndex].flash ?? null,
            };
            return { items: updated, isCartDrawerOpen: true };
          }

          return {
            items: [
              ...state.items,
              {
                id: itemId,
                product,
                quantity,
                selected_size: selectedSize,
                selected_color: selectedColor,
                flash,
              },
            ],
            isCartDrawerOpen: true,
          };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set((state) => {
          const item = state.items.find((i) => i.id === itemId);
          if (!item) return state;

          if (quantity > item.product.stock_count) {
            return state;
          }

          return {
            items: state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
          };
        });
      },

      clearCart: () => {
        set({ items: [], activeCoupon: null, pointsToRedeem: 0 });
      },

      setDeliveryType: (deliveryType) => set({ deliveryType }),

      setDeliveryZone: (deliveryZone) => set({ deliveryZone }),

      setPointsToRedeem: (pointsToRedeem) => set({ pointsToRedeem: Math.max(0, Math.floor(pointsToRedeem)) }),

      applyCoupon: async (code) => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) {
          return { success: false, message: 'Veuillez saisir un code.' };
        }

        try {
          // Validation serveur : la liste des codes n'est pas lisible par les clients
          const { data, error } = await supabase.rpc('validate_coupon', { p_code: trimmed });
          const result = data as any;

          if (error || !result?.valid) {
            return { success: false, message: result?.message || 'Code promo invalide ou expiré.' };
          }

          const coupon: Coupon = {
            id: result.id,
            code: result.code,
            discount_percent: result.discount_percent,
            store_id: result.store_id,
            vendor_id: result.vendor_id,
            status: 'active',
            created_by: result.created_by,
            created_at: result.created_at,
          };

          const applies = !coupon.store_id || get().items.some((i) => i.product.vendor_id === coupon.vendor_id);
          if (!applies) {
            return { success: false, message: 'Ce code promo ne concerne aucune boutique de votre panier.' };
          }

          set({ activeCoupon: coupon });
          return { success: true, message: `Code ${coupon.code} appliqué (-${coupon.discount_percent}%)!` };
        } catch (e: any) {
          return { success: false, message: e.message || 'Erreur lors de la validation du code.' };
        }
      },

      removeCoupon: () => set({ activeCoupon: null }),

      syncWithCatalog: (products, activeFlash) => {
        const byId = new Map(products.map((p) => [p.id, p]));
        let removed = 0;
        let changed = 0;

        const items = get().items.flatMap((item) => {
          const fresh = byId.get(item.product.id);
          if (!fresh || fresh.status !== 'active' || fresh.stock_count <= 0) {
            removed += 1;
            return [];
          }
          const flash = flashFromSale(activeFlash.get(fresh.id));
          const before = cartUnitPriceUsd(item);
          const next: CartItem = {
            ...item,
            product: fresh,
            flash,
            quantity: Math.min(item.quantity, fresh.stock_count),
          };
          if (cartUnitPriceUsd(next) !== before || next.quantity !== item.quantity) changed += 1;
          return [next];
        });

        set({ items });
        return { removed, changed };
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotalUsd: () => {
        return round2(get().items.reduce((sum, item) => sum + cartUnitPriceUsd(item) * item.quantity, 0));
      },

      getDeliveryFeeUsd: () => {
        const { deliveryType, deliveryZone, getSubtotalUsd } = get();
        if (deliveryType === 'In-Store Pickup') return 0;
        return deliveryFeeForZone(deliveryZone, getSubtotalUsd());
      },

      getPromoDiscountUsd: () => {
        const { activeCoupon, items } = get();
        if (!activeCoupon) return 0;

        // Même règle que le serveur : coupon boutique = articles de ce vendeur uniquement
        return round2(
          items
            .filter((item) => !activeCoupon.store_id || item.product.vendor_id === activeCoupon.vendor_id)
            .reduce(
              (sum, item) =>
                sum + round2(cartUnitPriceUsd(item) * item.quantity * (activeCoupon.discount_percent / 100)),
              0
            )
        );
      },

      getPointsUsed: () => {
        const { pointsToRedeem, getSubtotalUsd, getPromoDiscountUsd } = get();
        const remaining = Math.max(0, getSubtotalUsd() - getPromoDiscountUsd());
        return Math.min(pointsToRedeem, Math.floor(remaining / POINT_VALUE_USD));
      },

      getPointsDiscountUsd: () => {
        return round2(get().getPointsUsed() * POINT_VALUE_USD);
      },

      getTotalUsd: () => {
        const subtotal = get().getSubtotalUsd();
        const delivery = get().getDeliveryFeeUsd();
        const promo = get().getPromoDiscountUsd();
        const points = get().getPointsDiscountUsd();
        return Math.max(0, round2(subtotal + delivery - promo - points));
      },
    }),
    {
      name: 'zando-cart-storage',
      version: 2,
      partialize: (state) => ({
        items: state.items,
        activeCoupon: state.activeCoupon,
        pointsToRedeem: state.pointsToRedeem,
        deliveryType: state.deliveryType,
        deliveryZone: state.deliveryZone,
      }),
      // v1 : prix flash injectés dans product.price_usd, coupon sans vendor_id
      migrate: (persisted: any) => ({
        ...persisted,
        items: (persisted?.items || []).map((i: CartItem) => ({ ...i, flash: i.flash ?? null })),
        activeCoupon: null,
        deliveryZone: null,
      }),
    }
  )
);
