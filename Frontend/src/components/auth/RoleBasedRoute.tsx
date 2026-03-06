import React from 'react';
import { useUser, UserRole } from '../providers/UserProvider';
import { Navigate } from 'react-router-dom';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders based on user role
 * 
 * Usage:
 * <RoleBasedRoute allowedRoles={['admin', 'manager']}>
 *   <AdminPanel />
 * </RoleBasedRoute>
 */
export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { role, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Navigate to="/dashboard/overview" replace />
    );
  }

  return <>{children}</>;
};
