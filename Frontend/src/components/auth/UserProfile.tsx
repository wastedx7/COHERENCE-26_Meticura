import React from 'react';
import { useUser } from '../../providers/UserProvider';
import { useAuth } from '@clerk/clerk-react';

/**
 * Component that displays current user information including role
 * 
 * Can be used in header/sidebar to show user profile
 */
export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { role, isLoading } = useUser();

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="flex items-center gap-4">
      {user?.imageUrl && (
        <img
          src={user.imageUrl}
          alt={user.firstName || 'User'}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div>
        <p className="text-sm font-medium text-gray-900">
          {user?.firstName || 'User'}
        </p>
        {role && (
          <p className="text-xs text-gray-500 capitalize">
            {role === 'viewer' ? 'Viewer' : role === 'analyst' ? 'Analyst' : role === 'manager' ? 'Manager' : 'Administrator'}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Component that displays a role badge
 * 
 * Usage: <RoleBadge />
 */
export const RoleBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { role, isLoading } = useUser();

  if (isLoading || !role) {
    return null;
  }

  const roleColors: Record<string, { bg: string; text: string; label: string }> = {
    admin: { bg: 'bg-red-100', text: 'text-red-800', label: 'Administrator' },
    manager: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Manager' },
    analyst: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Analyst' },
    viewer: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Viewer' },
  };

  const colors = roleColors[role] || roleColors.viewer;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${className}`}>
      {colors.label}
    </span>
  );
};
