import React, { useEffect, useState, useCallback } from 'react';
import { BrainCircuit, Cpu, Zap, Beaker, Network, Loader2, CheckCircle2, RefreshCw, Crown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface ModelMetric {
    model_name: string;
    precision: number;
    recall: number;
    f1_score: number;
    auc_roc: number;
    avg_anomaly_score: number;
    false_positive_rate: number;
    training_time_sec: number;
    inference_time_ms: number;
}

interface ActiveModel {
    model_name: string;
    set_at: string;
    set_by_user_id: string;
}

const MODEL_ICONS: Record<string, React.FC<{ className?: string }>> = {
    isolation_forest: Network,
    lof: BrainCircuit,
    ocsvm: Zap,
    autoencoder: BrainCircuit,
    dbscan: Cpu,
    elliptic_envelope: Beaker,
};

const MODEL_LABELS: Record<string, { label: string; type: string; task: string }> = {
    isolation_forest: { label: 'Isolation Forest', type: 'Scikit-Learn', task: 'Anomaly Detection' },
    lof: { label: 'Local Outlier Factor', type: 'Scikit-Learn', task: 'Anomaly Detection' },
    ocsvm: { label: 'One-Class SVM', type: 'Scikit-Learn', task: 'Anomaly Detection' },
    autoencoder: { label: 'Deep Autoencoder', type: 'Neural Network', task: 'Anomaly Detection' },
    dbscan: { label: 'DBSCAN Clustering', type: 'Scikit-Learn', task: 'Clustering' },
    elliptic_envelope: { label: 'Elliptic Envelope', type: 'Scikit-Learn', task: 'Anomaly Detection' },
};

export default function MyModelsPage() {
    const { role } = useAuth();
    const [metrics, setMetrics] = useState<ModelMetric[]>([]);
    const [activeModel, setActiveModel] = useState<ActiveModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [retrainLoading, setRetrainLoading] = useState(false);
    const [retrainMsg, setRetrainMsg] = useState<string | null>(null);
    const [setActiveLoading, setSetActiveLoading] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [metricsRes, activeRes] = await Promise.allSettled([
                api.get('/predictions/metrics'),
                api.get('/predictions/active-model'),
            ]);
            if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data);
            if (activeRes.status === 'fulfilled') setActiveModel(activeRes.value.data);
        } catch { /* handled by individual promises */ }
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRetrain = async () => {
        setRetrainLoading(true);
        setRetrainMsg(null);
        try {
            const res = await api.post('/internal/retrain-model');
            setRetrainMsg(res.data?.message || 'Retrain complete');
            fetchData();
        } catch (e: any) {
            setRetrainMsg(e?.response?.data?.detail || 'Retrain failed');
        } finally {
            setRetrainLoading(false);
        }
    };

    const handleSetActive = async (modelName: string) => {
        setSetActiveLoading(modelName);
        try {
            const res = await api.put('/predictions/active-model', { model_name: modelName });
            setActiveModel(res.data);
        } catch { /* ignore */ }
        setSetActiveLoading(null);
    };

    // Build chart data from metrics
    const chartData = metrics.map(m => ({
        name: MODEL_LABELS[m.model_name]?.label?.split(' ')[0] || m.model_name,
        f1: +(m.f1_score * 100).toFixed(1),
        precision: +(m.precision * 100).toFixed(1),
        recall: +(m.recall * 100).toFixed(1),
    }));

    const avgScore = metrics.length > 0
        ? Math.round(metrics.reduce((sum, m) => sum + m.f1_score, 0) / metrics.length * 100)
        : 0;

    const canAdmin = role === 'admin';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Model Registry</h1>
                    <p className="text-slate-500 mt-1">Monitor, compare, and manage the ensemble ML models</p>
                </div>
                <button onClick={fetchData} className="p-2 glass-card hover:bg-slate-50 rounded-lg transition-colors text-slate-500 hover:text-indigo-600">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Chart */}
                <div className="glass-card p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Model Performance (F1 / Precision / Recall %)</h3>
                    <div className="h-64 w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} domain={[0, 100]} />
                                    <Tooltip cursor={{ fill: 'rgba(238, 242, 255, 0.5)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="f1" stroke="#6366f1" strokeWidth={3} name="F1 Score" dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="precision" stroke="#94a3b8" strokeWidth={2} name="Precision" dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="recall" stroke="#f43f5e" strokeWidth={2} name="Recall" dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">No metric data available</div>
                        )}
                    </div>
                </div>

                {/* Summary + Retrain */}
                <div className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-indigo-50 border-8 border-indigo-100 flex items-center justify-center mb-4">
                        <span className="text-2xl font-black text-indigo-600">{avgScore}%</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Average F1 Score</h3>
                    <p className="text-sm text-slate-500 mt-2">
                        {activeModel ? `Active: ${MODEL_LABELS[activeModel.model_name]?.label || activeModel.model_name}` : 'No active model set'}
                    </p>
                    {canAdmin && (
                        <button onClick={handleRetrain} disabled={retrainLoading}
                            className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg shadow-sm font-medium transition-colors w-full flex items-center justify-center gap-2">
                            {retrainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Trigger Batch Retrain
                        </button>
                    )}
                    {retrainMsg && <p className="text-sm mt-2 text-slate-600">{retrainMsg}</p>}
                </div>
            </div>

            {/* Model Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {metrics.map(m => {
                    const info = MODEL_LABELS[m.model_name] || { label: m.model_name, type: 'Unknown', task: 'Unknown' };
                    const Icon = MODEL_ICONS[m.model_name] || Network;
                    const isActive = activeModel?.model_name === m.model_name;

                    return (
                        <div key={m.model_name} className={`glass-card p-6 flex flex-col relative overflow-hidden group ${isActive ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Icon className="w-24 h-24 text-indigo-600 transform group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-2">
                                    {isActive && (
                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center gap-1">
                                            <Crown className="w-3 h-3" /> Active
                                        </span>
                                    )}
                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full border border-emerald-200">
                                        Ready
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 relative z-10">{info.label}</h3>
                            <p className="text-sm font-medium text-slate-500 mt-0.5 relative z-10">{info.task}</p>

                            <div className="mt-4 grid grid-cols-2 gap-2 text-xs relative z-10">
                                <div className="bg-slate-50 rounded p-2">
                                    <span className="text-slate-500">F1</span>
                                    <span className="float-right font-bold text-slate-800">{(m.f1_score * 100).toFixed(1)}%</span>
                                </div>
                                <div className="bg-slate-50 rounded p-2">
                                    <span className="text-slate-500">AUC</span>
                                    <span className="float-right font-bold text-slate-800">{(m.auc_roc * 100).toFixed(1)}%</span>
                                </div>
                                <div className="bg-slate-50 rounded p-2">
                                    <span className="text-slate-500">Prec</span>
                                    <span className="float-right font-bold text-slate-800">{(m.precision * 100).toFixed(1)}%</span>
                                </div>
                                <div className="bg-slate-50 rounded p-2">
                                    <span className="text-slate-500">Recall</span>
                                    <span className="float-right font-bold text-slate-800">{(m.recall * 100).toFixed(1)}%</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center relative z-10">
                                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{info.type}</span>
                                {canAdmin && !isActive && (
                                    <button onClick={() => handleSetActive(m.model_name)} disabled={setActiveLoading === m.model_name}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                        {setActiveLoading === m.model_name ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                        Set Active
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
