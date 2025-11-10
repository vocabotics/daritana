import React, { useState } from 'react';
import { HelpCircle, X, ExternalLink, Video, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface ContextualHelpProps {
  title: string;
  content: string;
  videoUrl?: string;
  articleUrl?: string;
  tips?: string[];
}

export function ContextualHelp({ title, content, videoUrl, articleUrl, tips }: ContextualHelpProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-full hover:bg-blue-100 hover:text-blue-600"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-2">{title}</h4>
            <p className="text-sm text-gray-600">{content}</p>
          </div>

          {tips && tips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Quick Tips:</p>
              <ul className="space-y-1">
                {tips.map((tip, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t">
            {videoUrl && (
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <Video className="h-3 w-3 mr-1" />
                Watch Video
              </Button>
            )}
            {articleUrl && (
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <Book className="h-3 w-3 mr-1" />
                Read More
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Floating Help Widget
export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 p-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
      >
        <HelpCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                <HelpCircle className="h-4 w-4 text-white" />
              </div>
              Need Help?
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsMinimized(true)}
              >
                _
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-sm h-auto py-2"
              onClick={() => window.open('/help', '_blank')}
            >
              <Book className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Help Center</div>
                <div className="text-xs text-gray-600">Browse articles and tutorials</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-sm h-auto py-2"
            >
              <Video className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Video Tutorials</div>
                <div className="text-xs text-gray-600">Watch step-by-step guides</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-sm h-auto py-2"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Contact Support</div>
                <div className="text-xs text-gray-600">Get help from our team</div>
              </div>
            </Button>
          </div>

          <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <p className="text-xs font-medium mb-2">Keyboard Shortcuts</p>
            <div className="space-y-1 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Help Center</span>
                <Badge variant="secondary" className="text-xs">F1</Badge>
              </div>
              <div className="flex justify-between">
                <span>Show Shortcuts</span>
                <Badge variant="secondary" className="text-xs">?</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Page-specific help contexts
export const helpContexts = {
  dashboard: {
    title: 'Dashboard Overview',
    content: 'Your dashboard shows real-time project statistics, recent activities, and important notifications. Customize widgets by clicking the settings icon.',
    tips: [
      'Drag widgets to rearrange',
      'Click any stat to see detailed view',
      'Filter data by date range'
    ]
  },
  projects: {
    title: 'Managing Projects',
    content: 'Create, organize, and track all your architecture projects. Use filters to find projects quickly, and switch between grid, list, and Kanban views.',
    tips: [
      'Use Ctrl+N to create new project',
      'Click project card for details',
      'Archive completed projects'
    ]
  },
  kanban: {
    title: 'Kanban Board',
    content: 'Visualize your workflow with drag-and-drop task management. Move tasks between columns to update their status automatically.',
    tips: [
      'Drag tasks to change status',
      'Use filters to focus on specific work',
      'Set WIP limits to prevent overload'
    ]
  },
  documents: {
    title: 'Document Management',
    content: 'Upload, organize, and collaborate on project documents. Version control ensures you never lose important changes.',
    tips: [
      'Drag files to upload',
      'Use categories to organize',
      'Enable review mode for collaboration'
    ]
  },
  financial: {
    title: 'Financial Tracking',
    content: 'Monitor project budgets, create invoices, and track payments. All financial data is encrypted and secure.',
    tips: [
      'Set budget alerts',
      'Export reports for accounting',
      'Track expenses by category'
    ]
  },
  team: {
    title: 'Team Collaboration',
    content: 'Chat with team members, join virtual rooms, and see who\'s online. Real-time presence makes collaboration seamless.',
    tips: [
      'Set your status to let others know your availability',
      'Use @mentions to get attention',
      'Join virtual rooms for focused work'
    ]
  }
};
