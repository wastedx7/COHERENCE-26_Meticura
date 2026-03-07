import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText, Download, Filter, FileBox, Activity, AlertTriangle,
  ArrowRightLeft, Loader2, CheckCircle2, AlertCircle,
  BarChart3, TrendingUp, Calendar, Sparkles
} from 'lucide-react';
import { api } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

type ReportType = 'anomalies' | 'lapse' | 'budget' | 'reallocation';
type DepartmentOption = { id: number; name: string };

const reportCards = [
  { id: 'anomalies', label: 'Anomaly Reports', icon: AlertTriangle, desc: 'Rule-based and ML-detected anomalies', color: 'from-red-500 to-rose-500', lightBg: 'bg-red-50', lightText: 'text-red-700', lightBorder: 'border-red-200' },
  { id: 'lapse', label: 'Lapse Predictions', icon: Activity, desc: 'EOFY forecast and risk scores by department', color: 'from-amber-500 to-orange-500', lightBg: 'bg-amber-50', lightText: 'text-amber-700', lightBorder: 'border-amber-200' },
  { id: 'budget', label: 'Budget Allocation', icon: BarChart3, desc: 'Current allocation and utilization data', color: 'from-indigo-500 to-blue-500', lightBg: 'bg-indigo-50', lightText: 'text-indigo-700', lightBorder: 'border-indigo-200' },
  { id: 'reallocation', label: 'Transfer Logs', icon: ArrowRightLeft, desc: 'Audit trail of executed reallocations', color: 'from-emerald-500 to-teal-500', lightBg: 'bg-emerald-50', lightText: 'text-emerald-700', lightBorder: 'border-emerald-200' },
] as const;

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState<ReportType>('anomalies');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [riskLevel, setRiskLevel] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [downloadHistory, setDownloadHistory] = useState<{ type: string; format: string; time: string }[]>([]);

  useEffect(() => {
    api.get('/budget/?limit=200&offset=0')
      .then(res => {
        const rows = res.data?.budgets || [];
        setDepartments(rows.map((r: any) => ({ id: Number(r.department_id), name: r.department_name || `Department ${r.department_id}` })));
      })
      .catch(() => setDepartments([]));
  }, []);

  const activeCard = reportCards.find(c => c.id === reportType)!;
  const canDownloadPdf = useMemo(() => reportType === 'anomalies' || reportType === 'lapse', [reportType]);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (departmentId) params.set('department_id', departmentId);
    if (reportType === 'anomalies' && severity) params.set('severity', severity);
    if (reportType === 'lapse' && riskLevel) params.set('risk_level', riskLevel);
    if (reportType === 'reallocation' && statusFilter) params.set('status', statusFilter);
    return params.toString() ? `?${params.toString()}` : '';
  };

  const handleDownload = async (format: 'pdf' | 'csv') => {
    setIsLoading(true);
    setMessage(null);
    setMessageType(null);
    try {
      if (reportType === 'reallocation') {
        if (format === 'pdf') throw new Error('PDF export is not available for reallocation yet. Use CSV.');
        const q = buildQuery();
        const res = await api.get(`/reallocation/suggestions${q}`);
        const rows = Array.isArray(res.data) ? res.data : [];
        const header = 'id,donor_dept_id,recipient_dept_id,suggested_amount,priority,status,reason,created_at\n';
        const csv = header + rows.map((r: any) =>
          [r.id, r.donor_dept_id, r.recipient_dept_id, r.suggested_amount, r.priority, r.status, `"${String(r.reason || '').replace(/"/g, '""')}"`, r.created_at].join(',')
        ).join('\n');
        downloadBlob(new Blob([csv], { type: 'text/csv' }), `reallocation_${Date.now()}.csv`);
      } else {
        const q = buildQuery();
        const endpointMap: Record<ReportType, { csv: string; pdf?: string }> = {
          anomalies: { csv: `/export/anomalies.csv${q}`, pdf: `/export/anomalies.pdf${q}` },
          lapse: { csv: `/export/predictions.csv${q}`, pdf: `/export/predictions.pdf${q}` },
          budget: { csv: '/export/budgets.csv' },
          reallocation: { csv: '' },
        };
        const endpoint = format === 'pdf' ? endpointMap[reportType].pdf : endpointMap[reportType].csv;
        if (!endpoint) throw new Error('Selected format is not available for this report type.');
        const res = await api.get(endpoint, { responseType: 'blob' });
        downloadBlob(res.data, `${reportType}_${Date.now()}.${format}`);
      }
      setMessage('Report downloaded successfully.');
      setMessageType('success');
      setDownloadHistory(prev => [{ type: t(`reports.card.${reportType}.label`), format: format.toUpperCase(), time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || err?.message || 'Failed to download report');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('reports.title')}</h1>
          <p className="text-slate-500 text-sm">{t('reports.subtitle')}</p>
        </div>
      </div>

      {/* Notification */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm animate-fade-in ${
          messageType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {messageType === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="font-medium">{message}</span>
        </div>
      )}

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map(rc => {
          const isActive = reportType === rc.id;
          return (
            <button
              key={rc.id}
              onClick={() => setReportType(rc.id as ReportType)}
              className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 border group ${
                isActive
                  ? `${rc.lightBg} ${rc.lightBorder} shadow-md ring-2 ring-offset-1 ring-${rc.id === 'anomalies' ? 'red' : rc.id === 'lapse' ? 'amber' : rc.id === 'budget' ? 'indigo' : 'emerald'}-500/20`
                  : 'bg-white border-slate-200 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${isActive ? rc.lightBg : ''}`} />
              <div className="relative z-10">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${
                  isActive ? `bg-gradient-to-br ${rc.color} shadow-sm` : 'bg-slate-100 group-hover:bg-slate-200'
                } transition-colors`}>
                  <rc.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <h3 className={`font-bold text-sm ${isActive ? rc.lightText : 'text-slate-800'}`}>{t(`reports.card.${rc.id}.label`)}</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{t(`reports.card.${rc.id}.desc`)}</p>
              </div>
              {isActive && <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${rc.color}`} />}
            </button>
          );
        })}
      </div>

      {/* Main controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter panel */}
        <div className="glass-card p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
            <Filter className="w-4 h-4" /> {t('reports.filters.title')}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('reports.filters.department')}</label>
            <select value={departmentId} onChange={e => setDepartmentId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all">
              <option value="">{t('reports.filters.department.all')}</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.id})</option>)}
            </select>
          </div>

          {reportType === 'anomalies' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('reports.filters.severity')}</label>
              <select value={severity} onChange={e => setSeverity(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all">
                <option value="">{t('reports.filters.severity.all')}</option>
                {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          )}
          {reportType === 'lapse' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('reports.filters.riskLevel')}</label>
              <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all">
                <option value="">{t('reports.filters.riskLevel.all')}</option>
                {['low', 'medium', 'high', 'critical', 'depleted'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          )}
          {reportType === 'reallocation' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('reports.filters.transferStatus')}</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all">
                {['pending', 'approved', 'rejected', 'executed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          )}

          {/* Download buttons */}
          <div className="mt-auto pt-4 border-t border-slate-100 space-y-2.5">
            <button disabled={isLoading || !canDownloadPdf} onClick={() => handleDownload('pdf')}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-black hover:to-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20 font-semibold transition-all disabled:opacity-40 disabled:shadow-none text-sm">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {t('reports.download.pdf')}
            </button>
            <button disabled={isLoading} onClick={() => handleDownload('csv')}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm font-semibold transition-all disabled:opacity-40 text-sm">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {t('reports.download.csv')}
            </button>
          </div>
        </div>

        {/* Preview & Info */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Active report info banner */}
          <div className={`rounded-2xl p-6 border ${activeCard.lightBorder} ${activeCard.lightBg} relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${activeCard.color} opacity-5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3`} />
            <div className="relative z-10 flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeCard.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <activeCard.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${activeCard.lightText}`}>{t(`reports.card.${activeCard.id}.label`)}</h2>
                <p className="text-slate-600 text-sm mt-1">{t(`reports.card.${activeCard.id}.desc`)}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/60 border border-white/80 px-2 py-0.5 rounded-full text-slate-600">
                    <Sparkles className="w-3 h-3" /> {t('common.liveData')}
                  </span>
                  {canDownloadPdf && <span className="text-[10px] font-bold bg-white/60 border border-white/80 px-2 py-0.5 rounded-full text-slate-600">{t('common.pdfCsv')}</span>}
                  {!canDownloadPdf && <span className="text-[10px] font-bold bg-white/60 border border-white/80 px-2 py-0.5 rounded-full text-slate-600">{t('common.csvOnly')}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Preview placeholder */}
          <div className="glass-card flex-1 flex flex-col justify-center items-center p-10 border-dashed border-2 border-slate-200 relative overflow-hidden min-h-[220px]">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50" />
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileBox className="w-10 h-10 text-slate-300" />
              </div>
              <p className="font-bold text-slate-600 text-lg">{t('reports.preview.title')}</p>
              <p className="text-sm text-slate-400 max-w-md mt-2">
                {t('reports.preview.description')}
              </p>
            </div>
          </div>

          {/* Download history */}
          {downloadHistory.length > 0 && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> {t('reports.history.title')}
              </h4>
              <div className="space-y-2">
                {downloadHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{h.type}</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 rounded text-slate-500">{h.format}</span>
                    <span className="ml-auto text-xs text-slate-400">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
