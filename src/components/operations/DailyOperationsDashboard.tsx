import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  Send,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Camera,
  FileText,
  MessageSquare,
  Bell,
  ChevronRight,
  Sunrise,
  Sunset,
  Moon
} from 'lucide-react';
import { useOperationsStore } from '@/store/operationsStore';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { ActionItem, BriefingItem, Evidence } from '@/types';

const DailyOperationsDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { currentProject } = useProjectStore();
  const {
    generateDailyBriefing,
    acknowledgeBriefing,
    createProgressReview,
    uploadEvidence,
    approveProgressReview,
    completeActionItem,
    todayActionItems,
    dailyBriefings,
    progressReviews,
    activeIssues
  } = useOperationsStore();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState('briefing');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [reviewNotes, setReviewNotes] = useState('');
  
  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Auto-generate morning briefing at 8 AM
  useEffect(() => {
    const now = new Date();
    if (now.getHours() === 8 && now.getMinutes() === 0 && currentProject) {
      generateDailyBriefing(currentProject.id, now);
    }
  }, [currentTime, currentProject, generateDailyBriefing]);
  
  // Auto-generate evening review at 6 PM
  useEffect(() => {
    const now = new Date();
    if (now.getHours() === 18 && now.getMinutes() === 0 && currentProject) {
      createProgressReview(currentProject.id, now);
    }
  }, [currentTime, currentProject, createProgressReview]);
  
  const getTimeOfDay = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { icon: Sunrise, text: 'Morning', color: 'text-yellow-500' };
    if (hour < 18) return { icon: Calendar, text: 'Afternoon', color: 'text-blue-500' };
    if (hour < 21) return { icon: Sunset, text: 'Evening', color: 'text-orange-500' };
    return { icon: Moon, text: 'Night', color: 'text-purple-500' };
  };
  
  const timeOfDay = getTimeOfDay();
  const TimeIcon = timeOfDay.icon;
  
  const todayBriefing = currentProject ? 
    Array.from(dailyBriefings.values()).find(b => 
      b.projectId === currentProject.id && 
      b.date.toDateString() === currentTime.toDateString()
    ) : null;
  
  const todayReview = currentProject ?
    Array.from(progressReviews.values()).find(r => 
      r.projectId === currentProject.id && 
      r.date.toDateString() === currentTime.toDateString()
    ) : null;
  
  const handleAcknowledge = () => {
    if (todayBriefing && user) {
      acknowledgeBriefing(todayBriefing.id, user.id, 'web');
    }
  };
  
  const handleCompleteTask = (itemId: string) => {
    completeActionItem(itemId);
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
    
    // Upload evidence
    files.forEach(file => {
      const evidence: Evidence = {
        id: `evidence-${Date.now()}-${file.name}`,
        type: file.type.startsWith('image/') ? 'photo' : 
              file.type.includes('pdf') ? 'document' : 
              file.type.startsWith('video/') ? 'video' : 'document',
        url: URL.createObjectURL(file),
        uploadedBy: user?.id || '',
        uploadedAt: new Date(),
        description: file.name
      };
      
      if (todayReview) {
        uploadEvidence(todayReview.id, evidence);
      }
    });
  };
  
  const handleApproveReview = () => {
    if (todayReview && user) {
      approveProgressReview(todayReview.id, user.id, reviewNotes);
    }
  };
  
  const completionRate = todayActionItems.length > 0 ?
    (todayActionItems.filter(i => i.status === 'completed').length / todayActionItems.length) * 100 : 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <TimeIcon className={`h-8 w-8 ${timeOfDay.color}`} />
          <div>
            <h2 className="text-2xl font-bold">Daily Operations Center</h2>
            <p className="text-muted-foreground">
              {currentTime.toLocaleDateString('en-MY', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              {' • '}
              {currentTime.toLocaleTimeString('en-MY', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={completionRate >= 80 ? 'default' : completionRate >= 50 ? 'secondary' : 'destructive'}>
            {completionRate.toFixed(0)}% Complete
          </Badge>
          <Button size="sm" variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Configure Alerts
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Tasks</p>
                <p className="text-2xl font-bold">{todayActionItems.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {todayActionItems.filter(i => i.status === 'completed').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Issues</p>
                <p className="text-2xl font-bold">{activeIssues.filter(i => i.status === 'open').length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Online</p>
                <p className="text-2xl font-bold">
                  {todayBriefing?.acknowledgedBy.length || 0}/
                  {todayBriefing?.teamMembers.length || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="briefing">
            <Sunrise className="h-4 w-4 mr-2" />
            Morning Briefing (8 AM)
          </TabsTrigger>
          <TabsTrigger value="progress">
            <Clock className="h-4 w-4 mr-2" />
            Progress Tracking
          </TabsTrigger>
          <TabsTrigger value="review">
            <Sunset className="h-4 w-4 mr-2" />
            Evening Review (6 PM)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="briefing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Briefing</CardTitle>
              <CardDescription>
                Auto-generated at 8:00 AM • Acknowledge to confirm receipt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayBriefing ? (
                <>
                  <div className="space-y-3">
                    {todayBriefing.agenda.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className={`mt-1 h-2 w-2 rounded-full ${
                          item.priority === 'urgent' ? 'bg-red-500' :
                          item.priority === 'high' ? 'bg-orange-500' :
                          item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                          {item.dueTime && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(item.dueTime).toLocaleTimeString('en-MY', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Team Acknowledgments:</span>
                      <div className="flex -space-x-2">
                        {todayBriefing.acknowledgedBy.slice(0, 5).map((ack, index) => (
                          <Avatar key={index} className="h-8 w-8 border-2 border-background">
                            <AvatarFallback>{ack.userId.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                        {todayBriefing.acknowledgedBy.length > 5 && (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                            +{todayBriefing.acknowledgedBy.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!todayBriefing.acknowledgedBy.find(a => a.userId === user?.id) && (
                      <Button onClick={handleAcknowledge}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Acknowledge Briefing
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No briefing generated yet. Briefings are automatically generated at 8:00 AM.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Action Items</CardTitle>
              <CardDescription>
                Track and complete your assigned tasks throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {todayActionItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={item.status === 'completed'}
                        onCheckedChange={() => handleCompleteTask(item.id)}
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${
                          item.status === 'completed' ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {item.task}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Assigned to: {item.assignedTo}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Due: {new Date(item.dueDate).toLocaleTimeString('en-MY', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                      {item.status === 'completed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Daily Progress</span>
                  <span className="text-sm text-muted-foreground">{completionRate.toFixed(0)}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evening Progress Review</CardTitle>
              <CardDescription>
                Submit evidence and get approval by 9:00 PM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayReview ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-500">
                        {todayReview.tasksCompleted.length}
                      </p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-yellow-500">
                        {todayReview.tasksInProgress.length}
                      </p>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-red-500">
                        {todayReview.tasksDelayed.length}
                      </p>
                      <p className="text-sm text-muted-foreground">Delayed</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Evidence Upload</label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="evidence-upload"
                        accept="image/*,video/*,.pdf"
                      />
                      <label htmlFor="evidence-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload photos, videos, or documents
                        </p>
                      </label>
                    </div>
                    
                    {uploadedFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4" />
                            <span>{file.name}</span>
                            <Badge variant="outline" className="ml-auto">
                              {(file.size / 1024).toFixed(1)} KB
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {user?.role === 'project_lead' && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Approval Comments</label>
                        <Textarea
                          placeholder="Add review comments..."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Review deadline: 9:00 PM
                        </div>
                        <Button 
                          onClick={handleApproveReview}
                          disabled={todayReview.approvalStatus === 'approved'}
                        >
                          {todayReview.approvalStatus === 'approved' ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approved
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Approve Review
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Evening review will be generated at 6:00 PM. Upload evidence throughout the day.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DailyOperationsDashboard;