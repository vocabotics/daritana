import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Clock, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useRFIStore } from '@/store/architect/rfiStore';
import { useProjectStore } from '@/store/projectStore';
import { RFI, RFIFilters } from '@/types/architect';
import { toast } from 'sonner';

const RFIManagement: React.FC = () => {
  const {
    rfis,
    currentRFI,
    statistics,
    loading,
    error,
    fetchRFIs,
    fetchRFI,
    createRFI,
    respondToRFI,
    updateRFI,
    fetchStatistics,
    setFilters,
    clearError,
  } = useRFIStore();

  const { projects } = useProjectStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setLocalFilters] = useState<RFIFilters>({});
  const [responseText, setResponseText] = useState('');
  const [responseFiles, setResponseFiles] = useState<File[]>([]);

  // Form state for creating RFI
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    category: 'architectural' as RFI['category'],
    priority: 'medium' as RFI['priority'],
    dateDue: '',
    assignedTo: { id: '', name: '', email: '' },
    requestedBy: { id: '', name: '', company: '', role: '' },
  });

  useEffect(() => {
    fetchRFIs();
    fetchStatistics();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  const handleCreateRFI = async () => {
    try {
      const newRFI = await createRFI({
        ...formData,
        projectName: projects.find(p => p.id === formData.projectId)?.name || '',
        status: 'open',
        attachments: [],
        tags: [],
      });
      toast.success('RFI created successfully');
      setShowCreateDialog(false);
      setFormData({
        projectId: '',
        title: '',
        description: '',
        category: 'architectural',
        priority: 'medium',
        dateDue: '',
        assignedTo: { id: '', name: '', email: '' },
        requestedBy: { id: '', name: '', company: '', role: '' },
      });
    } catch (err) {
      toast.error('Failed to create RFI');
    }
  };

  const handleViewRFI = (rfi: RFI) => {
    setSelectedRFI(rfi);
    fetchRFI(rfi.id);
    setShowDetailDialog(true);
  };

  const handleRespondToRFI = async () => {
    if (!selectedRFI) return;

    try {
      await respondToRFI(selectedRFI.id, responseText, responseFiles);
      toast.success('Response submitted successfully');
      setResponseText('');
      setResponseFiles([]);
      setShowDetailDialog(false);
    } catch (err) {
      toast.error('Failed to submit response');
    }
  };

  const getStatusColor = (status: RFI['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_review': return 'bg-yellow-500';
      case 'responded': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: RFI['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const filteredRFIs = rfis.filter(rfi =>
    rfi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rfi.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rfi.rfiNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && rfis.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">RFI Management</h1>
          <p className="text-muted-foreground">Manage Requests for Information</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create RFI
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total RFIs</CardTitle>
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
              <div className="text-2xl font-bold text-blue-600">{statistics.open}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Responded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.responded}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.avgResponseTime}h</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search RFIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.status?.[0] || 'all'}
          onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : [value as RFI['status']] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.priority?.[0] || 'all'}
          onValueChange={(value) => setFilters({ ...filters, priority: value === 'all' ? undefined : [value as RFI['priority']] })}
        >
          <SelectTrigger className="w-[180px]">
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
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* RFI Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RFI Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRFIs.map((rfi) => (
                <TableRow key={rfi.id}>
                  <TableCell className="font-medium">{rfi.rfiNumber}</TableCell>
                  <TableCell>{rfi.title}</TableCell>
                  <TableCell>{rfi.projectName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rfi.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(rfi.priority)}>
                      {rfi.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(rfi.status)}>
                      {rfi.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(rfi.dateDue), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{rfi.requestedBy.name}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewRFI(rfi)}
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

      {/* Create RFI Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New RFI</DialogTitle>
            <DialogDescription>
              Submit a new Request for Information
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
                  onValueChange={(value) => setFormData({ ...formData, category: value as RFI['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="architectural">Architectural</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="mep">MEP</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                placeholder="Enter RFI title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the information needed"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as RFI['priority'] })}
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
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dateDue}
                  onChange={(e) => setFormData({ ...formData, dateDue: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRFI}>Create RFI</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RFI Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedRFI && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedRFI.rfiNumber} - {selectedRFI.title}</span>
                  <Badge className={getStatusColor(selectedRFI.status)}>
                    {selectedRFI.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedRFI.projectName} | {format(new Date(selectedRFI.dateCreated), 'MMM dd, yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedRFI.description}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Category</h4>
                    <Badge variant="outline">{selectedRFI.category}</Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Priority</h4>
                    <Badge className={getPriorityColor(selectedRFI.priority)}>
                      {selectedRFI.priority}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Requested By</h4>
                    <p className="text-sm">{selectedRFI.requestedBy.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedRFI.requestedBy.company}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Due Date</h4>
                    <p className="text-sm">{format(new Date(selectedRFI.dateDue), 'MMM dd, yyyy')}</p>
                  </div>
                </div>

                {selectedRFI.response && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Response</h3>
                      <p className="text-sm text-muted-foreground">{selectedRFI.response}</p>
                      {selectedRFI.dateResponded && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Responded on {format(new Date(selectedRFI.dateResponded), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {selectedRFI.status === 'open' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Respond to RFI</Label>
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Enter your response"
                        rows={4}
                      />
                      <div className="flex justify-between">
                        <Input
                          type="file"
                          multiple
                          onChange={(e) => setResponseFiles(Array.from(e.target.files || []))}
                          className="max-w-xs"
                        />
                        <Button onClick={handleRespondToRFI}>Submit Response</Button>
                      </div>
                    </div>
                  </>
                )}

                {selectedRFI.attachments.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Attachments</h3>
                      <div className="space-y-2">
                        {selectedRFI.attachments.map(attachment => (
                          <div key={attachment.id} className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{attachment.fileName}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(attachment.fileSize / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RFIManagement;