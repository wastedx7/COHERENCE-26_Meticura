import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiClient } from '../lib/api-client';

export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';

interface UserContextType {
  role: UserRole | null;
  departmentIds: number[] | null;
  isLoading: boolean;
  error: string | null;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canApproveReallocation: boolean;
  canReviewAnomalies: boolean;
  canEditBudget: boolean;
  hasPermission: (permission: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [departmentIds, setDepartmentIds] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isLoaded || !isSignedIn) {
        setRole(null);
        setDepartmentIds(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get('/users/me');
        const { role: userRole, department_ids } = response.data;
        setRole(userRole as UserRole);
        setDepartmentIds(department_ids || null);
      } catch (err) {
        console.error('[UserContext] Failed to fetch user role:', err);
        setError('Failed to fetch user information');
        // Default to viewer role on error
        setRole('viewer');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [isSignedIn, isLoaded]);

  // Permission helper functions
  const permissionMap: Record<string, UserRole[]> = {
    'manage:users': ['admin'],
    'manage:roles': ['admin'],
    'view:budget': ['admin', 'manager', 'analyst', 'viewer'],
    'edit:budget': ['admin', 'manager'],
    'approve:reallocation': ['admin', 'manager'],
    'view:anomalies': ['admin', 'manager', 'analyst', 'viewer'],
    'review:anomalies': ['admin', 'manager', 'analyst'],
    'resolve:anomalies': ['admin', 'manager'],
    'view:reports': ['admin', 'manager', 'analyst', 'viewer'],
    'generate:reports': ['admin', 'manager', 'analyst'],
    'export:data': ['admin', 'manager', 'analyst'],
    'view:logs': ['admin'],
    'manage:settings': ['admin'],
  };

  const hasPermission = (permission: string): boolean => {
    if (!role) return false;
    const allowedRoles = permissionMap[permission] || [];
    return allowedRoles.includes(role);
  };

  const value: UserContextType = {
    role,
    departmentIds,
    isLoading,
    error,
    canManageUsers: hasPermission('manage:users'),
    canManageRoles: hasPermission('manage:roles'),
    canApproveReallocation: hasPermission('approve:reallocation'),
    canReviewAnomalies: hasPermission('review:anomalies'),
    canEditBudget: hasPermission('edit:budget'),
    hasPermission,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
