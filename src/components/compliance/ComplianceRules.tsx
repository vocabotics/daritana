import { useState, useEffect } from 'react';
import { complianceService, ComplianceRequirement } from '@/services/compliance.service';
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
  FileCheck,
  Eye,
  Edit,
  Trash2,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ComplianceRules() {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [authorityFilter, setAuthorityFilter] = useState<string>('all');
  const [isMandatoryFilter, setIsMandatoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRequirements();
  }, [page]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await complianceService.getRequirements({
        page,
        limit: 20
      });
      setRequirements(response.requirements);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching compliance requirements:', error);
      toast.error('Failed to load compliance requirements');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = 
      req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || req.category === categoryFilter;
    const matchesAuthority = authorityFilter === 'all' || req.authorityId === authorityFilter;
    const matchesMandatory = isMandatoryFilter === 'all' || 
      (isMandatoryFilter === 'mandatory' && req.isMandatory) ||
      (isMandatoryFilter === 'optional' && !req.isMandatory);
    
    return matchesSearch && matchesCategory && matchesAuthority && matchesMandatory;
  });

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      mandatory: { variant: 'destructive' as const, label: 'Mandatory' },
      recommended: { variant: 'default' as const, label: 'Recommended' },
      advisory: { variant: 'secondary' as const, label: 'Advisory' }
    };
    
    const config = severityConfig[severity as keyof typeof severityConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      building_planning: { color: 'bg-blue-100 text-blue-800', label: 'Building Planning' },
      structural_safety: { color: 'bg-red-100 text-red-800', label: 'Structural Safety' },
      fire_safety: { color: 'bg-orange-100 text-orange-800', label: 'Fire Safety' },
      accessibility: { color: 'bg-purple-100 text-purple-800', label: 'Accessibility' },
      environmental: { color: 'bg-green-100 text-green-800', label: 'Environmental' },
      health_safety: { color: 'bg-yellow-100 text-yellow-800', label: 'Health & Safety' },
      energy_efficiency: { color: 'bg-teal-100 text-teal-800', label: 'Energy Efficiency' },
      heritage_conservation: { color: 'bg-indigo-100 text-indigo-800', label: 'Heritage Conservation' },
      parking_traffic: { color: 'bg-gray-100 text-gray-800', label: 'Parking & Traffic' },
      services_utilities: { color: 'bg-cyan-100 text-cyan-800', label: 'Services & Utilities' },
      general_provisions: { color: 'bg-slate-100 text-slate-800', label: 'General Provisions' }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig];
    return (
      <Badge className={config.color} variant="outline">
        {config.label}
      </Badge>
    );
  };

  const handleDeleteRequirement = async (requirementId: string) => {
    if (confirm('Are you sure you want to delete this compliance requirement?')) {
      try {
        await complianceService.deleteRequirement(requirementId);
        toast.success('Compliance requirement deleted successfully');
        fetchRequirements();
      } catch (error) {
        console.error('Error deleting requirement:', error);
        toast.error('Failed to delete compliance requirement');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search rules by code, title, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="building_planning">Building Planning</SelectItem>
            <SelectItem value="structural_safety">Structural Safety</SelectItem>
            <SelectItem value="fire_safety">Fire Safety</SelectItem>
            <SelectItem value="accessibility">Accessibility</SelectItem>
            <SelectItem value="environmental">Environmental</SelectItem>
            <SelectItem value="health_safety">Health & Safety</SelectItem>
            <SelectItem value="energy_efficiency">Energy Efficiency</SelectItem>
            <SelectItem value="heritage_conservation">Heritage Conservation</SelectItem>
            <SelectItem value="parking_traffic">Parking & Traffic</SelectItem>
            <SelectItem value="services_utilities">Services & Utilities</SelectItem>
            <SelectItem value="general_provisions">General Provisions</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={authorityFilter} onValueChange={setAuthorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Authority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Authorities</SelectItem>
            <SelectItem value="DBKL">DBKL</SelectItem>
            <SelectItem value="MBPJ">MBPJ</SelectItem>
            <SelectItem value="MPSJ">MPSJ</SelectItem>
            <SelectItem value="MPK">MPK</SelectItem>
            <SelectItem value="MPPP">MPPP</SelectItem>
            <SelectItem value="MBIP">MBIP</SelectItem>
            <SelectItem value="JKR">JKR</SelectItem>
            <SelectItem value="BOMBA">BOMBA</SelectItem>
            <SelectItem value="TNB">TNB</SelectItem>
            <SelectItem value="IWK">IWK</SelectItem>
            <SelectItem value="DOE">DOE</SelectItem>
            <SelectItem value="DOSH">DOSH</SelectItem>
            <SelectItem value="PWD">PWD</SelectItem>
            <SelectItem value="HERITAGE_DEPARTMENT">Heritage Dept</SelectItem>
            <SelectItem value="STATE_AUTHORITY">State Authority</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={isMandatoryFilter} onValueChange={setIsMandatoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="mandatory">Mandatory</SelectItem>
            <SelectItem value="optional">Optional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Authority</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Project Types</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Loading compliance requirements...
                </TableCell>
              </TableRow>
            ) : filteredRequirements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No compliance requirements found
                </TableCell>
              </TableRow>
            ) : (
              filteredRequirements.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-muted-foreground" />
                      {req.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-sm text-muted-foreground truncate">
                      {req.description}
                    </p>
                  </TableCell>
                  <TableCell>{getCategoryBadge(req.category)}</TableCell>
                  <TableCell>
                    {req.authority ? (
                      <Badge variant="outline">{req.authority.code || req.authority.name}</Badge>
                    ) : (
                      <Badge variant="outline">N/A</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {req.isMandatory ? (
                      <Badge variant="destructive">Mandatory</Badge>
                    ) : (
                      <Badge variant="secondary">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{req.documentType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {req.projectTypes.slice(0, 2).map(type => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {req.projectTypes.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{req.projectTypes.length - 2}
                        </Badge>
                      )}
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Requirement
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          View Checklist
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteRequirement(req.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}