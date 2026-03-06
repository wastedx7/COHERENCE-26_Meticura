import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useNationalOverview } from '../../api/hooks/useBudget';
import { useAnomalies } from '../../api/hooks/useAnomalies';
import { NationalKPIs } from './components/NationalKPIs';
import { DistrictGrid } from './components/DistrictGrid';
import { LiveAlertsPanel } from './components/LiveAlertsPanel';
import { QuickStats } from './components/QuickStats';
import { RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const OverviewPage: React.FC = () => {
  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useNationalOverview();

  const {
    data: alertsData,
    isLoading: alertsLoading,
  } = useAnomalies({ limit: 10, status: 'active' });

  if (overviewLoading) {
    return (
      <div>
        <PageHeader title="National Overview" />
        <LoadingState message="Loading dashboard data..." />
      </div>
    );
  }

  if (overviewError || !overview) {
    return (
      <div>
        <PageHeader title="National Overview" />
        <ErrorState
          message="Failed to load dashboard data. Please try again."
          onRetry={() => refetchOverview()}
        />
      </div>
    );
  }

  const latestAlerts = alertsData?.anomalies || [];

  return (
    <div>
      <PageHeader
        title="National Overview"
        description="Real-time budget monitoring across all districts"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchOverview()}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        }
      />

      {/* KPI Strip */}
      <NationalKPIs data={overview} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Districts Grid - 2/3 width */}
        <div className="lg:col-span-2">
          <DistrictGrid />
        </div>

        {/* Live Alerts Panel - 1/3 width */}
        <div>
          <LiveAlertsPanel alerts={latestAlerts} isLoading={alertsLoading} />
        </div>
      </div>

      {/* Bottom Summary */}
      <QuickStats
        highRiskCount={overview.high_risk_count}
        pendingReallocations={overview.pending_reallocations}
      />
    </div>
  );
};
