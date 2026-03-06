import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/States';
import { AnomalyBadge } from '../../../components/common/AnomalyBadge';
import { DateDisplay } from '../../../components/common/DateDisplay';
import { AlertTriangle } from 'lucide-react';
import type { Anomaly } from '../../../api/types';

interface LiveAlertsPanelProps {
  alerts: Anomaly[];
  isLoading: boolean;
}

export const LiveAlertsPanel: React.FC<LiveAlertsPanelProps> = ({ alerts, isLoading }) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            Live Alerts
          </CardTitle>
          <button
            onClick={() => navigate('/dashboard/alerts')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle size={32} />}
            title="No active alerts"
            description="All systems are running smoothly"
          />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/dashboard/department/${alert.dept_id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <AnomalyBadge severity={alert.severity} size="sm" />
                  <DateDisplay date={alert.detected_at} format="relative" className="text-xs text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {alert.dept_name || `Dept ${alert.dept_id}`}
                </p>
                <p className="text-xs text-gray-600">
                  {alert.anomaly_type}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
