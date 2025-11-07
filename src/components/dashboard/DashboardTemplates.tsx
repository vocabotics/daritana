import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Users, TrendingUp, Zap, Lock, Award } from 'lucide-react';
import { DashboardWidget } from '@/types/dashboard';
import { cn } from '@/lib/utils';

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operational' | 'creative' | 'analytical' | 'collaborative';
  previewImage: string;
  widgets: DashboardWidget[];
  tags: string[];
  userRoles: string[];
  rating?: number;
  usageCount?: number;
  isPremium?: boolean;
  isPopular?: boolean;
}

// Properly positioned templates with no overlaps
export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  // Executive Templates
  {
    id: 'executive-command',
    name: 'Executive Command Center',
    description: 'High-level overview designed for executives and project leads',
    category: 'executive',
    previewImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    widgets: [
      { id: '1', type: 'performance-metrics', title: 'KPI Dashboard', position: { x: 0, y: 0 }, size: { width: 6, height: 4 } },
      { id: '2', type: 'revenue-chart', title: 'Financial Overview', position: { x: 6, y: 0 }, size: { width: 6, height: 4 } },
      { id: '3', type: 'active-projects', title: 'Portfolio Status', position: { x: 0, y: 4 }, size: { width: 4, height: 3 } },
      { id: '4', type: 'team-overview', title: 'Team Metrics', position: { x: 4, y: 4 }, size: { width: 4, height: 3 } },
      { id: '5', type: 'upcoming-deadlines', title: 'Critical Deadlines', position: { x: 8, y: 4 }, size: { width: 4, height: 3 } },
      { id: '6', type: 'ai-recommendations', title: 'Strategic Insights', position: { x: 0, y: 7 }, size: { width: 12, height: 2 } }
    ],
    tags: ['executive', 'overview', 'kpi', 'strategic'],
    userRoles: ['admin', 'project_lead'],
    rating: 4.8,
    usageCount: 1542,
    isPopular: true
  },
  {
    id: 'minimalist-focus',
    name: 'Minimalist Focus',
    description: 'Clean, distraction-free layout for deep work and focus',
    category: 'operational',
    previewImage: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=600&h=400&fit=crop',
    widgets: [
      { id: '1', type: 'my-tasks', title: 'Today\'s Focus', position: { x: 0, y: 0 }, size: { width: 6, height: 5 } },
      { id: '2', type: 'upcoming-deadlines', title: 'Deadlines', position: { x: 6, y: 0 }, size: { width: 6, height: 3 } },
      { id: '3', type: 'quick-actions', title: 'Quick Actions', position: { x: 6, y: 3 }, size: { width: 6, height: 2 } },
      { id: '4', type: 'activity-feed', title: 'Recent Updates', position: { x: 0, y: 5 }, size: { width: 12, height: 3 } }
    ],
    tags: ['minimal', 'focus', 'productivity', 'clean'],
    userRoles: ['designer', 'staff', 'contractor'],
    rating: 4.6,
    usageCount: 892
  },

  // Creative Templates
  {
    id: 'creative-studio',
    name: 'Creative Studio',
    description: 'Perfect for designers with visual project tracking',
    category: 'creative',
    previewImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop',
    widgets: [
      { id: '1', type: 'active-projects', title: 'Design Projects', position: { x: 0, y: 0 }, size: { width: 8, height: 4 } },
      { id: '2', type: 'recent-files', title: 'Recent Designs', position: { x: 8, y: 0 }, size: { width: 4, height: 4 } },
      { id: '3', type: 'my-tasks', title: 'Creative Tasks', position: { x: 0, y: 4 }, size: { width: 4, height: 3 } },
      { id: '4', type: 'team-overview', title: 'Design Team', position: { x: 4, y: 4 }, size: { width: 4, height: 3 } },
      { id: '5', type: 'activity-feed', title: 'Creative Updates', position: { x: 8, y: 4 }, size: { width: 4, height: 3 } },
      { id: '6', type: 'upcoming-deadlines', title: 'Project Deadlines', position: { x: 0, y: 7 }, size: { width: 12, height: 2 } }
    ],
    tags: ['creative', 'design', 'visual', 'artistic'],
    userRoles: ['designer'],
    rating: 4.7,
    usageCount: 673,
    isPremium: true
  },

  // Analytical Templates
  {
    id: 'data-analyst',
    name: 'Data Command Center',
    description: 'Data-rich layout with comprehensive analytics',
    category: 'analytical',
    previewImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    widgets: [
      { id: '1', type: 'performance-metrics', title: 'Metrics Overview', position: { x: 0, y: 0 }, size: { width: 12, height: 3 } },
      { id: '2', type: 'revenue-chart', title: 'Revenue Analysis', position: { x: 0, y: 3 }, size: { width: 6, height: 4 } },
      { id: '3', type: 'active-projects', title: 'Project Analytics', position: { x: 6, y: 3 }, size: { width: 6, height: 4 } },
      { id: '4', type: 'team-overview', title: 'Resource Allocation', position: { x: 0, y: 7 }, size: { width: 4, height: 3 } },
      { id: '5', type: 'upcoming-deadlines', title: 'Timeline Analysis', position: { x: 4, y: 7 }, size: { width: 4, height: 3 } },
      { id: '6', type: 'ai-recommendations', title: 'AI Insights', position: { x: 8, y: 7 }, size: { width: 4, height: 3 } }
    ],
    tags: ['analytics', 'data', 'metrics', 'insights'],
    userRoles: ['admin', 'project_lead'],
    rating: 4.9,
    usageCount: 1123,
    isPremium: true
  },

  // Collaborative Templates
  {
    id: 'team-hub',
    name: 'Team Collaboration Hub',
    description: 'Optimized for team collaboration and communication',
    category: 'collaborative',
    previewImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop',
    widgets: [
      { id: '1', type: 'team-overview', title: 'Team Status', position: { x: 0, y: 0 }, size: { width: 12, height: 3 } },
      { id: '2', type: 'activity-feed', title: 'Team Activity', position: { x: 0, y: 3 }, size: { width: 6, height: 4 } },
      { id: '3', type: 'active-projects', title: 'Team Projects', position: { x: 6, y: 3 }, size: { width: 6, height: 4 } },
      { id: '4', type: 'upcoming-deadlines', title: 'Team Deadlines', position: { x: 0, y: 7 }, size: { width: 6, height: 3 } },
      { id: '5', type: 'my-tasks', title: 'Team Tasks', position: { x: 6, y: 7 }, size: { width: 6, height: 3 } }
    ],
    tags: ['team', 'collaboration', 'communication'],
    userRoles: ['project_lead', 'staff'],
    rating: 4.5,
    usageCount: 756
  },

  // Operational Templates
  {
    id: 'daily-operations',
    name: 'Daily Operations',
    description: 'Streamlined for daily operational management',
    category: 'operational',
    previewImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
    widgets: [
      { id: '1', type: 'my-tasks', title: 'Today\'s Tasks', position: { x: 0, y: 0 }, size: { width: 4, height: 4 } },
      { id: '2', type: 'active-projects', title: 'Active Work', position: { x: 4, y: 0 }, size: { width: 8, height: 4 } },
      { id: '3', type: 'upcoming-deadlines', title: 'Deadlines', position: { x: 0, y: 4 }, size: { width: 6, height: 2 } },
      { id: '4', type: 'quick-actions', title: 'Actions', position: { x: 6, y: 4 }, size: { width: 6, height: 2 } },
      { id: '5', type: 'recent-files', title: 'Recent Files', position: { x: 0, y: 6 }, size: { width: 4, height: 3 } },
      { id: '6', type: 'activity-feed', title: 'Updates', position: { x: 4, y: 6 }, size: { width: 8, height: 3 } }
    ],
    tags: ['operations', 'daily', 'tasks', 'efficient'],
    userRoles: ['staff', 'contractor', 'designer'],
    rating: 4.4,
    usageCount: 1892,
    isPopular: true
  },

  // Client View Template
  {
    id: 'client-portal',
    name: 'Client Portal',
    description: 'Client-friendly view with project status and updates',
    category: 'executive',
    previewImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
    widgets: [
      { id: '1', type: 'project-overview', title: 'Project Status', position: { x: 0, y: 0 }, size: { width: 12, height: 3 } },
      { id: '2', type: 'active-projects', title: 'Timeline', position: { x: 0, y: 3 }, size: { width: 8, height: 4 } },
      { id: '3', type: 'revenue-chart', title: 'Budget Status', position: { x: 8, y: 3 }, size: { width: 4, height: 4 } },
      { id: '4', type: 'recent-files', title: 'Documents', position: { x: 0, y: 7 }, size: { width: 6, height: 3 } },
      { id: '5', type: 'activity-feed', title: 'Updates', position: { x: 6, y: 7 }, size: { width: 6, height: 3 } }
    ],
    tags: ['client', 'portal', 'status', 'updates'],
    userRoles: ['client'],
    rating: 4.3,
    usageCount: 421
  }
];

interface DashboardTemplatesProps {
  onSelectTemplate: (template: DashboardTemplate) => void;
  currentTemplateId?: string;
}

export function DashboardTemplates({ onSelectTemplate, currentTemplateId }: DashboardTemplatesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {DASHBOARD_TEMPLATES.map((template) => (
        <motion.div
          key={template.id}
          whileHover={{ y: -4 }}
          className="cursor-pointer"
        >
          <Card 
            className={cn(
              "overflow-hidden hover:shadow-lg transition-all",
              currentTemplateId === template.id && "ring-2 ring-blue-500"
            )}
            onClick={() => onSelectTemplate(template)}
          >
            <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
              <img 
                src={template.previewImage} 
                alt={template.name}
                className="w-full h-full object-cover"
              />
              {template.isPremium && (
                <Badge className="absolute top-2 right-2 bg-yellow-500">
                  <Lock className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              {template.isPopular && (
                <Badge className="absolute top-2 left-2 bg-green-500">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {template.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{template.rating}</span>
                    </div>
                  )}
                  {template.usageCount && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{template.usageCount}</span>
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="capitalize">
                  {template.category}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="w-4 h-4" />
                  <span>{template.widgets.length} widgets</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              <Button 
                className="w-full mt-4" 
                variant={currentTemplateId === template.id ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTemplate(template);
                }}
              >
                {currentTemplateId === template.id ? "Selected" : "Use Template"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export default DashboardTemplates;