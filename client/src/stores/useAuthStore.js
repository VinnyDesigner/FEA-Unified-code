import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as queries from '../lib/queries';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      module: null,
      hydrated: false,

      login: async (module, email, password) => {
        const data = await queries.login({ module, body: { email, password } });
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          module,
        });
      },

      logout: () => set({ user: null, accessToken: null, refreshToken: null, module: null }),

      refresh: async () => {
        const { module, refreshToken } = get();
        if (!module || !refreshToken) return null;
        try {
          const data = await queries.refresh(module, refreshToken);
          set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
          return data.accessToken;
        } catch {
          return null;
        }
      },

      updateProfile: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
    }),
    {
      name: 'fea-auth',
      version: 3,
      migrate: (state, version) => (version < 3 ? {} : state),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
