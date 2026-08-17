import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types/schema';
import { supabase } from '@/lib/supabase/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  fetchProfile: (userId: string) => Promise<User | null>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      fetchProfile: async (userId: string) => {
        try {
          const { data, error } = await (supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle() as any);

          if (error || !data) return null;

          const profileUser: User = {
            id: data.id,
            email: data.email,
            phone: data.phone,
            role: data.role as UserRole,
            physical_address: data.physical_address,
            full_name: data.full_name || '',
            gender_preference: (data.gender_preference || 'all') as 'women' | 'men' | 'all',
            points_balance: data.points_balance || 0,
            saved_coupons_count: data.saved_coupons_count || 0,
            status: data.status || 'active',
            preferred_currency: (data.preferred_currency || 'USD') as 'USD' | 'CDF',
          };

          set({ user: profileUser, isLoading: false });
          return profileUser;
        } catch (e) {
          console.error('[AuthStore] Error fetching profile:', e);
          set({ isLoading: false });
          return null;
        }
      },
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, isLoading: false });
      },
    }),
    {
      name: 'zando-auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
