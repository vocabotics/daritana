import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { designBriefApi } from '@/lib/api';
import { toast } from 'sonner';
import { 
  FileText,
  Eye,
  Download,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit,
  Send,
  Calendar,
  DollarSign,
  Users,
  Home,
  Palette,
  Leaf,
  Star,
  TrendingUp,
  ArrowRight,
  Bell,
  Camera,
  Map,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface DesignBrief {
  id: string;
  brief_name: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'revision_needed' | 'rejected';
  project_type: string;
  budget: number;
  submitted_at?: Date;
  reviewed_at?: Date;
  approved_at?: Date;
  estimated_timeline: number;
  client_feedback?: string;
  designer_notes?: string;
  progress_percentage: number;
}

interface ClientBriefPortalProps {
  clientId: string;
  briefs: DesignBrief[];
  onViewBrief: (briefId: string) => void;
  onEditBrief: (briefId: string) => void;
  onProvideFeedback: (briefId: string, feedback: string) => void;
}

export function ClientBriefPortal({ 
  clientId, 
  briefs, 
  onViewBrief, 
  onEditBrief, 
  onProvideFeedback 
}: ClientBriefPortalProps) {
  const [designBriefs, setDesignBriefs] = useState<DesignBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [team, setTeam] = useState<any[]>([]);

  // Load design briefs from API
  useEffect(() => {
    const loadDesignBriefs = async () => {
      setIsLoading(true);
      try {
        const response = await designBriefApi.getAll({ 
          client_id: clientId,
          limit: 50 
        });
        if (response.data?.briefs) {
          const formattedBriefs = response.data.briefs.map((brief: any) => ({
            id: brief.id,
            brief_name: brief.brief_name || brief.title || 'Untitled Brief',
            status: brief.status || 'draft',
            project_type: brief.project_type || brief.projectType || 'residential',
            budget: brief.budget || 0,
            submitted_at: brief.submitted_at ? new Date(brief.submitted_at) : undefined,
            reviewed_at: brief.reviewed_at ? new Date(brief.reviewed_at) : undefined,
            approved_at: brief.approved_at ? new Date(brief.approved_at) : undefined,
            estimated_timeline: brief.estimated_timeline || brief.timeline || 30,
            progress_percentage: brief.progress_percentage || 0,
            client_feedback: brief.client_feedback || brief.feedback,
            designer_notes: brief.designer_notes || brief.notes
          }));
          setDesignBriefs(formattedBriefs);
        }
      } catch (error) {
        console.error('Failed to load design briefs:', error);
        toast.error('Failed to load design briefs');
        // Fallback to provided briefs or empty array
        setDesignBriefs(briefs || []);
      } finally {
        setIsLoading(false);
      }
    };

    loadDesignBriefs();
  }, [clientId, briefs]);

  // Load team data from API
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        // Try to load team data from project team API
        const response = await designBriefApi.getProjectTeam(clientId);
        if (response.data?.team) {
          setTeam(response.data.team);
        } else {
          // Fallback to empty team if no team data available
          setTeam([]);
        }
      } catch (error) {
        console.error('Failed to load team data:', error);
        // Fallback to empty team on error
        setTeam([]);
      }
    };

    if (clientId) {
      loadTeamData();
    }
  }, [clientId]);
  const [selectedBrief, setSelectedBrief] = useState<DesignBrief | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [activeTab, setActiveTab] = useState('briefs');

  const getStatusIcon = (status: string) => {
    const icons = {
      draft: <Edit className="h-4 w-4" />,
      submitted: <Send className="h-4 w-4" />,
      under_review: <Eye className="h-4 w-4" />,
      approved: <CheckCircle className="h-4 w-4" />,
      revision_needed: <AlertCircle className="h-4 w-4" />,
      rejected: <XCircle className="h-4 w-4" />
    };
    return icons[status as keyof typeof icons] || <FileText className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      revision_needed: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDescription = (status: string) => {
    const descriptions = {
      draft: 'Brief is being prepared',
      submitted: 'Waiting for designer review',
      under_review: 'Designer is reviewing your requirements',
      approved: 'Brief approved - moving to design phase',
      revision_needed: 'Please review designer feedback and update',
      rejected: 'Brief needs major revisions'
    };
    return descriptions[status as keyof typeof descriptions] || 'Status unknown';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getNextSteps = (brief: DesignBrief) => {
    switch (brief.status) {
      case 'draft':
        return ['Complete all required sections', 'Review cultural preferences', 'Submit for review'];
      case 'submitted':
        return ['Designer will review within 3-5 business days', 'You will be notified of any questions'];
      case 'under_review':
        return ['Designer is analyzing your requirements', 'Preliminary concepts being developed'];
      case 'approved':
        return ['Design development will begin', 'Timeline will be finalized', 'Project kickoff meeting scheduled'];
      case 'revision_needed':
        return ['Review designer feedback', 'Update brief accordingly', 'Resubmit for approval'];
      case 'rejected':
        return ['Schedule consultation call', 'Discuss alternative approaches', 'Create new brief'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light">My Design Briefs</h1>
          <p className="text-gray-600 mt-2">
            Track your design brief progress and collaborate with our team
          </p>
        </div>
        <Button onClick={() => {}}>
          <FileText className="h-4 w-4 mr-2" />
          Create New Brief
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold">{designBriefs.length}</div>
                <div className="text-sm text-gray-600">Total Briefs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-semibold">
                  {designBriefs.filter(b => b.status === 'under_review').length}
                </div>
                <div className="text-sm text-gray-600">Under Review</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold">
                  {designBriefs.filter(b => b.status === 'approved').length}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-semibold">
                  {designBriefs.filter(b => b.status === 'revision_needed').length}
                </div>
                <div className="text-sm text-gray-600">Need Revision</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="briefs">My Briefs</TabsTrigger>
          <TabsTrigger value="team">Design Team</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="briefs" className="space-y-6">
          {/* Brief Cards */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading design briefs...</span>
            </div>
          ) : designBriefs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No design briefs found</h3>
              <p className="text-gray-600 mb-4">Create your first design brief to get started</p>
              <Button onClick={() => {}}>
                <FileText className="h-4 w-4 mr-2" />
                Create New Brief
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {designBriefs.map((brief) => (
              <Card key={brief.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(brief.status)}
                        {brief.brief_name}
                      </CardTitle>
                      <CardDescription>
                        {brief.project_type} • {formatCurrency(brief.budget)}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(brief.status)}>
                      {brief.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{brief.progress_percentage}%</span>
                    </div>
                    <Progress value={brief.progress_percentage} className="h-2" />
                  </div>

                  {/* Key Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {brief.submitted_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Submitted: {format(brief.submitted_at, 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    
                    {brief.estimated_timeline && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>Timeline: {brief.estimated_timeline} days</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>Budget: {formatCurrency(brief.budget)}</span>
                    </div>
                  </div>

                  {/* Status Description */}
                  <Alert>
                    <Bell className="h-4 w-4" />
                    <AlertDescription>
                      {getStatusDescription(brief.status)}
                    </AlertDescription>
                  </Alert>

                  {/* Designer Notes */}
                  {brief.designer_notes && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">Designer Notes</h4>
                          <p className="text-sm text-blue-800 mt-1">{brief.designer_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Next Steps:</h4>
                    <div className="space-y-1">
                      {getNextSteps(brief).map((step, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewBrief(brief.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    {(brief.status === 'draft' || brief.status === 'revision_needed') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditBrief(brief.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Brief
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>

                    {brief.status === 'under_review' && (
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Add Comments
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Design Team</CardTitle>
              <CardDescription>
                Meet the professionals working on your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {team.map((member) => (
                  <div key={member.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Design Guidelines</CardTitle>
                <CardDescription>
                  Resources to help you understand our design process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                  <Palette className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Cultural Design Guide</div>
                    <div className="text-sm text-gray-600">Malaysian architectural traditions</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                  <Leaf className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Sustainability Options</div>
                    <div className="text-sm text-gray-600">Eco-friendly materials and methods</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                  <Home className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Climate Design</div>
                    <div className="text-sm text-gray-600">Tropical architecture principles</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support & FAQ</CardTitle>
                <CardDescription>
                  Common questions and how to get help
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded">
                  <div className="font-medium">How long does brief review take?</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Typically 3-5 business days, depending on complexity
                  </div>
                </div>
                
                <div className="p-3 border rounded">
                  <div className="font-medium">Can I modify after approval?</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Minor changes possible, major changes require new brief
                  </div>
                </div>
                
                <div className="p-3 border rounded">
                  <div className="font-medium">What if I need urgent changes?</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Contact your project manager directly for priority review
                  </div>
                </div>
                
                <Button className="w-full mt-4">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}