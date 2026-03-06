import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Load super admin credentials from env
  const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@meticura.gov';
  const superAdminPassword = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || '';

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      // Navigation is handled in AuthContext after successful login
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-fill with super admin credentials button (for dev/demo)
  const handleUseSuperAdmin = () => {
    setEmail(superAdminEmail);
    setPassword(superAdminPassword);
    setError('');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-pulse flex space-x-4 justify-center mb-4">
            <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[100px] rounded-full" />

      <div className="relative z-10 flex min-h-screen items-center justify-center py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-slate-900">Meticura</h1>
            <p className="mt-2 text-sm text-slate-600">Budget Watchdog Platform</p>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">Sign in to your account</h2>
          </div>

          <div className="bg-white shadow-xl rounded-2xl py-8 px-6 border border-slate-200">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Login Failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-50 text-slate-900 placeholder-slate-400"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-50 text-slate-900 placeholder-slate-400"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 shadow-md"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {/* Demo Super Admin Button */}
              <button
                type="button"
                onClick={handleUseSuperAdmin}
                disabled={isSubmitting}
                className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-900 font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors duration-200 border border-slate-300"
              >
                Use Demo Super Admin
              </button>

              <div className="pt-3 border-t border-slate-300">
                <p className="text-center text-sm text-slate-700">
                  Don't have an account?{' '}
                  <Link to="/sign-up" className="font-semibold text-indigo-600 hover:text-indigo-700">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-300 rounded-lg text-sm text-blue-900 shadow-md">
            <p className="font-semibold mb-2">Demo Mode Enabled</p>
            <p>Click "Use Demo Super Admin" to login with pre-configured super admin credentials.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
