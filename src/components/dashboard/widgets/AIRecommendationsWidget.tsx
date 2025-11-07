import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

interface Recommendation {
  type: 'risk' | 'opportunity' | 'insight' | 'alert' | 'optimization' | 'info' | 'recommendation';
  title: string;
  description: string;
  action: string;
  priority?: 'high' | 'medium' | 'low';
}

export default function AIRecommendationsWidget({ data }: { data: Recommendation[] }) {
  if (!data || !Array.isArray(data)) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'insight': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'optimization': return <Zap className="h-4 w-4 text-purple-500" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4 text-indigo-500" />;
      case 'info': return <Zap className="h-4 w-4 text-gray-500" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'risk': return 'destructive';
      case 'alert': return 'destructive';
      case 'opportunity': return 'default';
      case 'insight': return 'secondary';
      case 'optimization': return 'secondary';
      case 'recommendation': return 'default';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Zap className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium">AI-Powered Insights</span>
      </div>
      {data.map((rec, index) => (
        <div key={index} className={`p-3 border rounded-lg hover:shadow-sm transition-shadow ${getPriorityColor(rec.priority)}`}>
          <div className="flex items-start gap-3">
            {getIcon(rec.type)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">{rec.title}</h4>
                <Badge variant={getTypeColor(rec.type)} className="text-xs">
                  {rec.type}
                </Badge>
                {rec.priority && (
                  <Badge variant="outline" className="text-xs">
                    {rec.priority}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
              <Button size="sm" variant="outline" className="text-xs">
                {rec.action}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}