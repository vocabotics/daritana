import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Sparkles,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';

interface AIInsightsProps {
  projects: any[];
  timeRange: string;
}

export function AIInsights({ projects, timeRange }: AIInsightsProps) {
  const [insights, setInsights] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    generateInsights();
  }, [projects, timeRange]);

  const generateInsights = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newInsights = [
      {
        id: 1,
        type: 'opportunity',
        title: 'Resource Optimization Opportunity',
        description: 'AI detected that 3 team members have 40% idle time next week. Consider reassigning them to Project Skyline to accelerate timeline.',
        impact: 'high',
        confidence: 92,
        actionable: true,
        metric: '+15% efficiency'
      },
      {
        id: 2,
        type: 'risk',
        title: 'Budget Overrun Risk Detected',
        description: 'Current spending trajectory suggests KLCC Tower project will exceed budget by 12% if current pace continues.',
        impact: 'critical',
        confidence: 87,
        actionable: true,
        metric: 'RM 125,000 at risk'
      },
      {
        id: 3,
        type: 'success',
        title: 'Above Average Performance',
        description: 'Team productivity is 23% higher than industry benchmark for similar projects. Key factor: effective use of collaborative tools.',
        impact: 'positive',
        confidence: 95,
        actionable: false,
        metric: '+23% productivity'
      },
      {
        id: 4,
        type: 'pattern',
        title: 'Recurring Delay Pattern',
        description: 'AI identified that permit approvals consistently cause 2-week delays. Consider starting permit process earlier in future projects.',
        impact: 'medium',
        confidence: 88,
        actionable: true,
        metric: '14 days average delay'
      },
      {
        id: 5,
        type: 'prediction',
        title: 'Completion Date Prediction',
        description: 'Based on current velocity and historical data, Heritage House project will complete 5 days ahead of schedule.',
        impact: 'positive',
        confidence: 78,
        actionable: false,
        metric: '5 days early'
      }
    ];
    
    setInsights(newInsights);
    setIsAnalyzing(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pattern': return <Info className="h-5 w-5 text-purple-500" />;
      case 'prediction': return <Sparkles className="h-5 w-5 text-orange-500" />;
      default: return <Brain className="h-5 w-5 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'positive': return 'success';
      default: return 'outline';
    }
  };

  // Chart data for insight trends
  const insightTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'],
    datasets: [
      {
        label: 'Insights Generated',
        data: [12, 18, 15, 22, 28],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4
      },
      {
        label: 'Actions Taken',
        data: [10, 14, 12, 18, 20],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-500" />
              <CardTitle>AI-Powered Insights</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateInsights}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insights List */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Latest Insights</h3>
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Alert className="border-l-4" style={{
                    borderLeftColor: insight.type === 'risk' ? '#ef4444' :
                                    insight.type === 'opportunity' ? '#3b82f6' :
                                    insight.type === 'success' ? '#22c55e' :
                                    insight.type === 'pattern' ? '#a855f7' : '#f97316'
                  }}>
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm">{insight.title}</h4>
                          <Badge variant={getImpactColor(insight.impact)} className="text-xs">
                            {insight.impact}
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm text-gray-600">
                          {insight.description}
                        </AlertDescription>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500">
                              Confidence: {insight.confidence}%
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {insight.metric}
                            </Badge>
                          </div>
                          {insight.actionable && (
                            <Button size="sm" variant="ghost">
                              Take Action
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Alert>
                </motion.div>
              ))}
            </div>

            {/* Insight Trends Chart */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Insight Trends</h3>
              <Card>
                <CardContent className="pt-6">
                  <Line 
                    data={insightTrendData} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </CardContent>
              </Card>

              {/* Key Findings */}
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <h4 className="text-sm font-semibold">Key Findings</h4>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Project velocity increased by 18% after implementing AI recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Resource allocation efficiency improved by 25% in the last month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>3 potential risks identified and mitigated before impact</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}