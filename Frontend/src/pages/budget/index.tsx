import React, { useEffect, useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Search,
    Activity,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
        'on-track': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'at-risk': 'bg-amber-100 text-amber-700 border-amber-200',
        'exceeded': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    const Icons: any = {
        'on-track': CheckCircle2,
        'at-risk': AlertCircle,
        'exceeded': AlertCircle
    };
    const Icon = Icons[status] || CheckCircle2;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles['on-track']}`}>
            <Icon className="w-3.5 h-3.5" />
            {status.replace('-', ' ').toUpperCase()}
        </span>
    );
};

export default function BudgetPage() {
    const { overview, departments, statusFilter, isLoading, fetchOverview, fetchByStatus } = useBudget();
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useLanguage();

    const filterLabels: Record<string, string> = {
        all: t('budget.filter.all'),
        'on-track': t('budget.filter.onTrack'),
        'at-risk': t('budget.filter.atRisk'),
        exceeded: t('budget.filter.exceeded'),
    };

    useEffect(() => {
        fetchOverview();
        fetchByStatus('all');
    }, []);

    const filteredDepts = (departments || []).filter((d: any) =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('budget.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('budget.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/budget/compare" className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg shadow-sm font-medium hover:bg-slate-50 transition-colors">
                        {t('budget.compareDepts')}
                    </Link>
                    <Link to="/budget/forecast" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-colors">
                        {t('budget.viewForecast')}
                    </Link>
                </div>
            </div>

            {/* Global Totals Bar */}
            <div className="glass-panel p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                    <div className="flex flex-col px-4">
                        <span className="text-sm font-medium text-slate-500 mb-1">{t('budget.totals.totalAllocated')}</span>
                        <span className="text-3xl font-bold text-slate-800">
                            ₹{((overview?.total_allocated || 14000000) / 1000000).toFixed(2)}M
                        </span>
                    </div>
                    <div className="flex flex-col px-4">
                        <span className="text-sm font-medium text-slate-500 mb-1">{t('budget.totals.totalSpent')}</span>
                        <span className="text-3xl font-bold text-indigo-600">
                            ₹{((overview?.total_spent || 5200000) / 1000000).toFixed(2)}M
                        </span>
                    </div>
                    <div className="flex flex-col px-4">
                        <span className="text-sm font-medium text-slate-500 mb-1">{t('budget.totals.avgUtilization')}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-slate-800">{overview?.avg_utilization || 37.1}%</span>
                            <span className="text-sm font-semibold text-emerald-600 flex bg-emerald-50 px-2 py-0.5 rounded-full"><ArrowDownRight className="w-4 h-4" /> 2.1%</span>
                        </div>
                    </div>
                    <div className="flex justify-around items-center px-4">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase font-semibold">{t('budget.totals.onTrack')}</p>
                            <p className="text-xl font-bold text-emerald-600">{overview?.status_counts?.['on-track'] || 14}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase font-semibold">{t('budget.totals.atRisk')}</p>
                            <p className="text-xl font-bold text-amber-600">{overview?.status_counts?.['at-risk'] || 4}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase font-semibold">{t('budget.totals.exceeded')}</p>
                            <p className="text-xl font-bold text-rose-600">{overview?.status_counts?.['exceeded'] || 1}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
                <div className="relative max-w-md w-full">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('budget.search.placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                </div>

                <div className="flex bg-white/60 p-1 rounded-lg border border-slate-200 backdrop-blur-sm shadow-sm">
                    {['all', 'on-track', 'at-risk', 'exceeded'].map((s) => (
                        <button
                            key={s}
                            onClick={() => fetchByStatus(s)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === s
                                    ? 'bg-white shadow-sm text-indigo-600'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {filterLabels[s]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Department Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => <div key={i} className="glass-card h-48 animate-pulse bg-slate-200/50"></div>)
                ) : filteredDepts.length > 0 ? (
                    filteredDepts.map((dept: any, i: number) => (
                        <Link to={`/budget/department/${dept.id || i + 1}`} key={dept.id || i} className="glass-card p-6 flex flex-col group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{dept.name || `Department ${i + 1}`}</h3>
                                    <p className="text-sm text-slate-500">{dept.code || `DPT-00${i + 1}`}</p>
                                </div>
                                <StatusBadge status={dept.status || (i % 3 === 0 ? 'at-risk' : 'on-track')} />
                            </div>

                            <div className="mt-auto relative z-10">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 font-medium tracking-tight">{t('budget.card.utilization')}</span>
                                    <span className="text-slate-800 font-bold">{dept.utilization_pct || Math.floor(Math.random() * 80 + 10)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50 shadow-inner">
                                    <div
                                        className={`h-2.5 rounded-full ${(dept.status || (i % 3 === 0 ? 'at-risk' : 'on-track')) === 'at-risk' ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${dept.utilization_pct || Math.floor(Math.random() * 80 + 10)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 mt-2">
                                    <span>{t('budget.card.spent')}: ₹{((dept.spent_amount || Math.random() * 5000000) / 100000).toFixed(1)}L</span>
                                    <span>{t('budget.card.alloc')}: ₹{((dept.allocated_amount || 10000000) / 100000).toFixed(1)}L</span>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 z-0">
                                <ArrowUpRight className="text-indigo-600/20 w-16 h-16" />
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 glass-panel">
                        <Filter className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-lg font-medium">{t('budget.empty')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
