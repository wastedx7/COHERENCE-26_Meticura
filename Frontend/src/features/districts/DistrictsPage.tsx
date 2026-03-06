import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ErrorState, LoadingState, EmptyState } from '../../components/ui/States';
import { useDistricts } from '../../api/hooks/useBudget';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { UtilizationBar } from '../../components/common/UtilizationBar';
import { AnomalyBadge } from '../../components/common/AnomalyBadge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { MapPin, Building2 } from 'lucide-react';
import { formatPercent } from '../../lib/utils';

export const DistrictsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: districts, isLoading, error } = useDistricts();

  const filteredDistricts = districts?.filter((d) =>
    d.district_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Districts" description="National district overview" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Districts" description="National district overview" />
        <ErrorState message="Failed to load districts. Please try again." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Districts"
        description="View and manage budget across all districts"
      />

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search districts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Districts Grid */}
      {filteredDistricts.length === 0 ? (
        <EmptyState
          icon={<MapPin size={48} />}
          title={searchQuery ? 'No districts found' : 'No districts available'}
          description={
            searchQuery
              ? `No districts match "${searchQuery}"`
              : 'There are no districts to display'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDistricts.map((district) => (
            <Card
              key={district.district_id}
              hover
              onClick={() => navigate(`/dashboard/districts/${district.district_id}`)}
              className="cursor-pointer"
            >
              <CardContent>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {district.district_name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Building2 size={14} />
                        {district.department_count} Departments
                      </p>
                    </div>
                    {district.anomaly_count > 0 && (
                      <AnomalyBadge
                        severity="high"
                        count={district.anomaly_count}
                        size="sm"
                        showLabel={false}
                      />
                    )}
                  </div>

                  {/* Budget Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allocated:</span>
                      <CurrencyDisplay amount={district.total_allocated} compact />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spent:</span>
                      <CurrencyDisplay amount={district.total_spent} compact />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <CurrencyDisplay amount={district.total_remaining} compact />
                    </div>
                  </div>

                  {/* Utilization */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Utilization</span>
                      <span className="text-sm font-semibold font-mono">
                        {formatPercent(district.utilization_pct)}
                      </span>
                    </div>
                    <UtilizationBar
                      allocated={district.total_allocated}
                      spent={district.total_spent}
                      remaining={district.total_remaining}
                      height="md"
                    />
                  </div>

                  {/* Risk Warning */}
                  {district.high_risk_count > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-red-600">
                        ⚠️ {district.high_risk_count} department(s) at risk
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
