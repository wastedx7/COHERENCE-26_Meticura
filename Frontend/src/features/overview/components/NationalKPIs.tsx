import React from 'react';
import { KPICard } from '../../../components/common/KPICard';
import type { NationalOverview } from '../../../api/types';
import { formatPercent } from '../../../lib/utils';

interface NationalKPIsProps {
  data: NationalOverview;
}

export const NationalKPIs: React.FC<NationalKPIsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Allocated"
        value={data.total_allocated}
        isCurrency
      />
      <KPICard
        title="Total Spent"
        value={data.total_spent}
        isCurrency
      />
      <KPICard
        title="Total Remaining"
        value={data.total_remaining}
        isCurrency
      />
      <KPICard
        title="Utilization"
        value={formatPercent(data.utilization_pct)}
      />
    </div>
  );
};
