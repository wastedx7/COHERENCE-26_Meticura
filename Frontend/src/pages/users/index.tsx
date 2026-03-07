import React, { useEffect, useState } from 'react';
import { Users, Shield, UserCheck, MoreVertical, Edit2, Power, AlertCircle, Loader2 } from 'lucide-react';
import { useUsers } from '../../context/UsersContext';

export default function UsersPage() {
    const { 
        users, 
        totalUsers, 
        availableRoles, 
        isLoading, 
        error, 
        fetchUsers, 
        fetchAvailableRoles,
        updateUserRole,
        updateUserStatus 
    } = useUsers();

    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [statusLoading, setStatusLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchAvailableRoles();
    }, []);

    const handleEditRole = (userId: number, currentRole: string) => {
        setEditingUserId(userId);
        setSelectedRole(currentRole);
    };

    const handleSaveRole = async (userId: number) => {
        try {
            await updateUserRole(userId, selectedRole);
            setEditingUserId(null);
            setSelectedRole('');
        } catch (err) {
            console.error('Failed to update role:', err);
        }
    };

    const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
        setStatusLoading(userId);
        try {
            await updateUserStatus(userId, !currentStatus);
        } catch (err) {
            console.error('Failed to toggle status:', err);
        } finally {
            setStatusLoading(null);
        }
    };

    const activeUsers = users.filter(u => u.is_active).length;
    const rolesCount = availableRoles.length;

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Access Control</h1>
                    <p className="text-slate-500 mt-1">Manage RBAC across the coherent infrastructure</p>
                </div>
                <button 
                    onClick={() => fetchUsers()}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Loading...' : 'Refresh Users'}
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="glass-panel p-6 flex flex-col text-center items-center justify-center bg-indigo-50/50">
                    <Shield className="w-8 h-8 text-indigo-500 mb-2" />
                    <h3 className="text-2xl font-bold text-slate-800">{rolesCount}</h3>
                    <p className="text-sm text-slate-500 font-medium">Distinct Roles</p>
                </div>
                <div className="glass-panel p-6 flex flex-col text-center items-center justify-center">
                    <Users className="w-8 h-8 text-blue-500 mb-2" />
                    <h3 className="text-2xl font-bold text-slate-800">{totalUsers}</h3>
                    <p className="text-sm text-slate-500 font-medium">Total Registered Users</p>
                </div>
                <div className="glass-panel p-6 flex flex-col text-center items-center justify-center">
                    <UserCheck className="w-8 h-8 text-emerald-500 mb-2" />
                    <h3 className="text-2xl font-bold text-slate-800">{activeUsers}</h3>
                    <p className="text-sm text-slate-500 font-medium">Active Accounts</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                {isLoading && users.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                        <p className="text-slate-500">Loading users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 text-slate-300 mb-2" />
                        <p className="text-slate-500">No users found</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">User Details</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Assigned Role</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{user.full_name || 'N/A'}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingUserId === user.id ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={selectedRole}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="px-2 py-1 border border-slate-300 rounded text-xs font-medium"
                                                >
                                                    {availableRoles.map((role) => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => handleSaveRole(user.id)}
                                                    className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingUserId(null)}
                                                    className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase
                                                    ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 
                                                      user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                                                      user.role === 'analyst' ? 'bg-emerald-100 text-emerald-700' :
                                                      'bg-slate-100 text-slate-600'}
                                                `}>
                                                    {user.role}
                                                </span>
                                                <button
                                                    onClick={() => handleEditRole(user.id, user.role)}
                                                    className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                                    title="Edit role"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            <span className="text-slate-600 font-medium">{user.is_active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                                            disabled={statusLoading === user.id}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors disabled:opacity-50"
                                            title={user.is_active ? 'Deactivate user' : 'Activate user'}
                                        >
                                            {statusLoading === user.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Power className="w-4 h-4" />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
