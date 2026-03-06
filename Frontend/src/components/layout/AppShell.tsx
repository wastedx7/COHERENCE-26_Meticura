import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    BarChart3,
    AlertTriangle,
    TrendingDown,
    Activity,
    FileText,
    Network,
    Users,
    Settings,
    Database,
    ArrowRightLeft,
    LogOut,
    ChevronLeft,
    ChevronRight,
    User,
    ShieldAlert
} from 'lucide-react';

export default function AppShell() {
    const { role, user, logout } = useAuth();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // Define navigation based on role  
    const getNavLinks = () => {
        const base = [
            { name: 'Dashboard', path: '/dashboard', icon: <BarChart3 className="w-5 h-5" /> },
            { name: 'Budget', path: '/budget', icon: <Activity className="w-5 h-5" /> },
            { name: 'Anomalies', path: '/anomalies', icon: <AlertTriangle className="w-5 h-5" /> },
            { name: 'Lapse', path: '/lapse', icon: <TrendingDown className="w-5 h-5" /> },
            { name: 'Reallocation', path: '/reallocation', icon: <ArrowRightLeft className="w-5 h-5" /> },
            { name: 'Tree View', path: '/tree', icon: <Network className="w-5 h-5" /> },
            { name: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5" /> },
        ];

        // Admin has access to all features including user management
        if (role === 'admin') {
            return [
                ...base,
                { name: 'Users', path: '/users', icon: <Users className="w-5 h-5" /> },
                { name: 'Engine Monitor', path: '/engine', icon: <Settings className="w-5 h-5" /> },
                { name: 'My Models', path: '/my-models', icon: <Database className="w-5 h-5" /> },
            ];
        }

        // Manager has access to most features
        if (role === 'manager') {
            return [
                ...base,
                { name: 'Engine Monitor', path: '/engine', icon: <Settings className="w-5 h-5" /> },
            ];
        }

        // Analyst has access to analysis features
        if (role === 'analyst') {
            return base;
        }

        // Viewer has read-only access
        return base;
    };

    const links = getNavLinks();

    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
            {/* Sidebar - Glassy UI */}
            <aside
                className={`${isCollapsed ? 'w-20' : 'w-64'} glass-panel my-4 ml-4 flex flex-col transition-all duration-300 relative z-20`}
            >
                <div className="p-5 flex items-center justify-between border-b border-white/20">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 rounded-lg p-1.5 shadow-md">
                                <ShieldAlert className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-xl text-slate-800 tracking-tight">Meticura</span>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="mx-auto bg-indigo-600 rounded-lg p-1.5">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3 top-6 bg-white border border-slate-200 shadow-sm rounded-full p-1 text-slate-500 hover:text-indigo-600 transition-colors z-30"
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar flex flex-col gap-1.5">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-white shadow-sm border border-indigo-100 text-indigo-700 font-medium'
                                    : 'text-slate-600 hover:bg-white/50 hover:text-indigo-600'
                                }`
                            }
                            title={isCollapsed ? link.name : undefined}
                        >
                            <div className="flex-shrink-0">{link.icon}</div>
                            {!isCollapsed && <span>{link.name}</span>}
                        </NavLink>
                    ))}
                </div>

                {/* User Card */}
                <div className="p-4 border-t border-white/20">
                    <div className="flex items-center p-2 rounded-xl bg-white/40 border border-white/50 shadow-sm backdrop-blur-sm">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {user?.full_name?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />}
                        </div>
                        {!isCollapsed && (
                            <div className="ml-3 flex-1 overflow-hidden">
                                <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name || 'Admin User'}</p>
                                <p className="text-xs text-slate-500 capitalize">{role?.replace('_', ' ') || 'Viewer'}</p>
                            </div>
                        )}
                        {!isCollapsed && (
                            <button 
                                onClick={() => setShowLogoutConfirm(true)}
                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white/50"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    
                    {/* Logout Confirmation Modal */}
                    {showLogoutConfirm && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-lg max-w-sm p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Logout</h3>
                                <p className="text-slate-600 mb-6">Are you sure you want to logout?</p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 transition-all duration-300">
                {/* Top Navbar */}
                <header className="h-20 w-full flex items-center justify-between px-8 py-4">
                    <div className="flex items-center gap-4">
                        {/* Contextual title or breadcrumb could go here */}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="glass-card px-4 py-2 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-sm font-medium text-slate-700">System Healthy</span>
                        </div>
                        <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 cursor-pointer">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                    </div>
                </header>

                {/* Page Content Scrollable Area */}
                <div className="flex-1 overflow-auto p-8 custom-scrollbar relative">
                    {/* Animated Router Outlet */}
                    <div className="animate-fade-in w-full max-w-7xl mx-auto pb-12">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Static Background Gradients (if needed beyond body styles) */}
            <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-20%] left-[-10%] w-[40%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0"></div>
        </div>
    );
}
