import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { usePredictions } from '../../api/hooks/usePredictions';
import { useAnomalies } from '../../api/hooks/useAnomalies';
import { Card } from '../../components/ui/Card';
import { RefreshCw, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  BudgetStatusGrid,
  LapseRiskPanel,
  AnomalyInsightsPanel,
  BudgetComparisonChart,
} from './components';

export const BudgetAnalysisDashboard: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const {
    data: predictionsData = { predictions: [], total: 0 } as any,
    isLoading: predictionsLoading,
    error: predictionsError,
    refetch: refetchPredictions,
  } = usePredictions();

  const {
    data: anomaliesData,
  } = useAnomalies({ status: 'active', limit: 20 });

  if (predictionsLoading) {
    return (
      <div>
        <PageHeader title="Budget Analysis" />
        <LoadingState message="Loading budget analysis..." />
      </div>
    );
  }

  if (predictionsError || !predictionsData) {
    return (
      <div>
        <PageHeader title="Budget Analysis" />
        <ErrorState
          message="Failed to load budget analysis. Please try again."
          onRetry={() => refetchPredictions()}
        />
      </div>
    );
  }

  const criticalLapses = (predictionsData?.predictions || []).filter(
    (p: any) => p.risk_level === 'critical'
  );
  const highRiskLapses = (predictionsData?.predictions || []).filter(
    (p: any) => p.risk_level === 'high'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Analysis Dashboard"
        description="Monitor budget utilization, lapse risks, and anomalies across departments"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchPredictions()}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Lapse Risk</p>
              <p className="text-3xl font-bold text-red-600">{criticalLapses.length}</p>
            </div>
            <AlertTriangle className="text-red-600" size={24} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-3xl font-bold text-yellow-600">{highRiskLapses.length}</p>
            </div>
            <TrendingUp className="text-yellow-600" size={24} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Anomalies</p>
              <p className="text-3xl font-bold text-orange-600">
                {anomaliesData?.anomalies.length || 0}
              </p>
            </div>
            <DollarSign className="text-orange-600" size={24} />
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lapse Risk & Anomalies */}
        <div className="lg:col-span-1 space-y-6">
          <LapseRiskPanel
            predictions={predictionsData?.predictions || []}
            selectedDept={selectedDept}
            onSelectDept={setSelectedDept}
          />

          <AnomalyInsightsPanel anomalies={anomaliesData?.anomalies || []} />
        </div>

        {/* Right Column - Budget Status & Comparison */}
        <div className="lg:col-span-2 space-y-6">
          <BudgetStatusGrid selectedDept={selectedDept} />

          <BudgetComparisonChart />
        </div>
      </div>
    </div>
  );
};
