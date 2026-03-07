import React, { useEffect, useState } from 'react';
import { useReallocation } from '../../context/ReallocationContext';
import { Link } from 'react-router-dom';
import {
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    XCircle,
    PlayCircle,
    AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ReallocationPage() {
    const { t } = useLanguage();
    const { fetchSuggestions, suggestions, summary, isLoading } = useReallocation();
    const [statusFilter, setStatusFilter] = useState('pending');

    useEffect(() => {
        fetchSuggestions(statusFilter);
    }, [statusFilter]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('reallocation.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('reallocation.subtitle')}</p>
                </div>
            </div>

            <div className="glass-panel p-6">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('reallocation.lifecycle.title')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 select-none relative z-10">
                    {[
                        { id: 'pending', label: t('reallocation.lifecycle.pending'), icon: Clock, count: summary?.pending || 12, amount: 4200000, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { id: 'approved', label: t('reallocation.lifecycle.approved'), icon: CheckCircle2, count: summary?.approved || 5, amount: 1500000, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { id: 'rejected', label: t('reallocation.lifecycle.rejected'), icon: XCircle, count: summary?.rejected || 3, amount: 800000, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { id: 'executed', label: t('reallocation.lifecycle.executed'), icon: PlayCircle, count: summary?.executed || 24, amount: 12500000, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                    ].map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setStatusFilter(item.id)}
                            className={`border p-4 rounded-xl cursor-pointer transition-all ${statusFilter === item.id ? `${item.bg} border-${item.color.split('-')[1]}-200 shadow-sm` : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <item.icon className={`w-4 h-4 ${statusFilter === item.id ? item.color : 'text-slate-400'}`} />
                                <span className={`text-sm font-bold uppercase tracking-wider ${statusFilter === item.id ? item.color : 'text-slate-500'}`}>{item.label}</span>
                            </div>
                            <p className="text-3xl font-black text-slate-800">{item.count}</p>
                            <p className="text-xs text-slate-500 mt-1 font-medium">₹{(item.amount / 100000).toFixed(1)}L {t('reallocation.lifecycle.totalVolume')}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-card overflow-hidden border border-slate-200 shadow-sm mt-4">
                <div className="p-4 border-b border-slate-200 bg-white/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 capitalize">{statusFilter} Suggestions</h2>
                </div>

                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600">{t('reallocation.table.transferPath')}</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">{t('reallocation.table.suggestedAmount')}</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">{t('reallocation.table.priority')}</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">{t('reallocation.table.status')}</th>
                            <th className="px-6 py-4 text-right">{t('reallocation.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ?
                            Array(4).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="h-20 bg-slate-50/50"></td></tr>)
                            : (suggestions.length > 0 ? suggestions : Array(4).fill(null).map((_, i) => ({
                                id: 100 + i, donor_id: 12 + i, recipient_id: 45 + i, amount: Math.floor(Math.random() * 500000 + 100000),
                                priority: i === 0 ? 'critical' : 'high', status: statusFilter,
                                reason: `Donor Dept ${12 + i} projected 28% lapse. Recipient Dept ${45 + i} projected deficit.`
                            }))).map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-0.5">{t('common.from')}</p>
                                                <p className="font-bold text-slate-800 bg-emerald-50 text-emerald-700 px-2 rounded inline-block border border-emerald-100">Dept {row.donor_id}</p>
                                            </div>
                                            <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500 mb-0.5">{t('common.to')}</p>
                                                <p className="font-bold text-slate-800 bg-rose-50 text-rose-700 px-2 rounded inline-block border border-rose-100">Dept {row.recipient_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xl font-bold text-indigo-600">₹{(row.amount / 100000).toFixed(2)}L</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase
                    ${row.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            {row.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium capitalize text-slate-600">{row.status}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/reallocation/${row.id}`} className="px-4 py-2 bg-white border border-slate-200 shadow-sm text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors inline-block">
                                            {t('reallocation.table.reviewDetails')}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
