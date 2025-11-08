import React, { useState, useEffect } from 'react';
import { Calendar, Camera, MapPin, Users, Cloud, AlertTriangle, CheckCircle, FileText, Plus, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSiteVisitStore } from '@/store/architect/siteVisitStore';
import { useProjectStore } from '@/store/projectStore';
import { SiteVisit, SiteObservation, SiteIssue } from '@/types/architect';
import { toast } from 'sonner';

const SiteVisits: React.FC = () => {
  const {
    siteVisits,
    currentSiteVisit,
    weatherData,
    loading,
    error,
    fetchSiteVisits,
    fetchSiteVisit,
    createSiteVisit,
    uploadPhotos,
    createIssue,
    generateReport,
    fetchWeatherData,
    clearError,
  } = useSiteVisitStore();

  const { projects } = useProjectStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedProject, setSelectedProject] = useState('');

  // Form state for creating visit
  const [formData, setFormData] = useState({
    projectId: '',
    visitType: 'routine' as SiteVisit['visitType'],
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '12:00',
    purpose: '',
    attendees: [] as any[],
    observations: [] as any[],
  });

  // Issue form state
  const [issueData, setIssueData] = useState({
    title: '',
    description: '',
    severity: 'medium' as SiteIssue['severity'],
    category: 'quality' as SiteIssue['category'],
    location: '',
    assignedTo: '',
    dueDate: '',
  });

  useEffect(() => {
    const dateRange = {
      from: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
      to: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
    };
    fetchSiteVisits(selectedProject, dateRange);
  }, [currentDate, selectedProject]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  useEffect(() => {
    // Fetch weather data for today
    if (formData.date) {
      fetchWeatherData('Kuala Lumpur', formData.date);
    }
  }, [formData.date]);

  const handleCreateVisit = async () => {
    try {
      const weather = weatherData || {
        condition: 'sunny' as const,
        temperature: 32,
        humidity: 75,
      };

      const newVisit = await createSiteVisit({
        ...formData,
        projectName: projects.find(p => p.id === formData.projectId)?.name || '',
        weather,
        issues: [],
        photos: [],
        createdBy: 'Current User',
      });

      toast.success('Site visit created successfully');
      setShowCreateDialog(false);
      setFormData({
        projectId: '',
        visitType: 'routine',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '12:00',
        purpose: '',
        attendees: [],
        observations: [],
      });
    } catch (err) {
      toast.error('Failed to create site visit');
    }
  };

  const handleViewVisit = (visit: SiteVisit) => {
    setSelectedVisit(visit);
    fetchSiteVisit(visit.id);
    setShowDetailDialog(true);
  };

  const handleUploadPhotos = async (files: FileList) => {
    if (!selectedVisit) return;

    try {
      await uploadPhotos(selectedVisit.id, Array.from(files));
      toast.success('Photos uploaded successfully');
      setShowPhotoUpload(false);
    } catch (err) {
      toast.error('Failed to upload photos');
    }
  };

  const handleCreateIssue = async () => {
    if (!selectedVisit) return;

    try {
      await createIssue(selectedVisit.id, issueData);
      toast.success('Issue created successfully');
      setIssueData({
        title: '',
        description: '',
        severity: 'medium',
        category: 'quality',
        location: '',
        assignedTo: '',
        dueDate: '',
      });
    } catch (err) {
      toast.error('Failed to create issue');
    }
  };

  const handleGenerateReport = async (visitId: string) => {
    try {
      const reportUrl = await generateReport(visitId);
      window.open(reportUrl, '_blank');
      toast.success('Report generated successfully');
    } catch (err) {
      toast.error('Failed to generate report');
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'stormy': return '⛈️';
      default: return '🌤️';
    }
  };

  const getVisitTypeColor = (type: SiteVisit['visitType']) => {
    switch (type) {
      case 'routine': return 'bg-blue-500';
      case 'inspection': return 'bg-purple-500';
      case 'progress': return 'bg-green-500';
      case 'safety': return 'bg-orange-500';
      case 'quality': return 'bg-yellow-500';
      case 'meeting': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getSeverityColor = (severity: SiteIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  // Calendar view helpers
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getVisitsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return siteVisits.filter(visit => visit.date === dateStr);
  };

  if (loading && siteVisits.length === 0) {
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
          <h1 className="text-3xl font-bold">Site Visits</h1>
          <p className="text-muted-foreground">Manage site inspections and observations</p>
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
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Site Visit
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siteVisits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {siteVisits.reduce((acc, visit) =>
                acc + visit.issues.filter(i => i.status === 'open').length, 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siteVisits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Photos Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {siteVisits.reduce((acc, visit) => acc + visit.photos.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-white p-2 text-center font-semibold text-sm">
                    {day}
                  </div>
                ))}
                {monthDays.map(day => {
                  const visits = getVisitsForDate(day);
                  return (
                    <div
                      key={day.toString()}
                      className={`bg-white p-2 min-h-[100px] ${
                        isToday(day) ? 'bg-blue-50' : ''
                      } ${
                        !isSameMonth(day, currentDate) ? 'text-gray-400' : ''
                      }`}
                    >
                      <div className="font-semibold text-sm mb-1">{format(day, 'd')}</div>
                      <div className="space-y-1">
                        {visits.slice(0, 2).map(visit => (
                          <div
                            key={visit.id}
                            className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                            onClick={() => handleViewVisit(visit)}
                          >
                            <Badge className={getVisitTypeColor(visit.visitType) + ' text-xs'}>
                              {visit.startTime} - {visit.projectName}
                            </Badge>
                          </div>
                        ))}
                        {visits.length > 2 && (
                          <div className="text-xs text-gray-500">+{visits.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          <div className="space-y-4">
            {siteVisits.map(visit => (
              <Card key={visit.id} className="cursor-pointer" onClick={() => handleViewVisit(visit)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {visit.visitNumber} - {visit.projectName}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(visit.date), 'MMMM d, yyyy')} | {visit.startTime} - {visit.endTime}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getVisitTypeColor(visit.visitType)}>
                        {visit.visitType}
                      </Badge>
                      <span className="text-lg">
                        {getWeatherIcon(visit.weather.condition)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Attendees</p>
                      <p className="text-sm text-muted-foreground">{visit.attendees.length} people</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Observations</p>
                      <p className="text-sm text-muted-foreground">{visit.observations.length} items</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Issues</p>
                      <p className="text-sm text-muted-foreground">
                        {visit.issues.length} ({visit.issues.filter(i => i.status === 'open').length} open)
                      </p>
                    </div>
                  </div>
                  {visit.purpose && (
                    <p className="text-sm text-muted-foreground">{visit.purpose}</p>
                  )}
                  {visit.reportUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(visit.reportUrl, '_blank');
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="mt-4">
          <div className="space-y-4">
            {siteVisits.flatMap(visit =>
              visit.issues.map(issue => (
                <Card key={issue.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className={`h-4 w-4 ${getSeverityColor(issue.severity)}`} />
                          {issue.title}
                        </CardTitle>
                        <CardDescription>
                          {visit.projectName} | {visit.visitNumber} | {issue.location}
                        </CardDescription>
                      </div>
                      <Badge variant={issue.status === 'open' ? 'destructive' : 'default'}>
                        {issue.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-medium">Assigned to: </span>
                        <span className="text-muted-foreground">{issue.assignedTo || 'Unassigned'}</span>
                      </div>
                      {issue.dueDate && (
                        <div className="text-sm">
                          <span className="font-medium">Due: </span>
                          <span className="text-muted-foreground">
                            {format(new Date(issue.dueDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Site Visit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Site Visit</DialogTitle>
            <DialogDescription>
              Schedule a new site inspection or visit
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
                <Label htmlFor="visitType">Visit Type</Label>
                <Select
                  value={formData.visitType}
                  onValueChange={(value) => setFormData({ ...formData, visitType: value as SiteVisit['visitType'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            {weatherData && (
              <Alert>
                <Cloud className="h-4 w-4" />
                <AlertDescription>
                  Weather forecast: {getWeatherIcon(weatherData.condition)} {weatherData.condition},
                  {weatherData.temperature}°C, Humidity: {weatherData.humidity}%
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Describe the purpose and objectives of this visit"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Attendees</Label>
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Add Attendees
              </Button>
              {formData.attendees.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {formData.attendees.length} attendees added
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVisit}>Create Visit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Site Visit Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedVisit && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedVisit.visitNumber} - {selectedVisit.projectName}</span>
                  <Badge className={getVisitTypeColor(selectedVisit.visitType)}>
                    {selectedVisit.visitType}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(selectedVisit.date), 'MMMM d, yyyy')} | {selectedVisit.startTime} - {selectedVisit.endTime}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Weather Info */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{getWeatherIcon(selectedVisit.weather.condition)}</span>
                  <div className="text-sm">
                    <p><span className="font-medium">Condition:</span> {selectedVisit.weather.condition}</p>
                    <p><span className="font-medium">Temperature:</span> {selectedVisit.weather.temperature}°C</p>
                    <p><span className="font-medium">Humidity:</span> {selectedVisit.weather.humidity}%</p>
                  </div>
                </div>

                <Separator />

                {/* Purpose */}
                <div>
                  <h3 className="font-semibold mb-2">Purpose</h3>
                  <p className="text-sm text-muted-foreground">{selectedVisit.purpose}</p>
                </div>

                <Separator />

                {/* Attendees */}
                <div>
                  <h3 className="font-semibold mb-2">Attendees ({selectedVisit.attendees.length})</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedVisit.attendees.map(attendee => (
                      <div key={attendee.id} className="text-sm p-2 border rounded">
                        <p className="font-medium">{attendee.name}</p>
                        <p className="text-muted-foreground">{attendee.company} - {attendee.role}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Observations */}
                <div>
                  <h3 className="font-semibold mb-2">Observations ({selectedVisit.observations.length})</h3>
                  <div className="space-y-2">
                    {selectedVisit.observations.map(observation => (
                      <div key={observation.id} className="p-3 border rounded">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">{observation.category}</Badge>
                          {observation.status === 'satisfactory' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <p className="text-sm">{observation.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <MapPin className="inline h-3 w-3" /> {observation.location}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Issues */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Issues ({selectedVisit.issues.length})</h3>
                    <Button size="sm" variant="outline">Add Issue</Button>
                  </div>
                  <div className="space-y-2">
                    {selectedVisit.issues.map(issue => (
                      <div key={issue.id} className="p-3 border rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${getSeverityColor(issue.severity)}`} />
                            <span className="font-medium text-sm">{issue.title}</span>
                          </div>
                          <Badge variant={issue.status === 'open' ? 'destructive' : 'default'}>
                            {issue.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-muted-foreground">
                            <MapPin className="inline h-3 w-3" /> {issue.location}
                          </p>
                          {issue.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              <Clock className="inline h-3 w-3" /> Due: {format(new Date(issue.dueDate), 'MMM d')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Photos */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Photos ({selectedVisit.photos.length})</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPhotoUpload(true)}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Upload Photos
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedVisit.photos.map(photo => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.thumbnailUrl}
                          alt={photo.caption}
                          className="w-full h-24 object-cover rounded cursor-pointer"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 text-xs">
                          {photo.caption}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport(selectedVisit.id)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Photos</DialogTitle>
            <DialogDescription>
              Add photos to this site visit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) {
                  handleUploadPhotos(e.target.files);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhotoUpload(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SiteVisits;