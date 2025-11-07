import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Calendar,
  DollarSign,
  Users,
  Clock,
  Target,
  Zap,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { motion } from 'framer-motion';

interface PredictiveAnalyticsProps {
  projects: any[];
  timeRange: string;
}

export function PredictiveAnalytics({ projects, timeRange }: PredictiveAnalyticsProps) {
  const [selectedScenario, setSelectedScenario] = useState('likely');

  // Predictive completion dates
  const completionPredictions = projects.map(project => ({
    name: project.name,
    originalDate: project.deadline,
    predictedDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    confidence: 75 + Math.random() * 20,
    riskFactors: Math.floor(Math.random() * 5)
  }));

  // Budget forecast data
  const budgetForecastData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Actual Spend',
        data: [120000, 150000, 180000, 200000, 210000, 225000],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2
      },
      {
        label: 'Predicted (Likely)',
        data: [null, null, null, null, null, 225000, 240000, 255000, 268000, 280000, 290000, 305000],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderDash: [5, 5],
        borderWidth: 2
      },
      {
        label: 'Predicted (Optimistic)',
        data: [null, null, null, null, null, 225000, 235000, 245000, 255000, 265000, 275000, 285000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderDash: [3, 3],
        borderWidth: 1
      },
      {
        label: 'Predicted (Pessimistic)',
        data: [null, null, null, null, null, 225000, 250000, 270000, 295000, 320000, 345000, 370000],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [2, 2],
        borderWidth: 1
      }
    ]
  };

  // Resource demand prediction
  const resourceDemandData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Designers',
        data: [8, 10, 12, 11, 14, 16],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
      },
      {
        label: 'Engineers',
        data: [5, 6, 8, 9, 10, 12],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
      },
      {
        label: 'Contractors',
        data: [3, 4, 5, 7, 8, 10],
        backgroundColor: 'rgba(251, 146, 60, 0.6)',
      }
    ]
  };

  const predictions = [
    {
      id: 1,
      type: 'completion',
      title: 'Project Completion Forecast',
      prediction: '3 projects likely to finish ahead of schedule',
      confidence: 82,
      impact: 'positive',
      details: 'Based on current velocity and resource allocation'
    },
    {
      id: 2,
      type: 'budget',
      title: 'Budget Overrun Alert',
      prediction: 'KLCC Tower project may exceed budget by 15%',
      confidence: 75,
      impact: 'warning',
      details: 'Current spending rate suggests overrun by Q3'
    },
    {
      id: 3,
      type: 'resource',
      title: 'Resource Shortage Predicted',
      prediction: 'Designer capacity will be exceeded in 2 weeks',
      confidence: 90,
      impact: 'critical',
      details: 'Need 3 additional designers to maintain schedule'
    },
    {
      id: 4,
      type: 'risk',
      title: 'Risk Probability Analysis',
      prediction: '25% chance of major delay in Heritage House',
      confidence: 70,
      impact: 'warning',
      details: 'Weather patterns and permit processing times'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Prediction Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {predictions.map((pred, index) => (
          <motion.div
            key={pred.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-l-4 ${
              pred.impact === 'positive' ? 'border-l-green-500' :
              pred.impact === 'warning' ? 'border-l-orange-500' :
              'border-l-red-500'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{pred.title}</CardTitle>
                  <Zap className={`h-4 w-4 ${
                    pred.impact === 'positive' ? 'text-green-500' :
                    pred.impact === 'warning' ? 'text-orange-500' :
                    'text-red-500'
                  }`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium mb-2">{pred.prediction}</p>
                <p className="text-xs text-gray-500 mb-3">{pred.details}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {pred.confidence}% confidence
                  </Badge>
                  <Button size="sm" variant="ghost">
                    Details
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Budget Forecast */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget Forecast Analysis</CardTitle>
              <CardDescription>Multi-scenario budget predictions based on historical data</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={selectedScenario === 'optimistic' ? 'default' : 'outline'}
                onClick={() => setSelectedScenario('optimistic')}
              >
                Optimistic
              </Button>
              <Button
                size="sm"
                variant={selectedScenario === 'likely' ? 'default' : 'outline'}
                onClick={() => setSelectedScenario('likely')}
              >
                Likely
              </Button>
              <Button
                size="sm"
                variant={selectedScenario === 'pessimistic' ? 'default' : 'outline'}
                onClick={() => setSelectedScenario('pessimistic')}
              >
                Pessimistic
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Line 
            data={budgetForecastData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom' as const,
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Demand Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Demand Forecast</CardTitle>
            <CardDescription>Predicted resource requirements for next 6 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <Bar 
              data={resourceDemandData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  }
                },
                scales: {
                  x: {
                    stacked: true,
                  },
                  y: {
                    stacked: true,
                    beginAtZero: true
                  }
                }
              }}
            />
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Resource capacity will be exceeded in Week 5. Consider hiring additional contractors or adjusting project timelines.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Completion Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>Project Completion Predictions</CardTitle>
            <CardDescription>AI-predicted completion dates with confidence levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completionPredictions.slice(0, 5).map((pred, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{pred.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        Predicted: {pred.predictedDate.toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {pred.confidence.toFixed(0)}% confident
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    {pred.riskFactors > 2 ? (
                      <Badge variant="destructive" className="text-xs">
                        {pred.riskFactors} risks
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Low risk
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}