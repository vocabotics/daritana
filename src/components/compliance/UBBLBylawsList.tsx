import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Building,
  Calculator,
  Eye,
  ChevronRight,
  BookOpen,
  AlertTriangle,
  Flame,
  List,
  Grid,
  Filter,
  Users,
  Ruler,
  Zap,
  FileText
} from 'lucide-react';
import { trueBylaws, TOTAL_BYLAWS, getBylawsByCategory, getCriticalBylaws } from '@/data/trueBylaws';
import WorldClassBylawExplainer from './WorldClassBylawExplainer';

export const UBBLBylawsList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByCategory, setFilterCategory] = useState('all');
  const [selectedBylaw, setSelectedBylaw] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeTab, setActiveTab] = useState('browse');

  const filteredBylaws = trueBylaws.filter(bylaw => {
    const matchesSearch = !searchQuery || 
      bylaw.number.includes(searchQuery) ||
      bylaw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bylaw.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterByCategory === 'all' || bylaw.category === filterByCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categoryIcons = {
    fire_safety: Flame,
    structural: Building,
    submission: FileText,
    accessibility: Users,
    environmental: BookOpen,
    spatial: Ruler,
    services: Zap,
    general: BookOpen
  };

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category as keyof typeof categoryIcons] || BookOpen;
    return Icon;
  };

  if (selectedBylaw) {
    return (
      <WorldClassBylawExplainer 
        bylaw={selectedBylaw} 
        onBack={() => setSelectedBylaw(null)} 
      />
    );
  }

  const categories = [
    { id: 'fire_safety', name: 'Fire Safety', icon: Flame, color: 'text-red-600', count: getBylawsByCategory('fire_safety').length },
    { id: 'structural', name: 'Structural', icon: Building, color: 'text-green-600', count: getBylawsByCategory('structural').length },
    { id: 'submission', name: 'Plan Submission', icon: FileText, color: 'text-blue-600', count: getBylawsByCategory('submission').length },
    { id: 'accessibility', name: 'Accessibility', icon: Users, color: 'text-purple-600', count: getBylawsByCategory('accessibility').length },
    { id: 'environmental', name: 'Environmental', icon: BookOpen, color: 'text-emerald-600', count: getBylawsByCategory('environmental').length },
    { id: 'spatial', name: 'Spatial Requirements', icon: Ruler, color: 'text-yellow-600', count: getBylawsByCategory('spatial').length },
    { id: 'services', name: 'Services', icon: Zap, color: 'text-indigo-600', count: getBylawsByCategory('services').length },
    { id: 'general', name: 'General', icon: BookOpen, color: 'text-gray-600', count: getBylawsByCategory('general').length }
  ];

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Browse & Search
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            By Category
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browse by Category</CardTitle>
              <CardDescription>
                Explore UBBL by-laws organized by regulatory category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Card
                      key={category.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setFilterCategory(category.id);
                        setActiveTab('browse');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Icon className={`h-5 w-5 ${category.color}`} />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{category.name}</h3>
                              <p className="text-sm text-muted-foreground">{category.count} by-laws</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">

      {/* Search and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
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
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-muted-foreground">
              Found {filteredBylaws.length} by-laws matching "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>UBBL By-laws ({filteredBylaws.length} results)</CardTitle>
          <CardDescription>
            Comprehensive Malaysian building regulations with rich explanations and interactive tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' ? (
            <div className="space-y-3">
              {filteredBylaws.slice(0, 20).map((bylaw) => {
                const Icon = getCategoryIcon(bylaw.category);
                return (
                  <div
                    key={bylaw.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedBylaw(bylaw)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            By-law {bylaw.number}: {bylaw.title}
                          </h3>
                          <Badge
                            variant={bylaw.priority === 'critical' ? 'destructive' : 
                                    bylaw.priority === 'high' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {bylaw.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Part {bylaw.part_number}: {bylaw.part_title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {bylaw.content || bylaw.explainer.simplified}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {bylaw.explainer.examples.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              {bylaw.explainer.examples.length} Examples
                            </Badge>
                          )}
                          {bylaw.requires_calculation && (
                            <Badge variant="secondary" className="text-xs">
                              <Calculator className="h-3 w-3 mr-1" />
                              Calculator
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Level {bylaw.complexity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBylaws.slice(0, 12).map((bylaw) => {
                const Icon = getCategoryIcon(bylaw.category);
                return (
                  <Card 
                    key={bylaw.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedBylaw(bylaw)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Icon className="h-4 w-4 text-blue-600" />
                          By-law {bylaw.number}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Badge 
                            variant={bylaw.priority === 'critical' ? 'destructive' : 
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
                      <Button size="sm" className="w-full text-xs h-8">
                        <ChevronRight className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredBylaws.length > (viewMode === 'list' ? 20 : 12) && (
            <div className="text-center mt-6">
              <p className="text-muted-foreground text-sm mb-4">
                Showing {viewMode === 'list' ? 20 : 12} of {filteredBylaws.length} by-laws. 
                Use search and filters to find specific regulations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UBBLBylawsList;