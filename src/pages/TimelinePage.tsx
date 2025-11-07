import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProjectTimeline } from '@/components/timeline/ProjectTimeline';
import { Calendar } from '@/components/calendar/Calendar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectStore } from '@/store/projectStore';
import { Calendar as CalendarIcon, Filter, Download, Eye, Clock, FileText } from 'lucide-react';

export function TimelinePage() {
  const { projects } = useProjectStore();
  const [activeView, setActiveView] = useState('timeline');
  
  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="h-8 bg-transparent border-0 p-0">
          <TabsTrigger value="timeline" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Calendar
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {}}
          className="h-8 px-3"
        >
          <Eye className="h-4 w-4 mr-2" />
          <span className="text-sm">Gantt View</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {}}
          className="h-8 px-3"
        >
          <FileText className="h-4 w-4 mr-2" />
          <span className="text-sm">Export PDF</span>
        </Button>
      </div>
    </div>
  );
  
  return (
    <Layout contextualInfo={false} toolbar={toolbar}>
      <div className="space-y-6">
        
        {/* Content based on active view */}
        {activeView === 'timeline' ? (
          <div className="space-y-6">
            {/* Timeline Filters */}
            <div className="flex flex-wrap gap-4">
              <Select>
                <SelectTrigger className="w-48 architect-border">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger className="w-40 architect-border">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger className="w-32 architect-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
            
            {/* Timeline Content */}
            <div className="bg-white rounded-lg minimal-shadow">
              <div className="p-6">
                <ProjectTimeline />
              </div>
            </div>
            
            {/* Timeline Legend */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Overdue</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-600">Due Soon</span>
              </div>
            </div>
          </div>
        ) : (
          <Calendar />
        )}
      </div>
    </Layout>
  );
}