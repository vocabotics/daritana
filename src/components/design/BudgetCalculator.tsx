import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Home,
  Package,
  Zap,
  Wrench,
  Users,
  FileText,
  PieChart,
  BarChart3,
  Clock,
  Target,
  Star
} from 'lucide-react';

interface BudgetCalculatorProps {
  projectType: string;
  totalBudget: number;
  floorArea?: number;
  roomCount?: number;
  culturalComplexity?: 'basic' | 'moderate' | 'complex';
  sustainabilityLevel?: number;
  onBudgetBreakdown: (breakdown: BudgetBreakdown) => void;
}

interface BudgetBreakdown {
  categories: {
    design_fees: number;
    materials: number;
    labor: number;
    permits_compliance: number;
    project_management: number;
    contingency: number;
  };
  detailed_breakdown: {
    [key: string]: {
      amount: number;
      percentage: number;
      items: Array<{
        name: string;
        cost: number;
        unit?: string;
        quantity?: number;
      }>;
    };
  };
  timeline_costs: {
    phase: string;
    duration: number;
    cost: number;
    cashflow: number[];
  }[];
  risk_factors: {
    factor: string;
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
  recommendations: string[];
}

// Malaysian construction cost data (RM per sqft)
const constructionRates = {
  terrace_house: { min: 450, max: 800, avg: 600 },
  semi_detached: { min: 500, max: 900, avg: 680 },
  bungalow: { min: 600, max: 1200, avg: 850 },
  condominium: { min: 400, max: 700, avg: 520 },
  apartment: { min: 350, max: 600, avg: 450 },
  shophouse: { min: 500, max: 1000, avg: 720 },
  office: { min: 300, max: 600, avg: 420 },
  retail: { min: 400, max: 800, avg: 580 },
  restaurant: { min: 600, max: 1200, avg: 880 },
  hotel: { min: 800, max: 1500, avg: 1100 }
};

// Professional fee structures (percentage of construction cost)
const professionalFees = {
  architect: { min: 6, max: 12, avg: 8.5 },
  engineer: { min: 3, max: 6, avg: 4.5 },
  interior_designer: { min: 8, max: 15, avg: 11 },
  project_manager: { min: 3, max: 8, avg: 5.5 },
  quantity_surveyor: { min: 2, max: 4, avg: 3 },
  compliance_consultant: { min: 1, max: 3, avg: 2 }
};

// Authority and permit costs
const permitCosts = {
  building_plan_approval: { min: 2000, max: 15000, avg: 6500 },
  cf_submission: { min: 1500, max: 8000, avg: 4000 },
  environmental_approval: { min: 3000, max: 20000, avg: 8500 },
  fire_safety_approval: { min: 2000, max: 12000, avg: 5500 },
  utility_connections: { min: 5000, max: 25000, avg: 12000 },
  miscellaneous_permits: { min: 1000, max: 5000, avg: 2500 }
};

export function BudgetCalculator({ 
  projectType, 
  totalBudget, 
  floorArea = 2000, 
  roomCount = 5,
  culturalComplexity = 'moderate',
  sustainabilityLevel = 5,
  onBudgetBreakdown 
}: BudgetCalculatorProps) {
  const [budgetType, setBudgetType] = useState<'construction' | 'renovation' | 'interior_only'>('renovation');
  const [complexityLevel, setComplexityLevel] = useState(culturalComplexity);
  const [customizations, setCustomizations] = useState({
    design_fees: 0,
    materials_premium: 0,
    labor_premium: 0,
    sustainability_premium: 0,
    cultural_premium: 0
  });
  const [contingencyLevel, setContingencyLevel] = useState([15]);
  const [paymentSchedule, setPaymentSchedule] = useState('standard');

  const getBaseRates = () => {
    const rates = constructionRates[projectType as keyof typeof constructionRates] || 
                  constructionRates.condominium;
    
    // Adjust for budget type
    let multiplier = 1;
    switch (budgetType) {
      case 'construction':
        multiplier = 1;
        break;
      case 'renovation':
        multiplier = 0.7;
        break;
      case 'interior_only':
        multiplier = 0.4;
        break;
    }
    
    return {
      min: rates.min * multiplier,
      max: rates.max * multiplier,
      avg: rates.avg * multiplier
    };
  };

  const calculateBudgetBreakdown = (): BudgetBreakdown => {
    const baseRates = getBaseRates();
    const estimatedConstructionCost = floorArea * baseRates.avg;
    
    // Base percentages
    let percentages = {
      design_fees: 12,
      materials: 45,
      labor: 25,
      permits_compliance: 4,
      project_management: 6,
      contingency: contingencyLevel[0]
    };

    // Adjustments based on complexity and preferences
    if (complexityLevel === 'complex') {
      percentages.design_fees += 3;
      percentages.permits_compliance += 2;
    }
    
    if (sustainabilityLevel > 7) {
      percentages.materials += 5;
      percentages.design_fees += 2;
    }

    // Cultural complexity adjustments
    const culturalMultipliers = {
      basic: 1,
      moderate: 1.1,
      complex: 1.25
    };
    const culturalMultiplier = culturalMultipliers[complexityLevel];

    // Calculate actual amounts
    const categories = {
      design_fees: (totalBudget * percentages.design_fees / 100) * culturalMultiplier,
      materials: (totalBudget * percentages.materials / 100),
      labor: (totalBudget * percentages.labor / 100),
      permits_compliance: (totalBudget * percentages.permits_compliance / 100),
      project_management: (totalBudget * percentages.project_management / 100),
      contingency: (totalBudget * percentages.contingency / 100)
    };

    // Detailed breakdown
    const detailed_breakdown = {
      design_fees: {
        amount: categories.design_fees,
        percentage: percentages.design_fees,
        items: [
          { name: 'Architectural Design', cost: categories.design_fees * 0.4 },
          { name: 'Interior Design', cost: categories.design_fees * 0.35 },
          { name: 'Cultural Consultation', cost: categories.design_fees * 0.15 },
          { name: 'Engineering Services', cost: categories.design_fees * 0.1 }
        ]
      },
      materials: {
        amount: categories.materials,
        percentage: percentages.materials,
        items: [
          { name: 'Flooring Materials', cost: categories.materials * 0.25 },
          { name: 'Wall Finishes', cost: categories.materials * 0.2 },
          { name: 'Ceiling Systems', cost: categories.materials * 0.15 },
          { name: 'Built-in Furniture', cost: categories.materials * 0.25 },
          { name: 'Lighting & Electrical', cost: categories.materials * 0.15 }
        ]
      },
      labor: {
        amount: categories.labor,
        percentage: percentages.labor,
        items: [
          { name: 'Construction Labor', cost: categories.labor * 0.5 },
          { name: 'Specialized Craftsmen', cost: categories.labor * 0.3 },
          { name: 'Installation Services', cost: categories.labor * 0.2 }
        ]
      },
      permits_compliance: {
        amount: categories.permits_compliance,
        percentage: percentages.permits_compliance,
        items: [
          { name: 'Building Plan Approval', cost: permitCosts.building_plan_approval.avg },
          { name: 'CF Submission', cost: permitCosts.cf_submission.avg },
          { name: 'Fire Safety Approval', cost: permitCosts.fire_safety_approval.avg },
          { name: 'Other Permits', cost: categories.permits_compliance - 16000 }
        ]
      }
    };

    // Timeline and cash flow
    const timeline_costs = [
      {
        phase: 'Design Development',
        duration: 30,
        cost: categories.design_fees * 0.6,
        cashflow: [categories.design_fees * 0.3, categories.design_fees * 0.3]
      },
      {
        phase: 'Permit & Approval',
        duration: 45,
        cost: categories.permits_compliance,
        cashflow: [categories.permits_compliance * 0.5, categories.permits_compliance * 0.5]
      },
      {
        phase: 'Construction Phase 1',
        duration: 60,
        cost: (categories.materials + categories.labor) * 0.6,
        cashflow: Array(3).fill((categories.materials + categories.labor) * 0.2)
      },
      {
        phase: 'Construction Phase 2',
        duration: 45,
        cost: (categories.materials + categories.labor) * 0.4,
        cashflow: Array(2).fill((categories.materials + categories.labor) * 0.2)
      }
    ];

    // Risk factors
    const risk_factors = [
      {
        factor: 'Material Cost Fluctuation',
        impact: 'medium' as const,
        mitigation: 'Lock in material prices early with suppliers'
      },
      {
        factor: 'Weather Delays',
        impact: 'low' as const,
        mitigation: 'Build buffer time into schedule'
      },
      {
        factor: 'Permit Approval Delays',
        impact: 'medium' as const,
        mitigation: 'Submit applications early with complete documentation'
      },
      {
        factor: 'Cultural Requirements Changes',
        impact: complexityLevel === 'complex' ? 'high' as const : 'low' as const,
        mitigation: 'Detailed cultural consultation in design phase'
      }
    ];

    // Recommendations
    const recommendations = [
      `Your budget of RM ${totalBudget.toLocaleString()} appears ${
        totalBudget > estimatedConstructionCost * 1.2 ? 'generous' : 
        totalBudget < estimatedConstructionCost * 0.8 ? 'tight' : 'appropriate'
      } for a ${projectType} of ${floorArea} sqft`,
      
      sustainabilityLevel > 7 ? 
        'Consider phasing sustainable upgrades to manage costs effectively' :
        'Sustainable materials may add 10-15% to material costs but provide long-term savings',
      
      complexityLevel === 'complex' ?
        'Complex cultural requirements may require specialist consultants - budget allocated accordingly' :
        'Standard cultural considerations have been factored into the design fees',
      
      `Contingency of ${contingencyLevel[0]}% is ${
        contingencyLevel[0] > 15 ? 'conservative' : 
        contingencyLevel[0] < 10 ? 'aggressive' : 'appropriate'
      } for this type of project`
    ];

    return {
      categories,
      detailed_breakdown,
      timeline_costs,
      risk_factors,
      recommendations
    };
  };

  const breakdown = calculateBudgetBreakdown();
  const totalAllocated = Object.values(breakdown.categories).reduce((sum, val) => sum + val, 0);
  const variance = totalBudget - totalAllocated;

  useEffect(() => {
    onBudgetBreakdown(breakdown);
  }, [totalBudget, floorArea, budgetType, complexityLevel, contingencyLevel, sustainabilityLevel]);

  const getCategoryColor = (category: string) => {
    const colors = {
      design_fees: 'bg-blue-500',
      materials: 'bg-green-500',
      labor: 'bg-orange-500',
      permits_compliance: 'bg-purple-500',
      project_management: 'bg-red-500',
      contingency: 'bg-gray-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold">{formatCurrency(totalBudget)}</div>
                <div className="text-sm text-gray-600">Total Budget</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold">{formatCurrency(totalAllocated)}</div>
                <div className="text-sm text-gray-600">Allocated</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <div className={`font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(variance))}
                </div>
                <div className="text-sm text-gray-600">
                  {variance >= 0 ? 'Remaining' : 'Over Budget'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-semibold">{formatCurrency(totalBudget / floorArea)}</div>
                <div className="text-sm text-gray-600">Per Sq Ft</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Variance Alert */}
      {Math.abs(variance) > totalBudget * 0.05 && (
        <Alert className={variance < 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {variance < 0 ? (
              <>Your current allocation exceeds the budget by {formatCurrency(Math.abs(variance))}. Consider adjusting categories or increasing the budget.</>
            ) : (
              <>You have {formatCurrency(variance)} remaining in your budget. Consider allocating to contingency or upgrades.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="breakdown">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-6">
          {/* Main Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Categories</CardTitle>
              <CardDescription>
                Breakdown of your {formatCurrency(totalBudget)} budget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(breakdown.categories).map(([category, amount]) => {
                  const percentage = (amount / totalBudget) * 100;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${getCategoryColor(category)}`} />
                          <span className="font-medium capitalize">
                            {category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(amount)}</div>
                          <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(breakdown.detailed_breakdown).map(([category, details]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize flex items-center gap-2">
                    {category === 'design_fees' && <FileText className="h-5 w-5" />}
                    {category === 'materials' && <Package className="h-5 w-5" />}
                    {category === 'labor' && <Users className="h-5 w-5" />}
                    {category === 'permits_compliance' && <CheckCircle className="h-5 w-5" />}
                    {category.replace('_', ' ')}
                  </CardTitle>
                  <CardDescription>
                    {formatCurrency(details.amount)} ({details.percentage.toFixed(1)}%)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {details.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium">{formatCurrency(item.cost)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline & Cash Flow</CardTitle>
              <CardDescription>
                Projected phases and payment schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {breakdown.timeline_costs.map((phase, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{phase.phase}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {phase.duration} days
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(phase.cost)}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline">
                        Phase {index + 1}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Payment Schedule: </span>
                      {phase.cashflow.map((payment, i) => (
                        <span key={i}>
                          {formatCurrency(payment)}
                          {i < phase.cashflow.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Calculation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Project Type</Label>
                  <Select value={budgetType} onValueChange={setBudgetType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">New Construction</SelectItem>
                      <SelectItem value="renovation">Renovation</SelectItem>
                      <SelectItem value="interior_only">Interior Design Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cultural Complexity</Label>
                  <Select value={complexityLevel} onValueChange={(value: any) => setComplexityLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic - Minimal cultural elements</SelectItem>
                      <SelectItem value="moderate">Moderate - Standard cultural integration</SelectItem>
                      <SelectItem value="complex">Complex - Extensive cultural requirements</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Contingency Level: {contingencyLevel[0]}%</Label>
                <div className="px-2 mt-2">
                  <Slider
                    value={contingencyLevel}
                    onValueChange={setContingencyLevel}
                    max={25}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5% (Aggressive)</span>
                    <span>15% (Standard)</span>
                    <span>25% (Conservative)</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Floor Area (sq ft)</Label>
                <Input 
                  type="number" 
                  value={floorArea} 
                  onChange={(e) => {/* Handle floor area change */}}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {breakdown.risk_factors.map((risk, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        risk.impact === 'high' ? 'bg-red-500' : 
                        risk.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium">{risk.factor}</div>
                        <div className="text-sm text-gray-600 mt-1">{risk.mitigation}</div>
                      </div>
                      <Badge variant={risk.impact === 'high' ? 'destructive' : 'outline'}>
                        {risk.impact} impact
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {breakdown.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}