import { create } from 'zustand';
import axios from 'axios';
import { devtools } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  company_ids: string[]
  sys_admin: boolean;
  provider: string;
  provider_id: string;
  picture?: string;
  created_at: string;
  last_login: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (provider: 'google' | 'microsoft') => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setToken: (token: string) => void;
  fetchAllUsers: () => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
const IS_PRODUCTION = import.meta.env.VITE_IN_PRODUCTION === 'true';

export const useAuthStore = create<AuthState>()(
  devtools((set, get) => ({
    user: null,
    token: IS_PRODUCTION ? (localStorage.getItem('auth_token') || null) : null,
    isLoading: false,
    error: null,

    login: (provider) => {
      if (!IS_PRODUCTION) {
        window.location.href = '/';
        return;
      }

      window.location.href = `${API_BASE}/auth/${provider}/login`;
    },

    logout: () => {
      if (IS_PRODUCTION) {
        localStorage.removeItem('auth_token');
      }
      set({ user: null, token: null, error: null });
    },

    checkAuth: async () => {
      if (!IS_PRODUCTION) {
        return;
      }

      const token = get().token;
      if (!token) return;

      set({ isLoading: true, error: null });
      try {
        const response = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        set({ user: response.data, isLoading: false });
      } catch (error) {
        console.error('[AuthStore] Auth check failed:', error);
        get().logout();
        set({ isLoading: false, error: 'Authentication failed' });
      }
    },

    setToken: (token: string) => {
      if (IS_PRODUCTION) {
        localStorage.setItem('auth_token', token);
      }
      set({ token });
      if (IS_PRODUCTION) {
        get().checkAuth();
      }
    }
  }), {
    name: 'AuthStore',
  })
);
