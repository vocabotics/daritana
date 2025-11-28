import React, { useState, useEffect } from 'react';
import { 
  WorkflowTest, 
  WorkflowTestSuite, 
  TestResult, 
  workflowTester 
} from '@/utils/workflowTesting';
import { 
  ALL_WORKFLOWS, 
  WORKFLOW_CATEGORIES 
} from '@/tests/workflows/userWorkflows';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart3,
  Filter,
  RefreshCw,
  Download,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowRunState {
  isRunning: boolean;
  currentWorkflow?: WorkflowTest;
  currentStep?: number;
  progress: number;
  results?: WorkflowTestSuite;
}

export const WorkflowTestDashboard: React.FC = () => {
  const [runState, setRunState] = useState<WorkflowRunState>({
    isRunning: false,
    progress: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [testHistory, setTestHistory] = useState<WorkflowTestSuite[]>([]);
  const [showOnlyFailed, setShowOnlyFailed] = useState(false);

  // Load test history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('workflow-test-history');
    if (savedHistory) {
      try {
        setTestHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to load test history:', error);
      }
    }
  }, []);

  // Save test history to localStorage
  const saveTestHistory = (newSuite: WorkflowTestSuite) => {
    const updatedHistory = [newSuite, ...testHistory].slice(0, 10); // Keep last 10 runs
    setTestHistory(updatedHistory);
    localStorage.setItem('workflow-test-history', JSON.stringify(updatedHistory));
  };

  const getWorkflowsForCategory = (category: string): WorkflowTest[] => {
    if (category === 'all') return ALL_WORKFLOWS;
    return WORKFLOW_CATEGORIES[category as keyof typeof WORKFLOW_CATEGORIES] || [];
  };

  const runSelectedWorkflows = async () => {
    if (runState.isRunning) return;

    const workflowsToRun = selectedWorkflows.length > 0 
      ? ALL_WORKFLOWS.filter(w => selectedWorkflows.includes(w.id))
      : getWorkflowsForCategory(selectedCategory);

    if (workflowsToRun.length === 0) {
      toast.error('No workflows selected');
      return;
    }

    setRunState({ 
      isRunning: true, 
      progress: 0 
    });

    try {
      const suite = await workflowTester.runTestSuite(workflowsToRun, 
        (testIndex, workflow, stepIndex) => {
          setRunState(prev => ({
            ...prev,
            currentWorkflow: workflow,
            currentStep: stepIndex,
            progress: (testIndex / workflowsToRun.length) * 100,
          }));
        }
      );

      setRunState({
        isRunning: false,
        progress: 100,
        results: suite,
      });

      saveTestHistory(suite);

      const { passed, failed } = suite.summary;
      if (failed === 0) {
        toast.success(`All tests passed! (${passed}/${passed + failed})`);
      } else {
        toast.error(`${failed} test(s) failed (${passed}/${passed + failed})`);
      }

    } catch (error) {
      setRunState({ isRunning: false, progress: 0 });
      toast.error('Test run failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const runSingleWorkflow = async (workflow: WorkflowTest) => {
    if (runState.isRunning) return;

    setRunState({ 
      isRunning: true, 
      currentWorkflow: workflow, 
      progress: 0 
    });

    try {
      const suite = await workflowTester.runWorkflow(workflow, 
        (stepIndex, step, result) => {
          setRunState(prev => ({
            ...prev,
            currentStep: stepIndex,
            progress: ((stepIndex + 1) / workflow.steps.length) * 100,
          }));
        }
      );

      setRunState({
        isRunning: false,
        progress: 100,
        results: suite,
      });

      saveTestHistory(suite);

      if (suite.summary.failed === 0) {
        toast.success('Workflow completed successfully!');
      } else {
        toast.error('Workflow failed');
      }

    } catch (error) {
      setRunState({ isRunning: false, progress: 0 });
      toast.error('Workflow failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const stopTest = () => {
    // Note: The actual stopping would need to be implemented in the workflow tester
    setRunState({ isRunning: false, progress: 0 });
    toast.info('Test stopped');
  };

  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      testHistory,
      statistics: workflowTester.getStatistics(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-test-results-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  if (import.meta.env.PROD) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workflow Testing</h2>
            <p className="text-gray-600">Testing dashboard is not available in production</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workflow Testing Dashboard</h2>
            <p className="text-gray-600">Test and validate user workflows</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportResults} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button onClick={() => workflowTester.clearResults()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Test Controls</span>
            {runState.isRunning && (
              <Button onClick={stopTest} variant="destructive" size="sm">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Test Category</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(WORKFLOW_CATEGORIES).map(category => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Progress Display */}
          {runState.isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {runState.currentWorkflow ? `Running: ${runState.currentWorkflow.name}` : 'Initializing...'}
                </span>
                <span>{Math.round(runState.progress)}%</span>
              </div>
              <Progress value={runState.progress} className="w-full" />
              {runState.currentStep !== undefined && runState.currentWorkflow && (
                <p className="text-xs text-gray-600">
                  Step {runState.currentStep + 1} of {runState.currentWorkflow.steps.length}
                </p>
              )}
            </div>
          )}

          {/* Run Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={runSelectedWorkflows}
              disabled={runState.isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run Tests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workflow List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Available Workflows</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowOnlyFailed(!showOnlyFailed)}
                variant="outline"
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showOnlyFailed ? 'Show All' : 'Show Failed'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getWorkflowsForCategory(selectedCategory).map(workflow => {
              const lastResult = testHistory
                .flatMap(suite => suite.results)
                .filter(r => r.workflowId === workflow.id)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

              if (showOnlyFailed && lastResult?.success) {
                return null;
              }

              return (
                <div key={workflow.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{workflow.name}</h3>
                        <Badge className={getPriorityColor(workflow.priority)}>
                          {workflow.priority}
                        </Badge>
                        {lastResult && getStatusIcon(lastResult.success)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                      <div className="text-xs text-gray-500">
                        {workflow.steps.length} steps • 
                        Roles: {workflow.roles?.join(', ') || 'All'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lastResult && (
                        <div className="text-xs text-gray-500 text-right">
                          <div>Last: {new Date(lastResult.timestamp).toLocaleString()}</div>
                          <div>{lastResult.duration}ms</div>
                        </div>
                      )}
                      <Button
                        onClick={() => runSingleWorkflow(workflow)}
                        disabled={runState.isRunning}
                        size="sm"
                        variant="outline"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {(runState.results || testHistory.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(runState.results ? [runState.results, ...testHistory] : testHistory)
                .slice(0, 5)
                .map((suite, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{suite.name}</h4>
                        <p className="text-sm text-gray-600">
                          {suite.summary.total} tests • 
                          {suite.summary.passed} passed • 
                          {suite.summary.failed} failed • 
                          {suite.summary.duration}ms
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {suite.summary.total > 0 
                            ? Math.round((suite.summary.passed / suite.summary.total) * 100)
                            : 0}%
                        </div>
                        <div className="text-xs text-gray-500">Success Rate</div>
                      </div>
                    </div>
                    
                    {/* Individual Test Results */}
                    <div className="space-y-1">
                      {suite.results
                        .slice(0, 10) // Show first 10 results
                        .map((result, resultIndex) => (
                          <div key={resultIndex} className="flex items-center justify-between text-sm py-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(result.success)}
                              <span>{result.stepId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{result.duration}ms</span>
                              {result.error && (
                                <span className="text-red-600 text-xs">{result.error}</span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Test Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const stats = workflowTester.getStatistics();
              return (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(stats.passRate)}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};