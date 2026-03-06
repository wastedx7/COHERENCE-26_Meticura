import React from 'react';
import { BrainCircuit, Cpu, Zap, Beaker, Network } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockPerformanceData = [
    { epoch: 10, iForest: 0.85, autoencoder: 0.90, lstm: 0.82 },
    { epoch: 20, iForest: 0.87, autoencoder: 0.92, lstm: 0.85 },
    { epoch: 30, iForest: 0.89, autoencoder: 0.94, lstm: 0.88 },
    { epoch: 40, iForest: 0.91, autoencoder: 0.95, lstm: 0.92 },
    { epoch: 50, iForest: 0.91, autoencoder: 0.96, lstm: 0.95 },
];

export default function MyModelsPage() {
    const models = [
        { name: 'Isolation Forest', type: 'Scikit-Learn', task: 'Anomaly Detection', score: 0.91, status: 'Active', icon: Network },
        { name: 'Deep Autoencoder', type: 'PyTorch/TensorFlow', task: 'Anomaly Detection', score: 0.96, status: 'Active', icon: BrainCircuit },
        { name: 'XGBoost', type: 'XGBoost', task: 'Lapse Prediction', score: 0.94, status: 'Active', icon: Zap },
        { name: 'LSTM RNN', type: 'PyTorch', task: 'Time-Series Forecast', score: 0.95, status: 'Active', icon: Cpu },
        { name: 'Linear Programming', type: 'SciPy', task: 'Budget Reallocation', score: 1.0, status: 'Active', icon: Beaker },
        { name: 'NLP RAG Pipeline', type: 'LangChain', task: 'Chatbot QA', score: 0.88, status: 'Active', icon: BrainCircuit },
    ];

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Model Registry</h1>
                <p className="text-slate-500 mt-1">Manage, retrain, and monitor the 6 core ML models</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">F1-Score / Accuracy Validation Curve</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockPerformanceData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} name="Epochs" />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} domain={[0.8, 1]} />
                                <Tooltip cursor={{ fill: 'rgba(238, 242, 255, 0.5)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="iForest" stroke="#94a3b8" strokeWidth={2} name="IsoForest" />
                                <Line type="monotone" dataKey="autoencoder" stroke="#6366f1" strokeWidth={3} name="Autoencoder" />
                                <Line type="monotone" dataKey="lstm" stroke="#f43f5e" strokeWidth={3} name="LSTM" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-indigo-50 border-8 border-indigo-100 flex items-center justify-center mb-4">
                        <span className="text-2xl font-black text-indigo-600">93%</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Global Average Confidence</h3>
                    <p className="text-sm text-slate-500 mt-2">All 6 models are operating over the strict 90% threshold required for automated generation.</p>
                    <button className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-colors w-full">
                        Trigger Batch Retrain
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {models.map(m => (
                    <div key={m.name} className="glass-card p-6 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <m.icon className="w-24 h-24 text-indigo-600 transform group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                                <m.icon className="w-6 h-6" />
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full border border-emerald-200">
                                {m.status}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 relative z-10">{m.name}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-0.5 relative z-10">{m.task}</p>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center relative z-10">
                            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{m.type}</span>
                            <span className="text-sm font-bold text-indigo-600">Valid: {m.score}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
