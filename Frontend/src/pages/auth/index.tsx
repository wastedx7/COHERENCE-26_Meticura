import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
    const { login, isLoading } = useAuth();

    if (isLoading) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[100px] rounded-full"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 animate-fade-in">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">Sign in to your account</h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 animate-slide-up">
                <div className="glass-panel py-8 px-4 sm:px-10 flex flex-col items-center">
                    <p className="text-sm text-slate-600 mb-6 font-medium text-center">Simulated Google Login via Clerk</p>
                    <button
                        onClick={() => login('demo-token')}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
}
