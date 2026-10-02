import React from 'react';
import { useBankOptStore } from '../../store';
import { formatCurrency } from '../../utils/format';

export const MetricsStrip = () => {
  const { currentResult } = useBankOptStore();
  const metrics = currentResult?.metrics;

  return (
    <div className="h-[80px] bg-white border-t border-[#D9E0E7] flex items-center px-6 gap-6 overflow-x-auto">
      <MetricItem label="Objective" value={metrics ? formatCurrency(metrics.objectiveValue) : '-'} />
      <MetricItem label="Capacity Used" value={metrics ? metrics.capacityUsed : '-'} />
      <MetricItem label="Operations" value={metrics ? metrics.operationCount : '-'} />
      <MetricItem label="States Explored" value={metrics ? metrics.statesExplored : '-'} />
      <MetricItem label="Pruned" value={metrics ? metrics.prunings : '-'} />
    </div>
  );
};

const MetricItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col">
    <span className="text-xs text-[#2A7F7F] font-semibold uppercase">{label}</span>
    <span className="text-lg font-mono text-[#2A3038]">{value}</span>
  </div>
);
