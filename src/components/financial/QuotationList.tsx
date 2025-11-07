import { useState } from 'react';
import { useFinancialStore } from '@/store/financialStore';
import { useProjectStore } from '@/store/projectStore';
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
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Search,
  Filter,
  FileText,
  Check,
  X,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function QuotationList() {
  const { 
    quotations, 
    deleteQuotation, 
    approveQuotation, 
    rejectQuotation,
    convertQuotationToInvoice 
  } = useFinancialStore();
  const { projects } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = 
      quotation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.items.some(item => 
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    const matchesProject = projectFilter === 'all' || quotation.projectId === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      submitted: { variant: 'default' as const, label: 'Submitted' },
      approved: { variant: 'success' as const, label: 'Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleApproveQuotation = (quotationId: string) => {
    if (confirm('Are you sure you want to approve this quotation?')) {
      approveQuotation(quotationId);
      toast.success('Quotation approved successfully');
    }
  };

  const handleRejectQuotation = (quotationId: string) => {
    if (confirm('Are you sure you want to reject this quotation?')) {
      rejectQuotation(quotationId);
      toast.success('Quotation rejected');
    }
  };

  const handleConvertToInvoice = (quotationId: string) => {
    if (confirm('Convert this quotation to an invoice?')) {
      convertQuotationToInvoice(quotationId);
      toast.success('Quotation converted to invoice successfully');
    }
  };

  const handleDeleteQuotation = (quotationId: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      deleteQuotation(quotationId);
      toast.success('Quotation deleted successfully');
    }
  };

  const handleDownloadQuotation = (quotation: any) => {
    toast.info('Generating PDF quotation...');
    // In a real app, this would generate and download a PDF
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const isValidUntilExpired = (validUntil: Date) => {
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quotations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No quotations found
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{quotation.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {quotation.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getProjectName(quotation.projectId)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(quotation.amount)}
                  </TableCell>
                  <TableCell>
                    <div className={isValidUntilExpired(quotation.validUntil) ? 'text-red-600' : ''}>
                      {format(new Date(quotation.validUntil), 'MMM dd, yyyy')}
                      {isValidUntilExpired(quotation.validUntil) && (
                        <div className="text-xs">Expired</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                  <TableCell>
                    {format(new Date(quotation.submittedAt), 'MMM dd, yyyy')}
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
                          Edit
                        </DropdownMenuItem>
                        
                        {quotation.status === 'submitted' && (
                          <>
                            <DropdownMenuItem onClick={() => handleApproveQuotation(quotation.id)}>
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRejectQuotation(quotation.id)}>
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {quotation.status === 'approved' && (
                          <DropdownMenuItem onClick={() => handleConvertToInvoice(quotation.id)}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Convert to Invoice
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem onClick={() => handleDownloadQuotation(quotation)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteQuotation(quotation.id)}
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