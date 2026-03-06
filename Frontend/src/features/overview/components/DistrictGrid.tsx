import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDistricts } from '../../../api/hooks/useBudget';
import { Card, CardContent, CardTitle } from '../../../components/ui/Card';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import { ErrorState, EmptyState } from '../../../components/ui/States';
import { CurrencyDisplay } from '../../../components/common/CurrencyDisplay';
import { UtilizationBar } from '../../../components/common/UtilizationBar';
import { AnomalyBadge } from '../../../components/common/AnomalyBadge';
import { MapPin } from 'lucide-react';
import { formatPercent } from '../../../lib/utils';

export const DistrictGrid: React.FC = () => {
  const navigate = useNavigate();
  const { data: districts, isLoading, error } = useDistricts();

  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">Districts</h2>
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
        <h2 className="text-lg font-semibold mb-4">Districts</h2>
        <ErrorState message="Failed to load districts" />
      </div>
    );
  }

  if (!districts || districts.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">Districts</h2>
        <EmptyState
          icon={<MapPin size={48} />}
          title="No districts found"
          description="There are no districts to display at the moment."
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Districts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {districts.map((district) => (
          <Card
            key={district.district_id}
            hover
            onClick={() => navigate(`/dashboard/districts/${district.district_id}`)}
          >
            <CardContent>
              <div className="flex items-start justify-between mb-3">
                <CardTitle className="text-base">{district.district_name}</CardTitle>
                {district.anomaly_count > 0 && (
                  <AnomalyBadge
                    severity="high"
                    count={district.anomaly_count}
                    size="sm"
                    showLabel={false}
                  />
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Departments:</span>
                  <span className="font-medium">{district.department_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Allocated:</span>
                  <CurrencyDisplay amount={district.total_allocated} compact />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilization:</span>
                  <span className="font-medium font-mono">
                    {formatPercent(district.utilization_pct)}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <UtilizationBar
                  allocated={district.total_allocated}
                  spent={district.total_spent}
                  remaining={district.total_remaining}
                  height="sm"
                />
              </div>

              {district.high_risk_count > 0 && (
                <div className="mt-2 text-xs text-red-600 font-medium">
                  {district.high_risk_count} department(s) at high risk
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
