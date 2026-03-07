import React, { useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import {
    Activity,
    TrendingUp,
    AlertTriangle,
    ShieldCheck,
    ArrowRight,
    Loader2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';

const KPICard = ({ title, value, icon, trend, alert = false, isLoading = false }: any) => (
    <div className={`glass-card p-6 flex flex-col justify-between relative overflow-hidden group ${alert ? 'border-red-200 shadow-red-100' : ''}`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${alert ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>
                {icon}
            </div>
            {trend && (
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <div>
            <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
            {isLoading ? (
                <div className="h-9 w-24 bg-slate-200 animate-pulse rounded"></div>
            ) : (
                <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
            )}
        </div>

        {/* Decorative background blur */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
    </div>
);

export default function DashboardPage() {
    const { user } = useAuth();
    const { fetchDashboardData, budgetOverview, criticalAnomalies, lapseSummary, isLoading } = useDashboard();

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Format currency values
    const formatCurrency = (value: number | undefined) => {
        if (!value) return '₹0';
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        return `₹${value.toLocaleString()}`;
    };

    const budgetVal = formatCurrency(budgetOverview?.total_allocated);
    const spentVal = formatCurrency(budgetOverview?.total_spent);
    const anomalyCount = criticalAnomalies?.length || 0;
    const lapseRisk = lapseSummary?.critical_count || 0;

    // Generate simple chart data from budget overview if available
    const chartData = budgetOverview ? [
        { 
            name: 'Current',
            spent: Math.round(budgetOverview.total_spent / 100000) / 10, // Convert to lakhs
            allocated: Math.round(budgetOverview.total_allocated / 100000) / 10
        }
    ] : [];

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, {user?.full_name || 'Admin'}. Here's what's happening.</p>
                </div>
                <Link 
                    to="/reports"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-all hover:shadow-md transform hover:-translate-y-0.5"
                >
                    Generate Full Report
                </Link>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Allocated Budget"
                    value={budgetVal}
                    icon={<Activity className="w-6 h-6" />}
                    isLoading={isLoading}
                />
                <KPICard
                    title="Total Spend YTD"
                    value={spentVal}
                    icon={<TrendingUp className="w-6 h-6" />}
                    isLoading={isLoading}
                />
                <KPICard
                    title="Critical Anomalies"
                    value={anomalyCount.toString()}
                    icon={<AlertTriangle className="w-6 h-6" />}
                    alert={anomalyCount > 0}
                    isLoading={isLoading}
                />
                <KPICard
                    title="High Lapse Risk Depts"
                    value={lapseRisk.toString()}
                    icon={<ShieldCheck className="w-6 h-6" />}
                    isLoading={isLoading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="glass-card p-6 lg:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Budget Overview</h2>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            </div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} label={{ value: 'Lakhs (₹)', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(238, 242, 255, 0.5)' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="spent" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={64} name="Spent" />
                                    <Bar dataKey="allocated" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={64} name="Allocated" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                <p>No budget data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action / Alerts Feed */}
                <div className="glass-card p-6 flex flex-col h-full bg-gradient-to-b from-white/60 to-slate-50/20">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Requires Attention</h2>
                        <Link to="/anomalies" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 transition-colors">
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                            </div>
                        ) : criticalAnomalies && criticalAnomalies.length > 0 ? (
                            criticalAnomalies.slice(0, 5).map((anomaly: any, idx: number) => (
                                <div key={idx} className="bg-red-50/60 border border-red-100 rounded-xl p-4 flex gap-3 hover:bg-red-50 transition-colors cursor-pointer">
                                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                                            {anomaly.type || 'Anomaly Detected'}
                                        </p>
                                        <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                            {anomaly.message || `Department ${anomaly.department_id} flagged`} - {anomaly.rule || 'ML Detection'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                <div className="text-center">
                                    <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                                    <p className="text-sm">No critical anomalies</p>
                                </div>
                            </div>
                        )}

                        {/* Lapse Warnings */}
                        {!isLoading && lapseSummary && lapseSummary.critical > 0 && (
                            <Link to="/lapse" className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 flex gap-3 hover:bg-amber-50 transition-colors cursor-pointer">
                                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">Budget Lapse Risk</p>
                                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                        {lapseSummary.critical} departments at critical risk of budget lapse
                                    </p>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
