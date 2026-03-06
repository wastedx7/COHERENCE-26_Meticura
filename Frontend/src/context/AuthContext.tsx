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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyInitial = async () => {
            try {
                const token = localStorage.getItem('meticura_token');
                if (token) {
                    // Simulate API call GET /api/auth/me
                    // Hardcoding a center admin user since we are not running a server but need to view all UI
                    setUser({
                        id: 1,
                        clerk_id: 'user_xyz123',
                        email: 'admin@meticura.gov',
                        full_name: 'System Admin',
                        username: 'sysadmin',
                        department_ids: [] // center admin has access to all
                    });
                    setRole('center_admin');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        // Auto-login for UI viewing purposes based on prompt constraints
        localStorage.setItem('meticura_token', 'dummy_token');
        verifyInitial();
    }, []);

    const login = async (token: string) => {
        // API logic to verify token
        localStorage.setItem('meticura_token', token);
        setUser({
            id: 1,
            clerk_id: 'user_xyz123',
            email: 'admin@meticura.gov',
            full_name: 'System Admin',
            username: 'sysadmin',
            department_ids: []
        });
        setRole('center_admin');
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
