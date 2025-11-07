import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Send, Check, X, Eye, Edit, Trash2, Download } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Quotation } from '@/types';
import { toast } from 'sonner';

const QuotationList: React.FC = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuotations, setSelectedQuotations] = useState<string[]>([]);

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      // Mock data for now - will replace with API call
      const mockQuotations: Quotation[] = [
        {
          id: '1',
          quotation_number: 'Q202412001',
          project_id: '1',
          project: { 
            id: '1', 
            name: 'KLCC Tower Renovation',
            projectCode: 'KLCC-2024-001'
          } as any,
          client_id: '1',
          client: { 
            id: '1', 
            name: 'John Doe',
            email: 'john@example.com'
          } as any,
          prepared_by: '2',
          preparedBy: {
            id: '2',
            name: 'Sarah Lee',
            email: 'sarah@daritana.com'
          } as any,
          status: 'sent',
          valid_until: new Date('2024-12-31'),
          subtotal: 150000,
          sst_amount: 12000,
          total_amount: 162000,
          discount_percentage: 5,
          payment_terms: '30 days',
          revision_number: 0,
          items: [],
          created_at: new Date('2024-12-01'),
          updated_at: new Date('2024-12-01'),
        },
        {
          id: '2',
          quotation_number: 'Q202412002',
          project_id: '2',
          project: { 
            id: '2', 
            name: 'Penang Heritage Hotel',
            projectCode: 'PHH-2024-002'
          } as any,
          client_id: '3',
          client: { 
            id: '3', 
            name: 'ABC Holdings',
            email: 'contact@abcholdings.com'
          } as any,
          prepared_by: '2',
          preparedBy: {
            id: '2',
            name: 'Sarah Lee',
            email: 'sarah@daritana.com'
          } as any,
          status: 'approved',
          valid_until: new Date('2024-12-25'),
          subtotal: 280000,
          sst_amount: 22400,
          total_amount: 302400,
          payment_terms: '50% deposit, 50% on completion',
          revision_number: 1,
          approved_at: new Date('2024-12-05'),
          items: [],
          created_at: new Date('2024-11-25'),
          updated_at: new Date('2024-12-05'),
        },
        {
          id: '3',
          quotation_number: 'Q202412003',
          project_id: '3',
          project: { 
            id: '3', 
            name: 'Modern Office Space',
            projectCode: 'MOS-2024-003'
          } as any,
          client_id: '4',
          client: { 
            id: '4', 
            name: 'Tech Innovations Sdn Bhd',
            email: 'info@techinnovations.my'
          } as any,
          prepared_by: '2',
          preparedBy: {
            id: '2',
            name: 'Sarah Lee',
            email: 'sarah@daritana.com'
          } as any,
          status: 'draft',
          valid_until: new Date('2025-01-15'),
          subtotal: 95000,
          sst_amount: 7600,
          total_amount: 102600,
          payment_terms: '30 days',
          revision_number: 0,
          items: [],
          created_at: new Date('2024-12-10'),
          updated_at: new Date('2024-12-10'),
        },
      ];

      const filtered = statusFilter === 'all' 
        ? mockQuotations 
        : mockQuotations.filter(q => q.status === statusFilter);

      setQuotations(filtered);
    } catch (error) {
      toast.error('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, icon: FileText },
      sent: { variant: 'default' as const, icon: Send },
      approved: { variant: 'success' as const, icon: Check },
      rejected: { variant: 'destructive' as const, icon: X },
      revised: { variant: 'warning' as const, icon: Edit },
      expired: { variant: 'outline' as const, icon: X },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      try {
        // API call to delete quotation
        toast.success('Quotation deleted successfully');
        fetchQuotations();
      } catch (error) {
        toast.error('Failed to delete quotation');
      }
    }
  };

  const handleSend = async (id: string) => {
    try {
      // API call to send quotation
      toast.success('Quotation sent successfully');
      fetchQuotations();
    } catch (error) {
      toast.error('Failed to send quotation');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const filteredQuotations = quotations.filter(
    (q) =>
      q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quotations</h2>
          <p className="text-gray-600">Manage project quotations and proposals</p>
        </div>
        <Button onClick={() => navigate('/quotations/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Quotation
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search quotations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="revised">Revised</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quotation #</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No quotations found
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-medium">
                    {quotation.quotation_number}
                    {quotation.revision_number > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        (Rev {quotation.revision_number})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{quotation.project?.name}</div>
                      <div className="text-xs text-gray-500">
                        {quotation.project?.projectCode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{quotation.client?.name}</div>
                      <div className="text-xs text-gray-500">
                        {quotation.client?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {formatCurrency(quotation.total_amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        SST: {formatCurrency(quotation.sst_amount)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(quotation.valid_until), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/quotations/${quotation.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {quotation.status === 'draft' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSend(quotation.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(quotation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default QuotationList;