import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Calculator, 
  Eye, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Play,
  Globe,
  Clock,
  Star,
  Lightbulb,
  Target,
  Award,
  Building
} from 'lucide-react';
import { useUBBLComplianceStore } from '@/store/ubblComplianceStore';
import type { UBBLClause, UBBLExplainer } from '@/types/ubbl';

interface UBBLRichExplainerProps {
  clause: UBBLClause;
  onClose?: () => void;
}

export default function UBBLRichExplainer({ clause, onClose }: UBBLRichExplainerProps) {
  const { explainerLanguage, setExplainerLanguage, getExplainerForClause } = useUBBLComplianceStore();
  
  const explainer = getExplainerForClause(clause.id, explainerLanguage);
  
  if (!explainer) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>UBBL Clause {clause.clause_number}</span>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Rich explainer not available for this clause yet. We're working on comprehensive explanations for all 1001 UBBL clauses.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Building className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold">UBBL Clause {clause.clause_number}</h1>
                  <p className="text-sm text-muted-foreground">
                    Part {clause.part_number}: {explainerLanguage === 'en' ? clause.part_title_en : clause.part_title_ms}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {/* Language Toggle */}
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button 
                    size="sm" 
                    variant={explainerLanguage === 'en' ? 'default' : 'ghost'}
                    onClick={() => setExplainerLanguage('en')}
                    className="h-8 px-3"
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    EN
                  </Button>
                  <Button 
                    size="sm" 
                    variant={explainerLanguage === 'ms' ? 'default' : 'ghost'}
                    onClick={() => setExplainerLanguage('ms')}
                    className="h-8 px-3"
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    MS
                  </Button>
                </div>
                {onClose && (
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    ✕
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">
              {explainerLanguage === 'en' ? clause.title_en : clause.title_ms}
            </h2>
            
            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={clause.priority_level === 'critical' ? 'destructive' : 
                            clause.priority_level === 'high' ? 'default' : 'secondary'}>
                <Star className="h-3 w-3 mr-1" />
                {clause.priority_level.charAt(0).toUpperCase() + clause.priority_level.slice(1)} Priority
              </Badge>
              
              <Badge variant="outline">
                <Target className="h-3 w-3 mr-1" />
                Level {clause.complexity_level}/5
              </Badge>
              
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {explainer.estimated_read_time} min read
              </Badge>
              
              {clause.calculation_required && (
                <Badge variant="outline">
                  <Calculator className="h-3 w-3 mr-1" />
                  Calculation Required
                </Badge>
              )}
              
              {explainer.learning_objectives.length > 0 && (
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  Academic Content
                </Badge>
              )}
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {clause.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag.replace(/[-_]/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Official Content */}
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-900 mb-2">Official UBBL Content</h3>
              <p className="text-blue-800">
                {explainerLanguage === 'en' ? clause.content_en : clause.content_ms}
              </p>
            </div>
            
            {/* Quick Summary */}
            {explainer.simplified_explanation && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  <strong>In Simple Terms:</strong> {explainer.simplified_explanation}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="explanation" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="explanation" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Explanation
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Examples
          </TabsTrigger>
          <TabsTrigger value="violations" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Violations
          </TabsTrigger>
          <TabsTrigger value="best-practices" className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            Best Practices
          </TabsTrigger>
          <TabsTrigger value="case-studies" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Case Studies
          </TabsTrigger>
          <TabsTrigger value="calculators" className="flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            Tools
          </TabsTrigger>
        </TabsList>

        {/* Detailed Explanation */}
        <TabsContent value="explanation" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div 
                className="prose prose-blue max-w-none"
                dangerouslySetInnerHTML={{ __html: explainer.explanation_html }}
              />
              
              {explainer.technical_notes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                  <h4 className="font-semibold text-gray-900 mb-2">Technical Notes</h4>
                  <p className="text-gray-700">{explainer.technical_notes}</p>
                </div>
              )}
              
              {explainer.learning_objectives.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Learning Objectives
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-green-800">
                    {explainer.learning_objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples */}
        <TabsContent value="examples" className="space-y-4">
          {explainer.examples.map((example, index) => (
            <Card key={example.id || index}>
              <CardHeader>
                <CardTitle className="text-lg">{example.title}</CardTitle>
                <div className="flex gap-2">
                  {example.building_type && (
                    <Badge variant="outline">{example.building_type.replace(/_/g, ' ')}</Badge>
                  )}
                  {example.location && (
                    <Badge variant="secondary">{example.location}</Badge>
                  )}
                  {example.project_size && (
                    <Badge variant="outline">{example.project_size}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-muted-foreground">{example.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <h5 className="font-semibold text-orange-900 mb-1">Scenario</h5>
                      <p className="text-orange-800 text-sm">{example.scenario}</p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <h5 className="font-semibold text-green-900 mb-1">Solution</h5>
                      <p className="text-green-800 text-sm">{example.solution}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Common Violations */}
        <TabsContent value="violations" className="space-y-4">
          {explainer.common_violations.map((violation, index) => (
            <Card key={violation.id || index} className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  {violation.description}
                </CardTitle>
                <Badge variant={violation.severity === 'critical' ? 'destructive' : 
                              violation.severity === 'major' ? 'default' : 'secondary'}>
                  {violation.severity.charAt(0).toUpperCase() + violation.severity.slice(1)} Violation
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold mb-2">Common Causes:</h5>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {violation.common_causes.map((cause, causeIndex) => (
                        <li key={causeIndex}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold mb-2">How to Avoid:</h5>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {violation.how_to_avoid.map((solution, solutionIndex) => (
                        <li key={solutionIndex}>{solution}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {violation.penalty && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Penalty:</strong> {violation.penalty}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {violation.examples && violation.examples.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2">Examples:</h5>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {violation.examples.map((example, exampleIndex) => (
                          <li key={exampleIndex}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Best Practices */}
        <TabsContent value="best-practices" className="space-y-4">
          {explainer.best_practices.map((practice, index) => (
            <Card key={practice.id || index} className="border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  {practice.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{practice.description}</p>
                  
                  <div>
                    <h5 className="font-semibold mb-2">Implementation Steps:</h5>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      {practice.implementation_steps.map((step, stepIndex) => (
                        <li key={stepIndex}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold mb-2">Benefits:</h5>
                      <ul className="list-disc list-inside space-y-1 text-green-700">
                        {practice.benefits.map((benefit, benefitIndex) => (
                          <li key={benefitIndex}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      {practice.cost_implications && (
                        <div>
                          <h6 className="font-medium">Cost Implications:</h6>
                          <p className="text-sm text-muted-foreground">{practice.cost_implications}</p>
                        </div>
                      )}
                      
                      {practice.time_savings && (
                        <div>
                          <h6 className="font-medium">Time Savings:</h6>
                          <p className="text-sm text-muted-foreground">{practice.time_savings}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Case Studies */}
        <TabsContent value="case-studies" className="space-y-4">
          {explainer.case_studies.map((caseStudy, index) => (
            <Card key={caseStudy.id || index}>
              <CardHeader>
                <CardTitle className="text-lg">{caseStudy.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">{caseStudy.building_type.replace(/_/g, ' ')}</Badge>
                  <Badge variant="secondary">{caseStudy.location}</Badge>
                </div>
                <p className="font-medium text-blue-600">{caseStudy.project_name}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                      <h5 className="font-semibold text-red-900 mb-1">Challenge</h5>
                      <p className="text-red-800 text-sm">{caseStudy.challenge}</p>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <h5 className="font-semibold text-blue-900 mb-1">Solution</h5>
                      <p className="text-blue-800 text-sm">{caseStudy.solution}</p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <h5 className="font-semibold text-green-900 mb-1">Outcome</h5>
                      <p className="text-green-800 text-sm">{caseStudy.outcome}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold mb-2">Key Lessons Learned:</h5>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {caseStudy.lessons_learned.map((lesson, lessonIndex) => (
                        <li key={lessonIndex}>{lesson}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Calculators and Tools */}
        <TabsContent value="calculators" className="space-y-4">
          {clause.calculators && clause.calculators.length > 0 ? (
            clause.calculators.map((calculator, index) => (
              <Card key={calculator.id} className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    {explainerLanguage === 'en' ? calculator.name_en : calculator.name_ms}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {explainerLanguage === 'en' ? calculator.description_en : calculator.description_ms}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h5 className="font-semibold mb-2">Available Parameters:</h5>
                      <div className="grid gap-2">
                        {calculator.input_parameters.map((param, paramIndex) => (
                          <div key={paramIndex} className="flex justify-between items-center">
                            <span className="font-medium">
                              {explainerLanguage === 'en' ? param.label_en : param.label_ms}
                            </span>
                            <Badge variant="outline">
                              {param.type} {param.unit && `(${param.unit})`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button className="w-full md:w-auto">
                        <Calculator className="h-4 w-4 mr-2" />
                        Open Calculator
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No interactive calculators available for this clause yet.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Our team is developing calculators for complex UBBL requirements. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer Metadata */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-between items-center text-sm text-muted-foreground gap-4">
            <div className="flex items-center gap-4">
              <span>Author: {explainer.author_name}</span>
              <span>Reviewer: {explainer.reviewer_name}</span>
              <span>Version: {explainer.version}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Last Updated: {explainer.updated_at.toLocaleDateString()}</span>
              <span>Review Date: {explainer.review_date?.toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}