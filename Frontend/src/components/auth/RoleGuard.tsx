import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppRole, canAccess } from '../../lib/permissions';

export function RoleGuard({ roles }: { roles: AppRole[] }) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) return <div className="p-6 text-sm text-zinc-300">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!canAccess(roles, role)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
