import React, { useState, useMemo } from 'react';
import { 
  Plus, Users, Calendar, Target, TrendingUp, Clock, 
  Play, Pause, SkipForward, Settings, Filter, BarChart3,
  Zap, Flag, Star, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import type { Sprint, UserStory, BurndownData, SprintCeremony } from '@/types/enterprise-pm';

interface AgileWorkspaceProps {
  onCreateSprint?: (sprint: Partial<Sprint>) => void;
  onUpdateStory?: (storyId: string, updates: Partial<UserStory>) => void;
}

const mockSprints: Sprint[] = [
  {
    id: 'sprint-1',
    projectId: 'proj-1',
    number: 1,
    name: 'Foundation & Setup',
    goal: 'Complete initial setup and foundation work for KLCC project',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-14'),
    teamCapacity: 320, // hours
    velocity: 42,
    stories: [],
    plannedPoints: 45,
    completedPoints: 42,
    burndown: [
      { date: new Date('2024-01-01'), idealRemaining: 45, actualRemaining: 45, completed: 0 },
      { date: new Date('2024-01-03'), idealRemaining: 36, actualRemaining: 38, completed: 7 },
      { date: new Date('2024-01-05'), idealRemaining: 27, actualRemaining: 28, completed: 17 },
      { date: new Date('2024-01-08'), idealRemaining: 18, actualRemaining: 15, completed: 30 },
      { date: new Date('2024-01-10'), idealRemaining: 9, actualRemaining: 8, completed: 37 },
      { date: new Date('2024-01-14'), idealRemaining: 0, actualRemaining: 3, completed: 42 }
    ],
    ceremonies: []
  },
  {
    id: 'sprint-2',
    projectId: 'proj-1',
    number: 2,
    name: 'Design Implementation',
    goal: 'Complete architectural design and begin structural work',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-28'),
    teamCapacity: 320,
    velocity: 0, // Current sprint
    stories: [],
    plannedPoints: 48,
    completedPoints: 28,
    burndown: [
      { date: new Date('2024-01-15'), idealRemaining: 48, actualRemaining: 48, completed: 0 },
      { date: new Date('2024-01-17'), idealRemaining: 40, actualRemaining: 43, completed: 5 },
      { date: new Date('2024-01-19'), idealRemaining: 32, actualRemaining: 35, completed: 13 },
      { date: new Date('2024-01-22'), idealRemaining: 24, actualRemaining: 28, completed: 20 },
      { date: new Date('2024-01-24'), idealRemaining: 16, actualRemaining: 20, completed: 28 }
    ],
    ceremonies: []
  }
];

const mockStories: UserStory[] = [
  {
    id: 'story-1',
    title: 'Site Survey and Analysis',
    description: 'Conduct comprehensive site survey and analysis for foundation planning',
    acceptanceCriteria: [
      'Complete topographical survey',
      'Soil analysis report generated',
      'Site constraints documented'
    ],
    storyPoints: 8,
    businessValue: 85,
    priority: 'high',
    sprintId: 'sprint-2',
    status: 'in-progress',
    tasks: []
  },
  {
    id: 'story-2',
    title: 'Architectural Blueprint Review',
    description: 'Review and finalize architectural blueprints with client',
    acceptanceCriteria: [
      'Client review meeting completed',
      'Feedback incorporated',
      'Final blueprints approved'
    ],
    storyPoints: 5,
    businessValue: 95,
    priority: 'critical',
    sprintId: 'sprint-2',
    status: 'review',
    tasks: []
  },
  {
    id: 'story-3',
    title: 'UBBL Compliance Check',
    description: 'Ensure all designs comply with Malaysian building codes',
    acceptanceCriteria: [
      'UBBL checklist completed',
      'Compliance report generated',
      'Issues documented and resolved'
    ],
    storyPoints: 3,
    businessValue: 100,
    priority: 'critical',
    sprintId: 'sprint-2',
    status: 'done',
    tasks: []
  },
  {
    id: 'story-4',
    title: 'Material Procurement Planning',
    description: 'Plan and initiate procurement for construction materials',
    acceptanceCriteria: [
      'Material requirements list created',
      'Supplier quotations obtained',
      'Purchase orders prepared'
    ],
    storyPoints: 13,
    businessValue: 70,
    priority: 'medium',
    status: 'backlog',
    tasks: []
  },
  {
    id: 'story-5',
    title: 'Project Team Onboarding',
    description: 'Onboard new team members and contractors',
    acceptanceCriteria: [
      'Team members briefed on project',
      'Access credentials provided',
      'Safety training completed'
    ],
    storyPoints: 5,
    businessValue: 60,
    priority: 'medium',
    status: 'ready',
    tasks: []
  }
];

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'gray' },
  { id: 'ready', title: 'Ready', color: 'blue' },
  { id: 'in-progress', title: 'In Progress', color: 'yellow' },
  { id: 'review', title: 'Review', color: 'purple' },
  { id: 'done', title: 'Done', color: 'green' }
];

export const AgileWorkspace: React.FC<AgileWorkspaceProps> = ({
  onCreateSprint,
  onUpdateStory
}) => {
  const [activeTab, setActiveTab] = useState('board');
  const [selectedSprint, setSelectedSprint] = useState<string>(mockSprints[1].id);
  const [stories, setStories] = useState<UserStory[]>(mockStories);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showCreateSprint, setShowCreateSprint] = useState(false);

  const currentSprint = mockSprints.find(s => s.id === selectedSprint);
  
  const sprintStories = useMemo(() => {
    return stories.filter(story => story.sprintId === selectedSprint);
  }, [stories, selectedSprint]);

  const backlogStories = useMemo(() => {
    return stories.filter(story => !story.sprintId);
  }, [stories]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const newStatus = destination.droppableId as UserStory['status'];
    
    setStories(prev => prev.map(story => 
      story.id === draggableId 
        ? { ...story, status: newStatus }
        : story
    ));

    onUpdateStory?.(draggableId, { status: newStatus });
  };

  const renderStoryCard = (story: UserStory, index: number) => (
    <Draggable key={story.id} draggableId={story.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "mb-2 cursor-pointer hover:shadow-md transition-shadow",
            snapshot.isDragging && "shadow-lg rotate-2"
          )}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <Badge variant={
                story.priority === 'critical' ? 'destructive' :
                story.priority === 'high' ? 'default' :
                story.priority === 'medium' ? 'secondary' : 'outline'
              } className="text-xs">
                {story.priority}
              </Badge>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {story.storyPoints} pts
                </Badge>
                <Star className="w-3 h-3 text-yellow-500" />
              </div>
            </div>
            
            <h4 className="font-medium text-sm mb-1 line-clamp-2">{story.title}</h4>
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{story.description}</p>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Value: {story.businessValue}/100
              </span>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{story.acceptanceCriteria.length} AC</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );

  const renderBoard = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-5 gap-4 h-full">
        {columns.map(column => {
          const columnStories = sprintStories.filter(story => story.status === column.id);
          
          return (
            <div key={column.id} className="flex flex-col">
              <div className={cn(
                "p-3 rounded-t-lg text-white font-medium flex items-center justify-between",
                `bg-${column.color}-500`
              )}>
                <span>{column.title}</span>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {columnStories.length}
                </Badge>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 p-2 border-l border-r border-b rounded-b-lg bg-gray-50 min-h-96",
                      snapshot.isDraggingOver && "bg-blue-50"
                    )}
                  >
                    {columnStories.map((story, index) => renderStoryCard(story, index))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );

  const renderBacklog = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Backlog</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" onClick={() => setShowCreateStory(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Story
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {backlogStories.map(story => (
          <Card key={story.id} className="cursor-pointer hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={
                      story.priority === 'critical' ? 'destructive' :
                      story.priority === 'high' ? 'default' :
                      'secondary'
                    }>
                      {story.priority}
                    </Badge>
                    <Badge variant="outline">{story.storyPoints} points</Badge>
                    <span className="text-xs text-gray-500">Value: {story.businessValue}</span>
                  </div>
                  <h4 className="font-medium mb-1">{story.title}</h4>
                  <p className="text-sm text-gray-600">{story.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    Add to Sprint
                  </Button>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSprintPlanning = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sprint Planning</CardTitle>
            <Button onClick={() => setShowCreateSprint(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Sprint
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Current Sprint: {currentSprint?.name}</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sprint Progress</span>
                    <span>{currentSprint?.completedPoints}/{currentSprint?.plannedPoints} points</span>
                  </div>
                  <Progress 
                    value={currentSprint ? (currentSprint.completedPoints / currentSprint.plannedPoints) * 100 : 0} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Team Capacity:</span>
                    <p className="font-medium">{currentSprint?.teamCapacity}h</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sprint Goal:</span>
                    <p className="font-medium text-xs">{currentSprint?.goal}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Team Velocity</h4>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={mockSprints}>
                  <XAxis dataKey="number" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Line type="monotone" dataKey="completedPoints" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Sprint Ceremonies */}
      <Card>
        <CardHeader>
          <CardTitle>Sprint Ceremonies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { name: 'Daily Standup', icon: Users, time: '9:00 AM', status: 'today' },
              { name: 'Sprint Review', icon: Target, time: 'Friday 2PM', status: 'upcoming' },
              { name: 'Retrospective', icon: TrendingUp, time: 'Friday 3PM', status: 'upcoming' },
              { name: 'Planning', icon: Calendar, time: 'Next Monday', status: 'scheduled' }
            ].map(ceremony => (
              <Card key={ceremony.name} className="text-center">
                <CardContent className="p-4">
                  <ceremony.icon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <h5 className="font-medium text-sm mb-1">{ceremony.name}</h5>
                  <p className="text-xs text-gray-500">{ceremony.time}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {ceremony.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBurndown = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Sprint Burndown Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={currentSprint?.burndown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
            <YAxis />
            <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
            <Line 
              type="monotone" 
              dataKey="idealRemaining" 
              stroke="#94a3b8" 
              strokeDasharray="5 5"
              name="Ideal Remaining" 
            />
            <Line 
              type="monotone" 
              dataKey="actualRemaining" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Actual Remaining" 
            />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Completed" 
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Agile Workspace</h2>
          <div className="flex items-center gap-2">
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockSprints.map(sprint => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    Sprint {sprint.number}: {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Sprint Status */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-green-600" />
            <span>Sprint {currentSprint?.number} Active</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>6 days remaining</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span>{currentSprint?.completedPoints}/{currentSprint?.plannedPoints} story points</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            <span>Velocity: 42 pts/sprint</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="board">Sprint Board</TabsTrigger>
            <TabsTrigger value="backlog">Product Backlog</TabsTrigger>
            <TabsTrigger value="planning">Sprint Planning</TabsTrigger>
            <TabsTrigger value="burndown">Burndown</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="flex-1 p-4 overflow-auto">
            {renderBoard()}
          </TabsContent>

          <TabsContent value="backlog" className="flex-1 p-4 overflow-auto">
            {renderBacklog()}
          </TabsContent>

          <TabsContent value="planning" className="flex-1 p-4 overflow-auto">
            {renderSprintPlanning()}
          </TabsContent>

          <TabsContent value="burndown" className="flex-1 p-4">
            {renderBurndown()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Dialog open={showCreateSprint} onOpenChange={setShowCreateSprint}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sprint</DialogTitle>
            <DialogDescription>Plan your next sprint with team capacity and goals</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Sprint name" />
            <Textarea placeholder="Sprint goal" />
            <div className="grid grid-cols-2 gap-4">
              <Input type="date" placeholder="Start date" />
              <Input type="date" placeholder="End date" />
            </div>
            <Input type="number" placeholder="Team capacity (hours)" />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCreateSprint(false)}>Create Sprint</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateStory} onOpenChange={setShowCreateStory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User Story</DialogTitle>
            <DialogDescription>Add a new user story to the product backlog</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Story title" />
            <Textarea placeholder="Story description" />
            <div className="grid grid-cols-3 gap-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Story points" />
              <Input type="number" placeholder="Business value" />
            </div>
            <Textarea placeholder="Acceptance criteria (one per line)" />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCreateStory(false)}>Create Story</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};