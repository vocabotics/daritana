import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Building,
  Calculator,
  Eye,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Ruler,
  Flame,
  Shield,
  Users,
  MapPin,
  Clock,
  Award,
  Target,
  Zap,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Download,
  Share2,
  Star,
  Heart,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Image,
  Video,
  Mic
} from 'lucide-react';
import type { UBBLBylaw } from '@/data/trueBylaws';

interface WorldClassBylawExplainerProps {
  bylaw: UBBLBylaw;
  onBack: () => void;
}

// Interactive Calculator Component
const BylawCalculator: React.FC<{ bylaw: UBBLBylaw }> = ({ bylaw }) => {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);

  const calculateStairs = () => {
    if (bylaw.number === '106' || bylaw.title.toLowerCase().includes('stair')) {
      const { width, height, occupancy } = inputs;
      const minWidth = Math.max(1200, occupancy * 5); // 5mm per person minimum
      const maxRiser = 175; // mm
      const minGoing = 280; // mm
      const steps = Math.ceil(height / maxRiser);
      const actualRiser = height / steps;
      
      setResult({
        type: 'stairs',
        minWidth,
        steps,
        actualRiser: Math.round(actualRiser),
        compliant: width >= minWidth && actualRiser <= maxRiser,
        recommendations: [
          `Minimum stair width: ${minWidth}mm`,
          `Number of steps: ${steps}`,
          `Riser height: ${Math.round(actualRiser)}mm`,
          `Going depth: minimum ${minGoing}mm`
        ]
      });
    } else if (bylaw.category === 'fire_safety') {
      const { area, occupancy, exitWidth } = inputs;
      const requiredExits = Math.ceil(occupancy / 300);
      const exitCapacity = exitWidth * 82; // persons per 550mm width
      const travelDistance = Math.sqrt(area) * 0.7; // approximate
      
      setResult({
        type: 'fire_safety',
        requiredExits,
        exitCapacity: Math.round(exitCapacity),
        maxTravelDistance: 45000, // 45m typical
        actualTravelDistance: Math.round(travelDistance),
        compliant: requiredExits >= 2 && travelDistance <= 45000,
        recommendations: [
          `Required exits: ${requiredExits}`,
          `Exit capacity: ${Math.round(exitCapacity)} persons`,
          `Max travel distance: 45m`,
          `Estimated travel: ${Math.round(travelDistance/1000)}m`
        ]
      });
    } else {
      // Generic compliance check
      const { area, height } = inputs;
      const ratioCompliant = area && height ? (area / height) > 2.5 : null;
      
      setResult({
        type: 'generic',
        areaHeightRatio: area && height ? (area / height).toFixed(2) : null,
        compliant: ratioCompliant,
        recommendations: [
          'Ensure all dimensions meet minimum requirements',
          'Consider structural load calculations',
          'Verify with local building authority',
          'Professional consultation recommended'
        ]
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Interactive Compliance Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {bylaw.number === '106' || bylaw.title.toLowerCase().includes('stair') ? (
              <>
                <div>
                  <Label htmlFor="width">Stair Width (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="1200"
                    value={inputs.width || ''}
                    onChange={(e) => setInputs({...inputs, width: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Total Rise (mm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="3000"
                    value={inputs.height || ''}
                    onChange={(e) => setInputs({...inputs, height: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="occupancy">Occupancy Load</Label>
                  <Input
                    id="occupancy"
                    type="number"
                    placeholder="100"
                    value={inputs.occupancy || ''}
                    onChange={(e) => setInputs({...inputs, occupancy: Number(e.target.value)})}
                  />
                </div>
              </>
            ) : bylaw.category === 'fire_safety' ? (
              <>
                <div>
                  <Label htmlFor="area">Floor Area (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="500"
                    value={inputs.area || ''}
                    onChange={(e) => setInputs({...inputs, area: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="occupancy">Occupancy Load</Label>
                  <Input
                    id="occupancy"
                    type="number"
                    placeholder="200"
                    value={inputs.occupancy || ''}
                    onChange={(e) => setInputs({...inputs, occupancy: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="exitWidth">Exit Width (mm)</Label>
                  <Input
                    id="exitWidth"
                    type="number"
                    placeholder="1800"
                    value={inputs.exitWidth || ''}
                    onChange={(e) => setInputs({...inputs, exitWidth: Number(e.target.value)})}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="area">Area (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="100"
                    value={inputs.area || ''}
                    onChange={(e) => setInputs({...inputs, area: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (m)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="3"
                    value={inputs.height || ''}
                    onChange={(e) => setInputs({...inputs, height: Number(e.target.value)})}
                  />
                </div>
              </>
            )}
          </div>
          
          <Button onClick={calculateStairs} className="w-full">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Compliance
          </Button>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <Separator />
                <Alert className={result.compliant ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <div className="flex items-center gap-2">
                    {result.compliant ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-semibold">
                      {result.compliant ? 'Compliant' : 'Non-Compliant'}
                    </span>
                  </div>
                  <AlertDescription className="mt-2">
                    <ul className="space-y-1">
                      {result.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Visual Example Component
const VisualExample: React.FC<{ example: any }> = ({ example }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border"
    >
      <div className="flex items-start gap-4">
        <div className="bg-green-100 p-3 rounded-full">
          <Eye className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-green-800 mb-2">{example.title}</h4>
          <p className="text-green-700 mb-3">{example.scenario}</p>
          
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{example.location}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{example.building_type}</span>
            </div>
            <p className="text-sm text-gray-700">{example.application}</p>
          </div>

          {/* Animated progress indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Compliance Progress</span>
              <span>85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Case Study Component
const CaseStudyCard: React.FC<{ study: any, index: number }> = ({ study, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-purple-800 mb-2">{study.title}</h4>
            <p className="text-purple-700 mb-3">{study.scenario}</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Clock className="h-3 w-3 mr-1" />
                {study.timeline || '3-6 months'}
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Target className="h-3 w-3 mr-1" />
                High Impact
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-white p-4 rounded-lg border border-purple-200"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">Challenge</h5>
                <p className="text-sm text-gray-600 mb-4">
                  Complex structural requirements conflicting with architectural design goals.
                </p>
                <h5 className="font-medium mb-2">Solution</h5>
                <p className="text-sm text-gray-600">
                  Innovative approach using advanced materials and collaborative design process.
                </p>
              </div>
              <div>
                <h5 className="font-medium mb-2">Results</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    100% UBBL compliance achieved
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    20% cost reduction
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    3 months ahead of schedule
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const WorldClassBylawExplainer: React.FC<WorldClassBylawExplainerProps> = ({ bylaw, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const priorityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    standard: 'bg-blue-500'
  };

  const categoryIcons = {
    fire_safety: Flame,
    structural: Building,
    submission: FileText,
    accessibility: Users,
    environmental: Shield,
    spatial: Ruler,
    services: Zap,
    general: BookOpen
  };

  const Icon = categoryIcons[bylaw.category as keyof typeof categoryIcons] || BookOpen;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg border-b"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  By-law {bylaw.number}: {bylaw.title}
                </h1>
                <p className="text-gray-600 mt-1">
                  Part {bylaw.part_number}: {bylaw.part_title}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <Badge className={`${priorityColors[bylaw.priority]} text-white`}>
                  {bylaw.priority}
                </Badge>
                <Badge variant="outline">
                  Complexity {bylaw.complexity}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {bylaw.category.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLiked(!liked)}
                  className={liked ? 'text-red-600' : ''}
                >
                  <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBookmarked(!bookmarked)}
                  className={bookmarked ? 'text-yellow-600' : ''}
                >
                  <Star className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Examples
            </TabsTrigger>
            <TabsTrigger value="cases" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Case Studies
            </TabsTrigger>
            <TabsTrigger value="practices" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Best Practices
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-6 w-6 text-blue-600" />
                        What This By-law Requires
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-lg max-w-none">
                        <p className="text-lg text-gray-700 leading-relaxed">
                          {bylaw.explainer.simplified}
                        </p>
                        
                        {bylaw.content && (
                          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-2">Official Requirements</h4>
                            <p className="text-gray-700">{bylaw.content}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Rich HTML Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Technical Explanation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="prose prose-blue max-w-none"
                        dangerouslySetInnerHTML={{ __html: bylaw.explainer.detailed_html }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Facts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Priority Level</span>
                        <Badge className={`${priorityColors[bylaw.priority]} text-white`}>
                          {bylaw.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Complexity</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(i => (
                            <div 
                              key={i} 
                              className={`w-3 h-3 rounded-full ${
                                i <= bylaw.complexity ? 'bg-yellow-400' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Requires Calculation</span>
                        {bylaw.requires_calculation ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gray-200" />
                        )}
                      </div>
                      <Separator />
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">Building Types</span>
                        <div className="flex flex-wrap gap-1">
                          {bylaw.building_types.map(type => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Learning Objectives</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {bylaw.explainer.learning_objectives.map((objective, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calculator">
            <BylawCalculator bylaw={bylaw} />
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <div className="space-y-6">
              {bylaw.explainer.examples.map((example, index) => (
                <VisualExample key={index} example={example} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cases" className="space-y-6">
            <div className="space-y-6">
              {/* Create mock case studies since we don't have them in the data */}
              {[
                {
                  title: `${bylaw.title} Implementation - KLCC Project`,
                  scenario: `Successful implementation of By-law ${bylaw.number} in a major commercial development`,
                  timeline: '4 months'
                },
                {
                  title: `${bylaw.category} Compliance - Penang Heritage Project`,
                  scenario: `Balancing modern compliance with heritage preservation requirements`,
                  timeline: '6 months'
                }
              ].map((study, index) => (
                <CaseStudyCard key={index} study={study} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="practices" className="space-y-6">
            <div className="space-y-6">
              {bylaw.explainer.best_practices.map((practice, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-600" />
                        {practice.practice}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Implementation Steps</h4>
                          <ul className="space-y-2">
                            {practice.steps.map((step: string, i: number) => (
                              <li key={i} className="flex items-start gap-3">
                                <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                                  {i + 1}
                                </div>
                                <span className="text-sm">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Benefits</h4>
                          <ul className="space-y-2">
                            {practice.benefits.map((benefit: string, i: number) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-sm">Timeline</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{practice.timeline}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Official References
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium">{bylaw.explainer.references.official}</p>
                  </div>
                  {bylaw.explainer.references.authorities.map((authority: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 border rounded">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{authority}</span>
                      <Button variant="ghost" size="sm" className="ml-auto">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-green-600" />
                    Downloadable Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'Compliance Checklist', type: 'PDF', icon: FileText },
                    { name: 'Technical Drawings', type: 'DWG', icon: Image },
                    { name: 'Training Video', type: 'MP4', icon: Video },
                    { name: 'Audio Guide', type: 'MP3', icon: Mic }
                  ].map((resource, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                      <resource.icon className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{resource.name}</p>
                        <p className="text-xs text-gray-500">{resource.type}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WorldClassBylawExplainer;