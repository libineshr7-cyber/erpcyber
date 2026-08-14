import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../api/client';

export interface AuthUser {
  userId: string;
  username: string;
  role: 'HOD' | 'SUPER_ADMIN' | 'STAFF' | 'STUDENT';
  mfaEnabled?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  requiresMfa: boolean;
  setUser: (user: AuthUser | null) => void;
  setRequiresMfa: (v: boolean) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      requiresMfa: false,

      setUser: (user) => set({ user }),
      setRequiresMfa: (v) => set({ requiresMfa: v }),

      checkAuth: async () => {
        try {
          const { data } = await api.get('/auth/me');
          if (data?.data) {
            set({ user: data.data as AuthUser });
          }
        } catch {
          // Maintain active persisted user on refresh if server is waking up
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {}
        set({ user: null, requiresMfa: false });
        sessionStorage.clear();
      },
    }),
    {
      name: 'erp-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
