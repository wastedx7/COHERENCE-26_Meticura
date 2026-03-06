import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'center_admin' | 'district_admin' | 'dept_admin' | 'citizen';

interface User {
    id: number;
    clerk_id: string;
    email: string;
    full_name: string;
    username?: string;
    image_url?: string;
    department_ids: number[];
}

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000/api';

const roleMap: Record<string, UserRole> = {
    center_admin: 'center_admin',
    district_admin: 'district_admin',
    dept_admin: 'dept_admin',
    citizen: 'citizen',
    admin: 'center_admin',
    manager: 'district_admin',
    analyst: 'dept_admin',
    viewer: 'citizen'
};

const normalizeRole = (role: string | null | undefined): UserRole => {
    if (!role) return 'citizen';
    return roleMap[role] || 'citizen';
};

const getTokenHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyInitial = async () => {
            try {
                const token = localStorage.getItem('meticura_token');
                if (token) {
                    const [authRes, userRes] = await Promise.all([
                        fetch(`${API_BASE}/auth/me`, { headers: getTokenHeaders(token) }),
                        fetch(`${API_BASE}/users/me`, { headers: getTokenHeaders(token) })
                    ]);

                    if (authRes.ok || userRes.ok) {
                        const authData = authRes.ok ? await authRes.json() : null;
                        const userData = userRes.ok ? await userRes.json() : null;

                        setUser({
                            id: userData?.id || 1,
                            clerk_id: userData?.clerk_id || authData?.clerk_id || 'user_local',
                            email: userData?.email || authData?.email || 'user@meticura.gov',
                            full_name: userData?.full_name || authData?.full_name || 'Meticura User',
                            username: userData?.username || authData?.username || 'user',
                            image_url: authData?.image_url,
                            department_ids: userData?.department_ids || []
                        });
                        setRole(normalizeRole(userData?.role));
                    } else {
                        // Fallback for local UI mode when backend auth is not configured.
                        setUser({
                            id: 1,
                            clerk_id: 'user_local',
                            email: 'admin@meticura.gov',
                            full_name: 'System Admin',
                            username: 'sysadmin',
                            department_ids: []
                        });
                        setRole('center_admin');
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        verifyInitial();
    }, []);

    const login = async (token: string) => {
        localStorage.setItem('meticura_token', token);
        setIsLoading(true);
        try {
            const [authRes, userRes] = await Promise.all([
                fetch(`${API_BASE}/auth/me`, { headers: getTokenHeaders(token) }),
                fetch(`${API_BASE}/users/me`, { headers: getTokenHeaders(token) })
            ]);

            if (!authRes.ok && !userRes.ok) {
                throw new Error('Unable to authenticate user from backend');
            }

            const authData = authRes.ok ? await authRes.json() : null;
            const userData = userRes.ok ? await userRes.json() : null;

            setUser({
                id: userData?.id || 1,
                clerk_id: userData?.clerk_id || authData?.clerk_id || 'user_local',
                email: userData?.email || authData?.email || 'user@meticura.gov',
                full_name: userData?.full_name || authData?.full_name || 'Meticura User',
                username: userData?.username || authData?.username || 'user',
                image_url: authData?.image_url,
                department_ids: userData?.department_ids || []
            });
            setRole(normalizeRole(userData?.role));
        } catch (err) {
            console.error(err);
            // Keep development experience usable if auth backend is unavailable.
            setUser({
                id: 1,
                clerk_id: 'user_local',
                email: 'admin@meticura.gov',
                full_name: 'System Admin',
                username: 'sysadmin',
                department_ids: []
            });
            setRole('center_admin');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('meticura_token');
        setUser(null);
        setRole(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, role, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
