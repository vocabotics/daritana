import React, { useState, useEffect } from 'react';
import { Upload, Download, Eye, History, Send, Filter, Grid, List, FileText, RefreshCw } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDrawingStore } from '@/store/architect/drawingStore';
import { useProjectStore } from '@/store/projectStore';
import { Drawing, DrawingFilters, DrawingTransmittal } from '@/types/architect';
import { toast } from 'sonner';

const DrawingRegister: React.FC = () => {
  const {
    drawings,
    currentDrawing,
    transmittals,
    loading,
    error,
    fetchDrawings,
    fetchDrawing,
    uploadDrawing,
    createRevision,
    updateDrawingStatus,
    createTransmittal,
    fetchTransmittals,
    setFilters,
    clearError,
  } = useDrawingStore();

  const { projects } = useProjectStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showTransmittalDialog, setShowTransmittalDialog] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [selectedDrawings, setSelectedDrawings] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setLocalFilters] = useState<DrawingFilters>({});
  const [activeTab, setActiveTab] = useState('all');

  // Upload form state
  const [uploadData, setUploadData] = useState({
    projectId: '',
    title: '',
    drawingNumber: '',
    discipline: 'architectural' as Drawing['discipline'],
    type: 'plan' as Drawing['type'],
    scale: '1:100',
    size: 'A1' as Drawing['size'],
    file: null as File | null,
  });

  // Revision form state
  const [revisionData, setRevisionData] = useState({
    revision: '',
    description: '',
    author: '',
    file: null as File | null,
  });

  // Transmittal form state
  const [transmittalData, setTransmittalData] = useState({
    recipient: { name: '', company: '', email: '' },
    purpose: 'for_review' as DrawingTransmittal['purpose'],
    dueDate: '',
    comments: '',
  });

  useEffect(() => {
    fetchDrawings(filters);
    if (projects.length > 0) {
      fetchTransmittals(projects[0].id);
    }
  }, [filters]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  const handleUploadDrawing = async () => {
    if (!uploadData.file) {
      toast.error('Please select a file');
      return;
    }

    try {
      await uploadDrawing(uploadData.file, {
        projectId: uploadData.projectId,
        projectName: projects.find(p => p.id === uploadData.projectId)?.name || '',
        drawingNumber: uploadData.drawingNumber,
        title: uploadData.title,
        discipline: uploadData.discipline,
        type: uploadData.type,
        scale: uploadData.scale,
        size: uploadData.size,
        currentRevision: 'A',
        status: 'draft',
        revisions: [],
        createdBy: 'Current User',
        transmittals: [],
        tags: [],
      });

      toast.success('Drawing uploaded successfully');
      setShowUploadDialog(false);
      setUploadData({
        projectId: '',
        title: '',
        drawingNumber: '',
        discipline: 'architectural',
        type: 'plan',
        scale: '1:100',
        size: 'A1',
        file: null,
      });
    } catch (err) {
      toast.error('Failed to upload drawing');
    }
  };

  const handleCreateRevision = async () => {
    if (!selectedDrawing || !revisionData.file) {
      toast.error('Please select a file');
      return;
    }

    try {
      await createRevision(selectedDrawing.id, revisionData.file, {
        revision: revisionData.revision,
        description: revisionData.description,
        author: revisionData.author,
        date: new Date().toISOString(),
        status: 'current',
      });

      toast.success('Revision created successfully');
      setShowRevisionDialog(false);
      setRevisionData({
        revision: '',
        description: '',
        author: '',
        file: null,
      });
    } catch (err) {
      toast.error('Failed to create revision');
    }
  };

  const handleCreateTransmittal = async () => {
    if (selectedDrawings.length === 0) {
      toast.error('Please select drawings');
      return;
    }

    try {
      await createTransmittal({
        projectId: projects[0]?.id || '',
        drawings: selectedDrawings,
        recipient: transmittalData.recipient,
        purpose: transmittalData.purpose,
        dueDate: transmittalData.dueDate,
        status: 'draft',
        comments: transmittalData.comments,
      });

      toast.success('Transmittal created successfully');
      setShowTransmittalDialog(false);
      setSelectedDrawings([]);
      setTransmittalData({
        recipient: { name: '', company: '', email: '' },
        purpose: 'for_review',
        dueDate: '',
        comments: '',
      });
    } catch (err) {
      toast.error('Failed to create transmittal');
    }
  };

  const handleStatusUpdate = async (drawingId: string, status: Drawing['status']) => {
    try {
      await updateDrawingStatus(drawingId, status);
      toast.success('Drawing status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: Drawing['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'for_review': return 'bg-yellow-500';
      case 'for_approval': return 'bg-orange-500';
      case 'approved': return 'bg-green-500';
      case 'for_construction': return 'bg-blue-500';
      case 'as_built': return 'bg-purple-500';
      case 'superseded': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getDisciplineIcon = (discipline: Drawing['discipline']) => {
    switch (discipline) {
      case 'architectural': return '🏛️';
      case 'structural': return '🏗️';
      case 'mep': return '⚡';
      case 'civil': return '🛤️';
      case 'landscape': return '🌳';
      case 'interior': return '🛋️';
      default: return '📐';
    }
  };

  const filteredDrawings = drawings.filter(drawing => {
    const matchesSearch = drawing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drawing.drawingNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'all' ||
      (activeTab === 'current' && drawing.status !== 'superseded') ||
      (activeTab === 'superseded' && drawing.status === 'superseded');

    return matchesSearch && matchesTab;
  });

  if (loading && drawings.length === 0) {
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
          <h1 className="text-3xl font-bold">Drawing Register</h1>
          <p className="text-muted-foreground">Manage project drawings and revisions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTransmittalDialog(true)}>
            <Send className="mr-2 h-4 w-4" />
            Create Transmittal
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Drawing
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {Object.entries({
          'Total Drawings': drawings.length,
          'For Review': drawings.filter(d => d.status === 'for_review').length,
          'Approved': drawings.filter(d => d.status === 'approved').length,
          'For Construction': drawings.filter(d => d.status === 'for_construction').length,
          'As Built': drawings.filter(d => d.status === 'as_built').length,
          'Superseded': drawings.filter(d => d.status === 'superseded').length,
        }).map(([label, count]) => (
          <Card key={label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search drawings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.discipline?.[0] || 'all'}
          onValueChange={(value) => setLocalFilters({ ...filters, discipline: value === 'all' ? undefined : [value as Drawing['discipline']] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Discipline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Disciplines</SelectItem>
            <SelectItem value="architectural">Architectural</SelectItem>
            <SelectItem value="structural">Structural</SelectItem>
            <SelectItem value="mep">MEP</SelectItem>
            <SelectItem value="civil">Civil</SelectItem>
            <SelectItem value="landscape">Landscape</SelectItem>
            <SelectItem value="interior">Interior</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.type?.[0] || 'all'}
          onValueChange={(value) => setLocalFilters({ ...filters, type: value === 'all' ? undefined : [value as Drawing['type']] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="plan">Plan</SelectItem>
            <SelectItem value="elevation">Elevation</SelectItem>
            <SelectItem value="section">Section</SelectItem>
            <SelectItem value="detail">Detail</SelectItem>
            <SelectItem value="schedule">Schedule</SelectItem>
            <SelectItem value="3d">3D</SelectItem>
            <SelectItem value="diagram">Diagram</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Drawings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Drawings</TabsTrigger>
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="superseded">Superseded</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {viewMode === 'list' ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDrawings(filteredDrawings.map(d => d.id));
                            } else {
                              setSelectedDrawings([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Drawing No.</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Discipline</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Scale</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Rev</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrawings.map((drawing) => (
                      <TableRow key={drawing.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedDrawings.includes(drawing.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDrawings([...selectedDrawings, drawing.id]);
                              } else {
                                setSelectedDrawings(selectedDrawings.filter(id => id !== drawing.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{drawing.drawingNumber}</TableCell>
                        <TableCell>{drawing.title}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <span>{getDisciplineIcon(drawing.discipline)}</span>
                            <span className="text-sm">{drawing.discipline}</span>
                          </span>
                        </TableCell>
                        <TableCell>{drawing.type}</TableCell>
                        <TableCell>{drawing.scale}</TableCell>
                        <TableCell>{drawing.size}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{drawing.currentRevision}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(drawing.status)}>
                            {drawing.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(drawing.lastModified), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedDrawing(drawing);
                                setShowRevisionDialog(true);
                              }}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDrawings.map((drawing) => (
                <Card key={drawing.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{drawing.drawingNumber}</CardTitle>
                        <CardDescription className="text-sm">{drawing.title}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(drawing.status) + ' text-xs'}>
                        {drawing.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                      {drawing.thumbnailUrl ? (
                        <img src={drawing.thumbnailUrl} alt={drawing.title} className="object-cover w-full h-full rounded" />
                      ) : (
                        <FileText className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{getDisciplineIcon(drawing.discipline)} {drawing.discipline}</span>
                      <span>Rev: {drawing.currentRevision}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{drawing.scale}</span>
                      <span>{drawing.size}</span>
                    </div>
                    <div className="flex gap-1 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Drawing Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Drawing</DialogTitle>
            <DialogDescription>
              Add a new drawing to the register
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  value={uploadData.projectId}
                  onValueChange={(value) => setUploadData({ ...uploadData, projectId: value })}
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
                <Label htmlFor="drawingNumber">Drawing Number</Label>
                <Input
                  id="drawingNumber"
                  value={uploadData.drawingNumber}
                  onChange={(e) => setUploadData({ ...uploadData, drawingNumber: e.target.value })}
                  placeholder="e.g., A-101"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="Drawing title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discipline">Discipline</Label>
                <Select
                  value={uploadData.discipline}
                  onValueChange={(value) => setUploadData({ ...uploadData, discipline: value as Drawing['discipline'] })}
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
                    <SelectItem value="interior">Interior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={uploadData.type}
                  onValueChange={(value) => setUploadData({ ...uploadData, type: value as Drawing['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plan">Plan</SelectItem>
                    <SelectItem value="elevation">Elevation</SelectItem>
                    <SelectItem value="section">Section</SelectItem>
                    <SelectItem value="detail">Detail</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="3d">3D</SelectItem>
                    <SelectItem value="diagram">Diagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scale">Scale</Label>
                <Input
                  id="scale"
                  value={uploadData.scale}
                  onChange={(e) => setUploadData({ ...uploadData, scale: e.target.value })}
                  placeholder="e.g., 1:100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select
                  value={uploadData.size}
                  onValueChange={(value) => setUploadData({ ...uploadData, size: value as Drawing['size'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A0">A0</SelectItem>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="A4">A4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Drawing File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.dwg,.dxf,.png,.jpg"
                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadDrawing}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Revision</DialogTitle>
            <DialogDescription>
              Upload a new revision for {selectedDrawing?.drawingNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revision">Revision</Label>
              <Input
                id="revision"
                value={revisionData.revision}
                onChange={(e) => setRevisionData({ ...revisionData, revision: e.target.value })}
                placeholder="e.g., B, C, D"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={revisionData.description}
                onChange={(e) => setRevisionData({ ...revisionData, description: e.target.value })}
                placeholder="Describe the changes in this revision"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={revisionData.author}
                onChange={(e) => setRevisionData({ ...revisionData, author: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revisionFile">Revised Drawing File</Label>
              <Input
                id="revisionFile"
                type="file"
                accept=".pdf,.dwg,.dxf,.png,.jpg"
                onChange={(e) => setRevisionData({ ...revisionData, file: e.target.files?.[0] || null })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRevision}>Create Revision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Transmittal Dialog */}
      <Dialog open={showTransmittalDialog} onOpenChange={setShowTransmittalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Transmittal</DialogTitle>
            <DialogDescription>
              Send selected drawings ({selectedDrawings.length} selected)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  value={transmittalData.recipient.name}
                  onChange={(e) => setTransmittalData({
                    ...transmittalData,
                    recipient: { ...transmittalData.recipient, name: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientCompany">Company</Label>
                <Input
                  id="recipientCompany"
                  value={transmittalData.recipient.company}
                  onChange={(e) => setTransmittalData({
                    ...transmittalData,
                    recipient: { ...transmittalData.recipient, company: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Email</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={transmittalData.recipient.email}
                onChange={(e) => setTransmittalData({
                  ...transmittalData,
                  recipient: { ...transmittalData.recipient, email: e.target.value }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Select
                  value={transmittalData.purpose}
                  onValueChange={(value) => setTransmittalData({
                    ...transmittalData,
                    purpose: value as DrawingTransmittal['purpose']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="for_review">For Review</SelectItem>
                    <SelectItem value="for_approval">For Approval</SelectItem>
                    <SelectItem value="for_construction">For Construction</SelectItem>
                    <SelectItem value="for_information">For Information</SelectItem>
                    <SelectItem value="as_built">As Built</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={transmittalData.dueDate}
                  onChange={(e) => setTransmittalData({ ...transmittalData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={transmittalData.comments}
                onChange={(e) => setTransmittalData({ ...transmittalData, comments: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransmittalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransmittal}>Create Transmittal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DrawingRegister;