import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({ baseURL, timeout: 15000 });

let refreshInflight = null;

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().accessToken;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }

    const errorCode = err.response?.data?.error?.code;

    if (errorCode === 'TOKEN_EXPIRED') {
      original._retry = true;

      if (!refreshInflight) {
        refreshInflight = useAuthStore.getState().refresh().finally(() => {
          refreshInflight = null;
        });
      }

      const newToken = await refreshInflight;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      const mod = useAuthStore.getState().module;
      useAuthStore.getState().logout();
      window.location.assign(mod === 'AQMS' ? '/AQMS/login' : '/MWQ/signin');
      return Promise.reject(err);
    }

    const mod = useAuthStore.getState().module;
    useAuthStore.getState().logout();
    window.location.assign(mod === 'AQMS' ? '/AQMS/login' : '/MWQ/signin');
    return Promise.reject(err);
  }
);

export default api;
