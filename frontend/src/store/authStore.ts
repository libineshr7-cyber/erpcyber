import { create } from 'zustand';
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  requiresMfa: false,

  setUser: (user) => set({ user }),
  setRequiresMfa: (v) => set({ requiresMfa: v }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data as AuthUser, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed with local logout even if server call fails
    }
    set({ user: null });
    window.location.href = '/login';
  },
}));
