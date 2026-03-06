import React, { useMemo } from 'react';
import { Card } from '../../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDistricts } from '../../../api/hooks/useBudget';
import { LoadingState } from '../../../components/ui/States';
import { TrendingUp } from 'lucide-react';

interface ChartDataItem {
  name: string;
  allocated: number;
  spent: number;
  utilization: string;
}

export const BudgetComparisonChart: React.FC = () => {
  const { data: districtData, isLoading } = useDistricts();

  const chartData = useMemo(() => {
    if (!districtData) return [];
    
    const allDepts = districtData.flatMap((district) => (district as any).departments || []);

    return allDepts
      .slice(0, 8)
      .map((dept: any) => ({
        name: dept.name.split(' ')[0], // First word of dept name
        allocated: Math.round((dept.allocated || 0) / 1000), // Convert to thousands
        spent: Math.round((dept.spent || 0) / 1000),
        utilization: (dept.utilization_percentage || 0).toFixed(1),
      }));
  }, [districtData]);

  if (isLoading) {
    return <LoadingState message="Loading chart..." />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-600">No budget data available for comparison</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-blue-600" size={20} />
        <h3 className="text-lg font-semibold">Budget Comparison</h3>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Amount (in thousands)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => {
                if (typeof value === 'number') {
                  return `${value.toLocaleString()}K`;
                }
                return value;
              }}
              contentStyle={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="allocated" fill="#3b82f6" name="Allocated" />
            <Bar dataKey="spent" fill="#ef4444" name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Utilization Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {chartData.map((item: ChartDataItem) => (
          <div
            key={item.name}
            className={`p-3 rounded-lg text-center ${
              Number(item.utilization) >= 80
                ? 'bg-red-50'
                : Number(item.utilization) >= 50
                ? 'bg-blue-50'
                : 'bg-green-50'
            }`}
          >
            <p className="text-xs font-medium text-gray-600 mb-1">{item.name}</p>
            <p className={`text-lg font-bold ${
              Number(item.utilization) >= 80
                ? 'text-red-600'
                : Number(item.utilization) >= 50
                ? 'text-blue-600'
                : 'text-green-600'
            }`}>
              {item.utilization}%
            </p>
            <p className="text-xs text-gray-600">Utilization</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
