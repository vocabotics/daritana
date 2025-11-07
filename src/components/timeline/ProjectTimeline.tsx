import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/utils';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  category: 'design' | 'engineering' | 'client' | 'management' | 'construction';
  assignedTo: string[];
  progress: number;
}

const mockTimelineItems: TimelineItem[] = [
  {
    id: '1',
    title: 'Initial Design Consultation',
    description: 'Meet with client to understand requirements and preferences',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-17'),
    status: 'completed',
    category: 'client',
    assignedTo: ['Ahmad Rahman', 'Lisa Wong'],
    progress: 100
  },
  {
    id: '2',
    title: 'Site Survey and Measurements',
    description: 'Detailed measurements and assessment of existing space',
    startDate: new Date('2024-01-18'),
    endDate: new Date('2024-01-20'),
    status: 'completed',
    category: 'engineering',
    assignedTo: ['Technical Team'],
    progress: 100
  },
  {
    id: '3',
    title: 'Design Brief Development',
    description: 'Create comprehensive design brief based on client requirements',
    startDate: new Date('2024-01-21'),
    endDate: new Date('2024-01-25'),
    status: 'in_progress',
    category: 'design',
    assignedTo: ['Lisa Wong'],
    progress: 75
  },
  {
    id: '4',
    title: 'DBKL Permit Application',
    description: 'Submit renovation permit application to local authorities',
    startDate: new Date('2024-01-26'),
    endDate: new Date('2024-02-15'),
    status: 'pending',
    category: 'management',
    assignedTo: ['Ahmad Rahman'],
    progress: 0
  },
  {
    id: '5',
    title: 'Detailed Design Development',
    description: 'Create detailed floor plans, elevations, and 3D renderings',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-28'),
    status: 'pending',
    category: 'design',
    assignedTo: ['Lisa Wong', 'Design Team'],
    progress: 0
  },
  {
    id: '6',
    title: 'Client Design Approval',
    description: 'Present final designs to client for approval',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-03-05'),
    status: 'pending',
    category: 'client',
    assignedTo: ['Ahmad Rahman'],
    progress: 0
  },
  {
    id: '7',
    title: 'Construction Phase',
    description: 'Execute renovation according to approved designs',
    startDate: new Date('2024-03-15'),
    endDate: new Date('2024-06-15'),
    status: 'pending',
    category: 'construction',
    assignedTo: ['Construction Team'],
    progress: 0
  },
  {
    id: '8',
    title: 'Final Inspection & Handover',
    description: 'Final quality check and project handover to client',
    startDate: new Date('2024-06-16'),
    endDate: new Date('2024-06-30'),
    status: 'pending',
    category: 'management',
    assignedTo: ['Ahmad Rahman'],
    progress: 0
  }
];

export function ProjectTimeline() {
  const getStatusColor = (status: TimelineItem['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getCategoryColor = (category: TimelineItem['category']) => {
    switch (category) {
      case 'design':
        return 'bg-purple-100 text-purple-800';
      case 'engineering':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-pink-100 text-pink-800';
      case 'management':
        return 'bg-indigo-100 text-indigo-800';
      case 'construction':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="relative">
        {mockTimelineItems.map((item, index) => (
          <div key={item.id} className="relative timeline-item pl-8 pb-8">
            {index < mockTimelineItems.length - 1 && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            )}
            
            <div className="timeline-marker">
              {item.status === 'completed' && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            
            <Card className="architect-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="architect-heading">{item.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 architect-text">
                  {item.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Start: {formatDate(item.startDate)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>End: {formatDate(item.endDate)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{item.assignedTo.join(', ')}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}