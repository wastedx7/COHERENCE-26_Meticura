import React, { useEffect, useMemo, useState } from 'react';
import { Network, AlertTriangle, ShieldCheck, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';

type DeptNode = {
  department_id: number;
  department_name: string;
  status: 'healthy' | 'warning' | 'critical';
  utilization: number;
  anomalyScore?: number;
  lapseRisk?: string;
};

export default function TreePage() {
  const [nodes, setNodes] = useState<DeptNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTreeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [topBudgetRes, anomalyRes, lapseRes] = await Promise.all([
        api.get('/budget/top-utilization?limit=24'),
        api.get('/anomalies/critical?limit=50'),
        api.get('/lapse/critical?limit=50'),
      ]);

      const budgetRows = topBudgetRes.data?.top_utilization || [];
      const anomalyRows = anomalyRes.data?.data || [];
      const lapseRows = lapseRes.data?.data || [];

      const anomalyMap = new Map<number, any>();
      for (const row of anomalyRows) {
        const id = Number(row.department_id || row.dept_id || row?.detection?.department_id || 0);
        if (id) anomalyMap.set(id, row);
      }

      const lapseMap = new Map<number, any>();
      for (const row of lapseRows) {
        const id = Number(row.dept_id || row.department_id || 0);
        if (id) lapseMap.set(id, row);
      }

      const computed: DeptNode[] = budgetRows.map((row: any) => {
        const deptId = Number(row.department_id || 0);
        const hasAnomaly = anomalyMap.has(deptId);
        const lapse = lapseMap.get(deptId);
        const lapseRisk = lapse?.risk_level || 'low';

        let status: DeptNode['status'] = 'healthy';
        if (hasAnomaly || lapseRisk === 'critical' || lapseRisk === 'high' || row.status === 'exceeded') {
          status = 'critical';
        } else if (row.status === 'at-risk' || lapseRisk === 'medium') {
          status = 'warning';
        }

        return {
          department_id: deptId,
          department_name: row.department_name || `Department ${deptId}`,
          status,
          utilization: Number(row.utilization_percentage || 0),
          anomalyScore: anomalyMap.get(deptId)?.combined_score,
          lapseRisk,
        };
      });

      setNodes(computed);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load organization tree data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTreeData();
  }, []);

  const grouped = useMemo(() => {
    return {
      critical: nodes.filter((n) => n.status === 'critical'),
      warning: nodes.filter((n) => n.status === 'warning'),
      healthy: nodes.filter((n) => n.status === 'healthy'),
    };
  }, [nodes]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organization Tree</h1>
          <p className="text-slate-500 mt-1">Live hierarchy view by budget utilization, anomaly signals, and lapse risk</p>
        </div>
        <button
          onClick={fetchTreeData}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Tree'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 border border-red-100">
          <p className="text-sm text-slate-500">Critical</p>
          <p className="text-2xl font-bold text-red-600">{grouped.critical.length}</p>
        </div>
        <div className="glass-panel p-4 border border-amber-100">
          <p className="text-sm text-slate-500">Warning</p>
          <p className="text-2xl font-bold text-amber-600">{grouped.warning.length}</p>
        </div>
        <div className="glass-panel p-4 border border-emerald-100">
          <p className="text-sm text-slate-500">Healthy</p>
          <p className="text-2xl font-bold text-emerald-600">{grouped.healthy.length}</p>
        </div>
      </div>

      <div className="glass-card p-6">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
            <p>Loading organization tree...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button onClick={fetchTreeData} className="mt-3 text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : nodes.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No department data available.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node) => (
              <div key={node.department_id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{node.department_name}</p>
                    <p className="text-xs text-slate-500">ID: {node.department_id}</p>
                  </div>
                  {node.status === 'critical' ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : node.status === 'warning' ? (
                    <TrendingDown className="w-5 h-5 text-amber-500" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-600">Utilization: <span className="font-semibold text-slate-800">{node.utilization.toFixed(2)}%</span></p>
                  <p className="text-slate-600">Lapse Risk: <span className="font-semibold capitalize text-slate-800">{node.lapseRisk || 'low'}</span></p>
                  <p className="text-slate-600">Status: <span className={`font-semibold capitalize ${
                    node.status === 'critical' ? 'text-red-600' : node.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>{node.status}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 inline-flex items-center gap-2">
        <Network className="w-4 h-4" />
        Data source: budget utilization + anomaly critical list + lapse critical list
      </div>
    </div>
  );
}
