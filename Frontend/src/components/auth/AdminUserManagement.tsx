import React, { useEffect, useState } from 'react';
import { useUser } from '../../providers/UserProvider';
import { apiClient } from '../../lib/api-client';
import toast from 'react-hot-toast';

interface User {
  id: number;
  clerk_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  department_ids: number[] | null;
}

/**
 * Admin panel for managing users and roles
 * Only accessible to users with admin role
 */
export const AdminUserManagement: React.FC = () => {
  const { canManageUsers, canManageRoles } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('viewer');
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !canManageRoles) {
      toast.error('Permission denied');
      return;
    }

    try {
      const response = await apiClient.put(`/users/${selectedUser.id}/role`, {
        role: newRole,
      });
      
      setUsers(users.map(u => (u.id === selectedUser.id ? response.data : u)));
      setShowRoleModal(false);
      setSelectedUser(null);
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error('Failed to update user role');
      console.error('Error updating role:', error);
    }
  };

  const handleStatusChange = async (userId: number, isActive: boolean) => {
    if (!canManageUsers) {
      toast.error('Permission denied');
      return;
    }

    try {
      const response = await apiClient.put(`/users/${userId}/status`, {
        is_active: !isActive,
      });
      
      setUsers(users.map(u => (u.id === userId ? response.data : u)));
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update user status');
      console.error('Error updating status:', error);
    }
  };

  if (!canManageUsers) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">You don't have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.full_name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="capitalize px-2 py-1 bg-gray-200 rounded text-gray-800 text-xs font-medium">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {canManageRoles && (
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(user.role);
                        setShowRoleModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Change Role
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange(user.id, user.is_active)}
                    className={`font-medium ${
                      user.is_active
                        ? 'text-red-600 hover:text-red-900'
                        : 'text-green-600 hover:text-green-900'
                    }`}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Change Role for {selectedUser.full_name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Role
              </label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
