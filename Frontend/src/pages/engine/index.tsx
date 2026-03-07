import React, { useState } from 'react';
import { Settings, PlayCircle, RefreshCw, Activity, Database, CheckCircle2, Loader2, AlertCircle, Zap } from 'lucide-react';
import { useEngine } from '../../context/EngineContext';

export default function EnginePage() {
    const {
        isRunningPipeline,
        isTrainingModels,
        isSeedingData,
        lastPipelineResult,
        lastTrainingResult,
        error,
        runPipeline,
        retrainModels,
        seedDatabase
    } = useEngine();

    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleRunPipeline = async () => {
        try {
            const result = await runPipeline();
            setNotification({
                type: 'success',
                message: `Pipeline executed successfully! ${result.mode === 'queued' ? '(Queued for background processing)' : ''}`
            });
            setTimeout(() => setNotification(null), 5000);
        } catch (err: any) {
            setNotification({
                type: 'error',
                message: err.message || 'Failed to run pipeline'
            });
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleRetrainModels = async () => {
        try {
            const result = await retrainModels();
            let message = 'Models retraining initiated!';
            if (result.mode === 'inline') {
                message = `Training complete! Lapse R²: ${result.lapse_r2?.toFixed(3)}, Anomaly Acc: ${result.anomaly_accuracy?.toFixed(3)}, Ensemble Acc: ${result.ensemble_accuracy?.toFixed(3)}`;
            }
            setNotification({
                type: 'success',
                message
            });
            setTimeout(() => setNotification(null), 5000);
        } catch (err: any) {
            setNotification({
                type: 'error',
                message: err.message || 'Failed to retrain models'
            });
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleSeedDatabase = async () => {
        if (!confirm('This will seed the database with test data. Continue?')) {
            return;
        }
        try {
            await seedDatabase();
            setNotification({
                type: 'success',
                message: 'Database seeded successfully!'
            });
            setTimeout(() => setNotification(null), 5000);
        } catch (err: any) {
            setNotification({
                type: 'error',
                message: err.message || 'Failed to seed database'
            });
            setTimeout(() => setNotification(null), 5000);
        }
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Engine Control</h1>
                    <p className="text-slate-500 mt-1">Monitor and control the AI pipeline execution</p>
                </div>
            </div>

            {/* Notifications */}
            {notification && (
                <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
                    notification.type === 'success' 
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                        : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Control Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <button
                    onClick={handleRunPipeline}
                    disabled={isRunningPipeline}
                    className="glass-card p-6 border border-indigo-100 hover:border-indigo-300 transition-all flex flex-col items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRunningPipeline ? (
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    ) : (
                        <PlayCircle className="w-10 h-10 text-indigo-500" />
                    )}
                    <div className="text-center">
                        <h3 className="font-bold text-slate-800 text-lg">Run Pipeline</h3>
                        <p className="text-sm text-slate-500 mt-1">Execute full data processing pipeline</p>
                    </div>
                    {isRunningPipeline && (
                        <span className="text-xs text-indigo-600 font-medium">Running...</span>
                    )}
                </button>

                <button
                    onClick={handleRetrainModels}
                    disabled={isTrainingModels}
                    className="glass-card p-6 border border-emerald-100 hover:border-emerald-300 transition-all flex flex-col items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isTrainingModels ? (
                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    ) : (
                        <Zap className="w-10 h-10 text-emerald-500" />
                    )}
                    <div className="text-center">
                        <h3 className="font-bold text-slate-800 text-lg">Retrain Models</h3>
                        <p className="text-sm text-slate-500 mt-1">Retrain all ML models with latest data</p>
                    </div>
                    {isTrainingModels && (
                        <span className="text-xs text-emerald-600 font-medium">Training...</span>
                    )}
                </button>

                <button
                    onClick={handleSeedDatabase}
                    disabled={isSeedingData}
                    className="glass-card p-6 border border-amber-100 hover:border-amber-300 transition-all flex flex-col items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSeedingData ? (
                        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                    ) : (
                        <Database className="w-10 h-10 text-amber-500" />
                    )}
                    <div className="text-center">
                        <h3 className="font-bold text-slate-800 text-lg">Seed Database</h3>
                        <p className="text-sm text-slate-500 mt-1">Populate database with test data</p>
                    </div>
                    {isSeedingData && (
                        <span className="text-xs text-amber-600 font-medium">Seeding...</span>
                    )}
                </button>
            </div>

            {/* Last Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Last Pipeline Result */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        Last Pipeline Execution
                    </h3>
                    {lastPipelineResult ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">Status:</span>
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                    lastPipelineResult.success 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {lastPipelineResult.success ? 'SUCCESS' : 'FAILED'}
                                </span>
                            </div>
                            {lastPipelineResult.mode && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600">Mode:</span>
                                    <span className="text-sm font-medium text-slate-800">{lastPipelineResult.mode}</span>
                                </div>
                            )}
                            {lastPipelineResult.message && (
                                <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600">
                                    {lastPipelineResult.message}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">No pipeline results yet</p>
                    )}
                </div>

                {/* Last Training Result */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-emerald-500" />
                        Last Model Training
                    </h3>
                    {lastTrainingResult ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">Status:</span>
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                    lastTrainingResult.success 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {lastTrainingResult.success ? 'SUCCESS' : 'FAILED'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">Mode:</span>
                                <span className="text-sm font-medium text-slate-800">{lastTrainingResult.mode}</span>
                            </div>
                            {lastTrainingResult.mode === 'inline' && (
                                <div className="mt-3 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600">Lapse R² Score:</span>
                                        <span className="font-bold text-slate-800">{lastTrainingResult.lapse_r2?.toFixed(3)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600">Anomaly Accuracy:</span>
                                        <span className="font-bold text-slate-800">{lastTrainingResult.anomaly_accuracy?.toFixed(3)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600">Ensemble Accuracy:</span>
                                        <span className="font-bold text-slate-800">{lastTrainingResult.ensemble_accuracy?.toFixed(3)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">No training results yet</p>
                    )}
                </div>
            </div>

            {/* System Status */}
            <div className="glass-panel p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden relative border border-slate-700">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">System Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex gap-4">
                            <div className="mt-1"><Activity className="w-8 h-8 text-emerald-500" /></div>
                            <div>
                                <h3 className="font-bold text-white">Anomaly Detection</h3>
                                <p className="text-sm text-slate-400 mt-1">Rule Engine + ML Models Active</p>
                                <span className="mt-2 inline-block px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded border border-emerald-500/30">HEALTHY</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="mt-1"><Database className="w-8 h-8 text-indigo-400" /></div>
                            <div>
                                <h3 className="font-bold text-white">Database Connection</h3>
                                <p className="text-sm text-slate-400 mt-1">PostgreSQL operational</p>
                                <span className="mt-2 inline-block px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded border border-indigo-500/30">CONNECTED</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="mt-1"><Settings className="w-8 h-8 text-slate-400" /></div>
                            <div>
                                <h3 className="font-bold text-white">API Services</h3>
                                <p className="text-sm text-slate-400 mt-1">All endpoints responsive</p>
                                <span className="mt-2 inline-block px-2.5 py-1 bg-slate-500/20 text-slate-300 text-xs font-bold rounded border border-slate-500/30">READY</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
