import React from 'react';
import { TrendingUp } from 'lucide-react';

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

export default function RevenueChartWidget({ data }: { data: ChartData }) {
  if (!data) return null;

  const maxValue = Math.max(...data.datasets[0].data);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">RM {(data.datasets[0].data[data.datasets[0].data.length - 1] / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500">Current Month</p>
        </div>
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm">+12%</span>
        </div>
      </div>
      
      <div className="relative h-32">
        <div className="flex items-end justify-between h-full gap-2">
          {data.datasets[0].data.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-blue-500 rounded-t"
                style={{ height: `${(value / maxValue) * 100}%` }}
              />
              <span className="text-xs text-gray-500 mt-1">{data.labels[index]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}