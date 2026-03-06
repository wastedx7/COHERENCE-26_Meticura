import React, { useMemo } from 'react';
import { useDistricts } from '../../../api/hooks/useBudget';
import { Card } from '../../../components/ui/Card';
import { LoadingState, ErrorState } from '../../../components/ui/States';
import { TrendingDown, BarChart3, AlertCircle } from 'lucide-react';

interface BudgetStatusGridProps {
  selectedDept?: string | null;
}

interface BudgetItem {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  utilization_percentage: number;
}

export const BudgetStatusGrid: React.FC<BudgetStatusGridProps> = ({ selectedDept }) => {
  const { data: districtData, isLoading, error } = useDistricts();
  
  const budgetData = {
    departments: districtData?.flatMap((district) => {
      // Transform district data to department budgets
      return (district as any).departments || [];
    }) || []
  };

  const filteredBudgets = useMemo(() => {
    if (!budgetData) return [];
    
    let budgets: BudgetItem[] = budgetData.departments || [];
    
    // Filter by selected department if provided
    if (selectedDept) {
      budgets = budgets.filter((b: BudgetItem) => b.id === selectedDept);
    }
    
    // Sort by utilization percentage (descending)
    return budgets.sort(
      (a: BudgetItem, b: BudgetItem) => (b.utilization_percentage || 0) - (a.utilization_percentage || 0)
    );
  }, [budgetData, selectedDept]);

  if (isLoading) {
    return <LoadingState message="Loading budget status..." />;
  }

  if (error || !budgetData) {
    return <ErrorState message="Failed to load budget data" />;
  }

  const getStatusColor = (utilization: number) => {
    if (utilization >= 100) return 'bg-red-50 border-red-200';
    if (utilization >= 80) return 'bg-yellow-50 border-yellow-200';
    if (utilization >= 50) return 'bg-blue-50 border-blue-200';
    return 'bg-green-50 border-green-200';
  };

  const getStatusIcon = (utilization: number) => {
    if (utilization >= 100) return <AlertCircle className="text-red-600" size={20} />;
    if (utilization >= 80) return <TrendingDown className="text-yellow-600" size={20} />;
    return <BarChart3 className="text-blue-600" size={20} />;
  };

  const getStatusLabel = (utilization: number) => {
    if (utilization >= 100) return 'Exceeded';
    if (utilization >= 80) return 'At Risk';
    return 'On Track';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Budget Status Overview</h3>

      {filteredBudgets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {selectedDept ? 'Selected department not found' : 'No budget data available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBudgets.slice(0, 6).map((budget: BudgetItem) => (
            <div
              key={budget.id}
              className={`p-4 rounded-lg border-2 ${getStatusColor(budget.utilization_percentage || 0)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{budget.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Dept {budget.id}
                  </p>
                </div>
                {getStatusIcon(budget.utilization_percentage || 0)}
              </div>

              {/* Budget Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">
                    {Math.round(budget.spent || 0).toLocaleString()}
                  </span>
                  <span className="text-gray-600">
                    of {Math.round(budget.allocated || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (budget.utilization_percentage || 0) >= 100
                        ? 'bg-red-600'
                        : (budget.utilization_percentage || 0) >= 80
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{
                      width: `${Math.min((budget.utilization_percentage || 0), 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">Remaining</p>
                  <p className="font-semibold">
                    {Math.round(budget.remaining || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Utilization</p>
                  <p className="font-semibold">
                    {(budget.utilization_percentage || 0).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className={`font-semibold ${
                    (budget.utilization_percentage || 0) >= 100 ? 'text-red-600' :
                    (budget.utilization_percentage || 0) >= 80 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {getStatusLabel(budget.utilization_percentage || 0)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
