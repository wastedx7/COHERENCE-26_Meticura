import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Filter,
  FileBox,
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../lib/api';

type ReportType = 'anomalies' | 'lapse' | 'budget' | 'reallocation';

type DepartmentOption = { id: number; name: string };

const reportCards = [
  { id: 'anomalies', label: 'Anomaly Reports', icon: AlertTriangle, desc: 'Detailed lists of rule and ML anomalies' },
  { id: 'lapse', label: 'Lapse Predictions', icon: Activity, desc: 'EOFY forecast and risk scores by department' },
  { id: 'budget', label: 'Budget Allocation', icon: FileBox, desc: 'Current allocation and utilization data' },
  { id: 'reallocation', label: 'Transfer Logs', icon: ArrowRightLeft, desc: 'Audit trail of executed reallocations' },
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
  const [reportType, setReportType] = useState<ReportType>('anomalies');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [riskLevel, setRiskLevel] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await api.get('/budget/?limit=200&offset=0');
        const rows = res.data?.budgets || [];
        setDepartments(
          rows.map((r: any) => ({ id: Number(r.department_id), name: r.department_name || `Department ${r.department_id}` }))
        );
      } catch {
        setDepartments([]);
      }
    };
    loadDepartments();
  }, []);

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
        // No export endpoint exists for reallocation; generate CSV client-side.
        if (format === 'pdf') {
          throw new Error('PDF export is not available for reallocation yet. Use CSV export.');
        }
        const q = buildQuery();
        const res = await api.get(`/reallocation/suggestions${q}`);
        const rows = Array.isArray(res.data) ? res.data : [];
        const header = 'id,donor_dept_id,recipient_dept_id,suggested_amount,priority,status,reason,created_at\n';
        const csv = header + rows
          .map((r: any) => [r.id, r.donor_dept_id, r.recipient_dept_id, r.suggested_amount, r.priority, r.status, `"${String(r.reason || '').replace(/"/g, '""')}"`, r.created_at].join(','))
          .join('\n');
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
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || err?.message || 'Failed to download report');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Report Generator</h1>
        <p className="text-slate-500 mt-1">Export structured financial intelligence using live backend data</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg border flex items-center gap-2 ${
          messageType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {messageType === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {reportCards.map((rc) => (
          <div
            key={rc.id}
            onClick={() => setReportType(rc.id as ReportType)}
            className={`border rounded-xl p-5 cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
              reportType === rc.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`p-3 rounded-full mb-3 ${reportType === rc.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
              <rc.icon className="w-6 h-6" />
            </div>
            <h3 className={`font-bold ${reportType === rc.id ? 'text-indigo-800' : 'text-slate-800'}`}>{rc.label}</h3>
            <p className="text-xs text-slate-500 mt-1">{rc.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass-card flex flex-col md:flex-row gap-8 overflow-hidden">
        <div className="p-8 w-full md:w-1/3 bg-slate-50/50 border-r border-slate-100 flex flex-col gap-6 relative z-10">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4" /> Filter Options
            </h3>

            <label className="block text-sm font-semibold text-slate-700 mb-1 mt-4">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
              ))}
            </select>

            {reportType === 'anomalies' && (
              <>
                <label className="block text-sm font-semibold text-slate-700 mb-1 mt-4">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </>
            )}

            {reportType === 'lapse' && (
              <>
                <label className="block text-sm font-semibold text-slate-700 mb-1 mt-4">Risk Level</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Risk Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                  <option value="depleted">Depleted</option>
                </select>
              </>
            )}

            {reportType === 'reallocation' && (
              <>
                <label className="block text-sm font-semibold text-slate-700 mb-1 mt-4">Transfer Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="executed">Executed</option>
                </select>
              </>
            )}
          </div>

          <div className="mt-auto space-y-3 pt-6 border-t border-slate-200 flex flex-col gap-2">
            <button
              disabled={isLoading || !canDownloadPdf}
              onClick={() => handleDownload('pdf')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-black text-white rounded-xl shadow font-semibold transition-colors disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download PDF
            </button>
            <button
              disabled={isLoading}
              onClick={() => handleDownload('csv')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm font-semibold transition-colors disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Export CSV
            </button>
          </div>
        </div>

        <div className="p-8 flex-1 flex flex-col justify-center items-center text-slate-400 border-dashed border-2 border-slate-100 m-8 rounded-2xl bg-white/30 backdrop-blur-sm relative overflow-hidden">
          <FileText className="w-16 h-16 text-slate-200 mb-4" />
          <p className="font-semibold text-lg text-slate-500">Live Export Mode</p>
          <p className="text-sm max-w-sm text-center mt-2">
            Choose report type and filters, then download PDF/CSV from backend export APIs.
          </p>
          <div className="absolute right-[-20%] bottom-[-20%] w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl z-[-1]"></div>
        </div>
      </div>
    </div>
  );
}
