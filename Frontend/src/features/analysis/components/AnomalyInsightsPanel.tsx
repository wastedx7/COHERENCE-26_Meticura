import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Shield, AlertCircle, Eye } from 'lucide-react';
import type { Anomaly } from '../../../api/types';

interface AnomalyInsightsPanelProps {
  anomalies: Anomaly[];
}

export const AnomalyInsightsPanel: React.FC<AnomalyInsightsPanelProps> = ({ anomalies }) => {
  const severityCount = {
    critical: anomalies.filter((a) => a.severity === 'critical').length,
    high: anomalies.filter((a) => a.severity === 'high').length,
    medium: anomalies.filter((a) => a.severity === 'medium').length,
    low: anomalies.filter((a) => a.severity === 'low').length,
  };

  const anomalyTypes = anomalies.reduce(
    (acc, a) => {
      const type = a.anomaly_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const sortedTypes = Object.entries(anomalyTypes)
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, 3);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-yellow-600';
      case 'medium':
        return 'text-orange-600';
      default:
        return 'text-blue-600';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Critical';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      default:
        return 'Low';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="text-purple-600" size={18} />
        <h4 className="font-semibold text-sm">Anomaly Detection Insights</h4>
      </div>

      {anomalies.length === 0 ? (
        <div className="text-center py-6">
          <Eye className="mx-auto text-green-600 mb-2" size={24} />
          <p className="text-sm text-gray-600">No anomalies detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Severity Distribution */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(severityCount).map(([severity, count]) => (
              count > 0 && (
                <div
                  key={severity}
                  className={`p-2 rounded text-center ${
                    severity === 'critical'
                      ? 'bg-red-50'
                      : severity === 'high'
                      ? 'bg-yellow-50'
                      : severity === 'medium'
                      ? 'bg-orange-50'
                      : 'bg-blue-50'
                  }`}
                >
                  <p className={`text-xs font-semibold ${getSeverityColor(severity)}`}>
                    {getSeverityLabel(severity)}
                  </p>
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                </div>
              )
            ))}
          </div>

          {/* Top Anomaly Types */}
          {sortedTypes.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <h5 className="text-xs font-semibold text-gray-700 mb-2">Top Issues</h5>
              <div className="space-y-2">
                {sortedTypes.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-gray-600" />
                      <span className="text-gray-700 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Item */}
          <div className="border-t pt-3 mt-3">
            <button className="w-full text-xs font-semibold text-purple-600 hover:text-purple-700 py-2 px-2 rounded hover:bg-purple-50 transition-all">
              View All Anomalies →
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
