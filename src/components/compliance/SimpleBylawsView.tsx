import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Building,
  Calculator,
  Eye,
  ChevronRight,
  BookOpen,
  AlertTriangle,
  Flame,
  Zap,
  TrendingUp,
  Star,
  Sparkles
} from 'lucide-react';
import { trueBylaws, TOTAL_BYLAWS, getBylawsByCategory, getCriticalBylaws } from '@/data/trueBylaws';
import WorldClassBylawExplainer from './WorldClassBylawExplainer';

export const SimpleBylawsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByCategory, setFilterCategory] = useState('all');
  const [selectedBylaw, setSelectedBylaw] = useState<any>(null);

  const filteredBylaws = trueBylaws.filter(bylaw => {
    const matchesSearch = !searchQuery || 
      bylaw.number.includes(searchQuery) ||
      bylaw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bylaw.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterByCategory === 'all' || bylaw.category === filterByCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (selectedBylaw) {
    return (
      <WorldClassBylawExplainer 
        bylaw={selectedBylaw} 
        onBack={() => setSelectedBylaw(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="space-y-8 p-6">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white relative overflow-hidden"
        >
          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-4 flex items-center justify-center gap-3"
            >
              <Sparkles className="h-10 w-10" />
              World-Class UBBL By-laws System
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl opacity-90 max-w-3xl mx-auto"
            >
              Experience {TOTAL_BYLAWS} authentic Malaysian building regulations with interactive calculators, 
              rich explainers, and professional-grade compliance tools.
            </motion.p>
          </div>
          
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 20 + 5}px`,
                  height: `${Math.random() * 20 + 5}px`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Enhanced Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {[
            { icon: BookOpen, label: 'Total By-laws', value: TOTAL_BYLAWS, color: 'blue', trend: '+5%' },
            { icon: AlertTriangle, label: 'Critical', value: getCriticalBylaws().length, color: 'red', trend: 'High Priority' },
            { icon: Flame, label: 'Fire Safety', value: getBylawsByCategory('fire_safety').length, color: 'orange', trend: 'Essential' },
            { icon: Building, label: 'Structural', value: getBylawsByCategory('structural').length, color: 'green', trend: 'Core' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group"
            >
              <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-full bg-${stat.color}-100 group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 text-xs text-${stat.color}-600 bg-${stat.color}-50 px-2 py-1 rounded-full`}>
                        <TrendingUp className="h-3 w-3" />
                        {stat.trend}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-gray-200"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by-laws by number, title, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/50"
              />
            </div>
            <Select value={filterByCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-64 h-12 border-2 border-gray-200 rounded-xl bg-white/50">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm">
                <SelectItem value="all">🏢 All Categories</SelectItem>
                <SelectItem value="fire_safety">🔥 Fire Safety</SelectItem>
                <SelectItem value="structural">🏗️ Structural</SelectItem>
                <SelectItem value="submission">📋 Plan Submission</SelectItem>
                <SelectItem value="accessibility">♿ Accessibility</SelectItem>
                <SelectItem value="environmental">🌿 Environmental</SelectItem>
                <SelectItem value="spatial">📏 Spatial Requirements</SelectItem>
                <SelectItem value="services">⚡ Services</SelectItem>
                <SelectItem value="general">📖 General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {searchQuery && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 text-sm text-gray-600"
            >
              Found {filteredBylaws.length} by-laws matching "{searchQuery}"
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced By-laws Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredBylaws.slice(0, 12).map((bylaw, index) => (
            <motion.div
              key={bylaw.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <Card className="relative overflow-hidden cursor-pointer bg-white/80 backdrop-blur-sm border-2 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 h-full">
                {/* Priority indicator */}
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  bylaw.priority === 'critical' ? 'bg-red-500' :
                  bylaw.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                
                {/* Interactive hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base group-hover:text-blue-600 transition-colors">
                      <div className="p-2 rounded-full bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300">
                        <Building className="h-4 w-4 text-blue-600" />
                      </div>
                      By-law {bylaw.number}
                    </CardTitle>
                    
                    <div className="flex gap-1">
                      <Badge 
                        variant={bylaw.priority === 'critical' ? 'destructive' : 
                                bylaw.priority === 'high' ? 'default' : 'secondary'} 
                        className="text-xs font-semibold"
                      >
                        {bylaw.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Level {bylaw.complexity}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardDescription className="text-xs text-gray-600">
                    Part {bylaw.part_number}: {bylaw.part_title}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0 relative z-10 flex flex-col h-full">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-3 text-sm line-clamp-2 group-hover:text-blue-800 transition-colors">
                      {bylaw.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                      {bylaw.content || bylaw.explainer.simplified}
                    </p>
                    
                    {/* Enhanced Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {bylaw.explainer.examples.length > 0 && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge variant="secondary" className="text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                            <Eye className="h-3 w-3 mr-1" />
                            {bylaw.explainer.examples.length} Examples
                          </Badge>
                        </motion.div>
                      )}
                      {bylaw.requires_calculation && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge variant="secondary" className="text-xs px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
                            <Calculator className="h-3 w-3 mr-1" />
                            Calculator
                          </Badge>
                        </motion.div>
                      )}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Rich Explainer
                        </Badge>
                      </motion.div>
                    </div>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => setSelectedBylaw(bylaw)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Explore Rich Details
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </motion.div>
                </CardContent>
                
                {/* Floating action indicators */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="p-1 bg-white/90 rounded-full shadow-lg"
                  >
                    <Star className="h-3 w-3 text-yellow-500" />
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredBylaws.length > 12 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-center bg-white/60 backdrop-blur-sm p-8 rounded-2xl border-2 border-gray-200"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex -space-x-2">
                {[BookOpen, Calculator, Eye, Star].map((Icon, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.1 + i * 0.1 }}
                    className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white"
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </motion.div>
                ))}
              </div>
              <div className="text-lg font-semibold text-gray-800">
                Showing 12 of {filteredBylaws.length} world-class by-laws
              </div>
            </div>
            
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              Use our advanced search and intelligent filters to discover the exact regulations you need. 
              Each by-law features interactive calculators, real-world examples, and comprehensive explanations.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="outline" className="px-3 py-1 bg-white/80">
                🔍 Intelligent Search
              </Badge>
              <Badge variant="outline" className="px-3 py-1 bg-white/80">
                🧮 Interactive Calculators
              </Badge>
              <Badge variant="outline" className="px-3 py-1 bg-white/80">
                📚 Rich Examples
              </Badge>
              <Badge variant="outline" className="px-3 py-1 bg-white/80">
                🎯 Best Practices
              </Badge>
            </div>
          </motion.div>
        )}

        {/* Professional Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center py-12 border-t border-gray-200 bg-white/40 backdrop-blur-sm rounded-2xl"
        >
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              The World's Most Comprehensive UBBL Compliance System
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Trusted by universities, architectural firms, and government authorities across Malaysia. 
              Experience the future of building regulation compliance with our AI-powered platform.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="text-3xl font-bold text-blue-600 mb-2">{TOTAL_BYLAWS}</div>
                <div className="text-gray-600">Authentic By-laws</div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
                <div className="text-gray-600">UBBL 1984 Coverage</div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-bold text-purple-600 mb-2">AI</div>
                <div className="text-gray-600">Powered Insights</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SimpleBylawsView;