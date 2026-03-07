import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Network, AlertTriangle, ShieldCheck, TrendingDown, Loader2, RefreshCw,
  ChevronDown, ChevronRight, Building2, Eye, BarChart3, Zap, Search,
  Filter, ArrowUpRight
} from 'lucide-react';
import { api } from '../../lib/api';

type DeptNode = {
  department_id: number;
  department_name: string;
  status: 'healthy' | 'warning' | 'critical';
  utilization: number;
  anomalyScore?: number;
  lapseRisk?: string;
  allocated?: number;
  spent?: number;
};

const STATUS_CONFIG = {
  critical: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-200 hover:border-red-300',
    ring: 'ring-red-500/20',
    dot: 'bg-red-500',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700 border-red-200',
    glow: 'shadow-red-100',
    icon: AlertTriangle,
    bar: 'from-red-500 to-rose-500',
  },
  warning: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-200 hover:border-amber-300',
    ring: 'ring-amber-500/20',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    glow: 'shadow-amber-100',
    icon: TrendingDown,
    bar: 'from-amber-500 to-orange-500',
  },
  healthy: {
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    border: 'border-emerald-200 hover:border-emerald-300',
    ring: 'ring-emerald-500/20',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    glow: 'shadow-emerald-100',
    icon: ShieldCheck,
    bar: 'from-emerald-500 to-teal-500',
  },
} as const;

export default function TreePage() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<DeptNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ critical: true, warning: true, healthy: true });
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [selectedNode, setSelectedNode] = useState<DeptNode | null>(null);

  const fetchTreeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [topBudgetRes, anomalyRes, lapseRes] = await Promise.all([
        api.get('/budget/top-utilization?limit=50'),
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
          allocated: row.allocated_budget || 0,
          spent: row.spent_amount || 0,
        };
      });
      setNodes(computed);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load organization tree data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTreeData(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return nodes;
    const q = search.toLowerCase();
    return nodes.filter(n => n.department_name.toLowerCase().includes(q) || String(n.department_id).includes(q));
  }, [nodes, search]);

  const grouped = useMemo(() => ({
    critical: filtered.filter(n => n.status === 'critical'),
    warning: filtered.filter(n => n.status === 'warning'),
    healthy: filtered.filter(n => n.status === 'healthy'),
  }), [filtered]);

  const toggleGroup = (key: string) => setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const fmt = (n: number) => {
    if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`;
    if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
    return n.toLocaleString();
  };

  const NodeCard = ({ node }: { node: DeptNode }) => {
    const cfg = STATUS_CONFIG[node.status];
    const Icon = cfg.icon;
    return (
      <div
        onClick={() => setSelectedNode(selectedNode?.department_id === node.department_id ? null : node)}
        className={`relative rounded-2xl border ${cfg.border} ${cfg.bg} p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${cfg.glow} hover:-translate-y-0.5 group overflow-hidden`}
      >
        {/* Glow accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${cfg.dot} opacity-5 blur-2xl -translate-y-1/2 translate-x-1/2`} />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl ${cfg.badge} border flex items-center justify-center`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm leading-tight">{node.department_name}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID #{node.department_id}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.badge} border`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${node.status === 'critical' ? 'animate-pulse' : ''}`} />
              {node.status}
            </div>
          </div>

          {/* Utilization bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">Utilization</span>
              <span className="font-bold text-slate-700">{node.utilization.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden shadow-inner">
              <div className={`h-full rounded-full bg-gradient-to-r ${cfg.bar} transition-all duration-700`} style={{ width: `${Math.min(node.utilization, 100)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white/60 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 block">Lapse Risk</span>
              <span className="font-bold text-slate-700 capitalize">{node.lapseRisk || 'low'}</span>
            </div>
            <div className="bg-white/60 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 block">Anomaly</span>
              <span className="font-bold text-slate-700">{node.anomalyScore != null ? node.anomalyScore.toFixed(2) : '—'}</span>
            </div>
          </div>

          {node.allocated != null && node.allocated > 0 && (
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span>Alloc: ₹{fmt(node.allocated)}</span>
              <span>Spent: ₹{fmt(node.spent || 0)}</span>
            </div>
          )}
        </div>

        {/* Quick action */}
        <button
          onClick={e => { e.stopPropagation(); navigate(`/budget/department/${node.department_id}`); }}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/80 shadow-sm hover:bg-white"
          title="View department budget"
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
        </button>
      </div>
    );
  };

  const TreeGroup = ({ title, nodes: groupNodes, statusKey, count }: { title: string; nodes: DeptNode[]; statusKey: string; count: number; }) => {
    const isExpanded = expandedGroups[statusKey] ?? true;
    const cfg = STATUS_CONFIG[statusKey as keyof typeof STATUS_CONFIG];
    return (
      <div className="mb-6">
        <button onClick={() => toggleGroup(statusKey)} className="w-full flex items-center gap-3 mb-3 group">
          <div className={`w-8 h-8 rounded-lg ${cfg.badge} border flex items-center justify-center`}>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-700">{title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.badge} border`}>{count}</span>
          </div>
          {/* Connector line */}
          <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
        </button>
        {isExpanded && (
          <div className="ml-4 pl-4 border-l-2 border-dashed border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {groupNodes.map(n => <NodeCard key={n.department_id} node={n} />)}
            </div>
            {groupNodes.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No departments in this category</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organization Tree</h1>
              <p className="text-slate-500 text-sm">Live hierarchy with budget, anomaly & lapse risk signals</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
            <button onClick={() => setViewMode('tree')} className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'tree' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Network className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={fetchTreeData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl shadow-md shadow-indigo-500/20 font-medium text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Departments', value: nodes.length, icon: Building2, color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
          { label: 'Critical', value: grouped.critical.length, icon: AlertTriangle, color: 'from-red-500 to-rose-500', bg: 'bg-red-50', text: 'text-red-700' },
          { label: 'Warning', value: grouped.warning.length, icon: TrendingDown, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700' },
          { label: 'Healthy', value: grouped.healthy.length, icon: ShieldCheck, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-3 border hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search departments by name or ID..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 text-sm transition-all"
        />
        {search && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="glass-card py-20 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
            <Network className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-slate-500 font-medium">Building organization tree...</p>
        </div>
      ) : error ? (
        <div className="glass-card py-16 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <button onClick={fetchTreeData} className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1.5 transition-colors">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : nodes.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No department data available</p>
        </div>
      ) : viewMode === 'tree' ? (
        <div className="glass-card p-6">
          {/* Root node */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25 text-white">
              <Network className="w-5 h-5" />
              <div>
                <p className="font-bold text-sm">Meticura Central</p>
                <p className="text-indigo-200 text-[10px]">{nodes.length} departments monitored</p>
              </div>
            </div>
          </div>
          {/* Vertical connector */}
          <div className="w-px h-6 bg-gradient-to-b from-indigo-300 to-slate-200 mx-auto" />

          <TreeGroup title="Critical Departments" nodes={grouped.critical} statusKey="critical" count={grouped.critical.length} />
          <TreeGroup title="Warning Departments" nodes={grouped.warning} statusKey="warning" count={grouped.warning.length} />
          <TreeGroup title="Healthy Departments" nodes={grouped.healthy} statusKey="healthy" count={grouped.healthy.length} />
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(n => <NodeCard key={n.department_id} node={n} />)}
        </div>
      )}

      {/* Detail drawer */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelectedNode(null)}>
          <div className="w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto animate-slide-in-right" onClick={e => e.stopPropagation()}>
            <div className={`p-6 bg-gradient-to-br ${STATUS_CONFIG[selectedNode.status].bar} text-white`}>
              <button onClick={() => setSelectedNode(null)} className="mb-4 text-white/70 hover:text-white text-sm">&larr; Close</button>
              <h2 className="text-xl font-bold">{selectedNode.department_name}</h2>
              <p className="text-white/70 text-sm mt-1">Department #{selectedNode.department_id}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Status', value: selectedNode.status, capitalize: true },
                  { label: 'Utilization', value: `${selectedNode.utilization.toFixed(1)}%` },
                  { label: 'Lapse Risk', value: selectedNode.lapseRisk || 'low', capitalize: true },
                  { label: 'Anomaly Score', value: selectedNode.anomalyScore?.toFixed(3) ?? 'N/A' },
                ].map(m => (
                  <div key={m.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{m.label}</p>
                    <p className={`text-lg font-bold text-slate-800 ${m.capitalize ? 'capitalize' : ''}`}>{m.value}</p>
                  </div>
                ))}
              </div>
              {selectedNode.allocated != null && selectedNode.allocated > 0 && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Budget</p>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Allocated</span>
                    <span className="font-bold text-slate-800">₹{fmt(selectedNode.allocated)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Spent</span>
                    <span className="font-bold text-slate-800">₹{fmt(selectedNode.spent || 0)}</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setSelectedNode(null); navigate(`/budget/department/${selectedNode.department_id}`); }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" /> View Full Details
              </button>
              <button
                onClick={() => { setSelectedNode(null); navigate(`/anomalies/department/${selectedNode.department_id}`); }}
                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> View Anomalies
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Network className="w-3.5 h-3.5" />
          Budget utilization + anomaly signals + lapse risk
        </div>
        <span>{nodes.length} departments &bull; Last refreshed just now</span>
      </div>
    </div>
  );
}
