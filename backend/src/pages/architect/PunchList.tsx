import React, { useState, useEffect } from 'react';
import { Plus, Camera, CheckCircle, AlertTriangle, Clock, Download, Filter, MessageSquare, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePunchListStore } from '@/store/architect/punchListStore';
import { useProjectStore } from '@/store/projectStore';
import { PunchItem, PunchListFilters, PunchPhoto } from '@/types/architect';
import { toast } from 'sonner';

const PunchList: React.FC = () => {
  const {
    punchItems,
    currentPunchItem,
    statistics,
    loading,
    error,
    fetchPunchItems,
    fetchPunchItem,
    createPunchItem,
    updateStatus,
    uploadPhotos,
    addComment,
    fetchStatistics,
    exportReport,
    setFilters,
    clearError,
  } = usePunchListStore();

  const { projects } = useProjectStore();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PunchItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setLocalFilters] = useState<PunchListFilters>({});
  const [selectedProject, setSelectedProject] = useState('');
  const [commentText, setCommentText] = useState('');
  const [photoType, setPhotoType] = useState<PunchPhoto['type']>('before');

  // Form state for creating punch item
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    location: '',
    floor: '',
    room: '',
    category: 'finishes' as PunchItem['category'],
    type: 'defect' as PunchItem['type'],
    priority: 'medium' as PunchItem['priority'],
    dueDate: '',
    assignedContractor: {
      id: '',
      name: '',
      company: '',
      trade: '',
    },
    costToRectify: 0,
  });

  // Kanban columns
  const kanbanColumns = [
    { id: 'open', title: 'Open', color: 'bg-red-500' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-500' },
    { id: 'ready_for_inspection', title: 'Ready for Inspection', color: 'bg-blue-500' },
    { id: 'approved', title: 'Approved', color: 'bg-green-500' },
    { id: 'rejected', title: 'Rejected', color: 'bg-orange-500' },
    { id: 'closed', title: 'Closed', color: 'bg-gray-500' },
  ];

  useEffect(() => {
    fetchPunchItems(filters);
    fetchStatistics(selectedProject);
  }, [filters, selectedProject]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  const handleCreatePunchItem = async () => {
    try {
      const newItem = await createPunchItem({
        ...formData,
        projectName: projects.find(p => p.id === formData.projectId)?.name || '',
        status: 'open',
        createdBy: 'Current User',
        photos: [],
        comments: [],
        tags: [],
      });

      toast.success('Punch item created successfully');
      setShowCreateDialog(false);
      setFormData({
        projectId: '',
        title: '',
        description: '',
        location: '',
        floor: '',
        room: '',
        category: 'finishes',
        type: 'defect',
        priority: 'medium',
        dueDate: '',
        assignedContractor: {
          id: '',
          name: '',
          company: '',
          trade: '',
        },
        costToRectify: 0,
      });
    } catch (err) {
      toast.error('Failed to create punch item');
    }
  };

  const handleViewItem = (item: PunchItem) => {
    setSelectedItem(item);
    fetchPunchItem(item.id);
    setShowDetailDialog(true);
  };

  const handleStatusUpdate = async (itemId: string, newStatus: PunchItem['status']) => {
    try {
      await updateStatus(itemId, newStatus);
      toast.success('Status updated successfully');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleUploadPhotos = async (files: FileList) => {
    if (!selectedItem) return;

    try {
      await uploadPhotos(selectedItem.id, Array.from(files), photoType);
      toast.success('Photos uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload photos');
    }
  };

  const handleAddComment = async () => {
    if (!selectedItem || !commentText) return;

    try {
      await addComment(selectedItem.id, {
        text: commentText,
        author: 'Current User',
        authorRole: 'Architect',
      });
      toast.success('Comment added');
      setCommentText('');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      const url = await exportReport(selectedProject || 'all', format);
      const link = document.createElement('a');
      link.href = url;
      link.download = `punch-list.${format}`;
      link.click();
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const itemId = result.draggableId;
    const newStatus = result.destination.droppableId as PunchItem['status'];

    handleStatusUpdate(itemId, newStatus);
  };

  const getPriorityColor = (priority: PunchItem['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-400';
    }
  };

  const getCategoryIcon = (category: PunchItem['category']) => {
    switch (category) {
      case 'architectural': return '🏛️';
      case 'structural': return '🏗️';
      case 'mep': return '⚡';
      case 'finishes': return '🎨';
      case 'external': return '🏞️';
      case 'landscape': return '🌳';
      default: return '📋';
    }
  };

  const filteredItems = punchItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject = !selectedProject || item.projectId === selectedProject;

    return matchesSearch && matchesProject;
  });

  if (loading && punchItems.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Punch List</h1>
          <p className="text-muted-foreground">Track and resolve construction defects</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExportReport('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.open}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.completionRate}%</div>
              <Progress value={statistics.completionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search punch items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.priority?.[0] || 'all'}
          onValueChange={(value) => setLocalFilters({ ...filters, priority: value === 'all' ? undefined : [value as PunchItem['priority']] })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.category?.[0] || 'all'}
          onValueChange={(value) => setLocalFilters({ ...filters, category: value === 'all' ? undefined : [value as PunchItem['category']] })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="architectural">Architectural</SelectItem>
            <SelectItem value="structural">Structural</SelectItem>
            <SelectItem value="mep">MEP</SelectItem>
            <SelectItem value="finishes">Finishes</SelectItem>
            <SelectItem value="external">External</SelectItem>
            <SelectItem value="landscape">Landscape</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanColumns.map(column => {
              const columnItems = filteredItems.filter(item => item.status === column.id);
              return (
                <div key={column.id} className="flex-shrink-0 w-80">
                  <div className={`${column.color} text-white p-2 rounded-t-lg`}>
                    <h3 className="font-semibold flex justify-between items-center">
                      {column.title}
                      <Badge variant="secondary" className="bg-white/20">
                        {columnItems.length}
                      </Badge>
                    </h3>
                  </div>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <ScrollArea
                        className="h-[500px] bg-gray-50 rounded-b-lg p-2"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <div className="space-y-2">
                          {columnItems.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => handleViewItem(item)}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                      <CardTitle className="text-sm font-medium line-clamp-1">
                                        {item.itemNumber}
                                      </CardTitle>
                                      <Badge className={getPriorityColor(item.priority) + ' text-xs'}>
                                        {item.priority}
                                      </Badge>
                                    </div>
                                    <CardDescription className="text-xs line-clamp-2">
                                      {item.title}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    <div className="space-y-2 text-xs">
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        <span>{item.location}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <User className="h-3 w-3" />
                                        <span>{item.assignedContractor.company}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>{format(new Date(item.dueDate), 'MMM d')}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-lg">{getCategoryIcon(item.category)}</span>
                                        <div className="flex gap-1">
                                          {item.photos.length > 0 && (
                                            <Camera className="h-3 w-3" />
                                          )}
                                          {item.comments.length > 0 && (
                                            <MessageSquare className="h-3 w-3" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </ScrollArea>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item No.</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.itemNumber}</TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>
                      {item.floor && `F${item.floor} - `}{item.room || item.location}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <span>{getCategoryIcon(item.category)}</span>
                        <span className="text-sm">{item.category}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.assignedContractor.company}</TableCell>
                    <TableCell>{format(new Date(item.dueDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewItem(item)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Punch Item Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Punch Item</DialogTitle>
            <DialogDescription>
              Add a new defect or issue to the punch list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as PunchItem['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="architectural">Architectural</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="mep">MEP</SelectItem>
                    <SelectItem value="finishes">Finishes</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the defect or issue"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Block A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="e.g., 5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room/Area</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g., Meeting Room 501"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as PunchItem['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defect">Defect</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                    <SelectItem value="incorrect">Incorrect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as PunchItem['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractor">Assigned Contractor</Label>
                <Input
                  id="contractor"
                  value={formData.assignedContractor.company}
                  onChange={(e) => setFormData({
                    ...formData,
                    assignedContractor: { ...formData.assignedContractor, company: e.target.value }
                  })}
                  placeholder="Contractor company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Estimated Cost to Rectify (RM)</Label>
              <Input
                id="cost"
                type="number"
                value={formData.costToRectify}
                onChange={(e) => setFormData({ ...formData, costToRectify: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePunchItem}>Create Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Punch Item Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedItem.itemNumber} - {selectedItem.title}</span>
                  <Badge className={getPriorityColor(selectedItem.priority)}>
                    {selectedItem.priority}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedItem.projectName} | Created {format(new Date(selectedItem.createdAt), 'MMM dd, yyyy')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedItem.floor && `Floor ${selectedItem.floor}, `}
                      {selectedItem.room || selectedItem.location}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Category</h4>
                    <p className="text-sm">
                      {getCategoryIcon(selectedItem.category)} {selectedItem.category}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Assigned To</h4>
                    <p className="text-sm">{selectedItem.assignedContractor.company}</p>
                    <p className="text-xs text-muted-foreground">{selectedItem.assignedContractor.trade}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Due Date</h4>
                    <p className="text-sm">{format(new Date(selectedItem.dueDate), 'MMM dd, yyyy')}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>

                <Separator />

                {/* Photos Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Photos</h3>
                    <div className="flex gap-2">
                      <Select value={photoType} onValueChange={(v) => setPhotoType(v as PunchPhoto['type'])}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before">Before</SelectItem>
                          <SelectItem value="during">During</SelectItem>
                          <SelectItem value="after">After</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && handleUploadPhotos(e.target.files)}
                        className="w-auto"
                      />
                    </div>
                  </div>

                  <Tabs defaultValue="before">
                    <TabsList>
                      <TabsTrigger value="before">Before</TabsTrigger>
                      <TabsTrigger value="during">During</TabsTrigger>
                      <TabsTrigger value="after">After</TabsTrigger>
                    </TabsList>
                    {['before', 'during', 'after'].map(type => (
                      <TabsContent key={type} value={type}>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedItem.photos
                            .filter(photo => photo.type === type)
                            .map(photo => (
                              <div key={photo.id} className="relative">
                                <img
                                  src={photo.thumbnailUrl}
                                  alt={photo.caption || ''}
                                  className="w-full h-32 object-cover rounded"
                                />
                                {photo.caption && (
                                  <p className="text-xs text-center mt-1">{photo.caption}</p>
                                )}
                              </div>
                            ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>

                <Separator />

                {/* Comments Section */}
                <div>
                  <h3 className="font-semibold mb-2">Comments</h3>
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {selectedItem.comments.map(comment => (
                      <div key={comment.id} className="p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.timestamp), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <Button onClick={handleAddComment}>Comment</Button>
                  </div>
                </div>

                <Separator />

                {/* Status Actions */}
                <div>
                  <h3 className="font-semibold mb-2">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {kanbanColumns
                      .filter(col => col.id !== selectedItem.status)
                      .map(col => (
                        <Button
                          key={col.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(selectedItem.id, col.id as PunchItem['status'])}
                        >
                          Move to {col.title}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PunchList;