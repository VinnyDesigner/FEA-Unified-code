import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export default function AuthGate({ children, fallback = null }) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const module = useAuthStore((s) => s.module);

  if (!hydrated) return fallback;

  if (!accessToken) {
    let redirectPath = '/MWQ/signin';
    if (module === 'AQMS') {
      redirectPath = '/AQMS/login';
    } else if (!module) {
      const path = window.location.pathname;
      if (path.startsWith('/AQMS')) redirectPath = '/AQMS/login';
    }
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
