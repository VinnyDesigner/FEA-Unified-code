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
      access: [],
      perms: [],
      hydrated: false,

      // `module` is the UI/data-routing context (which app's screens are shown);
      // it is NOT sent to the auth endpoint. Authorization comes from access/perms.
      login: async (module, email, password) => {
        const data = await queries.login({ body: { email, password } });
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          access: data.access || [],
          perms: data.perms || [],
          module,
        });
      },

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, access: [], perms: [], module: null }),

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return null;
        try {
          const data = await queries.refresh(refreshToken);
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            ...(data.access ? { access: data.access } : {}),
            ...(data.perms ? { perms: data.perms } : {}),
          });
          return data.accessToken;
        } catch {
          return null;
        }
      },

      updateProfile: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
    }),
    {
      name: 'fea-auth',
      version: 4,
      migrate: (state, version) => (version < 4 ? {} : state),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
