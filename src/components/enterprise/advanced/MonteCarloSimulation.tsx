import React, { useState, useMemo } from 'react';
import { 
  Play, Pause, RotateCcw, Settings, Download, 
  TrendingUp, AlertTriangle, Target, Activity,
  BarChart3, PieChart, Zap, Clock, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { cn } from '@/lib/utils';

interface MonteCarloSimulationProps {
  onRunSimulation?: (params: SimulationParams) => void;
  onExportResults?: (format: 'pdf' | 'excel') => void;
}

interface SimulationParams {
  iterations: number;
  confidenceLevels: number[];
  riskFactors: RiskFactor[];
  uncertaintyModel: 'triangular' | 'beta' | 'normal';
}

interface RiskFactor {
  id: string;
  name: string;
  impact: 'schedule' | 'cost' | 'both';
  probability: number;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  correlation: number;
}

const mockRiskFactors: RiskFactor[] = [
  {
    id: 'weather',
    name: 'Weather Delays',
    impact: 'schedule',
    probability: 0.7,
    optimistic: 2,
    mostLikely: 7,
    pessimistic: 14,
    correlation: 0.3
  },
  {
    id: 'permits',
    name: 'Permit Delays',
    impact: 'both',
    probability: 0.4,
    optimistic: 5,
    mostLikely: 15,
    pessimistic: 30,
    correlation: 0.6
  },
  {
    id: 'materials',
    name: 'Material Price Volatility',
    impact: 'cost',
    probability: 0.6,
    optimistic: 5000,
    mostLikely: 25000,
    pessimistic: 75000,
    correlation: 0.4
  },
  {
    id: 'resources',
    name: 'Resource Availability',
    impact: 'both',
    probability: 0.5,
    optimistic: 3,
    mostLikely: 8,
    pessimistic: 20,
    correlation: 0.5
  }
];

// Mock simulation results
const mockResults = {
  schedule: {
    mean: 287,
    median: 285,
    standardDeviation: 18.5,
    min: 245,
    max: 340,
    percentiles: {
      10: 262,
      25: 275,
      50: 285,
      75: 298,
      80: 302,
      90: 315,
      95: 325
    },
    histogram: [
      { range: '245-255', frequency: 45, probability: 4.5 },
      { range: '255-265', frequency: 125, probability: 12.5 },
      { range: '265-275', frequency: 210, probability: 21.0 },
      { range: '275-285', frequency: 265, probability: 26.5 },
      { range: '285-295', frequency: 220, probability: 22.0 },
      { range: '295-305', frequency: 95, probability: 9.5 },
      { range: '305-315', frequency: 30, probability: 3.0 },
      { range: '315-340', frequency: 10, probability: 1.0 }
    ]
  },
  cost: {
    mean: 5250000,
    median: 5180000,
    standardDeviation: 480000,
    min: 4650000,
    max: 6800000,
    percentiles: {
      10: 4850000,
      25: 4950000,
      50: 5180000,
      75: 5450000,
      80: 5550000,
      90: 5850000,
      95: 6150000
    }
  },
  sensitivity: [
    { factor: 'Weather Delays', scheduleImpact: 0.45, costImpact: 0.12, totalImpact: 0.385 },
    { factor: 'Permit Delays', scheduleImpact: 0.35, costImpact: 0.28, totalImpact: 0.315 },
    { factor: 'Material Prices', scheduleImpact: 0.08, costImpact: 0.52, totalImpact: 0.30 },
    { factor: 'Resource Availability', scheduleImpact: 0.25, costImpact: 0.18, totalImpact: 0.215 }
  ]
};

export const MonteCarloSimulation: React.FC<MonteCarloSimulationProps> = ({
  onRunSimulation,
  onExportResults
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [iterations, setIterations] = useState([1000]);
  const [selectedMetric, setSelectedMetric] = useState<'schedule' | 'cost'>('schedule');
  const [showResults, setShowResults] = useState(true); // For demo purposes

  const confidenceLevels = [80, 90, 95];

  const runSimulation = async () => {
    setIsRunning(true);
    setProgress(0);
    
    // Simulate running Monte Carlo
    for (let i = 0; i <= 100; i += 2) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setIsRunning(false);
    setShowResults(true);
    
    onRunSimulation?.({
      iterations: iterations[0],
      confidenceLevels,
      riskFactors: mockRiskFactors,
      uncertaintyModel: 'triangular'
    });
  };

  const currentResults = useMemo(() => {
    try {
      return selectedMetric === 'schedule' ? mockResults.schedule : mockResults.cost;
    } catch (error) {
      console.error('Error loading simulation results:', error);
      return mockResults.schedule; // fallback to schedule data
    }
  }, [selectedMetric]);
  
  const unit = useMemo(() => 
    selectedMetric === 'schedule' ? 'days' : '$'
  , [selectedMetric]);
  
  const formatter = useMemo(() => 
    selectedMetric === 'schedule' 
      ? (value: number) => `${value} days`
      : (value: number) => `$${(value / 1000000).toFixed(1)}M`
  , [selectedMetric]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Monte Carlo Risk Analysis</h2>
            <p className="text-sm text-gray-500">Advanced probabilistic project forecasting</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Zap className="w-3 h-3" />
              AI-Powered
            </Badge>
            <Button variant="outline" size="sm" onClick={() => onExportResults?.('excel')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Iterations:</label>
            <Slider
              value={iterations}
              onValueChange={setIterations}
              max={10000}
              min={100}
              step={100}
              className="w-32"
            />
            <span className="text-sm font-mono w-16">{iterations[0].toLocaleString()}</span>
          </div>
          
          <Select defaultValue="triangular">
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="triangular">Triangular</SelectItem>
              <SelectItem value="beta">Beta PERT</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={runSimulation}
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Running...' : 'Run Simulation'}
          </Button>
          
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Simulation Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>

      {/* Results */}
      {showResults && (
        <div className="flex-1 p-4 space-y-6 overflow-auto">
          {/* Metric Selector */}
          <div className="flex gap-2">
            <Button
              variant={selectedMetric === 'schedule' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('schedule')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Schedule Risk
            </Button>
            <Button
              variant={selectedMetric === 'cost' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('cost')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Cost Risk
            </Button>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Mean</p>
                    <p className="text-2xl font-bold">{currentResults?.mean ? formatter(currentResults.mean) : 'N/A'}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">P80 (80% Confidence)</p>
                    <p className="text-2xl font-bold text-orange-600">{currentResults?.percentiles?.[80] ? formatter(currentResults.percentiles[80]) : 'N/A'}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">P90 (90% Confidence)</p>
                    <p className="text-2xl font-bold text-red-600">{currentResults?.percentiles?.[90] ? formatter(currentResults.percentiles[90]) : 'N/A'}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Standard Deviation</p>
                    <p className="text-2xl font-bold">{currentResults?.standardDeviation ? formatter(currentResults.standardDeviation) : 'N/A'}</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Probability Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Probability Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={currentResults?.histogram || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Probability']}
                      labelFormatter={(label) => `Range: ${label} ${unit}`}
                    />
                    <Bar dataKey="probability" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sensitivity Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Sensitivity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockResults?.sensitivity || []} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="factor" type="category" width={120} />
                    <Tooltip 
                      formatter={([value], [name]) => [`${(typeof value === 'number' ? value * 100 : 0).toFixed(1)}%`, name]}
                    />
                    <Bar dataKey="totalImpact" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Confidence Intervals */}
          <Card>
            <CardHeader>
              <CardTitle>Confidence Intervals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {confidenceLevels.map(level => {
                  const percentileValue = currentResults?.percentiles?.[level as keyof typeof currentResults.percentiles];
                  const formattedValue = percentileValue ? formatter(percentileValue) : 'N/A';
                  
                  return (
                    <div key={level} className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {formattedValue}
                      </p>
                      <p className="text-sm text-gray-500">P{level} ({level}% Confidence)</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {level}% chance of completion within this {selectedMetric === 'schedule' ? 'timeframe' : 'budget'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Factors Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRiskFactors.map(factor => (
                  <div key={factor.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{factor.name}</p>
                      <p className="text-sm text-gray-500">
                        Impact: {factor.impact} • Probability: {(factor.probability * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {factor.optimistic} - {factor.pessimistic} {unit.replace('$', 'k')}
                      </p>
                      <div className="w-24">
                        <Progress value={factor.correlation * 100} className="h-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};