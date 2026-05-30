import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export default function RequireRole({ roles, children }) {
  const user = useAuthStore((s) => s.user);
  const access = useAuthStore((s) => s.access);
  const module = useAuthStore((s) => s.module);

  // Authorization now comes from RBAC grants (access[]). A user passes if they
  // hold an ACTIVE grant whose role is in `roles` (ADMIN spans every app).
  // Falls back to the legacy user.role claim for older persisted sessions.
  const grants = Array.isArray(access) ? access : [];
  const hasGrantRole = grants.some((g) => g.status === 'ACTIVE' && roles.includes(g.role));
  const allowed = hasGrantRole || (user && roles.includes(user.role));

  if (!allowed) {
    const dashboard = module === 'AQMS' ? '/AQMS/live-data' : '/MWQ/dashboard';
    return <Navigate to={dashboard} replace />;
  }

  return children;
}
