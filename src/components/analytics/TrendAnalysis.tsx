import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Filter,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';

interface TrendAnalysisProps {
  projects: any[];
  timeRange: string;
}

export function TrendAnalysis({ projects, timeRange }: TrendAnalysisProps) {
  const [selectedTrends, setSelectedTrends] = useState(['budget', 'schedule', 'quality']);
  const [comparisonMode, setComparisonMode] = useState(false);

  // Multi-metric trend data
  const trendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Budget Efficiency',
        data: [85, 88, 87, 89, 92, 91, 93, 95, 94, 96, 97, 98],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        hidden: !selectedTrends.includes('budget')
      },
      {
        label: 'Schedule Adherence',
        data: [90, 89, 91, 88, 87, 89, 91, 92, 93, 92, 94, 95],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        hidden: !selectedTrends.includes('schedule')
      },
      {
        label: 'Quality Score',
        data: [92, 93, 91, 94, 95, 94, 96, 95, 97, 96, 98, 97],
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        tension: 0.4,
        hidden: !selectedTrends.includes('quality')
      },
      {
        label: 'Resource Utilization',
        data: [78, 80, 82, 79, 81, 83, 85, 84, 86, 88, 87, 89],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
        hidden: !selectedTrends.includes('resource')
      }
    ]
  };

  // Seasonal trends
  const seasonalData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Current Year',
        data: [320000, 380000, 420000, 450000],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
      },
      {
        label: 'Previous Year',
        data: [280000, 340000, 380000, 400000],
        backgroundColor: 'rgba(156, 163, 175, 0.6)',
      },
      {
        label: 'Year Before',
        data: [250000, 300000, 340000, 360000],
        backgroundColor: 'rgba(209, 213, 219, 0.6)',
      }
    ]
  };

  const trendInsights = [
    {
      metric: 'Project Completion Rate',
      current: 92,
      previous: 87,
      trend: 'up',
      change: 5,
      insight: 'Significant improvement in delivery timelines'
    },
    {
      metric: 'Average Project Duration',
      current: 124,
      previous: 138,
      trend: 'down',
      change: -14,
      insight: 'Projects completing 14 days faster on average'
    },
    {
      metric: 'Client Satisfaction',
      current: 4.6,
      previous: 4.3,
      trend: 'up',
      change: 0.3,
      insight: 'Highest satisfaction score in 2 years'
    },
    {
      metric: 'Cost Overrun Frequency',
      current: 12,
      previous: 18,
      trend: 'down',
      change: -6,
      insight: '33% reduction in budget overruns'
    },
    {
      metric: 'Team Productivity',
      current: 88,
      previous: 82,
      trend: 'up',
      change: 6,
      insight: 'Team efficiency improved by 7.3%'
    }
  ];

  const toggleTrend = (trend: string) => {
    setSelectedTrends(prev => 
      prev.includes(trend) 
        ? prev.filter(t => t !== trend)
        : [...prev, trend]
    );
  };

  return (
    <div className="space-y-6">
      {/* Trend Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historical Trend Analysis</CardTitle>
              <CardDescription>Long-term performance patterns and insights</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComparisonMode(!comparisonMode)}
              >
                {comparisonMode ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                {comparisonMode ? 'Show All' : 'Compare'}
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Trend Toggles */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['budget', 'schedule', 'quality', 'resource'].map(trend => (
              <Badge
                key={trend}
                variant={selectedTrends.includes(trend) ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => toggleTrend(trend)}
              >
                {trend}
              </Badge>
            ))}
          </div>

          {/* Main Trend Chart */}
          <Line 
            data={trendData}
            options={{
              responsive: true,
              interaction: {
                mode: 'index' as const,
                intersect: false,
              },
              plugins: {
                legend: {
                  position: 'bottom' as const,
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.dataset.label + ': ' + context.parsed.y + '%';
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  min: 70,
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Trend Insights</CardTitle>
            <CardDescription>Period-over-period comparisons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trendInsights.map((insight, index) => (
                <motion.div
                  key={insight.metric}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{insight.metric}</p>
                    <p className="text-xs text-gray-500 mt-1">{insight.insight}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {typeof insight.current === 'number' && insight.current > 10 
                          ? insight.current + '%'
                          : insight.current}
                      </p>
                      <div className="flex items-center gap-1">
                        {insight.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : insight.trend === 'down' ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : (
                          <Minus className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={`text-xs ${
                          insight.trend === 'up' ? 'text-green-500' :
                          insight.trend === 'down' ? 'text-red-500' :
                          'text-gray-400'
                        }`}>
                          {insight.change > 0 ? '+' : ''}{insight.change}
                          {typeof insight.current === 'number' && insight.current > 10 ? '%' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Seasonal Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Performance Patterns</CardTitle>
            <CardDescription>Quarterly trends over multiple years</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="revenue" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
              </TabsList>
              <TabsContent value="revenue">
                <Bar
                  data={seasonalData}
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
                        ticks: {
                          callback: function(value) {
                            return 'RM ' + value.toLocaleString();
                          }
                        }
                      }
                    }
                  }}
                />
              </TabsContent>
              <TabsContent value="projects">
                <div className="text-center py-8 text-gray-500">
                  Project volume seasonal analysis
                </div>
              </TabsContent>
              <TabsContent value="efficiency">
                <div className="text-center py-8 text-gray-500">
                  Efficiency metrics by quarter
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}