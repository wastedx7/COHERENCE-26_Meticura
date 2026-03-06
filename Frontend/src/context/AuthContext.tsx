import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { AppRole, normalizeRole } from '../lib/permissions';

type AuthUser = {
  clerk_id?: string;
  email?: string;
  full_name?: string;
  role?: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: AppRole;
  user: AuthUser | null;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<AppRole>('citizen');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    void verifyToken();
  }, []);

  async function verifyToken() {
    try {
      await api.post('/api/auth/verify-token');
      const me = await api.get('/api/users/me');
      const meData = me.data?.user ?? me.data ?? {};
      setUser(meData);
      setRole(normalizeRole(meData.role));
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      setRole('citizen');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loginWithToken(token: string) {
    localStorage.setItem('auth_token', token);
    setIsLoading(true);
    await verifyToken();
  }

  function logout() {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setRole('citizen');
    setUser(null);
  }

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, role, user, loginWithToken, logout }),
    [isAuthenticated, isLoading, role, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
