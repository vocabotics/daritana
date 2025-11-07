import React from 'react';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Metrics {
  projectCompletion: number;
  clientSatisfaction: number;
  onTimeDelivery: number;
  budgetAdherence: number;
  teamUtilization: number;
}

export default function PerformanceMetricsWidget({ data }: { data: Metrics }) {
  if (!data) return null;

  const metrics = [
    { label: 'Project Completion', value: data.projectCompletion, unit: '%', trend: 'up' },
    { label: 'Client Satisfaction', value: data.clientSatisfaction, unit: '/5', trend: 'stable' },
    { label: 'On-Time Delivery', value: data.onTimeDelivery, unit: '%', trend: 'down' },
    { label: 'Budget Adherence', value: data.budgetAdherence, unit: '%', trend: 'up' },
    { label: 'Team Utilization', value: data.teamUtilization, unit: '%', trend: 'stable' },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3">
      {metrics.map((metric, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm">{metric.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">
                {metric.value}{metric.unit}
              </span>
              {getTrendIcon(metric.trend)}
            </div>
          </div>
          <Progress 
            value={metric.unit === '/5' ? (metric.value / 5) * 100 : metric.value} 
            className="h-2"
          />
        </div>
      ))}
    </div>
  );
}