import { useState, useEffect } from 'react';
import { complianceService } from '@/services/compliance.service';
import { projectService } from '@/services/project.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Search,
  Filter,
  Building,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ProjectComplianceData {
  project: {
    id: string;
    name: string;
    type?: string;
    category?: string;
  };
  complianceStatus: any[];
  summary: {
    totalRequirements: number;
    mandatoryRequirements: number;
    compliantMandatory: number;
    overallScore: number;
    isCompliant: boolean;
  };
}

export default function ProjectComplianceList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectCompliances, setProjectCompliances] = useState<Map<string, ProjectComplianceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchProjectsAndCompliance();
  }, []);

  const fetchProjectsAndCompliance = async () => {
    try {
      setLoading(true);
      const projectsData = await projectService.getProjects();
      setProjects(projectsData);

      // Fetch compliance for each project
      const complianceMap = new Map();
      await Promise.all(
        projectsData.slice(0, 5).map(async (project: any) => {
          try {
            const compliance = await complianceService.getProjectCompliance(project.id);
            complianceMap.set(project.id, compliance);
          } catch (error) {
            console.error(`Failed to fetch compliance for project ${project.id}:`, error);
          }
        })
      );
      setProjectCompliances(complianceMap);
    } catch (error) {
      console.error('Error fetching projects and compliance:', error);
      toast.error('Failed to load project compliance data');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'all') return true;
    
    const compliance = projectCompliances.get(project.id);
    if (!compliance) return statusFilter === 'pending_submission';
    
    const score = compliance.summary.overallScore;
    const isCompliant = compliance.summary.isCompliant;
    
    switch (statusFilter) {
      case 'fully_compliant':
        return isCompliant && score >= 100;
      case 'mostly_compliant':
        return isCompliant && score >= 80 && score < 100;
      case 'partially_compliant':
        return !isCompliant && score >= 50;
      case 'non_compliant':
        return !isCompliant && score < 50;
      case 'under_review':
        return compliance.complianceStatus.some((s: any) => s.status === 'PENDING_APPROVAL');
      case 'pending_submission':
        return compliance.complianceStatus.some((s: any) => s.status === 'NOT_STARTED');
      default:
        return true;
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      fully_compliant: { variant: 'success' as const, label: 'Fully Compliant', icon: CheckCircle2 },
      mostly_compliant: { variant: 'default' as const, label: 'Mostly Compliant', icon: CheckCircle2 },
      partially_compliant: { variant: 'warning' as const, label: 'Partially Compliant', icon: AlertTriangle },
      non_compliant: { variant: 'destructive' as const, label: 'Non-Compliant', icon: AlertTriangle },
      under_review: { variant: 'secondary' as const, label: 'Under Review', icon: Eye },
      pending_submission: { variant: 'outline' as const, label: 'Pending Submission', icon: FileText }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getComplianceStatus = (project: any) => {
    const compliance = projectCompliances.get(project.id);
    if (!compliance) return 'pending_submission';
    
    const { summary } = compliance;
    const score = summary.overallScore;
    
    if (summary.isCompliant && score >= 100) return 'fully_compliant';
    if (summary.isCompliant && score >= 80) return 'mostly_compliant';
    if (!summary.isCompliant && score >= 50) return 'partially_compliant';
    if (!summary.isCompliant && score < 50) return 'non_compliant';
    
    const hasPending = compliance.complianceStatus.some((s: any) => s.status === 'PENDING_APPROVAL');
    if (hasPending) return 'under_review';
    
    return 'pending_submission';
  };

  const getRiskLevel = (score: number, nonCompliantCount: number) => {
    if (nonCompliantCount > 0 && score < 50) return { level: 'Critical', color: 'text-red-600' };
    if (score < 70) return { level: 'High', color: 'text-orange-600' };
    if (score < 85) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  const handleViewDetails = (projectId: string) => {
    toast.info('Opening project compliance details...');
    // Navigate to project compliance details
    window.location.href = `/projects/${projectId}/compliance`;
  };

  const handleGenerateReport = async (projectId: string) => {
    try {
      toast.info('Generating compliance report...');
      const report = await complianceService.generateProjectComplianceReport(projectId);
      console.log('Report generated:', report);
      toast.success('Compliance report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate compliance report');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="fully_compliant">Fully Compliant</SelectItem>
            <SelectItem value="mostly_compliant">Mostly Compliant</SelectItem>
            <SelectItem value="partially_compliant">Partially Compliant</SelectItem>
            <SelectItem value="non_compliant">Non-Compliant</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="pending_submission">Pending Submission</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Compliance Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Assigned Officer</TableHead>
              <TableHead>Last Assessment</TableHead>
              <TableHead>Next Review</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Loading project compliance data...
                </TableCell>
              </TableRow>
            ) : filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No project compliance records found
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => {
                const compliance = projectCompliances.get(project.id);
                const score = compliance?.summary.overallScore || 0;
                const nonCompliantCount = compliance?.summary.mandatoryRequirements 
                  ? compliance.summary.mandatoryRequirements - compliance.summary.compliantMandatory
                  : 0;
                const riskLevel = getRiskLevel(score, nonCompliantCount);
                const status = getComplianceStatus(project);
                
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {compliance?.summary.totalRequirements || 0} requirements
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(project.type || project.category || 'General').replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={score} className="w-16" />
                        <span className="text-sm font-medium">{Math.round(score)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(status)}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${riskLevel.color}`}>
                        {riskLevel.level}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{project.assignedTo || 'Unassigned'}</span>
                    </TableCell>
                    <TableCell>
                      {project.updatedAt ? format(new Date(project.updatedAt), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(pc.nextReviewDate), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(pc.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Update Checks
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateReport(pc.id)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Report
                          </DropdownMenuItem>
                          {nonCompliantCount > 0 && (
                            <DropdownMenuItem>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              View Issues
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}