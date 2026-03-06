import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ErrorState, LoadingState, EmptyState } from '../../components/ui/States';
import { useAnomalies, useResolveAnomaly } from '../../api/hooks/useAnomalies';
import { useFilterStore } from '../../store';
import { AnomalyBadge } from '../../components/common/AnomalyBadge';
import { DateDisplay } from '../../components/common/DateDisplay';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { formatRelativeDate } from '../../lib/utils';
import type { AnomalySeverity } from '../../api/types';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'resolved' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const anomalyFilters = useFilterStore((state) => state.anomalyFilters);
  const setAnomalyFilters = useFilterStore((state) => state.setAnomalyFilters);

  const { mutate: resolveAnomaly, isPending: isResolving } = useResolveAnomaly();

  // Fetch anomalies with filters
  const {
    data: anomaliesData,
    isLoading,
    error,
  } = useAnomalies({
    severity: selectedSeverities.length > 0 ? selectedSeverities : undefined,
    status,
    limit: 50,
    offset: (page - 1) * 50,
  });

  const anomalies = anomaliesData?.anomalies || [];
  const total = anomaliesData?.total || 0;
  const totalPages = Math.ceil(total / 50);

  const handleResolve = (anomalyId: string) => {
    resolveAnomaly({ anomalyId }, { onSuccess: () => {} });
  };

  const handleToggleSeverity = (severity: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
    setPage(1); // Reset to first page
  };

  const filteredAnomalies = anomalies.filter((a) =>
    a.dept_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.anomaly_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Alerts Center" description="Manage and resolve anomalies" />
        <SkeletonTable rows={10} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Alerts Center" description="Manage and resolve anomalies" />
        <ErrorState message="Failed to load alerts. Please try again." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Alerts Center"
        description={`${total} total alerts`}
      />

      {/* Filters Card */}
      <Card className="mb-6">
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>

            {/* Search */}
            <Input
              placeholder="Search by department or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as any);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <div className="flex flex-wrap gap-2">
                {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => handleToggleSeverity(sev)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedSeverities.includes(sev)
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      {filteredAnomalies.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<AlertTriangle size={48} className="text-green-500" />}
              title={searchQuery ? 'No alerts found' : 'No active alerts'}
              description={
                searchQuery
                  ? `No alerts match "${searchQuery}"`
                  : 'All systems operating normally'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Severity</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Detected</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnomalies.map((alert) => (
                  <tr
                    key={alert.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <AnomalyBadge severity={alert.severity} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/dashboard/department/${alert.dept_id}`)}
                        className="text-blue-600 hover:underline"
                      >
                        {alert.dept_name || `Dept ${alert.dept_id}`}
                      </button>
                    </td>
                    <td className="px-4 py-3">{alert.anomaly_type}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <DateDisplay date={alert.detected_at} format="relative" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {alert.resolved_at ? (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!alert.resolved_at && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleResolve(alert.id)}
                          isLoading={isResolving}
                        >
                          Resolve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
