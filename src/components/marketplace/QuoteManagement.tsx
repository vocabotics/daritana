import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Download,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  Package,
  Truck,
  MessageSquare,
  Edit,
  Copy,
  ArrowRight,
  AlertCircle,
  Star,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface QuoteItem {
  id: string;
  productName: string;
  productId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
  deliveryTime?: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  customer: {
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
  };
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  terms?: string;
  attachments?: string[];
}

interface QuoteRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company: string;
  projectTitle: string;
  description: string;
  requirements: string;
  budget?: {
    min: number;
    max: number;
  };
  timeline: string;
  location: string;
  attachments?: string[];
  status: 'new' | 'in_progress' | 'quoted' | 'closed';
  createdAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export function QuoteManagement() {
  const [activeTab, setActiveTab] = useState('requests');
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [showRequestDetail, setShowRequestDetail] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data
  const [quoteRequests] = useState<QuoteRequest[]>([
    {
      id: 'qr1',
      customerName: 'Ahmad Rahman',
      customerEmail: 'ahmad@construction.com.my',
      customerPhone: '+60 12-345 6789',
      company: 'Rahman Construction Sdn Bhd',
      projectTitle: 'Office Building Construction Materials',
      description: 'Need comprehensive quote for materials for a 5-story office building project in KLCC area',
      requirements: 'Portland cement (200 tons), Steel rebar Grade 500 (50 tons), Ready-mix concrete (500 cubic meters), Bricks (50,000 pieces)',
      budget: { min: 80000, max: 120000 },
      timeline: '3 months',
      location: 'KLCC, Kuala Lumpur',
      attachments: ['building_plans.pdf', 'specifications.docx'],
      status: 'new',
      createdAt: new Date('2024-01-20'),
      priority: 'high'
    },
    {
      id: 'qr2',
      customerName: 'Siti Aminah',
      customerEmail: 'siti@modernhomes.my',
      customerPhone: '+60 13-567 8901',
      company: 'Modern Homes Sdn Bhd',
      projectTitle: 'Residential Development Phase 2',
      description: 'Quote request for materials for 50-unit residential development',
      requirements: 'Tiles, sanitary ware, electrical fittings, plumbing materials, paint',
      budget: { min: 150000, max: 200000 },
      timeline: '4 months',
      location: 'Seremban, Negeri Sembilan',
      status: 'in_progress',
      createdAt: new Date('2024-01-18'),
      priority: 'medium'
    },
    {
      id: 'qr3',
      customerName: 'David Lim',
      customerEmail: 'david@retailspaces.com',
      customerPhone: '+60 16-789 0123',
      company: 'Retail Spaces Pte Ltd',
      projectTitle: 'Mall Renovation Project',
      description: 'Urgent quote needed for mall renovation materials',
      requirements: 'Flooring materials, ceiling systems, lighting fixtures, air conditioning materials',
      timeline: '1 month',
      location: 'Penang',
      status: 'quoted',
      createdAt: new Date('2024-01-15'),
      priority: 'urgent'
    }
  ]);

  const [quotes] = useState<Quote[]>([
    {
      id: 'q1',
      quoteNumber: 'QUO-2024-001',
      title: 'Office Building Construction Materials',
      customer: {
        name: 'Ahmad Rahman',
        company: 'Rahman Construction Sdn Bhd',
        email: 'ahmad@construction.com.my',
        phone: '+60 12-345 6789',
        address: 'No. 45, Jalan Ampang, 50450 Kuala Lumpur'
      },
      items: [
        {
          id: 'qi1',
          productName: 'Portland Cement OPC 50kg',
          description: 'High grade Portland cement suitable for structural concrete',
          quantity: 4000,
          unit: 'bags',
          unitPrice: 23.50,
          totalPrice: 94000,
          specifications: 'MS 522:2003 compliant, Grade 42.5N',
          deliveryTime: '2-3 weeks'
        },
        {
          id: 'qi2',
          productName: 'Steel Rebar Grade 500',
          description: 'High tensile steel reinforcement bars',
          quantity: 50000,
          unit: 'kg',
          unitPrice: 3.20,
          totalPrice: 160000,
          specifications: '12mm diameter, 12m length, MS 146 compliant',
          deliveryTime: '3-4 weeks'
        }
      ],
      subtotal: 254000,
      tax: 15240, // 6% GST
      shipping: 5000,
      discount: 12700, // 5% bulk discount
      total: 261540,
      status: 'sent',
      validUntil: new Date('2024-02-20'),
      createdAt: new Date('2024-01-21'),
      updatedAt: new Date('2024-01-21'),
      notes: 'Bulk discount applied for large quantity order',
      terms: 'Payment: 30% advance, 70% on delivery. Delivery: Ex-works Shah Alam warehouse.'
    }
  ]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'quoted': return 'bg-purple-100 text-purple-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-green-100 text-green-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateQuote = (requestId: string) => {
    const request = quoteRequests.find(r => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setShowCreateQuote(true);
    }
  };

  const handleSendQuote = (quoteId: string) => {
    toast.success('Quote sent successfully!', {
      description: 'Customer will be notified via email'
    });
  };

  const handleAcceptQuote = (quoteId: string) => {
    toast.success('Quote accepted!', {
      description: 'Proceeding to order processing'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quote Management</h1>
          <p className="text-gray-600">Handle quote requests and manage quotations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Quote
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Requests</p>
                <p className="text-2xl font-bold">{quoteRequests.filter(r => r.status === 'new').length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{quoteRequests.filter(r => r.status === 'in_progress').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quotes Sent</p>
                <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'sent').length}</p>
              </div>
              <Send className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'accepted').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Quote Requests</TabsTrigger>
          <TabsTrigger value="quotes">My Quotes</TabsTrigger>
        </TabsList>

        {/* Quote Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search quote requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <div className="space-y-4">
            {quoteRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{request.projectTitle}</CardTitle>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                      <CardDescription className="mb-3">
                        {request.description}
                      </CardDescription>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{request.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>{request.company}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{request.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{request.timeline}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm text-gray-500">
                        {request.createdAt.toLocaleDateString()}
                      </span>
                      {request.budget && (
                        <div className="text-right">
                          <p className="text-sm font-semibold">Budget</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(request.budget.min)} - {formatCurrency(request.budget.max)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{request.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{request.customerEmail}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRequestDetail(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleCreateQuote(request.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Create Quote
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-6">
          <div className="space-y-4">
            {quotes.map((quote) => (
              <Card key={quote.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{quote.quoteNumber}</CardTitle>
                        <Badge className={getStatusColor(quote.status)}>
                          {quote.status}
                        </Badge>
                      </div>
                      <CardDescription className="mb-3">
                        {quote.title}
                      </CardDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Customer:</span>
                          <p className="font-semibold">{quote.customer.name}</p>
                          <p className="text-gray-600">{quote.customer.company}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Valid Until:</span>
                          <p className="font-semibold">{quote.validUntil.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Items:</span>
                          <p className="font-semibold">{quote.items.length} items</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(quote.total)}</p>
                      <p className="text-sm text-gray-500">Total Amount</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Created: {quote.createdAt.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      {quote.status === 'draft' && (
                        <Button size="sm" onClick={() => handleSendQuote(quote.id)}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Quote
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Request Detail Modal */}
      <Dialog open={showRequestDetail} onOpenChange={setShowRequestDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedRequest.customerName}</p>
                    <p><span className="font-medium">Company:</span> {selectedRequest.company}</p>
                    <p><span className="font-medium">Email:</span> {selectedRequest.customerEmail}</p>
                    <p><span className="font-medium">Phone:</span> {selectedRequest.customerPhone}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Project Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Location:</span> {selectedRequest.location}</p>
                    <p><span className="font-medium">Timeline:</span> {selectedRequest.timeline}</p>
                    <p><span className="font-medium">Priority:</span> 
                      <Badge className={`${getPriorityColor(selectedRequest.priority)} ml-2`}>
                        {selectedRequest.priority}
                      </Badge>
                    </p>
                    {selectedRequest.budget && (
                      <p><span className="font-medium">Budget:</span> {formatCurrency(selectedRequest.budget.min)} - {formatCurrency(selectedRequest.budget.max)}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedRequest.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Requirements</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedRequest.requirements}</p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowRequestDetail(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowRequestDetail(false);
                  handleCreateQuote(selectedRequest.id);
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Quote
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Quote Modal */}
      <Dialog open={showCreateQuote} onOpenChange={setShowCreateQuote}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>Quote creation form will be implemented here</p>
              <p className="text-sm">Include item selection, pricing, terms, and conditions</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateQuote(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowCreateQuote(false);
                toast.success('Quote created successfully!');
              }}>
                Create Quote
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}