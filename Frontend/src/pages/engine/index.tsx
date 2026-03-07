import React, { useState, useEffect } from 'react';
import {
  Settings, PlayCircle, RefreshCw, Activity, Database, CheckCircle2,
  Loader2, AlertCircle, Zap, Terminal, Clock, Cpu, Gauge, Server,
  Shield, Sparkles
} from 'lucide-react';
import { useEngine } from '../../context/EngineContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../lib/api';

export default function EnginePage() {
    const {
        isRunningPipeline, isTrainingModels, isSeedingData,
        lastPipelineResult, lastTrainingResult, error,
        runPipeline, retrainModels, seedDatabase
    } = useEngine();

    const { t } = useLanguage();

    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'degraded'>('checking');
    const [uptime] = useState(() => new Date());
    const [actionLog, setActionLog] = useState<{ action: string; time: string; status: 'success' | 'error' }[]>([]);

    useEffect(() => {
        api.get('/budget/overview').then(() => setHealthStatus('healthy')).catch(() => setHealthStatus('degraded'));
    }, []);

    const notify = (type: 'success' | 'error', message: string, action: string) => {
        setNotification({ type, message });
        setActionLog(prev => [{ action, time: new Date().toLocaleTimeString(), status: type }, ...prev.slice(0, 9)]);
        setTimeout(() => setNotification(null), 6000);
    };

    const handleRunPipeline = async () => {
        try {
            const result = await runPipeline();
            notify('success', `Pipeline executed! ${result.mode === 'queued' ? '(Queued)' : '(Inline)'}`, 'Run Pipeline');
        } catch (err: any) {
            notify('error', err.message || 'Pipeline failed', 'Run Pipeline');
        }
    };

    const handleRetrainModels = async () => {
        try {
            const result = await retrainModels();
            const msg = result.mode === 'inline'
                ? `Training done! Lapse R²: ${result.lapse_r2?.toFixed(3)}, Anomaly: ${result.anomaly_accuracy?.toFixed(3)}, Ensemble: ${result.ensemble_accuracy?.toFixed(3)}`
                : 'Retraining queued for background processing';
            notify('success', msg, 'Retrain Models');
        } catch (err: any) {
            notify('error', err.message || 'Training failed', 'Retrain Models');
        }
    };

    const handleSeedDatabase = async () => {
        if (!confirm(t('engine.action.seedDatabase.confirm'))) return;
        try {
            await seedDatabase();
            notify('success', 'Database seeded successfully!', 'Seed Database');
        } catch (err: any) {
            notify('error', err.message || 'Seeding failed', 'Seed Database');
        }
    };

    const isAnyRunning = isRunningPipeline || isTrainingModels || isSeedingData;

    return (
        <div className="animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/30">
                        <Settings className={`w-7 h-7 text-white ${isAnyRunning ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('engine.title')}</h1>
                        <p className="text-slate-500 text-sm">{t('engine.subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm text-sm font-medium ${
                        healthStatus === 'healthy' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        healthStatus === 'degraded' ? 'bg-red-50 border-red-200 text-red-700' :
                        'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${healthStatus === 'healthy' ? 'bg-emerald-500 animate-pulse' : healthStatus === 'degraded' ? 'bg-red-500' : 'bg-slate-400 animate-pulse'}`} />
                        {healthStatus === 'checking' ? t('engine.health.checking') : healthStatus === 'healthy' ? t('engine.health.healthy') : t('engine.health.degraded')}
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 shadow-sm animate-fade-in ${
                    notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}
            {error && !notification && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" /><span>{error}</span>
                </div>
            )}

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {[
                    {
                        title: t('engine.action.runPipeline.title'), desc: t('engine.action.runPipeline.desc'),
                        icon: PlayCircle, gradient: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-500/25',
                        border: 'border-indigo-100 hover:border-indigo-300', loading: isRunningPipeline, onClick: handleRunPipeline,
                        loadingText: 'Running pipeline...', badge: t('engine.action.runPipeline.badge')
                    },
                    {
                        title: t('engine.action.retrainModels.title'), desc: t('engine.action.retrainModels.desc'),
                        icon: Zap, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25',
                        border: 'border-emerald-100 hover:border-emerald-300', loading: isTrainingModels, onClick: handleRetrainModels,
                        loadingText: 'Training models...', badge: t('engine.action.retrainModels.badge')
                    },
                    {
                        title: t('engine.action.seedDatabase.title'), desc: t('engine.action.seedDatabase.desc'),
                        icon: Database, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25',
                        border: 'border-amber-100 hover:border-amber-300', loading: isSeedingData, onClick: handleSeedDatabase,
                        loadingText: 'Seeding data...', badge: t('engine.action.seedDatabase.badge')
                    },
                ].map(card => (
                    <button key={card.title} onClick={card.onClick} disabled={card.loading}
                        className={`glass-card p-6 border ${card.border} transition-all duration-300 flex flex-col items-center gap-4 disabled:opacity-60 disabled:cursor-wait hover:shadow-lg hover:-translate-y-0.5 group relative overflow-hidden text-center`}>
                        {/* Glow */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 group-hover:opacity-10 transition-opacity`} />

                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center ${card.shadow} shadow-lg`}>
                                {card.loading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <card.icon className="w-8 h-8 text-white" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{card.title}</h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-[200px]">{card.desc}</p>
                            </div>
                            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 rounded-full">{card.badge}</span>
                        </div>
                        {card.loading && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden">
                                <div className={`h-full bg-gradient-to-r ${card.gradient} animate-pulse w-full`} />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Results & Status Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Pipeline Result */}
                <div className="glass-card p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4 relative z-10">
                        <Activity className="w-4 h-4 text-indigo-500" /> {t('engine.result.pipeline.title')}
                    </h3>
                    {lastPipelineResult ? (
                        <div className="space-y-3 relative z-10">
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                                    lastPipelineResult.success ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                    {lastPipelineResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                    {lastPipelineResult.success ? 'SUCCESS' : 'FAILED'}
                                </span>
                                {lastPipelineResult.mode && <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{lastPipelineResult.mode}</span>}
                            </div>
                            {lastPipelineResult.message && (
                                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-mono leading-relaxed">{lastPipelineResult.message}</div>
                            )}
                        </div>
                    ) : (
                        <div className="py-6 text-center text-slate-400 relative z-10">
                            <Terminal className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm">{t('engine.result.pipeline.noResults')}</p>
                        </div>
                    )}
                </div>

                {/* Training Result */}
                <div className="glass-card p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4 relative z-10">
                        <RefreshCw className="w-4 h-4 text-emerald-500" /> {t('engine.result.training.title')}
                    </h3>
                    {lastTrainingResult ? (
                        <div className="space-y-3 relative z-10">
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                                    lastTrainingResult.success ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                    {lastTrainingResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                    {lastTrainingResult.success ? 'SUCCESS' : 'FAILED'}
                                </span>
                                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{lastTrainingResult.mode}</span>
                            </div>
                            {lastTrainingResult.mode === 'inline' && (
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {[
                                        { label: t('engine.result.training.lapseR2'), value: lastTrainingResult.lapse_r2, color: 'text-indigo-700' },
                                        { label: t('engine.result.training.anomalyAcc'), value: lastTrainingResult.anomaly_accuracy, color: 'text-emerald-700' },
                                        { label: t('engine.result.training.ensembleAcc'), value: lastTrainingResult.ensemble_accuracy, color: 'text-purple-700' },
                                    ].map(m => (
                                        <div key={m.label} className="bg-slate-50 rounded-xl p-3 text-center">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{m.label}</p>
                                            <p className={`text-lg font-black ${m.color}`}>{m.value?.toFixed(3) ?? '—'}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-6 text-center text-slate-400 relative z-10">
                            <Cpu className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm">{t('engine.result.training.noResults')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* System Status Bar */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white relative overflow-hidden border border-slate-700/50 mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />

                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                    <Sparkles className="w-4 h-4" /> {t('engine.system.title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative z-10">
                    {[
                        { title: t('engine.system.anomalyDetection'), desc: 'Rule Engine + 6 ML Models', icon: Shield, status: 'ACTIVE', statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                        { title: t('engine.system.database'), desc: 'PostgreSQL via Supabase', icon: Database, status: 'CONNECTED', statusColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
                        { title: t('engine.system.apiGateway'), desc: 'FastAPI + Uvicorn', icon: Server, status: 'READY', statusColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
                        { title: t('engine.system.mlPipeline'), desc: 'Celery + Inline fallback', icon: Gauge, status: isAnyRunning ? 'RUNNING' : 'IDLE', statusColor: isAnyRunning ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
                    ].map(s => (
                        <div key={s.title} className="flex gap-3">
                            <div className="mt-0.5"><s.icon className="w-7 h-7 text-slate-400" /></div>
                            <div>
                                <h4 className="font-bold text-white text-sm">{s.title}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                                <span className={`mt-2 inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${s.statusColor}`}>{s.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Log */}
            {actionLog.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <Clock className="w-3.5 h-3.5" /> {t('engine.actionLog.title')}
                    </h3>
                    <div className="space-y-2">
                        {actionLog.map((log, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm py-1.5">
                                {log.status === 'success'
                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    : <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                <span className="font-medium text-slate-700">{log.action}</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                    log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                }`}>{log.status.toUpperCase()}</span>
                                <span className="ml-auto text-xs text-slate-400 font-mono">{log.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
