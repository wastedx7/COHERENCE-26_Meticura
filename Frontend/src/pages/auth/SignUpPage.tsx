import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { buildApiUrl } from '../../lib/apiConfig';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone && !/^[\d\s\-\+\(\)]{7,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field as user is typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({ submit: undefined });

    try {
      const response = await fetch(buildApiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          phone: formData.phone || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      // Show success message
      setSuccess(true);
      
      // Redirect to login after successful registration
      setTimeout(() => {
        navigate('/login', { replace: true, state: { from: 'signup' } });
      }, 2000);
    } catch (err: any) {
      setErrors({
        submit: err.message || 'Registration failed. Please try again.'
      });
      console.error('Signup error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen bg-slate-50 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Created!</h2>
          <p className="text-slate-600 mb-4">Redirecting to login...</p>
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
            <h2 className="mt-6 text-2xl font-bold text-slate-900">Create your account</h2>
          </div>

          <div className="bg-white shadow-xl rounded-2xl py-8 px-6 border border-slate-200">
            {errors.submit && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Registration Failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{errors.submit}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-slate-800 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none disabled:bg-slate-50 transition-colors text-slate-900 placeholder-slate-400 ${
                      errors.fullName
                        ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30'
                        : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/30'
                    }`}
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-700 font-medium mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none disabled:bg-slate-50 transition-colors text-slate-900 placeholder-slate-400 ${
                      errors.email
                        ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30'
                        : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/30'
                    }`}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-700 font-medium mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-800 mb-2">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    disabled={isSubmitting}
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none disabled:bg-slate-50 transition-colors text-slate-900 placeholder-slate-400 ${
                      errors.phone
                        ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30'
                        : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/30'
                    }`}
                    placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-700 font-medium mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={isSubmitting}
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none disabled:bg-slate-50 transition-colors text-slate-900 placeholder-slate-400 ${
                      errors.password
                        ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30'
                        : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/30'
                    }`}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-700 font-medium mt-1">{errors.password}</p>
                )}
                <p className="text-xs text-slate-600 mt-1">Must contain at least 8 characters, one uppercase letter, and one number</p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-800 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    disabled={isSubmitting}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none disabled:bg-slate-50 transition-colors text-slate-900 placeholder-slate-400 ${
                      errors.confirmPassword
                        ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/30'
                        : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/30'
                    }`}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-700 font-medium mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 mt-6 shadow-md"
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-300">
              <p className="text-center text-sm text-slate-700">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
