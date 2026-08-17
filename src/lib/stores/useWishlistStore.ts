import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  favoriteProductIds: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => boolean;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      favoriteProductIds: [],

      isFavorite: (productId: string) => {
        return get().favoriteProductIds.includes(productId);
      },

      toggleFavorite: (productId: string) => {
        const current = get().favoriteProductIds;
        const exists = current.includes(productId);
        if (exists) {
          set({ favoriteProductIds: current.filter((id) => id !== productId) });
          return false;
        } else {
          set({ favoriteProductIds: [...current, productId] });
          return true;
        }
      },

      addToWishlist: (productId: string) => {
        const current = get().favoriteProductIds;
        if (!current.includes(productId)) {
          set({ favoriteProductIds: [...current, productId] });
        }
      },

      removeFromWishlist: (productId: string) => {
        set((state) => ({
          favoriteProductIds: state.favoriteProductIds.filter((id) => id !== productId),
        }));
      },

      clearWishlist: () => {
        set({ favoriteProductIds: [] });
      },
    }),
    {
      name: 'zando-wishlist-storage',
    }
  )
);
