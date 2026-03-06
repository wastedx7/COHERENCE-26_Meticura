import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ErrorState, LoadingState, EmptyState } from '../../components/ui/States';
import { useDistrictDetail } from '../../api/hooks/useBudget';
import { usePredictions } from '../../api/hooks/usePredictions';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { UtilizationBar } from '../../components/common/UtilizationBar';
import { RiskIndicator } from '../../components/common/RiskIndicator';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { ChevronRight } from 'lucide-react';
import { formatPercent, formatRelativeDate } from '../../lib/utils';

export const DistrictDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'utilization' | 'risk'>('name');

  const {
    data: districtData,
    isLoading,
    error,
  } = useDistrictDetail(id || '');

  const { data: predictionsData } = usePredictions();
  const predictions = predictionsData?.predictions || [];

  if (!id) {
    return (
      <div>
        <PageHeader title="District Detail" />
        <ErrorState message="No district ID provided" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="District Detail" />
        <SkeletonTable rows={10} />
      </div>
    );
  }

  if (error || !districtData) {
    return (
      <div>
        <PageHeader title="District Detail" />
        <ErrorState message="Failed to load district details" />
      </div>
    );
  }

  // Filter and sort departments
  let filteredDepts = districtData.departments.filter((d) =>
    d.dept_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortBy === 'utilization') {
    filteredDepts.sort((a, b) => b.utilization_pct - a.utilization_pct);
  } else if (sortBy === 'risk') {
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
    filteredDepts.sort(
      (a, b) => riskOrder[a.risk_level as keyof typeof riskOrder] - riskOrder[b.risk_level as keyof typeof riskOrder]
    );
  } else {
    filteredDepts.sort((a, b) => a.dept_name.localeCompare(b.dept_name));
  }

  return (
    <div>
      <PageHeader
        title={districtData.district.name}
        breadcrumbs={[
          { label: 'Districts', path: '/dashboard/districts' },
          { label: districtData.district.name },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600 mb-1">Total Allocated</p>
            <p className="text-xl font-bold font-mono">
              <CurrencyDisplay amount={districtData.summary.total_allocated} compact />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600 mb-1">Total Spent</p>
            <p className="text-xl font-bold font-mono">
              <CurrencyDisplay amount={districtData.summary.total_spent} compact />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600 mb-1">Total Remaining</p>
            <p className="text-xl font-bold font-mono">
              <CurrencyDisplay amount={districtData.summary.total_remaining} compact />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600 mb-1">Utilization</p>
            <p className="text-xl font-bold font-mono">
              {formatPercent(districtData.summary.utilization_pct)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Departments Table */}
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div>
              <CardTitle>Departments ({filteredDepts.length})</CardTitle>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="utilization">Sort by Utilization</option>
                <option value="risk">Sort by Risk</option>
              </select>
            </div>

            {/* Table */}
            {filteredDepts.length === 0 ? (
              <EmptyState title="No departments found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Department</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">Allocated</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">Spent</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">Utilization</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">Risk</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Last Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepts.map((dept) => (
                      <tr
                        key={dept.dept_id}
                        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/dashboard/department/${dept.dept_id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{dept.dept_name}</span>
                            {dept.has_anomaly && (
                              <span className="inline-block h-2 w-2 bg-red-500 rounded-full"></span>
                            )}
                          </div>
                        </td>
                        <td className="text-right px-4 py-3 font-mono">
                          <CurrencyDisplay amount={dept.allocated} compact />
                        </td>
                        <td className="text-right px-4 py-3 font-mono">
                          <CurrencyDisplay amount={dept.spent} compact />
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-block">
                            <UtilizationBar
                              allocated={dept.allocated}
                              spent={dept.spent}
                              remaining={dept.remaining}
                              height="sm"
                              className="w-24"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                              {formatPercent(dept.utilization_pct)}
                            </p>
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <RiskIndicator risk={dept.risk_level || 'none'} showLabel={false} />
                        </td>
                        <td className="text-left px-4 py-3 text-gray-600">
                          {dept.last_transaction_date
                            ? formatRelativeDate(dept.last_transaction_date)
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
