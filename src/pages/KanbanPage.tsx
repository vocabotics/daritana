import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { QuickTaskModal } from '@/components/tasks/QuickTaskModal';
import { TasksEmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useUIStore } from '@/store/uiStore';
import { useDemoStore } from '@/store/demoStore';
import { Plus, Filter, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function KanbanPage() {
  const { projects, fetchProjects } = useProjectStore();
  const { tasks, fetchTasks, createTask, isLoading } = useTaskStore();
  const { showCreateTaskModal, openCreateTaskModal, closeCreateTaskModal } = useUIStore();
  const { isEnabled: isDemoMode } = useDemoStore();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  useEffect(() => {
    // Fetch projects and tasks when component mounts
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);
  
  useEffect(() => {
    // Re-fetch tasks when filters change
    const params: any = {};
    if (selectedProject !== 'all') params.projectId = selectedProject;
    if (selectedPriority !== 'all') params.priority = selectedPriority;
    if (selectedAssignee === 'me') {
      // TODO: Get current user ID and filter by assignedTo
    } else if (selectedAssignee === 'unassigned') {
      // TODO: Filter for unassigned tasks
    }
    
    fetchTasks(params);
  }, [selectedProject, selectedPriority, selectedAssignee, fetchTasks]);
  
  // Calculate stats from real data
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const reviewCount = tasks.filter(t => t.status === 'review').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  
  const shouldShowEmptyState = !isLoading && tasks.length === 0 && !isDemoMode;
  
  // Handle task creation
  const handleCreateTask = async (data: any) => {
    setIsCreatingTask(true);
    try {
      const success = await createTask(data);
      if (success) {
        toast.success('Task created successfully!');
        closeCreateTaskModal();
        
        // Refresh tasks to show the new task
        const params: any = {};
        if (selectedProject !== 'all') params.projectId = selectedProject;
        if (selectedPriority !== 'all') params.priority = selectedPriority;
        await fetchTasks(params);
      } else {
        toast.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light architect-heading">
              Kanban Board
            </h1>
            <p className="text-gray-600 architect-text mt-2">
              Manage tasks across all projects with visual workflow management
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Team View
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Timeline
            </Button>
            <Button 
              className="bg-black hover:bg-gray-800"
              onClick={openCreateTaskModal}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48 architect-border">
              <SelectValue placeholder="Filter by Project" />
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
          
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-32 architect-border">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
            <SelectTrigger className="w-40 architect-border">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team</SelectItem>
              <SelectItem value="me">Assigned to Me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
        
        {/* Show empty state when no tasks in real mode */}
        {shouldShowEmptyState ? (
          <div className="flex items-center justify-center py-20">
            <TasksEmptyState onCreateTask={openCreateTaskModal} />
          </div>
        ) : (
          <>
            {/* Kanban Board */}
            <div className="bg-white rounded-lg minimal-shadow">
              <div className="p-6">
                <KanbanBoard />
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-yellow-50 rounded-lg architect-border">
                <div className="text-2xl font-bold text-yellow-800">{todoCount}</div>
                <div className="text-sm text-yellow-600">To Do</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg architect-border">
                <div className="text-2xl font-bold text-blue-800">{inProgressCount}</div>
                <div className="text-sm text-blue-600">In Progress</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg architect-border">
                <div className="text-2xl font-bold text-orange-800">{reviewCount}</div>
                <div className="text-sm text-orange-600">Review</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg architect-border">
                <div className="text-2xl font-bold text-green-800">{doneCount}</div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
            </div>
          </>
        )}
        
        {/* Create Task Modal */}
        <QuickTaskModal
          open={showCreateTaskModal}
          onClose={closeCreateTaskModal}
          onSubmit={handleCreateTask}
          isLoading={isCreatingTask}
          projectId={selectedProject !== 'all' ? selectedProject : undefined}
        />
      </div>
    </Layout>
  );
}