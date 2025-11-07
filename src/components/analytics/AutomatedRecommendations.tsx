import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AutomatedRecommendationsProps {
  projects: any[];
  metrics: any;
}

export function AutomatedRecommendations({ projects, metrics }: AutomatedRecommendationsProps) {
  const [acceptedRecommendations, setAcceptedRecommendations] = useState<number[]>([]);
  const [rejectedRecommendations, setRejectedRecommendations] = useState<number[]>([]);

  const recommendations = [
    {
      id: 1,
      category: 'resource',
      priority: 'high',
      title: 'Optimize Resource Allocation',
      description: 'Reassign 2 designers from Project A to Project B to balance workload',
      impact: 'Increase overall productivity by 15%',
      effort: 'low',
      estimatedValue: 25000,
      confidence: 92,
      actions: [
        'Review current assignments',
        'Conduct team availability check',
        'Implement reassignment'
      ]
    },
    {
      id: 2,
      category: 'schedule',
      priority: 'critical',
      title: 'Accelerate Critical Path',
      description: 'Fast-track permit approvals to prevent 2-week delay in KLCC Tower',
      impact: 'Avoid RM 50,000 in delay costs',
      effort: 'medium',
      estimatedValue: 50000,
      confidence: 87,
      actions: [
        'Contact permit office immediately',
        'Prepare expedited documentation',
        'Assign dedicated liaison'
      ]
    },
    {
      id: 3,
      category: 'cost',
      priority: 'medium',
      title: 'Bulk Material Procurement',
      description: 'Combine material orders across 3 projects for 12% discount',
      impact: 'Save RM 35,000 on materials',
      effort: 'low',
      estimatedValue: 35000,
      confidence: 95,
      actions: [
        'Consolidate material requirements',
        'Negotiate with suppliers',
        'Coordinate delivery schedules'
      ]
    },
    {
      id: 4,
      category: 'quality',
      priority: 'medium',
      title: 'Implement Automated Testing',
      description: 'Deploy automated quality checks at key milestones',
      impact: 'Reduce defects by 30%',
      effort: 'high',
      estimatedValue: 15000,
      confidence: 78,
      actions: [
        'Set up testing framework',
        'Train quality team',
        'Create test protocols'
      ]
    },
    {
      id: 5,
      category: 'process',
      priority: 'low',
      title: 'Streamline Approval Workflow',
      description: 'Reduce approval stages from 5 to 3 for routine decisions',
      impact: 'Save 10 hours per week',
      effort: 'medium',
      estimatedValue: 8000,
      confidence: 83,
      actions: [
        'Map current workflow',
        'Identify redundancies',
        'Implement new process'
      ]
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'resource': return <Users className="h-4 w-4" />;
      case 'schedule': return <Clock className="h-4 w-4" />;
      case 'cost': return <DollarSign className="h-4 w-4" />;
      case 'quality': return <Target className="h-4 w-4" />;
      case 'process': return <Zap className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-50';
      case 'high': return 'text-orange-500 bg-orange-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const acceptRecommendation = (id: number) => {
    setAcceptedRecommendations([...acceptedRecommendations, id]);
    setRejectedRecommendations(rejectedRecommendations.filter(r => r !== id));
  };

  const rejectRecommendation = (id: number) => {
    setRejectedRecommendations([...rejectedRecommendations, id]);
    setAcceptedRecommendations(acceptedRecommendations.filter(r => r !== id));
  };

  const totalPotentialValue = recommendations.reduce((sum, rec) => sum + rec.estimatedValue, 0);
  const acceptedValue = recommendations
    .filter(rec => acceptedRecommendations.includes(rec.id))
    .reduce((sum, rec) => sum + rec.estimatedValue, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <CardTitle>AI-Generated Recommendations</CardTitle>
            </div>
            <Badge variant="outline" className="bg-white">
              {recommendations.length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Potential Value</p>
              <p className="text-2xl font-bold text-violet-700">
                RM {totalPotentialValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Accepted Value</p>
              <p className="text-2xl font-bold text-green-600">
                RM {acceptedValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Implementation Rate</p>
              <p className="text-2xl font-bold">
                {((acceptedRecommendations.length / recommendations.length) * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold">
                {(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length).toFixed(0)}%
              </p>
            </div>
          </div>
          <Progress 
            value={(acceptedValue / totalPotentialValue) * 100} 
            className="mt-4"
          />
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        <AnimatePresence>
          {recommendations.map((rec, index) => {
            const isAccepted = acceptedRecommendations.includes(rec.id);
            const isRejected = rejectedRecommendations.includes(rec.id);
            
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${isAccepted ? 'border-green-500 bg-green-50' : isRejected ? 'border-red-500 bg-red-50' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getPriorityColor(rec.priority)}`}>
                          {getCategoryIcon(rec.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{rec.title}</h3>
                            <Badge variant={rec.priority === 'critical' ? 'destructive' : 'outline'}>
                              {rec.priority}
                            </Badge>
                            <Badge variant="outline">{rec.confidence}% confident</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-green-500" />
                              {rec.impact}
                            </span>
                            <span className="text-gray-500">
                              Effort: <Badge variant="outline" className="ml-1">{rec.effort}</Badge>
                            </span>
                            <span className="font-semibold text-green-600">
                              +RM {rec.estimatedValue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {!isAccepted && !isRejected && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => acceptRecommendation(rec.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectRecommendation(rec.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {isAccepted && (
                        <Badge variant="success" className="h-fit">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Accepted
                        </Badge>
                      )}
                      
                      {isRejected && (
                        <Badge variant="destructive" className="h-fit">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  {isAccepted && (
                    <CardContent>
                      <Alert className="bg-white">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-semibold mb-2">Implementation Steps:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            {rec.actions.map((action, i) => (
                              <li key={i} className="text-sm">{action}</li>
                            ))}
                          </ol>
                          <Button size="sm" className="mt-3">
                            Start Implementation
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}