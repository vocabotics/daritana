import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LayoutGrid, Briefcase, Users, BarChart3, Calendar, 
  GitBranch, Settings, Upload, Download, Play, Zap, Globe, Building2,
  AlertCircle, RefreshCw, Filter, Plus, Save
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useFinancialStore } from '@/store/financialStore';
import { useUserStore } from '@/store/userStore';
import { GanttChart } from '@/components/enterprise/gantt/GanttChart';
import { ResourceManagement } from '@/components/enterprise/resources/ResourceManagement';
import { PortfolioDashboard } from '@/components/enterprise/portfolio/PortfolioDashboard';
import { WBSDesigner } from '@/components/enterprise/wbs/WBSDesigner';
import { AdvancedReporting } from '@/components/enterprise/reports/AdvancedReporting';
import { AgileWorkspace } from '@/components/enterprise/agile/AgileWorkspace';
import { MonteCarloSimulation } from '@/components/enterprise/advanced/MonteCarloSimulation';
import { toast } from 'sonner';
import { enterpriseApi } from '@/lib/api';
import type { GanttTask, Resource, ResourceAssignment, WBSNode } from '@/types/enterprise-pm';

export default function EnterprisePM() {
  const [activeTab, setActiveTab] = useState('gantt');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get data from unified stores
  const { projects, fetchProjects, currentProject, setCurrentProject, updateProject } = useProjectStore();
  const { tasks, fetchProjectTasks, createTask, updateTask, deleteTask } = useTaskStore();
  const { user } = useAuthStore();
  const { invoices, quotations, expenses } = useFinancialStore();
  const { users, fetchUsers } = useUserStore();

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchProjects();
        // Try to fetch users but don't fail if endpoint doesn't exist yet
        try {
          await fetchUsers();
        } catch (userError) {
          console.warn('Could not fetch users, using fallback data:', userError);
        }
        if (currentProject?.id) {
          await fetchProjectTasks(currentProject.id);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentProject?.id]);

  // Transform projects and tasks to Gantt format
  const ganttTasks: GanttTask[] = useMemo(() => {
    if (!projects.length && !tasks.length) return [];

    const ganttData: GanttTask[] = [];
    
    // Add projects as summary tasks
    projects.forEach(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const projectStart = new Date(project.startDate || new Date());
      const projectEnd = new Date(project.endDate || new Date());
      const duration = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate project completion based on task completion
      const totalTasks = projectTasks.length || 1;
      const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
      const percentComplete = Math.round((completedTasks / totalTasks) * 100);

      ganttData.push({
        id: project.id,
        wbsCode: project.id.substring(0, 8),
        name: project.name,
        type: 'summary',
        startDate: projectStart,
        endDate: projectEnd,
        duration: duration,
        percentComplete: percentComplete,
        predecessors: [],
        successors: [],
        resources: [],
        cost: project.budget || 0,
        actualCost: project.actualCost || 0,
        level: 0,
        children: projectTasks.map(t => t.id),
        isCritical: project.priority === 'urgent' || project.priority === 'high',
        totalFloat: 0,
        freeFloat: 0,
        baselines: [],
        customFields: {
          status: project.status,
          priority: project.priority,
          client: project.client?.firstName + ' ' + project.client?.lastName,
          location: [project.address, project.city, project.state].filter(Boolean).join(', ')
        }
      });

      // Add tasks as subtasks
      projectTasks.forEach((task, index) => {
        const taskStart = new Date(task.startDate || project.startDate || new Date());
        const taskEnd = new Date(task.dueDate || task.endDate || project.endDate || new Date());
        const taskDuration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine task completion percentage based on status
        let taskPercentComplete = 0;
        switch (task.status) {
          case 'completed': taskPercentComplete = 100; break;
          case 'in_progress': taskPercentComplete = task.progress || 50; break;
          case 'review': taskPercentComplete = 75; break;
          case 'todo': taskPercentComplete = 0; break;
          default: taskPercentComplete = 0;
        }

        // Create dependencies based on task order
        const predecessors = index > 0 ? [{
          id: `dep-${task.id}`,
          fromTaskId: projectTasks[index - 1].id,
          toTaskId: task.id,
          type: 'FS' as const,
          lag: 0
        }] : [];

        const successors = index < projectTasks.length - 1 ? [{
          id: `dep-${projectTasks[index + 1].id}`,
          fromTaskId: task.id,
          toTaskId: projectTasks[index + 1].id,
          type: 'FS' as const,
          lag: 0
        }] : [];

        ganttData.push({
          id: task.id,
          wbsCode: `${project.id.substring(0, 8)}.${index + 1}`,
          name: task.title,
          type: 'task',
          startDate: taskStart,
          endDate: taskEnd,
          duration: taskDuration,
          percentComplete: taskPercentComplete,
          parentId: project.id,
          predecessors: predecessors,
          successors: successors,
          resources: task.assignee ? [{
            resourceId: task.assignee.id,
            resourceName: task.assignee.name,
            units: 100,
            role: 'Developer'
          }] : [],
          cost: task.estimatedCost || 0,
          actualCost: task.actualCost || 0,
          level: 1,
          isCritical: task.priority === 'high' || task.priority === 'urgent',
          totalFloat: 0,
          freeFloat: 0,
          baselines: [],
          customFields: {
            status: task.status,
            priority: task.priority,
            assignee: task.assignee?.name,
            tags: task.tags?.join(', ')
          }
        });
      });
    });

    return ganttData;
  }, [projects, tasks]);

  // Transform organization users to resources
  const resources: Resource[] = useMemo(() => {
    // Use real organization users as resources
    const resourceMap = new Map<string, Resource>();
    
    // Add all organization users as resources
    users.forEach(user => {
      if (!resourceMap.has(user.id)) {
        const initials = user.name ? 
          user.name.split(' ').map(n => n[0]).join('').toUpperCase() :
          user.email.substring(0, 2).toUpperCase();
        
        resourceMap.set(user.id, {
          id: user.id,
          name: user.name || `${user.firstName} ${user.lastName}`,
          email: user.email,
          type: 'person',
          initials: initials,
          role: user.role === 'project_lead' ? 'Project Lead' :
                user.role === 'designer' ? 'Designer' :
                user.role === 'contractor' ? 'Contractor' :
                user.role === 'staff' ? 'Staff' : 'Team Member',
          department: user.department || 'General',
          costPerHour: user.costPerHour || 150,
          maxUnits: 100,
          currentAllocation: 0,
          skills: user.skills || [],
          availability: []
        });
      }
    });
    
    // Also add any task assignees that might not be in users list
    tasks.forEach(task => {
      if (task.assignee && !resourceMap.has(task.assignee.id)) {
        resourceMap.set(task.assignee.id, {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email || '',
          type: 'person',
          initials: task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          role: 'Team Member',
          department: 'Development',
          costPerHour: 150,
          maxUnits: 100,
          currentAllocation: 0,
          skills: [],
          availability: []
        });
      }
    });

    return Array.from(resourceMap.values());
  }, [users, tasks]);

  // Generate resource assignments
  const resourceAssignments: ResourceAssignment[] = useMemo(() => {
    const assignments: ResourceAssignment[] = [];
    
    ganttTasks.forEach(task => {
      if (task.type === 'task' && task.resources) {
        task.resources.forEach(resource => {
          assignments.push({
            id: `assign-${task.id}-${resource.resourceId}`,
            taskId: task.id,
            resourceId: resource.resourceId,
            units: resource.units || 100,
            startDate: task.startDate,
            endDate: task.endDate,
            actualWork: 0,
            plannedWork: task.duration * 8, // 8 hours per day
            remainingWork: task.duration * 8 * (1 - task.percentComplete / 100),
            cost: (resource.units / 100) * task.duration * 8 * 150 // Default rate
          });
        });
      }
    });

    return assignments;
  }, [ganttTasks]);

  // Transform projects to WBS structure
  const wbsData: WBSNode = useMemo(() => {
    if (!currentProject) {
      return {
        id: 'root',
        code: '0',
        name: 'Select a Project',
        type: 'deliverable',
        children: []
      };
    }

    const projectTasks = tasks.filter(t => t.projectId === currentProject.id);
    
    return {
      id: currentProject.id,
      code: '1',
      name: currentProject.name,
      type: 'deliverable',
      description: currentProject.description,
      duration: Math.ceil((new Date(currentProject.endDate || new Date()).getTime() - 
                          new Date(currentProject.startDate || new Date()).getTime()) / (1000 * 60 * 60 * 24)),
      cost: currentProject.budget,
      resources: currentProject.projectLead ? [currentProject.projectLead.email] : [],
      children: projectTasks.map((task, index) => ({
        id: task.id,
        code: `1.${index + 1}`,
        name: task.title,
        type: 'task',
        description: task.description,
        duration: Math.ceil((new Date(task.dueDate || task.endDate || new Date()).getTime() - 
                           new Date(task.startDate || new Date()).getTime()) / (1000 * 60 * 60 * 24)),
        cost: task.estimatedCost,
        resources: task.assignee ? [task.assignee.email || task.assignee.name] : [],
        children: []
      }))
    };
  }, [currentProject, tasks]);

  // Handle Gantt task updates
  const handleGanttTaskUpdate = async (taskId: string, updates: Partial<GanttTask>) => {
    try {
      setIsSaving(true);
      
      // Check if it's a project or task
      const project = projects.find(p => p.id === taskId);
      if (project) {
        // Update project
        await updateProject(taskId, {
          name: updates.name,
          startDate: updates.startDate?.toISOString(),
          endDate: updates.endDate?.toISOString(),
          budget: updates.cost
        });
        toast.success('Project updated successfully');
      } else {
        // Update task
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          await updateTask(taskId, {
            title: updates.name,
            startDate: updates.startDate?.toISOString(),
            dueDate: updates.endDate?.toISOString(),
            progress: updates.percentComplete,
            estimatedCost: updates.cost
          });
          toast.success('Task updated successfully');
        }
      }
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Failed to update. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle task creation
  const handleCreateTask = async (parentId?: string) => {
    try {
      setIsSaving(true);
      const projectId = parentId || currentProject?.id;
      if (!projectId) {
        toast.error('Please select a project first');
        return;
      }

      await createTask({
        projectId: projectId,
        title: 'New Task',
        description: 'Task description',
        status: 'todo',
        priority: 'medium',
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      toast.success('Task created successfully');
      await fetchProjectTasks(projectId);
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    try {
      setIsSaving(true);
      await deleteTask(taskId);
      toast.success('Task deleted successfully');
      if (currentProject?.id) {
        await fetchProjectTasks(currentProject.id);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle export
  const handleExport = () => {
    const exportData = {
      projects: projects,
      tasks: tasks,
      ganttTasks: ganttTasks,
      resources: resources,
      assignments: resourceAssignments,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enterprise-pm-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Enterprise Project Management</h1>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          {projects.length} Projects • {tasks.length} Tasks
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchProjects();
            if (currentProject?.id) {
              fetchProjectTasks(currentProject.id);
            }
          }}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button
          size="sm"
          onClick={() => handleCreateTask()}
          disabled={!currentProject}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>
    </div>
  );

  if (isLoading && !projects.length) {
    return (
      <Layout toolbar={toolbar}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">Loading project data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout toolbar={toolbar}>
      <div className="space-y-6">
        {!currentProject && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Select a project from the sidebar to view its details in Enterprise PM mode.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Gantt Chart
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="wbs" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              WBS
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="agile" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Agile
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Risk Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gantt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Gantt Chart</CardTitle>
                <CardDescription>
                  Interactive project timeline with dependencies, critical path, and resource allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GanttChart
                  tasks={ganttTasks}
                  onTaskUpdate={handleGanttTaskUpdate}
                  onTaskCreate={handleCreateTask}
                  onTaskDelete={handleDeleteTask}
                  showCriticalPath
                  showBaselines
                  showDependencies
                  enableDragDrop
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resource Management</CardTitle>
                <CardDescription>
                  Optimize resource allocation and track utilization across projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResourceManagement
                  resources={resources}
                  assignments={resourceAssignments}
                  tasks={ganttTasks}
                  onAssignmentUpdate={(assignmentId, updates) => {
                    console.log('Assignment update:', assignmentId, updates);
                    // Handle assignment updates
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Dashboard</CardTitle>
                <CardDescription>
                  Executive-level view of all projects with KPIs and strategic alignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioDashboard
                  projects={projects.map(p => ({
                    id: p.id,
                    name: p.name,
                    status: p.status as any || 'planning',
                    health: p.priority === 'urgent' || p.priority === 'high' ? 'red' : 
                            p.priority === 'medium' ? 'yellow' : 'green',
                    budget: p.budget || 100000,
                    spent: p.actualCost || 0,
                    progress: p.progress || 0,
                    startDate: new Date(p.startDate || new Date()),
                    endDate: new Date(p.endDate || new Date()),
                    roi: p.roi || 0, // Real ROI from API
                    npv: p.npv || 0, // Real NPV from API
                    irr: p.irr || 0, // Real IRR from API
                    riskScore: p.priority === 'urgent' ? 80 : p.priority === 'high' ? 60 : 30,
                    strategicAlignment: 70 + Math.random() * 30,
                    teamSize: tasks.filter(t => t.projectId === p.id).length || 5,
                    priority: p.priority as any || 'medium',
                    tasks: tasks.filter(t => t.projectId === p.id),
                    invoices: invoices.filter(i => i.projectId === p.id),
                    expenses: expenses?.filter(e => e.projectId === p.id) || []
                  }))}
                  totalBudget={projects.reduce((sum, p) => sum + (p.budget || 100000), 0)}
                  strategicGoals={[
                    { name: 'Customer Satisfaction', weight: 0.3, score: 85 },
                    { name: 'Innovation', weight: 0.25, score: 72 },
                    { name: 'Market Share', weight: 0.2, score: 68 },
                    { name: 'Operational Excellence', weight: 0.15, score: 90 },
                    { name: 'Sustainability', weight: 0.1, score: 75 }
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wbs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Work Breakdown Structure Designer</CardTitle>
                <CardDescription>
                  Visual WBS editor with drag-and-drop functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WBSDesigner
                  data={wbsData}
                  onNodeUpdate={(nodeId, updates) => {
                    console.log('WBS node update:', nodeId, updates);
                    // Handle WBS updates
                  }}
                  onNodeCreate={(parentId, node) => {
                    handleCreateTask(parentId);
                  }}
                  onNodeDelete={(nodeId) => {
                    handleDeleteTask(nodeId);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Reporting</CardTitle>
                <CardDescription>
                  Comprehensive reports with custom templates and real-time analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdvancedReporting
                  projects={projects}
                  tasks={tasks}
                  resources={resources}
                  financials={{
                    invoices: invoices,
                    quotations: quotations,
                    expenses: expenses || []
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agile Workspace</CardTitle>
                <CardDescription>
                  Sprint planning, burndown charts, and agile ceremonies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgileWorkspace
                  tasks={tasks}
                  projects={projects}
                  onTaskUpdate={updateTask}
                  onTaskCreate={createTask}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monte Carlo Risk Analysis</CardTitle>
                <CardDescription>
                  AI-powered probabilistic project forecasting and risk assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MonteCarloSimulation
                  tasks={ganttTasks}
                  resources={resources}
                  historicalData={{
                    projects: projects,
                    tasks: tasks
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isSaving && (
          <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm">Saving changes...</span>
          </div>
        )}
      </div>
    </Layout>
  );
}