import React, { createContext, useContext, useState, useEffect } from 'react';
import { buildApiUrl } from '../lib/apiConfig';

type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';

interface User {
    id: number;
    email: string;
    full_name: string;
    phone?: string;
    role: UserRole;
    is_active: boolean;
}

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
    logout: () => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const TOKEN_KEY = 'meticura_token';
const USER_KEY = 'meticura_user';

const getTokenHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
});

const parseStoredUser = (): User | null => {
    try {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
};

const deriveUserFromToken = (token: string): User | null => {
    try {
        const payloadPart = token.split('.')[1];
        if (!payloadPart) return null;
        const json = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(json);
        return {
            id: Number(payload.sub || 0),
            email: payload.email || '',
            full_name: payload.email || 'User',
            role: (payload.role || 'viewer') as UserRole,
            is_active: true,
        };
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Verify token on mount and restore session
    useEffect(() => {
        const verifyToken = async () => {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), 5000);
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                // Restore cached user immediately so refresh does not block app rendering.
                const storedUser = parseStoredUser() || deriveUserFromToken(token);
                if (storedUser) {
                    setUser(storedUser);
                    setRole(storedUser.role);
                    setIsLoading(false);
                }

                const response = await fetch(buildApiUrl('/users/me'), {
                    headers: getTokenHeaders(token),
                    mode: 'cors',
                    signal: controller.signal,
                });

                if (response.ok) {
                    const userData = await response.json();
                    const normalizedUser = {
                        id: userData.id,
                        email: userData.email,
                        full_name: userData.full_name,
                        phone: userData.phone,
                        role: userData.role,
                        is_active: userData.is_active,
                    };
                    setUser(normalizedUser);
                    setRole(userData.role as UserRole);
                    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
                    setError(null);
                } else if (response.status === 401) {
                    // Token is invalid or expired
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
                    setUser(null);
                    setRole(null);
                }
            } catch (error) {
                // Network/transient failures should not force logout on refresh.
                console.warn('Token verification warning:', error);
            } finally {
                window.clearTimeout(timeoutId);
                setIsLoading(false);
            }
        };

        verifyToken();
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        setError(null);
        try {
            const response = await fetch(buildApiUrl('/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMsg = errorData.detail || 'Login failed';
                setError(errorMsg);
                throw new Error(errorMsg);
            }

            const data = await response.json();
            const token = data.access_token;

            // Store token
            localStorage.setItem(TOKEN_KEY, token);

            // Set user data
            if (data.user) {
                const userData = data.user;
                const normalizedUser = {
                    id: userData.id,
                    email: userData.email,
                    full_name: userData.full_name,
                    phone: userData.phone,
                    role: userData.role,
                    is_active: userData.is_active,
                };
                setUser(normalizedUser);
                setRole(userData.role as UserRole);
                localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
            }
        } catch (error: any) {
            const errorMsg = error.message || 'Login failed';
            setError(errorMsg);
            throw error;
        }
    };

    const register = async (
        email: string,
        password: string,
        fullName: string,
        phone?: string
    ): Promise<void> => {
        setError(null);
        try {
            const response = await fetch(buildApiUrl('/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName,
                    phone: phone || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMsg = errorData.detail || 'Registration failed';
                setError(errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            const errorMsg = error.message || 'Registration failed';
            setError(errorMsg);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setRole(null);
        setError(null);
        // Redirect happens in component that calls logout
    };

    return (
        <AuthContext.Provider 
            value={{
                user,
                role,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                error
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
