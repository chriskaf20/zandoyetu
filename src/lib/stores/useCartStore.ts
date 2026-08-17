import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types/cart';
import { Product, Coupon } from '@/types/schema';
import { supabase } from '@/lib/supabase/client';

interface CartState {
  items: CartItem[];
  activeCoupon: Coupon | null;
  pointsToRedeem: number;
  deliveryType: 'Cash on Delivery' | 'In-Store Pickup';
  isCartDrawerOpen: boolean;
  setCartDrawerOpen: (isOpen: boolean) => void;
  addItem: (product: Product, size?: string, color?: string, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryType: (type: 'Cash on Delivery' | 'In-Store Pickup') => void;
  setPointsToRedeem: (points: number) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  getItemCount: () => number;
  getSubtotalUsd: () => number;
  getDeliveryFeeUsd: () => number;
  getPromoDiscountUsd: () => number;
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
      isCartDrawerOpen: false,

      setCartDrawerOpen: (isCartDrawerOpen) => set({ isCartDrawerOpen }),

      addItem: (product, size, color, quantity = 1) => {
        set((state) => {
          const selectedSize = size || (product.sizes_json ? JSON.parse(product.sizes_json)[0] : 'Unique');
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
              quantity: updated[existingIndex].quantity + quantity,
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

      setPointsToRedeem: (pointsToRedeem) => set({ pointsToRedeem }),

      applyCoupon: async (code) => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) {
          return { success: false, message: 'Veuillez saisir un code.' };
        }

        try {
          const { data, error } = await (supabase
            .from('coupons')
            .select('*')
            .eq('code', trimmed)
            .eq('status', 'active')
            .maybeSingle() as any);

          if (error || !data) {
            return { success: false, message: 'Code promo invalide ou expiré.' };
          }

          const coupon: Coupon = {
            id: data.id,
            code: data.code,
            discount_percent: data.discount_percent,
            store_id: data.store_id,
            status: data.status as 'active',
            created_by: data.created_by,
            created_at: data.created_at,
          };

          set({ activeCoupon: coupon });
          return { success: true, message: `Code ${coupon.code} appliqué (-${coupon.discount_percent}%)!` };
        } catch (e: any) {
          return { success: false, message: e.message || 'Erreur lors de la validation du code.' };
        }
      },

      removeCoupon: () => set({ activeCoupon: null }),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotalUsd: () => {
        return get().items.reduce((sum, item) => sum + item.product.price_usd * item.quantity, 0);
      },

      getDeliveryFeeUsd: () => {
        const { deliveryType, getSubtotalUsd } = get();
        if (deliveryType === 'In-Store Pickup') return 0;
        return getSubtotalUsd() >= 50 ? 0 : 5.0;
      },

      getPromoDiscountUsd: () => {
        const { activeCoupon, items } = get();
        if (!activeCoupon) return 0;

        let applicableSubtotal = 0;
        items.forEach((item) => {
          applicableSubtotal += item.product.price_usd * item.quantity;
        });

        return Math.round(applicableSubtotal * (activeCoupon.discount_percent / 100) * 100) / 100;
      },

      getPointsDiscountUsd: () => {
        const { pointsToRedeem } = get();
        return Math.round(pointsToRedeem * 0.20 * 100) / 100;
      },

      getTotalUsd: () => {
        const subtotal = get().getSubtotalUsd();
        const delivery = get().getDeliveryFeeUsd();
        const promo = get().getPromoDiscountUsd();
        const points = get().getPointsDiscountUsd();
        return Math.max(0, Math.round((subtotal + delivery - promo - points) * 100) / 100);
      },
    }),
    {
      name: 'zando-cart-storage',
    }
  )
);
