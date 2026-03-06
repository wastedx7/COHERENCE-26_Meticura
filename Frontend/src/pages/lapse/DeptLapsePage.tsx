import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLapse } from '../../context/LapseContext';
import { ChevronLeft, CalendarClock, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export function DeptLapsePage() {
    const { id } = useParams();
    const { fetchDeptPrediction, isLoading } = useLapse();
    const [prediction, setPrediction] = useState<any>(null);

    useEffect(() => {
        if (id) {
            fetchDeptPrediction(Number(id)).then(setPrediction);
        }
    }, [id, fetchDeptPrediction]);

    // Mock data for chart
    const mockLineData = [
        { day: 0, actual: 0, alloc: 1000 },
        { day: 60, actual: 150, alloc: 1000 },
        { day: 120, actual: 300, alloc: 1000 },
        { day: 180, actual: 500, alloc: 1000 },
        { day: 240, actual: 650, alloc: 1000 },
        { day: 365, pred: 820, alloc: 1000 }
    ];

    const data = prediction || {
        department_id: id || 101,
        name: 'Education infrastructure',
        avg_daily_spend: 25400,
        predicted_total_spend: 8500000,
        allocation: 12000000,
        predicted_lapse_amount: 3500000,
        predicted_lapse_pct: 29.1,
        risk_level: 'high',
        days_to_fiscal_end: 84
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/lapse" className="p-2 glass-card hover:bg-slate-50 rounded-full transition-colors text-slate-500 hover:text-indigo-600">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{data.name}</h1>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">ID: {data.department_id}</span>
                        </div>
                        <p className="text-slate-500 mt-1">Detailed lapse prediction and Extrapolated burn path</p>
                    </div>
                </div>
                <Link to={`/reallocation`} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-colors">
                    <ArrowRightLeft className="w-4 h-4" /> Send to Reallocation
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="glass-panel p-8 relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute right-[-10%] top-[-10%] w-64 h-64 bg-rose-50 rounded-full blur-3xl opacity-60"></div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Predicted EOY Lapse</h3>
                    <div className="flex items-baseline gap-2 relative z-10 mb-6">
                        <span className="text-5xl font-black text-slate-800 tracking-tighter">₹{(data.predicted_lapse_amount / 100000).toFixed(1)}L</span>
                        <span className="text-xl font-bold text-rose-500">({data.predicted_lapse_pct}%)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 relative z-10 border-t border-slate-200/60 pt-6">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase">Avg Daily Spend</p>
                            <p className="font-bold text-lg text-slate-700 mt-1 flex items-center gap-1">
                                <TrendingDown className="w-4 h-4 text-emerald-500" /> ₹{(data.avg_daily_spend).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase">Days Remaining</p>
                            <p className="font-bold text-lg text-slate-700 mt-1 flex items-center gap-1">
                                <CalendarClock className="w-4 h-4 text-indigo-500" /> {data.days_to_fiscal_end} Days
                            </p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Extrapolated Burn Path</h3>
                    <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockLineData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'rgba(238, 242, 255, 0.5)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="alloc" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Allocation" />
                                <Line type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} name="Actual Spend" />
                                <Line type="monotone" dataKey="pred" stroke="#f43f5e" strokeWidth={3} strokeDasharray="3 3" dot={{ r: 4 }} name="Predicted Spend" />
                                <ReferenceLine x={240} stroke="#cbd5e1" label={{ position: 'top', value: 'Today', fill: '#64748B', fontSize: 12 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
