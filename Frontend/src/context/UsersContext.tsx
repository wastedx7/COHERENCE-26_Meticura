import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
    id: number;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: string;
    is_active: boolean;
    department_ids: number[] | null;
    created_at: string;
}

interface UsersContextType {
    users: User[];
    totalUsers: number;
    availableRoles: string[];
    isLoading: boolean;
    error: string | null;
    fetchUsers: (skip?: number, limit?: number) => Promise<void>;
    fetchAvailableRoles: () => Promise<void>;
    updateUserRole: (userId: number, role: string, departmentIds?: number[]) => Promise<void>;
    updateUserStatus: (userId: number, isActive: boolean) => Promise<void>;
    refreshUsers: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType>({} as UsersContextType);

export const UsersProvider = ({ children }: { children: ReactNode }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async (skip: number = 0, limit: number = 50) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/users?skip=${skip}&limit=${limit}`);
            if (response.data) {
                setUsers(response.data.users || []);
                setTotalUsers(response.data.total || 0);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to fetch users';
            setError(errorMsg);
            console.error('Fetch users error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableRoles = async () => {
        try {
            const response = await api.get('/users/roles/available');
            if (response.data?.roles) {
                setAvailableRoles(response.data.roles);
            }
        } catch (err: any) {
            console.error('Fetch roles error:', err);
        }
    };

    const updateUserRole = async (userId: number, role: string, departmentIds?: number[]) => {
        setError(null);
        try {
            const response = await api.put(`/users/${userId}/role`, {
                user_id: userId,
                role,
                department_ids: departmentIds || null
            });
            
            if (response.data) {
                // Update local user list
                setUsers(prevUsers => 
                    prevUsers.map(user => 
                        user.id === userId 
                            ? { ...user, role, department_ids: departmentIds || null }
                            : user
                    )
                );
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to update user role';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    };

    const updateUserStatus = async (userId: number, isActive: boolean) => {
        setError(null);
        try {
            const response = await api.put(`/users/${userId}/status`, {
                user_id: userId,
                is_active: isActive
            });
            
            if (response.data) {
                // Update local user list
                setUsers(prevUsers => 
                    prevUsers.map(user => 
                        user.id === userId 
                            ? { ...user, is_active: isActive }
                            : user
                    )
                );
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to update user status';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    };

    const refreshUsers = async () => {
        await fetchUsers();
    };

    return (
        <UsersContext.Provider
            value={{
                users,
                totalUsers,
                availableRoles,
                isLoading,
                error,
                fetchUsers,
                fetchAvailableRoles,
                updateUserRole,
                updateUserStatus,
                refreshUsers,
            }}
        >
            {children}
        </UsersContext.Provider>
    );
};

export const useUsers = () => {
    const context = useContext(UsersContext);
    if (!context) {
        throw new Error('useUsers must be used within a UsersProvider');
    }
    return context;
};
