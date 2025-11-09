import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Calculator,
  DollarSign,
  FileText,
  Download,
  Info,
  TrendingUp,
  Building,
  Home,
  Factory,
  Store,
  Hotel,
  School,
  Hospital,
  Briefcase
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import PageWrapper from '@/components/PageWrapper'
import { cn } from '@/lib/utils'
import type { FeeCalculation } from '@/types/architect'

export default function FeeCalculator() {
  // Calculation state
  const [projectValue, setProjectValue] = useState<string>('')
  const [projectType, setProjectType] = useState<FeeCalculation['projectType']>('residential')
  const [complexity, setComplexity] = useState<FeeCalculation['complexity']>('standard')
  const [serviceScope, setServiceScope] = useState<FeeCalculation['serviceScope']>('full')
  const [calculation, setCalculation] = useState<FeeCalculation | null>(null)

  // Saved calculations history
  const [savedCalculations, setSavedCalculations] = useState<FeeCalculation[]>([
    {
      id: '1',
      projectId: 'PROJ-001',
      projectName: 'Residential Bungalow - Damansara Heights',
      projectType: 'residential',
      projectValue: 2500000,
      complexity: 'standard',
      serviceScope: 'full',
      lamScale: '6%',
      baseFee: 150000,
      complexityAdjustment: 0,
      scopeAdjustment: 0,
      totalProfessionalFee: 150000,
      disbursements: 15000,
      grandTotal: 165000,
      sst: 9900,
      totalWithSST: 174900,
      calculatedBy: 'Ar. Ahmad bin Abdullah',
      calculatedDate: new Date('2024-01-15').toISOString(),
      notes: 'Standard LAM scale for residential project under RM5M',
      breakdown: {
        schematicDesign: 22500,
        designDevelopment: 30000,
        constructionDocuments: 45000,
        bidding: 15000,
        constructionAdministration: 37500
      },
      approved: true,
      approvedBy: 'Client - Dato Ahmad',
      approvedDate: new Date('2024-01-16').toISOString()
    },
    {
      id: '2',
      projectId: 'PROJ-002',
      projectName: 'Commercial Office Tower - KLCC',
      projectType: 'commercial',
      projectValue: 58000000,
      complexity: 'complex',
      serviceScope: 'full',
      lamScale: '4.5%',
      baseFee: 2610000,
      complexityAdjustment: 261000,
      scopeAdjustment: 0,
      totalProfessionalFee: 2871000,
      disbursements: 287100,
      grandTotal: 3158100,
      sst: 189486,
      totalWithSST: 3347586,
      calculatedBy: 'Ar. Sarah Lee',
      calculatedDate: new Date('2024-01-10').toISOString(),
      notes: 'Complex commercial project, LAM scale with +10% complexity premium',
      breakdown: {
        schematicDesign: 430650,
        designDevelopment: 574200,
        constructionDocuments: 861300,
        bidding: 287100,
        constructionAdministration: 718050
      },
      approved: false
    }
  ])

  // LAM Scale percentages based on project value and type
  const getLAMScale = (value: number, type: FeeCalculation['projectType']): { percentage: number; description: string } => {
    // LAM Scale 2024 - Simplified version (actual scale is more complex with tiers)
    if (type === 'residential') {
      if (value <= 500000) return { percentage: 8, description: '8% - Residential under RM500k' }
      if (value <= 5000000) return { percentage: 6, description: '6% - Residential RM500k-5M' }
      if (value <= 10000000) return { percentage: 5.5, description: '5.5% - Residential RM5M-10M' }
      return { percentage: 5, description: '5% - Residential over RM10M' }
    }

    if (type === 'commercial' || type === 'institutional') {
      if (value <= 1000000) return { percentage: 7, description: '7% - Commercial/Institutional under RM1M' }
      if (value <= 10000000) return { percentage: 6, description: '6% - Commercial/Institutional RM1M-10M' }
      if (value <= 50000000) return { percentage: 5, description: '5% - Commercial/Institutional RM10M-50M' }
      return { percentage: 4.5, description: '4.5% - Commercial/Institutional over RM50M' }
    }

    if (type === 'industrial') {
      if (value <= 5000000) return { percentage: 5.5, description: '5.5% - Industrial under RM5M' }
      if (value <= 20000000) return { percentage: 4.5, description: '4.5% - Industrial RM5M-20M' }
      return { percentage: 4, description: '4% - Industrial over RM20M' }
    }

    // Other types
    return { percentage: 6, description: '6% - Other project types' }
  }

  // Complexity multipliers
  const getComplexityMultiplier = (complexityLevel: FeeCalculation['complexity']): number => {
    switch (complexityLevel) {
      case 'simple': return 0.9 // -10%
      case 'standard': return 1.0 // base
      case 'complex': return 1.1 // +10%
      case 'very_complex': return 1.25 // +25%
      default: return 1.0
    }
  }

  // Service scope multipliers
  const getScopeMultiplier = (scope: FeeCalculation['serviceScope']): number => {
    switch (scope) {
      case 'schematic_only': return 0.15 // 15% of total
      case 'design_development': return 0.35 // 35% of total
      case 'construction_documents': return 0.65 // 65% of total
      case 'full': return 1.0 // 100%
      case 'full_plus_supervision': return 1.2 // +20% for full-time supervision
      default: return 1.0
    }
  }

  // Calculate professional fee
  const handleCalculate = () => {
    const value = parseFloat(projectValue)

    if (!value || value <= 0) {
      toast.error('Please enter a valid project value')
      return
    }

    // Get LAM scale
    const lamScale = getLAMScale(value, projectType)
    const baseFee = value * (lamScale.percentage / 100)

    // Apply complexity adjustment
    const complexityMultiplier = getComplexityMultiplier(complexity)
    const complexityAdjustment = baseFee * (complexityMultiplier - 1)

    // Apply scope adjustment
    const scopeMultiplier = getScopeMultiplier(serviceScope)
    const scopeAdjustedFee = (baseFee + complexityAdjustment) * scopeMultiplier
    const scopeAdjustment = scopeAdjustedFee - (baseFee + complexityAdjustment)

    const totalProfessionalFee = baseFee + complexityAdjustment + scopeAdjustment

    // Disbursements (typically 10% of professional fee)
    const disbursements = totalProfessionalFee * 0.1

    const grandTotal = totalProfessionalFee + disbursements

    // SST 6%
    const sst = grandTotal * 0.06

    const totalWithSST = grandTotal + sst

    // Fee breakdown (standard RIBA/LAM phases)
    const breakdown = {
      schematicDesign: totalProfessionalFee * 0.15, // 15%
      designDevelopment: totalProfessionalFee * 0.20, // 20%
      constructionDocuments: totalProfessionalFee * 0.30, // 30%
      bidding: totalProfessionalFee * 0.10, // 10%
      constructionAdministration: totalProfessionalFee * 0.25 // 25%
    }

    const newCalculation: FeeCalculation = {
      id: `calc-${Date.now()}`,
      projectId: '',
      projectName: '',
      projectType,
      projectValue: value,
      complexity,
      serviceScope,
      lamScale: lamScale.description,
      baseFee,
      complexityAdjustment,
      scopeAdjustment,
      totalProfessionalFee,
      disbursements,
      grandTotal,
      sst,
      totalWithSST,
      calculatedBy: 'Current User', // TODO: Get from auth
      calculatedDate: new Date().toISOString(),
      breakdown,
      notes: '',
      approved: false
    }

    setCalculation(newCalculation)
    toast.success('Fee calculated successfully')
  }

  const handleSaveCalculation = () => {
    if (!calculation) return

    setSavedCalculations([calculation, ...savedCalculations])
    toast.success('Calculation saved')
  }

  const handleExport = (calc: FeeCalculation) => {
    toast.success(`Exporting calculation for ${calc.projectName || 'New Project'}`)
    // TODO: Implement PDF export
  }

  const getProjectTypeIcon = (type: FeeCalculation['projectType']) => {
    switch (type) {
      case 'residential': return <Home className="h-4 w-4" />
      case 'commercial': return <Building className="h-4 w-4" />
      case 'industrial': return <Factory className="h-4 w-4" />
      case 'retail': return <Store className="h-4 w-4" />
      case 'hospitality': return <Hotel className="h-4 w-4" />
      case 'educational': return <School className="h-4 w-4" />
      case 'healthcare': return <Hospital className="h-4 w-4" />
      case 'institutional': return <Briefcase className="h-4 w-4" />
      case 'mixed_use': return <Building className="h-4 w-4" />
      case 'other': return <Building className="h-4 w-4" />
    }
  }

  const getComplexityBadge = (complexityLevel: FeeCalculation['complexity']) => {
    const config = {
      simple: 'bg-green-100 text-green-800 border-green-300',
      standard: 'bg-blue-100 text-blue-800 border-blue-300',
      complex: 'bg-orange-100 text-orange-800 border-orange-300',
      very_complex: 'bg-red-100 text-red-800 border-red-300'
    }
    return <Badge variant="outline" className={config[complexityLevel]}>
      {complexityLevel.replace('_', ' ')}
    </Badge>
  }

  const stats = {
    totalCalculations: savedCalculations.length,
    approvedCalculations: savedCalculations.filter(c => c.approved).length,
    totalValue: savedCalculations.reduce((sum, c) => sum + c.totalWithSST, 0),
    averageFee: savedCalculations.length > 0
      ? savedCalculations.reduce((sum, c) => sum + c.totalProfessionalFee, 0) / savedCalculations.length
      : 0
  }

  return (
    <PageWrapper title="Professional Fee Calculator">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalculations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedCalculations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RM {(stats.totalValue / 1000).toFixed(0)}k</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Professional Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RM {(stats.averageFee / 1000).toFixed(0)}k</div>
            </CardContent>
          </Card>
        </div>

        {/* Fee Calculator */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>LAM Scale Fee Calculator</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Calculate professional fees based on Lembaga Arkitek Malaysia (LAM) scale
                </p>
              </div>
              <Badge variant="outline" className="bg-blue-50">
                LAM Scale 2024
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* Input Section */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="project-value">Project Value (RM)</Label>
                  <Input
                    id="project-value"
                    type="number"
                    placeholder="e.g., 2500000"
                    value={projectValue}
                    onChange={(e) => setProjectValue(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the estimated construction value
                  </p>
                </div>

                <div>
                  <Label htmlFor="project-type">Project Type</Label>
                  <Select value={projectType} onValueChange={(value) => setProjectType(value as FeeCalculation['projectType'])}>
                    <SelectTrigger id="project-type" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="hospitality">Hospitality</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="institutional">Institutional</SelectItem>
                      <SelectItem value="mixed_use">Mixed Use</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="complexity">Project Complexity</Label>
                  <Select value={complexity} onValueChange={(value) => setComplexity(value as FeeCalculation['complexity'])}>
                    <SelectTrigger id="complexity" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple (-10%)</SelectItem>
                      <SelectItem value="standard">Standard (Base Rate)</SelectItem>
                      <SelectItem value="complex">Complex (+10%)</SelectItem>
                      <SelectItem value="very_complex">Very Complex (+25%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="service-scope">Service Scope</Label>
                  <Select value={serviceScope} onValueChange={(value) => setServiceScope(value as FeeCalculation['serviceScope'])}>
                    <SelectTrigger id="service-scope" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schematic_only">Schematic Design Only (15%)</SelectItem>
                      <SelectItem value="design_development">Through Design Development (35%)</SelectItem>
                      <SelectItem value="construction_documents">Through Construction Documents (65%)</SelectItem>
                      <SelectItem value="full">Full Service (100%)</SelectItem>
                      <SelectItem value="full_plus_supervision">Full Service + Supervision (120%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleCalculate} className="w-full md:w-auto">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Professional Fee
                </Button>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>Based on LAM Scale 2024</span>
                </div>
              </div>

              {/* Calculation Result */}
              {calculation && (
                <div className="border-t pt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Calculation Result</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleSaveCalculation}>
                        Save Calculation
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport(calculation)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Project Value:</span>
                        <span className="font-medium">RM {calculation.projectValue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">LAM Scale Rate:</span>
                        <span className="font-medium">{calculation.lamScale}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Base Professional Fee:</span>
                        <span className="font-medium">RM {calculation.baseFee.toLocaleString()}</span>
                      </div>
                      {calculation.complexityAdjustment !== 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Complexity Adjustment:</span>
                          <span className={cn('font-medium', calculation.complexityAdjustment > 0 ? 'text-orange-600' : 'text-green-600')}>
                            {calculation.complexityAdjustment > 0 ? '+' : ''}RM {calculation.complexityAdjustment.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {calculation.scopeAdjustment !== 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Scope Adjustment:</span>
                          <span className={cn('font-medium', calculation.scopeAdjustment > 0 ? 'text-orange-600' : 'text-green-600')}>
                            {calculation.scopeAdjustment > 0 ? '+' : ''}RM {calculation.scopeAdjustment.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 border-l pl-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Professional Fee:</span>
                        <span className="text-lg font-bold text-blue-600">
                          RM {calculation.totalProfessionalFee.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Disbursements (10%):</span>
                        <span className="font-medium">RM {calculation.disbursements.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">RM {calculation.grandTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">SST (6%):</span>
                        <span className="font-medium">RM {calculation.sst.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-bold">Grand Total (with SST):</span>
                        <span className="text-xl font-bold text-green-600">
                          RM {calculation.totalWithSST.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Phase Breakdown */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Fee Breakdown by Design Phase</h4>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Schematic Design (15%)</span>
                        <span className="text-sm font-medium">RM {calculation.breakdown.schematicDesign.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Design Development (20%)</span>
                        <span className="text-sm font-medium">RM {calculation.breakdown.designDevelopment.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Construction Documents (30%)</span>
                        <span className="text-sm font-medium">RM {calculation.breakdown.constructionDocuments.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Bidding & Negotiation (10%)</span>
                        <span className="text-sm font-medium">RM {calculation.breakdown.bidding.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Construction Administration (25%)</span>
                        <span className="text-sm font-medium">RM {calculation.breakdown.constructionAdministration.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">Important Notes:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                          <li>Fees calculated based on LAM Scale 2024 guidelines</li>
                          <li>Disbursements include printing, travel, and sundry expenses</li>
                          <li>Additional services (MEP, structural, etc.) are not included</li>
                          <li>Fees are subject to negotiation and client approval</li>
                          <li>SST (Sales and Service Tax) at 6% applies to professional services</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Saved Calculations */}
        {savedCalculations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Saved Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Complexity</TableHead>
                      <TableHead>Professional Fee</TableHead>
                      <TableHead>Total (with SST)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedCalculations.map((calc) => (
                      <TableRow key={calc.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{calc.projectName || 'Untitled Project'}</p>
                            <p className="text-sm text-muted-foreground">{calc.projectId || 'No ID'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getProjectTypeIcon(calc.projectType)}
                            <span className="capitalize text-sm">{calc.projectType.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>RM {(calc.projectValue / 1000).toFixed(0)}k</TableCell>
                        <TableCell>{getComplexityBadge(calc.complexity)}</TableCell>
                        <TableCell className="font-medium">RM {calc.totalProfessionalFee.toLocaleString()}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          RM {calc.totalWithSST.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {calc.approved ? (
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(calc.calculatedDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExport(calc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  )
}
