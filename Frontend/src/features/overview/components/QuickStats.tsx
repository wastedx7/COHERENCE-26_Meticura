import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { AlertCircle, ArrowLeftRight } from 'lucide-react';

interface QuickStatsProps {
  highRiskCount: number;
  pendingReallocations: number;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  highRiskCount,
  pendingReallocations,
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <Card
        hover
        onClick={() => navigate('/dashboard/alerts')}
        className="cursor-pointer"
      >
        <div className="flex items-center gap-4 p-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">High Risk Departments</p>
            <p className="text-2xl font-bold text-gray-900">{highRiskCount}</p>
          </div>
        </div>
      </Card>

      <Card
        hover
        onClick={() => navigate('/dashboard/reallocation')}
        className="cursor-pointer"
      >
        <div className="flex items-center gap-4 p-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <ArrowLeftRight className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Pending Reallocations</p>
            <p className="text-2xl font-bold text-gray-900">{pendingReallocations}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
