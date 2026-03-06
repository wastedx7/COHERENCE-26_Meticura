import React, { createContext, useContext, useState, useEffect } from 'react';

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

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'meticura_token';

const getTokenHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Verify token on mount and restore session
    useEffect(() => {
        const verifyToken = async () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE}/users/me`, {
                    headers: getTokenHeaders(token),
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser({
                        id: userData.id,
                        email: userData.email,
                        full_name: userData.full_name,
                        phone: userData.phone,
                        role: userData.role,
                        is_active: userData.is_active,
                    });
                    setRole(userData.role as UserRole);
                    setError(null);
                } else {
                    // Token is invalid or expired
                    localStorage.removeItem(TOKEN_KEY);
                    setUser(null);
                    setRole(null);
                }
            } catch (error) {
                console.warn('Token verification failed:', error);
                localStorage.removeItem(TOKEN_KEY);
                setUser(null);
                setRole(null);
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
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
                setUser({
                    id: userData.id,
                    email: userData.email,
                    full_name: userData.full_name,
                    phone: userData.phone,
                    role: userData.role,
                    is_active: userData.is_active,
                });
                setRole(userData.role as UserRole);
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
            const response = await fetch(`${API_BASE}/auth/register`, {
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
