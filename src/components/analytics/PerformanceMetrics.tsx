import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Gauge
} from 'lucide-react';
import { Radar, Bar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

interface PerformanceMetricsProps {
  projects: any[];
  timeRange: string;
}

export function PerformanceMetrics({ projects, timeRange }: PerformanceMetricsProps) {
  // KPI calculations
  const kpis = {
    schedulePerformance: 0.92,
    costPerformance: 1.08,
    qualityIndex: 0.95,
    resourceUtilization: 0.78,
    customerSatisfaction: 4.6,
    teamProductivity: 0.88
  };

  // Team performance data
  const teamPerformanceData = {
    labels: ['Productivity', 'Quality', 'Timeliness', 'Communication', 'Innovation', 'Collaboration'],
    datasets: [
      {
        label: 'Current Period',
        data: [88, 92, 85, 90, 78, 95],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(99, 102, 241)'
      },
      {
        label: 'Previous Period',
        data: [82, 88, 80, 85, 72, 88],
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        borderColor: 'rgb(156, 163, 175)',
        pointBackgroundColor: 'rgb(156, 163, 175)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(156, 163, 175)'
      }
    ]
  };

  // Efficiency breakdown
  const efficiencyData = {
    labels: ['Design', 'Planning', 'Execution', 'Review', 'Delivery'],
    datasets: [{
      data: [92, 88, 78, 95, 85],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  // Department performance
  const departmentData = {
    labels: ['Architecture', 'Interior Design', 'Engineering', 'Project Management', 'Construction'],
    datasets: [
      {
        label: 'Performance Score',
        data: [92, 88, 85, 90, 82],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
      },
      {
        label: 'Target',
        data: [90, 90, 90, 90, 90],
        backgroundColor: 'rgba(156, 163, 175, 0.3)',
      }
    ]
  };

  const performanceCards = [
    {
      title: 'Schedule Performance Index',
      value: kpis.schedulePerformance,
      target: 1.0,
      unit: 'SPI',
      trend: 'up',
      change: '+0.05',
      icon: Clock,
      color: 'text-blue-500'
    },
    {
      title: 'Cost Performance Index',
      value: kpis.costPerformance,
      target: 1.0,
      unit: 'CPI',
      trend: 'down',
      change: '-0.03',
      icon: TrendingDown,
      color: 'text-orange-500'
    },
    {
      title: 'Quality Index',
      value: kpis.qualityIndex,
      target: 0.9,
      unit: 'QI',
      trend: 'up',
      change: '+0.02',
      icon: Target,
      color: 'text-green-500'
    },
    {
      title: 'Resource Utilization',
      value: kpis.resourceUtilization,
      target: 0.85,
      unit: '%',
      trend: 'down',
      change: '-0.04',
      icon: Users,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {card.unit === '%' ? `${(card.value * 100).toFixed(0)}%` : card.value.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">
                    / {card.unit === '%' ? `${(card.target * 100).toFixed(0)}%` : card.target.toFixed(1)}
                  </span>
                </div>
                <Progress 
                  value={(card.value / card.target) * 100} 
                  className="mt-2"
                />
                <div className="flex items-center mt-2">
                  {card.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${card.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance Analysis</CardTitle>
            <CardDescription>Multi-dimensional performance assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <Radar 
              data={teamPerformanceData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  }
                },
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      stepSize: 20
                    }
                  }
                }
              }}
            />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm font-medium">Overall Improvement</span>
                <Badge variant="success">+6.2%</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span className="text-sm font-medium">Team Morale</span>
                <Badge>High</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Efficiency Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Process Efficiency Breakdown</CardTitle>
            <CardDescription>Performance across project phases</CardDescription>
          </CardHeader>
          <CardContent>
            <Doughnut 
              data={efficiencyData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return context.label + ': ' + context.parsed + '%';
                      }
                    }
                  }
                }
              }}
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Average Efficiency</span>
                <span className="font-semibold">87.6%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Bottleneck Phase</span>
                <Badge variant="outline">Execution</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Department Performance Comparison</CardTitle>
              <CardDescription>Performance scores vs targets by department</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              <Gauge className="h-3 w-3 mr-1" />
              Monthly Review
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Bar 
            data={departmentData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom' as const,
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                }
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}