import React from 'react';
import { Card } from '../../../components/ui/Card';
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import type { Prediction } from '../../../api/types';

interface LapseRiskPanelProps {
  predictions: Prediction[];
  selectedDept?: string | null;
  onSelectDept: (deptId: string) => void;
}

export const LapseRiskPanel: React.FC<LapseRiskPanelProps> = ({
  predictions,
  selectedDept,
  onSelectDept,
}) => {
  const criticalRisks = predictions
    .filter((p) => p.risk_level === 'critical')
    .slice(0, 5);

  const highRisks = predictions
    .filter((p) => p.risk_level === 'high')
    .slice(0, 5);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'high':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'medium':
        return 'bg-orange-50 border-l-4 border-orange-500';
      default:
        return 'bg-green-50 border-l-4 border-green-500';
    }
  };



  return (
    <div className="space-y-4">
      {/* Critical Risks */}
      {criticalRisks.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-600" size={18} />
            <h4 className="font-semibold text-sm">Critical Lapse Risk</h4>
          </div>
          <div className="space-y-2">
            {criticalRisks.map((prediction) => (
              <button
                key={prediction.dept_id}
                onClick={() => onSelectDept(prediction.dept_id)}
                className={`w-full p-3 text-left rounded transition-all ${getRiskColor(
                  prediction.risk_level
                )} ${selectedDept === prediction.dept_id ? 'ring-2 ring-red-400' : 'hover:shadow-sm'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{prediction.dept_name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-gray-600" />
                      <p className="text-xs text-gray-600">
                        {prediction.predicted_lapse} days until lapse
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-700">
                      {(prediction.confidence_score * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-600">confidence</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* High Risks */}
      {highRisks.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-yellow-600" size={18} />
            <h4 className="font-semibold text-sm">High Risk Monitoring</h4>
          </div>
          <div className="space-y-2">
            {highRisks.map((prediction) => (
              <button
                key={prediction.dept_id}
                onClick={() => onSelectDept(prediction.dept_id)}
                className={`w-full p-3 text-left rounded transition-all ${getRiskColor(
                  prediction.risk_level
                )} ${selectedDept === prediction.dept_id ? 'ring-2 ring-yellow-400' : 'hover:shadow-sm'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{prediction.dept_name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-gray-600" />
                      <p className="text-xs text-gray-600">
                        {prediction.predicted_lapse} days until lapse
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-700">
                      {(prediction.confidence_score * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-600">confidence</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {criticalRisks.length === 0 && highRisks.length === 0 && (
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600">No lapse risks detected</p>
        </Card>
      )}
    </div>
  );
};
