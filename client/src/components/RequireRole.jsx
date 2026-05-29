import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export default function RequireRole({ roles, children }) {
  const user = useAuthStore((s) => s.user);
  const module = useAuthStore((s) => s.module);

  if (!user || !roles.includes(user.role)) {
    const dashboard = module === 'AQMS' ? '/AQMS/live-data' : '/MWQ/dashboard';
    return <Navigate to={dashboard} replace />;
  }

  return children;
}
