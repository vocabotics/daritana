import { useState } from 'react';
import { useUBBLComplianceStore } from '@/store/ubblComplianceStore';
import { useProjectStore } from '@/store/projectStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Search,
  Building,
  Ruler,
  Users,
  Shield,
  AlertCircle,
  ChevronRight,
  ClipboardCheck,
  BookOpen,
  Filter,
  Clock,
  FileCheck,
  Calculator,
  Flame,
  Wind,
  Sun,
  Lightbulb,
  Star,
  Globe,
  Award,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { trueBylaws, TOTAL_BYLAWS, getBylawsByCategory, getCriticalBylaws } from '@/data/trueBylaws';
import UBBLRichExplainer from './UBBLRichExplainer';

type BuildingType = 'residential' | 'commercial' | 'industrial' | 'institutional' | 'all';

interface UBBLComplianceCheckerProps {
  projectId?: string;
}

export const UBBLComplianceChecker: React.FC<UBBLComplianceCheckerProps> = ({ projectId }) => {
  const { projects } = useProjectStore();
  const {
    sections,
    complianceChecks,
    reports,
    isLoading,
    runComplianceCheck,
    generateReport,
    searchClauses,
    getApplicableClauses,
    filterBySection,
    setFilterSection,
    richClauses,
    getClausesWithExplainers,
    searchRichClauses
  } = useUBBLComplianceStore();

  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [buildingType, setBuildingType] = useState<BuildingType>('commercial');
  const [buildingHeight, setBuildingHeight] = useState('');
  const [floorArea, setFloorArea] = useState('');
  const [occupancy, setOccupancy] = useState('');
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByCategory, setFilterCategory] = useState('all');
  const [selectedClause, selectClause] = useState<any>(null);

  const handleRunCheck = async () => {
    if (!selectedProject || !buildingHeight || !floorArea || !occupancy) {
      toast.error('Please fill in all required fields');
      return;
    }

    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;

    try {
      const check = await runComplianceCheck({
        projectId: project.id,
        projectName: project.name,
        buildingType,
        buildingHeight: parseFloat(buildingHeight),
        floorArea: parseFloat(floorArea),
        occupancy: parseInt(occupancy)
      });

      setSelectedCheckId(check.id);
      toast.success(`Compliance check completed for ${project.name}`);
      
      if (check.result.violations.length > 0) {
        toast.warning(`Found ${check.result.violations.length} compliance violations`);
      }
    } catch (error) {
      toast.error('Failed to run compliance check');
    }
  };

  const handleGenerateReport = async (checkId: string) => {
    try {
      const report = await generateReport(checkId);
      toast.success('Compliance report generated successfully');
      
      // Trigger download
      const blob = await useUBBLComplianceStore.getState().exportReport(report.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ubbl-compliance-report-${report.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const selectedCheck = complianceChecks.find(c => c.id === selectedCheckId);
  const searchResults = searchQuery ? searchClauses(searchQuery) : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="explainers" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="explainers">
            <Lightbulb className="h-4 w-4 mr-2" />
            Rich Explainers
          </TabsTrigger>
          <TabsTrigger value="checker">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Compliance Checker
          </TabsTrigger>
          <TabsTrigger value="clauses">
            <BookOpen className="h-4 w-4 mr-2" />
            UBBL Clauses
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="h-4 w-4 mr-2" />
            Check History
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Download className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Rich Explainers Tab - True UBBL By-laws System */}
        <TabsContent value="explainers" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">UBBL By-laws Rich Explainers</h2>
            <p className="text-muted-foreground">
              Complete coverage of {TOTAL_BYLAWS} authentic UBBL by-laws with detailed explanations and practical guidance.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total By-laws</p>
                    <p className="text-2xl font-bold">{TOTAL_BYLAWS}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Critical</p>
                    <p className="text-2xl font-bold">{getCriticalBylaws().length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Flame className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Fire Safety</p>
                    <p className="text-2xl font-bold">{getBylawsByCategory('fire_safety').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Structural</p>
                    <p className="text-2xl font-bold">{getBylawsByCategory('structural').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by-laws by number, title, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterByCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fire_safety">Fire Safety</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="submission">Plan Submission</SelectItem>
                <SelectItem value="accessibility">Accessibility</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="spatial">Spatial Requirements</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* By-laws Grid */}
          <div className="space-y-6">
            {/* Filter and display by-laws */}
            {(() => {
              const filteredBylaws = trueBylaws.filter(bylaw => {
                const matchesSearch = !searchQuery || 
                  bylaw.number.includes(searchQuery) ||
                  bylaw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  bylaw.content.toLowerCase().includes(searchQuery.toLowerCase());
                
                const matchesCategory = filterByCategory === 'all' || bylaw.category === filterByCategory;
                
                return matchesSearch && matchesCategory;
              });

              return (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBylaws.slice(0, 12).map((bylaw) => (
                    <Card key={bylaw.id} className="cursor-pointer hover:shadow-lg transition-shadow border hover:border-blue-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Building className="h-4 w-4 text-blue-600" />
                            By-law {bylaw.number}
                          </CardTitle>
                          <div className="flex gap-1">
                            <Badge variant={bylaw.priority === 'critical' ? 'destructive' : 
                                          bylaw.priority === 'high' ? 'default' : 'secondary'} 
                                   className="text-xs">
                              {bylaw.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Level {bylaw.complexity}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription className="text-xs">
                          Part {bylaw.part_number}: {bylaw.part_title}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <h4 className="font-semibold mb-2 text-sm line-clamp-2">{bylaw.title}</h4>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {bylaw.content || bylaw.explainer.simplified}
                        </p>
                        
                        {/* Features */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {bylaw.explainer.examples.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              <Eye className="h-3 w-3 mr-1" />
                              {bylaw.explainer.examples.length} Examples
                            </Badge>
                          )}
                          {bylaw.requires_calculation && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              <Calculator className="h-3 w-3 mr-1" />
                              Calculator
                            </Badge>
                          )}
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="w-full text-xs h-8"
                          onClick={() => {
                            // Convert to old format for the explainer component
                            const convertedClause = {
                              id: bylaw.id,
                              clause_number: bylaw.number,
                              part_number: bylaw.part_number,
                              part_title_en: bylaw.part_title,
                              title_en: bylaw.title,
                              content_en: bylaw.content,
                              priority_level: bylaw.priority,
                              complexity_level: bylaw.complexity,
                              explainers: [{
                                simplified_explanation: bylaw.explainer.simplified,
                                detailed_explanation: bylaw.explainer.detailed_html,
                                examples: bylaw.explainer.examples,
                                case_studies: [],
                                common_violations: bylaw.explainer.common_issues,
                                best_practices: bylaw.explainer.best_practices,
                                calculation_tools: bylaw.requires_calculation ? bylaw.explainer.interactive_elements : []
                              }]
                            };
                            selectClause(convertedClause);
                          }}
                        >
                          <ChevronRight className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()}
            
            {/* Show more button */}
            {(() => {
              const filteredBylaws = trueBylaws.filter(bylaw => {
                const matchesSearch = !searchQuery || 
                  bylaw.number.includes(searchQuery) ||
                  bylaw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  bylaw.content.toLowerCase().includes(searchQuery.toLowerCase());
                
                const matchesCategory = filterByCategory === 'all' || bylaw.category === filterByCategory;
                
                return matchesSearch && matchesCategory;
              });

              return filteredBylaws.length > 12 && (
                <div className="text-center">
                  <p className="text-muted-foreground text-sm mb-4">
                    Showing 12 of {filteredBylaws.length} by-laws. Use search and filters to find specific regulations.
                  </p>
                </div>
              );
            })()}
          </div>
        </TabsContent>

        <TabsContent value="checker" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>New Compliance Check</CardTitle>
                <CardDescription>
                  Run UBBL compliance check for your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Select Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buildingType">Building Type</Label>
                  <Select value={buildingType} onValueChange={(v) => setBuildingType(v as BuildingType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="institutional">Institutional</SelectItem>
                      <SelectItem value="assembly">Assembly</SelectItem>
                      <SelectItem value="mixed-use">Mixed Use</SelectItem>
                      <SelectItem value="high-rise">High Rise</SelectItem>
                      <SelectItem value="low-rise">Low Rise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">
                      <Ruler className="h-4 w-4 inline mr-1" />
                      Building Height (m)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      value={buildingHeight}
                      onChange={(e) => setBuildingHeight(e.target.value)}
                      placeholder="e.g., 30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">
                      <Building className="h-4 w-4 inline mr-1" />
                      Floor Area (sqm)
                    </Label>
                    <Input
                      id="area"
                      type="number"
                      value={floorArea}
                      onChange={(e) => setFloorArea(e.target.value)}
                      placeholder="e.g., 5000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupancy">
                    <Users className="h-4 w-4 inline mr-1" />
                    Expected Occupancy
                  </Label>
                  <Input
                    id="occupancy"
                    type="number"
                    value={occupancy}
                    onChange={(e) => setOccupancy(e.target.value)}
                    placeholder="e.g., 200"
                  />
                </div>

                <Button 
                  onClick={handleRunCheck} 
                  className="w-full"
                  disabled={isLoading || !selectedProject}
                >
                  {isLoading ? (
                    <>
                      <Calculator className="h-4 w-4 mr-2 animate-spin" />
                      Running Check...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Run Compliance Check
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {selectedCheck && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Check Results</CardTitle>
                    <Badge 
                      variant={selectedCheck.status === 'completed' ? 'default' : 'destructive'}
                    >
                      {selectedCheck.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {selectedCheck.projectName} - {format(selectedCheck.checkDate, 'PPP')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Compliance Score</p>
                      <p className="text-3xl font-bold">
                        {selectedCheck.result.complianceScore}%
                      </p>
                    </div>
                    <div className="h-20 w-20">
                      <Progress 
                        value={selectedCheck.result.complianceScore} 
                        className="h-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-2xl font-semibold text-blue-600">
                        {selectedCheck.result.applicableClauses.length}
                      </p>
                      <p className="text-xs text-gray-600">Applicable Clauses</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded">
                      <p className="text-2xl font-semibold text-red-600">
                        {selectedCheck.result.violations.length}
                      </p>
                      <p className="text-xs text-gray-600">Violations Found</p>
                    </div>
                  </div>

                  {selectedCheck.result.violations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        Violations
                      </h4>
                      <ScrollArea className="h-32">
                        {selectedCheck.result.violations.map((violation, idx) => (
                          <div key={idx} className="p-2 border-l-2 border-red-500 mb-2">
                            <p className="text-sm font-medium">{violation.description}</p>
                            <p className="text-xs text-gray-600">
                              Clause: {violation.clauseId} | Severity: {violation.severity}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              Action: {violation.requiredAction}
                            </p>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}

                  {selectedCheck.result.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                        Recommendations
                      </h4>
                      <ul className="text-sm space-y-1">
                        {selectedCheck.result.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start">
                            <ChevronRight className="h-4 w-4 mr-1 mt-0.5 text-gray-400" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleGenerateReport(selectedCheck.id)}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="clauses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>UBBL Clauses Database</CardTitle>
              <CardDescription>
                Browse all 343 UBBL clauses and requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clauses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterBySection || 'all'} onValueChange={(v) => setFilterSection(v === 'all' ? null : v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterByCategory} onValueChange={(v: any) => setFilterCategory(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="mandatory">Mandatory</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                    <SelectItem value="recommended">Recommended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-96">
                {searchQuery ? (
                  <div className="space-y-2">
                    {searchResults.map(clause => (
                      <Card key={clause.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{clause.id}</Badge>
                              <Badge 
                                variant={
                                  clause.category === 'mandatory' ? 'destructive' :
                                  clause.category === 'conditional' ? 'default' : 'secondary'
                                }
                              >
                                {clause.category}
                              </Badge>
                            </div>
                            <h4 className="font-medium mt-2">{clause.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{clause.description}</p>
                            <div className="mt-2">
                              <p className="text-xs font-medium">Requirements:</p>
                              <ul className="text-xs text-gray-600 mt-1">
                                {clause.requirements.slice(0, 2).map((req, idx) => (
                                  <li key={idx}>• {req}</li>
                                ))}
                                {clause.requirements.length > 2 && (
                                  <li className="text-blue-600">
                                    +{clause.requirements.length - 2} more...
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections
                      .filter(section => !filterBySection || section.id === filterBySection)
                      .map(section => (
                        <div key={section.id}>
                          <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
                          <div className="space-y-2">
                            {section.clauses
                              .filter(clause => 
                                filterByCategory === 'all' || clause.category === filterByCategory
                              )
                              .map(clause => (
                                <Card key={clause.id} className="p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">{clause.id}</Badge>
                                        <Badge 
                                          variant={
                                            clause.category === 'mandatory' ? 'destructive' :
                                            clause.category === 'conditional' ? 'default' : 'secondary'
                                          }
                                        >
                                          {clause.category}
                                        </Badge>
                                      </div>
                                      <h4 className="font-medium mt-2">{clause.title}</h4>
                                      <p className="text-sm text-gray-600 mt-1">{clause.description}</p>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                          </div>
                          <Separator className="my-4" />
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Check History</CardTitle>
              <CardDescription>
                View all previous compliance checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {complianceChecks.map(check => (
                  <Card key={check.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{check.projectName}</h4>
                        <p className="text-sm text-gray-600">
                          {format(check.checkDate, 'PPP')} • {check.buildingType}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span>Height: {check.buildingHeight}m</span>
                          <span>Area: {check.floorArea} sqm</span>
                          <span>Occupancy: {check.occupancy}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(check.status)}
                          <Badge 
                            variant={check.status === 'completed' ? 'default' : 'destructive'}
                          >
                            {check.status}
                          </Badge>
                          <div className="text-2xl font-bold">
                            {check.result.complianceScore}%
                          </div>
                        </div>
                        {check.result.violations.length > 0 && (
                          <p className="text-sm text-red-600 mt-1">
                            {check.result.violations.length} violations
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => setSelectedCheckId(check.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>
                Download and manage compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.map(report => (
                  <Card key={report.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <h4 className="font-medium">Report #{report.id}</h4>
                            <p className="text-sm text-gray-600">
                              Generated: {format(report.generatedDate, 'PPP')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            Score: {report.complianceScore}%
                          </span>
                          <span>
                            Clauses: {report.applicableClauses}/{report.totalClauses}
                          </span>
                          {report.violations.length > 0 && (
                            <span className="text-red-600">
                              {report.violations.length} violations
                            </span>
                          )}
                        </div>
                        {report.certifiedBy && (
                          <p className="text-sm text-gray-600 mt-1">
                            Certified by: {report.certifiedBy}
                          </p>
                        )}
                        {report.validUntil && (
                          <p className="text-sm text-gray-600">
                            Valid until: {format(report.validUntil, 'PP')}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          const blob = await useUBBLComplianceStore.getState().exportReport(report.id);
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `ubbl-report-${report.id}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UBBLComplianceChecker;