import React, { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
    ShieldAlert,
    Sparkles
} from 'lucide-react';

type NavSection = { label: string; links: { name: string; path: string; icon: React.ReactNode }[] };

export default function AppShell() {
    const { role, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

    const sections: NavSection[] = useMemo(() => {
        const core = {
            label: 'Core',
            links: [
                { name: 'Dashboard', path: '/dashboard', icon: <BarChart3 className="w-5 h-5" /> },
                { name: 'Budget', path: '/budget', icon: <Activity className="w-5 h-5" /> },
                { name: 'Anomalies', path: '/anomalies', icon: <AlertTriangle className="w-5 h-5" /> },
                { name: 'Lapse Risk', path: '/lapse', icon: <TrendingDown className="w-5 h-5" /> },
                { name: 'Tree View', path: '/tree', icon: <Network className="w-5 h-5" /> },
            ],
        };

        if (role === 'admin') {
            return [
                core,
                {
                    label: 'Management',
                    links: [
                        { name: 'Reallocation', path: '/reallocation', icon: <ArrowRightLeft className="w-5 h-5" /> },
                        { name: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5" /> },
                        { name: 'Users', path: '/users', icon: <Users className="w-5 h-5" /> },
                        { name: 'Transactions', path: '/transactions', icon: <FileText className="w-5 h-5" /> },
                    ],
                },
                {
                    label: 'System',
                    links: [
                        { name: 'Engine', path: '/engine', icon: <Settings className="w-5 h-5" /> },
                        { name: 'My Models', path: '/my-models', icon: <Database className="w-5 h-5" /> },
                    ],
                },
            ];
        }

        if (role === 'manager') {
            return [
                core,
                {
                    label: 'Management',
                    links: [
                        { name: 'Reallocation', path: '/reallocation', icon: <ArrowRightLeft className="w-5 h-5" /> },
                        { name: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5" /> },
                        { name: 'Transactions', path: '/transactions', icon: <FileText className="w-5 h-5" /> },
                        { name: 'My Models', path: '/my-models', icon: <Database className="w-5 h-5" /> },
                    ],
                },
            ];
        }

        if (role === 'analyst') {
            return [
                core,
                {
                    label: 'Tools',
                    links: [
                        { name: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5" /> },
                        { name: 'My Models', path: '/my-models', icon: <Database className="w-5 h-5" /> },
                    ],
                },
            ];
        }

        return [core];
    }, [role]);

    // Current page title for breadcrumb
    const pageTitle = useMemo(() => {
        for (const section of sections) {
            const match = section.links.find(l => location.pathname.startsWith(l.path));
            if (match) return match.name;
        }
        return '';
    }, [location.pathname, sections]);

    const ROLE_COLORS: Record<string, string> = {
        admin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        manager: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        analyst: 'bg-amber-100 text-amber-700 border-amber-200',
        viewer: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} glass-panel my-4 ml-4 flex flex-col transition-all duration-300 relative z-20`}>
                {/* Brand */}
                <div className="p-5 flex items-center justify-between border-b border-white/20 relative">
                    {!isCollapsed ? (
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-2 shadow-lg shadow-indigo-500/25">
                                <ShieldAlert className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="font-black text-lg text-slate-800 tracking-tight block leading-none">Meticura</span>
                                <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Budget Guard</span>
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-2 shadow-lg shadow-indigo-500/25">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3 top-6 bg-white border border-slate-200 shadow-md rounded-full p-1 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all z-30"
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar flex flex-col">
                    {sections.map((section, si) => (
                        <div key={section.label} className={si > 0 ? 'mt-2' : ''}>
                            {!isCollapsed && (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-2 select-none">
                                    {section.label}
                                </p>
                            )}
                            {isCollapsed && si > 0 && (
                                <div className="my-2 mx-3 border-t border-slate-200/60" />
                            )}
                            <div className="flex flex-col gap-0.5">
                                {section.links.map((link) => (
                                    <NavLink
                                        key={link.path}
                                        to={link.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive
                                                ? 'bg-gradient-to-r from-indigo-50 to-white shadow-sm border border-indigo-100/80 text-indigo-700 font-semibold'
                                                : 'text-slate-500 hover:bg-white/60 hover:text-indigo-600 hover:shadow-sm'
                                            }`
                                        }
                                        title={isCollapsed ? link.name : undefined}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r-full" />
                                                )}
                                                <div className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                                                    {link.icon}
                                                </div>
                                                {!isCollapsed && (
                                                    <span className="text-sm">{link.name}</span>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* User Card */}
                <div className="p-3 border-t border-white/20">
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''} p-2.5 rounded-xl bg-gradient-to-r from-white/60 to-white/30 border border-white/50 shadow-sm backdrop-blur-sm`}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md shadow-indigo-500/20">
                            {user?.full_name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                        {!isCollapsed && (
                            <div className="ml-3 flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate leading-tight">{user?.full_name || 'Admin User'}</p>
                                <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${ROLE_COLORS[role || 'viewer']}`}>
                                    {role || 'viewer'}
                                </span>
                            </div>
                        )}
                        {!isCollapsed && (
                            <button 
                                onClick={() => setShowLogoutConfirm(true)}
                                className="p-1.5 text-slate-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Logout Modal */}
                    {showLogoutConfirm && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                                    <LogOut className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 text-center mb-1">Sign Out?</h3>
                                <p className="text-slate-500 text-center text-sm mb-6">You'll need to sign in again to access the dashboard.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-medium hover:from-red-700 hover:to-red-600 transition-all shadow-md shadow-red-500/25"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 transition-all duration-300">
                {/* Top Bar */}
                <header className="h-16 w-full flex items-center justify-between px-8 border-b border-slate-100/80">
                    <div className="flex items-center gap-3">
                        {pageTitle && (
                            <>
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-bold text-slate-800">{pageTitle}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="glass-card px-3.5 py-1.5 flex items-center gap-2 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold text-slate-600">Online</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-8 custom-scrollbar relative">
                    <div className="animate-fade-in w-full max-w-7xl mx-auto pb-12">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Background blurs */}
            <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px] pointer-events-none z-0" />
            <div className="fixed bottom-[-20%] left-[-10%] w-[40%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0" />
        </div>
    );
}
