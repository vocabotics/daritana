import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, XCircle, AlertCircle, Loader2, 
  RefreshCw, Download, Upload, CreditCard, Users,
  FileText, Database, Shield, Zap, Globe
} from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface TestResult {
  name: string;
  category: string;
  status: 'pending' | 'testing' | 'passed' | 'failed' | 'skipped';
  message?: string;
  icon?: React.ReactNode;
}

export default function TestChecklist() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initializeTests();
  }, []);

  const initializeTests = () => {
    setTests([
      // Authentication Tests
      { name: 'Authentication Status', category: 'Auth', status: 'pending', icon: <Shield className="h-4 w-4" /> },
      { name: 'User Session', category: 'Auth', status: 'pending', icon: <Users className="h-4 w-4" /> },
      { name: 'Token Validation', category: 'Auth', status: 'pending', icon: <Shield className="h-4 w-4" /> },
      
      // API Tests
      { name: 'Backend Health Check', category: 'API', status: 'pending', icon: <Zap className="h-4 w-4" /> },
      { name: 'Database Connection', category: 'API', status: 'pending', icon: <Database className="h-4 w-4" /> },
      { name: 'API Response Time', category: 'API', status: 'pending', icon: <Globe className="h-4 w-4" /> },
      
      // Feature Tests
      { name: 'Project Management', category: 'Features', status: 'pending', icon: <FileText className="h-4 w-4" /> },
      { name: 'File Upload', category: 'Features', status: 'pending', icon: <Upload className="h-4 w-4" /> },
      { name: 'Payment Integration', category: 'Features', status: 'pending', icon: <CreditCard className="h-4 w-4" /> },
      { name: 'Real-time Updates', category: 'Features', status: 'pending', icon: <RefreshCw className="h-4 w-4" /> },
      
      // Performance Tests
      { name: 'Page Load Time', category: 'Performance', status: 'pending', icon: <Zap className="h-4 w-4" /> },
      { name: 'Bundle Size', category: 'Performance', status: 'pending', icon: <Download className="h-4 w-4" /> },
      { name: 'Memory Usage', category: 'Performance', status: 'pending', icon: <Database className="h-4 w-4" /> },
    ]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    const totalTests = tests.length;
    let completed = 0;

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      // Update test status to testing
      setTests(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: 'testing' } : t
      ));

      // Run specific test
      const result = await runTest(test);
      
      // Update test with result
      setTests(prev => prev.map((t, idx) => 
        idx === i ? { ...result } : t
      ));

      completed++;
      setProgress((completed / totalTests) * 100);
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsRunning(false);
  };

  const runTest = async (test: TestResult): Promise<TestResult> => {
    try {
      switch (test.name) {
        case 'Authentication Status':
          return {
            ...test,
            status: isAuthenticated ? 'passed' : 'failed',
            message: isAuthenticated ? 'User is authenticated' : 'Not authenticated'
          };

        case 'User Session':
          return {
            ...test,
            status: user ? 'passed' : 'failed',
            message: user ? `Logged in as ${user.email}` : 'No user session'
          };

        case 'Token Validation':
          const token = localStorage.getItem('token');
          return {
            ...test,
            status: token ? 'passed' : 'failed',
            message: token ? 'Token exists' : 'No token found'
          };

        case 'Backend Health Check':
          try {
            const response = await api.get('/health');
            return {
              ...test,
              status: response.data.status === 'healthy' ? 'passed' : 'failed',
              message: `Backend status: ${response.data.status}`
            };
          } catch {
            return {
              ...test,
              status: 'failed',
              message: 'Backend not responding'
            };
          }

        case 'Database Connection':
          try {
            const response = await api.get('/health');
            return {
              ...test,
              status: response.data.database === 'connected' ? 'passed' : 'failed',
              message: response.data.database === 'connected' ? 'Database connected' : 'Database not connected'
            };
          } catch {
            return {
              ...test,
              status: 'failed',
              message: 'Cannot check database status'
            };
          }

        case 'API Response Time':
          const start = performance.now();
          try {
            await api.get('/health');
            const duration = performance.now() - start;
            return {
              ...test,
              status: duration < 1000 ? 'passed' : 'failed',
              message: `Response time: ${duration.toFixed(0)}ms`
            };
          } catch {
            return {
              ...test,
              status: 'failed',
              message: 'API not responding'
            };
          }

        case 'Project Management':
          try {
            await api.get('/api/projects');
            return {
              ...test,
              status: 'passed',
              message: 'Projects API working'
            };
          } catch {
            return {
              ...test,
              status: 'failed',
              message: 'Projects API not accessible'
            };
          }

        case 'File Upload':
          return {
            ...test,
            status: 'skipped',
            message: 'Manual test required'
          };

        case 'Payment Integration':
          return {
            ...test,
            status: window.Stripe ? 'passed' : 'failed',
            message: window.Stripe ? 'Stripe loaded' : 'Stripe not loaded'
          };

        case 'Real-time Updates':
          return {
            ...test,
            status: 'skipped',
            message: 'WebSocket test skipped'
          };

        case 'Page Load Time':
          const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
          return {
            ...test,
            status: loadTime < 3000 ? 'passed' : 'failed',
            message: `Load time: ${loadTime}ms`
          };

        case 'Bundle Size':
          return {
            ...test,
            status: 'skipped',
            message: 'Build required for test'
          };

        case 'Memory Usage':
          if ('memory' in performance) {
            const memory = (performance as any).memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            return {
              ...test,
              status: usedMB < 100 ? 'passed' : 'failed',
              message: `Memory: ${usedMB}MB`
            };
          }
          return {
            ...test,
            status: 'skipped',
            message: 'Memory API not available'
          };

        default:
          return {
            ...test,
            status: 'skipped',
            message: 'Test not implemented'
          };
      }
    } catch (error: any) {
      return {
        ...test,
        status: 'failed',
        message: error.message
      };
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'testing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<TestResult['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      passed: 'default',
      failed: 'destructive',
      testing: 'secondary',
      skipped: 'outline',
      pending: 'outline'
    };
    
    return (
      <Badge variant={variants[status]} className="ml-2">
        {status}
      </Badge>
    );
  };

  const stats = {
    total: tests.length,
    passed: tests.filter(t => t.status === 'passed').length,
    failed: tests.filter(t => t.status === 'failed').length,
    skipped: tests.filter(t => t.status === 'skipped').length
  };

  const successRate = stats.total > 0 ? (stats.passed / stats.total) * 100 : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Test Checklist</h1>
          <p className="text-gray-600 mt-1">Verify all systems are working correctly</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">Passed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">Skipped</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.skipped}</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Running tests...</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Rate */}
        {!isRunning && stats.total > 0 && (
          <Alert className={successRate >= 80 ? 'border-green-500' : successRate >= 50 ? 'border-yellow-500' : 'border-red-500'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Success Rate: {successRate.toFixed(1)}%</strong>
              <br />
              {successRate >= 80 
                ? 'System is working well!' 
                : successRate >= 50 
                ? 'Some issues need attention.' 
                : 'Critical issues detected. Please check failed tests.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>Click Run Tests to check system status</CardDescription>
              </div>
              <Button 
                onClick={runTests} 
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Tests
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(
                tests.reduce((acc, test) => {
                  if (!acc[test.category]) acc[test.category] = [];
                  acc[test.category].push(test);
                  return acc;
                }, {} as Record<string, TestResult[]>)
              ).map(([category, categoryTests]) => (
                <div key={category}>
                  <h3 className="font-medium text-sm text-gray-600 mb-2">{category}</h3>
                  <div className="space-y-2">
                    {categoryTests.map((test, idx) => (
                      <div 
                        key={`${category}-${idx}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test.status)}
                          <div className="flex items-center gap-2">
                            {test.icon}
                            <span className="font-medium">{test.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {test.message && (
                            <span className="text-sm text-gray-600">{test.message}</span>
                          )}
                          {getStatusBadge(test.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Frontend URL:</span>
                <span className="ml-2 font-mono">{window.location.origin}</span>
              </div>
              <div>
                <span className="text-gray-600">API URL:</span>
                <span className="ml-2 font-mono">{import.meta.env.VITE_API_URL || 'Not configured'}</span>
              </div>
              <div>
                <span className="text-gray-600">Environment:</span>
                <span className="ml-2 font-mono">{import.meta.env.MODE}</span>
              </div>
              <div>
                <span className="text-gray-600">User Agent:</span>
                <span className="ml-2 font-mono text-xs">{navigator.userAgent.substring(0, 50)}...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}