import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Search, 
  Star, 
  Crown, 
  Zap, 
  TrendingUp,
  Users,
  Building,
  Target,
  Sparkles,
  Brain,
  Clock,
  Eye,
  Palette,
  BarChart3,
  Grid3x3,
  Lightbulb,
  Wand2,
  Filter
} from 'lucide-react';
import { useSmartDashboardStore } from '@/store/smartDashboardStore';
import { useAuthStore } from '@/store/authStore';
import { useProjectContextStore } from '@/store/projectContextStore';
import { toast } from 'sonner';

interface SmartTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

const categoryIcons = {
  productivity: Grid3x3,
  analytics: BarChart3,
  collaboration: Users,
  executive: Crown,
  operational: Target
};

const contextIcons = {
  global: Building,
  project: Target,
  both: Sparkles
};

export const SmartTemplateSelector: React.FC<SmartTemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const { user } = useAuthStore();
  const { mode, currentProject } = useProjectContextStore();
  const {
    availableTemplates,
    currentContext,
    getRecommendedTemplates,
    analytics,
    userPreferences,
    suggestOptimizations,
    generateSmartLayout
  } = useSmartDashboardStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const recommendedTemplates = getRecommendedTemplates();
  const optimizations = suggestOptimizations();

  // Filter templates based on search, category, and context
  const filteredTemplates = availableTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    const matchesContext = template.context === currentContext.mode || template.context === 'both';
    
    const matchesRole = template.userRoles.includes(currentContext.userRole);
    
    return matchesSearch && matchesCategory && matchesContext && matchesRole;
  });

  // Sort templates by relevance score
  const sortedTemplates = filteredTemplates.sort((a, b) => {
    // Calculate relevance score
    const aRelevance = a.aiScore * 0.4 + 
                      (analytics.templateUsage[a.id] || 0) * 0.3 +
                      (a.isRecommended ? 20 : 0) +
                      (userPreferences.recentlyUsedTemplates.includes(a.id) ? 15 : 0);
    
    const bRelevance = b.aiScore * 0.4 + 
                      (analytics.templateUsage[b.id] || 0) * 0.3 +
                      (b.isRecommended ? 20 : 0) +
                      (userPreferences.recentlyUsedTemplates.includes(b.id) ? 15 : 0);
    
    return bRelevance - aRelevance;
  });

  const categories = [
    { id: 'all', name: 'All Templates', icon: Grid3x3 },
    { id: 'executive', name: 'Executive', icon: Crown },
    { id: 'operational', name: 'Operations', icon: Target },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'collaboration', name: 'Team', icon: Users },
    { id: 'productivity', name: 'Productivity', icon: Zap }
  ];

  const handleSelectTemplate = (templateId: string) => {
    onSelectTemplate(templateId);
    toast.success('Template applied successfully!');
    onClose();
  };

  const handleGenerateAILayout = async () => {
    setIsGeneratingAI(true);
    try {
      await generateSmartLayout();
      toast.success('AI-generated layout applied!');
      onClose();
    } catch (error) {
      toast.error('Failed to generate AI layout');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getContextTitle = () => {
    if (currentContext.mode === 'project' && currentProject) {
      return `${currentProject.name} Dashboard Templates`;
    }
    return 'Global Dashboard Templates';
  };

  const getContextDescription = () => {
    if (currentContext.mode === 'project') {
      return 'Project-specific templates optimized for focused work and collaboration';
    }
    return 'Portfolio overview templates for managing multiple projects and teams';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl">{getContextTitle()}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {getContextDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 overflow-hidden">
          {/* Context Indicator */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentContext.mode === 'project' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                {currentContext.mode === 'project' ? 
                  <Target className="h-5 w-5 text-purple-600" /> : 
                  <Building className="h-5 w-5 text-blue-600" />
                }
              </div>
              <div>
                <div className="font-medium">
                  {currentContext.mode === 'project' ? 'Project Mode' : 'Global Mode'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentContext.mode === 'project' 
                    ? `Focused on: ${currentProject?.name || 'Current Project'}`
                    : 'Portfolio overview across all projects'
                  }
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">
                {currentContext.userRole.replace('_', ' ')}
              </Badge>
              {showAIRecommendations && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates, tags, or features..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleGenerateAILayout}
              disabled={isGeneratingAI}
              className="flex items-center gap-2"
            >
              <Wand2 className={`h-4 w-4 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              {isGeneratingAI ? 'Generating...' : 'AI Generate'}
            </Button>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 overflow-hidden">
            <TabsList className="grid grid-cols-6 w-full">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="mt-4 flex-1 overflow-y-auto">
              {/* AI Recommendations Section */}
              {showAIRecommendations && recommendedTemplates.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">AI Recommendations</h3>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                      Personalized
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {recommendedTemplates.slice(0, 3).map((template) => {
                      const Icon = categoryIcons[template.category];
                      const ContextIcon = contextIcons[template.context];
                      const usageCount = analytics.templateUsage[template.id] || 0;
                      
                      return (
                        <motion.div
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          className="relative"
                        >
                          <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg border-2 hover:border-purple-200 bg-gradient-to-br from-white to-purple-50/30">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-5 w-5 text-purple-600" />
                                  <CardTitle className="text-sm font-semibold">{template.name}</CardTitle>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center gap-1 text-xs text-amber-600">
                                    <Star className="h-3 w-3 fill-amber-400" />
                                    {template.aiScore}
                                  </div>
                                  {template.isRecommended && (
                                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                                      Recommended
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <CardDescription className="text-xs">
                                {template.description}
                              </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="pt-0">
                              <div className="space-y-3">
                                {/* Usage Stats */}
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Usage:</span>
                                  <div className="flex items-center gap-1">
                                    <Progress value={Math.min(usageCount * 10, 100)} className="h-1 w-12" />
                                    <span className="font-medium">{usageCount}</span>
                                  </div>
                                </div>
                                
                                {/* Context & Tags */}
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="outline" className="text-xs py-0">
                                    <ContextIcon className="h-3 w-3 mr-1" />
                                    {template.context}
                                  </Badge>
                                  {template.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs py-0">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                
                                <Button 
                                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                  size="sm"
                                  onClick={() => handleSelectTemplate(template.id)}
                                >
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Apply Template
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Optimizations */}
                  {optimizations.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">Smart Suggestions</span>
                      </div>
                      {optimizations.slice(0, 2).map((opt, index) => (
                        <div key={index} className="text-xs text-amber-700 mb-1">
                          • {opt.suggestion} (Confidence: {Math.round(opt.confidence * 100)}%)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* All Templates Grid */}
              <TabsContent value={selectedCategory} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {sortedTemplates.map((template, index) => {
                      const Icon = categoryIcons[template.category];
                      const ContextIcon = contextIcons[template.context];
                      const usageCount = analytics.templateUsage[template.id] || 0;
                      const isRecommended = recommendedTemplates.some(r => r.id === template.id);
                      
                      return (
                        <motion.div
                          key={template.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isRecommended ? 'border-purple-200 bg-gradient-to-br from-white to-purple-50/20' : 'hover:border-primary/50'
                          }`}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-primary" />
                                  <CardTitle className="text-sm">{template.name}</CardTitle>
                                </div>
                                <div className="flex items-center gap-1">
                                  {isRecommended && (
                                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                                      <Brain className="h-3 w-3 mr-1" />
                                      AI
                                    </Badge>
                                  )}
                                  {template.isCustom && (
                                    <Badge variant="secondary" className="text-xs">Custom</Badge>
                                  )}
                                  {template.category === 'executive' && (
                                    <Crown className="h-3 w-3 text-amber-500" />
                                  )}
                                </div>
                              </div>
                              <CardDescription className="text-xs">
                                {template.description}
                              </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                {/* Widgets Preview */}
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Includes:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {template.widgets.slice(0, 3).map((widget, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs py-0">
                                        {widget.title}
                                      </Badge>
                                    ))}
                                    {template.widgets.length > 3 && (
                                      <Badge variant="outline" className="text-xs py-0">
                                        +{template.widgets.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Stats */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <ContextIcon className="h-3 w-3" />
                                    {template.context}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {usageCount}
                                  </div>
                                </div>
                                
                                <Button 
                                  className="w-full"
                                  variant={isRecommended ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleSelectTemplate(template.id)}
                                >
                                  {isRecommended && <Sparkles className="h-4 w-4 mr-2" />}
                                  Apply Template
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                
                {sortedTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No templates found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search terms or category filter
                    </p>
                    <Button variant="outline" onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};