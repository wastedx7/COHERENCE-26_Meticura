import React, { useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import {
    Activity,
    TrendingUp,
    AlertTriangle,
    ShieldCheck,
    ArrowRight
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

const KPICard = ({ title, value, icon, trend, alert = false }: any) => (
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
            <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
        </div>

        {/* Decorative background blur */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
    </div>
);

// Dummy chart data since API is not actually running
const mockChartData = [
    { name: 'Jan', spent: 4000, allocated: 10000 },
    { name: 'Feb', spent: 3000, allocated: 10000 },
    { name: 'Mar', spent: 2000, allocated: 10000 },
    { name: 'Apr', spent: 2780, allocated: 10000 },
    { name: 'May', spent: 1890, allocated: 10000 },
    { name: 'Jun', spent: 2390, allocated: 10000 },
];

export default function DashboardPage() {
    const { user } = useAuth();
    const { fetchDashboardData, budgetOverview, criticalAnomalies, lapseSummary, isLoading } = useDashboard();

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // If no actual data from mocked API comes through, provide fallback visuals
    const budgetVal = budgetOverview?.total_allocated ? `₹${(budgetOverview.total_allocated / 100000).toFixed(1)}M` : '₹124.5M';
    const spentVal = budgetOverview?.total_spent ? `₹${(budgetOverview.total_spent / 100000).toFixed(1)}M` : '₹42.3M';
    const anomalyCount = criticalAnomalies?.length || 3;
    const lapseRisk = lapseSummary?.critical_count || 5;

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, {user?.full_name || 'Admin'}. Here's what's happening.</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-all hover:shadow-md transform hover:-translate-y-0.5">
                    Generate Full Report
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Allocated Budget"
                    value={budgetVal}
                    icon={<Activity className="w-6 h-6" />}
                    trend={12}
                />
                <KPICard
                    title="Total Spend YTD"
                    value={spentVal}
                    icon={<TrendingUp className="w-6 h-6" />}
                    trend={-4}
                />
                <KPICard
                    title="Critical Anomalies"
                    value={anomalyCount.toString()}
                    icon={<AlertTriangle className="w-6 h-6" />}
                    alert={anomalyCount > 0}
                />
                <KPICard
                    title="High Lapse Risk Depts"
                    value={lapseRisk.toString()}
                    icon={<ShieldCheck className="w-6 h-6" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="glass-card p-6 lg:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Monthly Spending vs Allocation</h2>
                        <select className="bg-white border text-sm border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow">
                            <option>Last 6 Months</option>
                            <option>This Fiscal Year</option>
                        </select>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(238, 242, 255, 0.5)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="spent" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={32} />
                                <Bar dataKey="allocated" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
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
                        {/* Hardcoded visual representation of alerts */}
                        <div className="bg-red-50/60 border border-red-100 rounded-xl p-4 flex gap-3 hover:bg-red-50 transition-colors cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 line-clamp-1">Rapid Spend Detected</p>
                                <p className="text-xs text-slate-500 leading-relaxed mt-1">Urban Dev Dept spent 42% of annual budget in the last 15 days.</p>
                            </div>
                        </div>

                        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 flex gap-3 hover:bg-amber-50 transition-colors cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 line-clamp-1">Inactivity Alert</p>
                                <p className="text-xs text-slate-500 leading-relaxed mt-1">Health & Sanitation has recorded 0 transactions in 90 days.</p>
                            </div>
                        </div>

                        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex gap-3 hover:bg-indigo-50 transition-colors cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 line-clamp-1">Reallocation Needed</p>
                                <p className="text-xs text-slate-500 leading-relaxed mt-1">Education Dept is trending towards a 15% deficit by Q4.</p>
                            </div>
                        </div>

                        <div className="bg-white/60 border border-slate-200 rounded-xl p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-slate-300 mt-2 flex-shrink-0"></div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">System Log</p>
                                <p className="text-xs text-slate-500 mt-1">Weekly anomaly scan completed successfully at 02:00 AM.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
