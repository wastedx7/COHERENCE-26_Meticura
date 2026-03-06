import React, { useEffect } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { TrendingDown, AlertTriangle } from 'lucide-react';

export function ForecastPage() {
    const { fetchForecast, forecast, isLoading } = useBudget();

    useEffect(() => { fetchForecast(); }, [fetchForecast]);

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Budget Forecast</h1>
                <p className="text-slate-500 mt-1">Lapse predictions combined with current budget tracking to forecast EOY position.</p>
            </div>

            <div className="glass-card overflow-hidden border border-slate-200 shadow-sm">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600">Department</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Allocated</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Spent (YTD)</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 border-l border-slate-200">Predicted EOY Spend</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Predicted Lapse</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Risk Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ?
                            Array(5).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="h-16 bg-slate-100/50"></td></tr>)
                            : (forecast.length > 0 ? forecast : Array(8).fill(null).map((_, i) => ({
                                id: i, name: `Department ${i + 1}`, allocated: 100, spent: 40 + i * 5, pred_spend: 80 + i * 4, lapse: 20 - i * 4, risk: (20 - i * 4) > 10 ? 'HIGH' : 'LOW'
                            }))).map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{row.name}</td>
                                    <td className="px-6 py-4 text-slate-600">₹{row.allocated}M</td>
                                    <td className="px-6 py-4 text-slate-600">₹{row.spent}M</td>
                                    <td className="px-6 py-4 font-medium text-indigo-600 border-l border-slate-100 bg-indigo-50/30">₹{row.pred_spend}M</td>
                                    <td className="px-6 py-4 font-bold text-slate-800">₹{row.lapse}M</td>
                                    <td className="px-6 py-4 text-right">
                                        {row.risk === 'HIGH' ? (
                                            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-200"><AlertTriangle className="w-3 h-3" /> HIGH</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200"><TrendingDown className="w-3 h-3" /> LOW</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
