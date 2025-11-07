import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Clock, AlertTriangle, CheckCircle, XCircle, Plus, Search, Filter, Download, Reply, Eye, Tag, Flag, User, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'billing' | 'account' | 'feature_request' | 'bug_report' | 'general';
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  assignedToName?: string;
  messages: TicketMessage[];
  tags: string[];
}

interface TicketMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  timestamp: string;
  isInternal: boolean;
}

interface SupportStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  avgResponseTime: number;
  satisfactionScore: number;
  criticalTickets: number;
  overdueTickets: number;
}

export const UserSupport: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    avgResponseTime: 0,
    satisfactionScore: 0,
    criticalTickets: 0,
    overdueTickets: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in production, this would come from API
  useEffect(() => {
    const mockTickets: SupportTicket[] = [
      {
        id: '1',
        title: 'Cannot upload project files',
        description: 'Getting error when trying to upload CAD files to the project. Error message says "File type not supported" but these are standard .dwg files.',
        status: 'open',
        priority: 'high',
        category: 'technical',
        companyId: '1',
        companyName: 'Architect Studio Malaysia',
        userId: 'user1',
        userName: 'Ahmad Rahman',
        userEmail: 'ahmad@architectstudio.my',
        createdAt: '2025-01-17T10:30:00Z',
        updatedAt: '2025-01-17T10:30:00Z',
        tags: ['file-upload', 'cad-files', 'error'],
        messages: [
          {
            id: 'msg1',
            userId: 'user1',
            userName: 'Ahmad Rahman',
            userRole: 'Admin',
            message: 'Getting error when trying to upload CAD files to the project. Error message says "File type not supported" but these are standard .dwg files.',
            timestamp: '2025-01-17T10:30:00Z',
            isInternal: false
          }
        ]
      },
      {
        id: '2',
        title: 'Billing inquiry - subscription upgrade',
        description: 'I would like to upgrade from Basic to Professional plan. Can you help me understand the pricing and what additional features I will get?',
        status: 'in_progress',
        priority: 'medium',
        category: 'billing',
        companyId: '2',
        companyName: 'Design Hub Singapore',
        userId: 'user2',
        userName: 'Sarah Chen',
        userEmail: 'sarah@designhub.sg',
        createdAt: '2025-01-16T14:20:00Z',
        updatedAt: '2025-01-17T09:15:00Z',
        assignedTo: 'admin1',
        assignedToName: 'Support Team',
        tags: ['billing', 'upgrade', 'subscription'],
        messages: [
          {
            id: 'msg2',
            userId: 'user2',
            userName: 'Sarah Chen',
            userRole: 'Admin',
            message: 'I would like to upgrade from Basic to Professional plan. Can you help me understand the pricing and what additional features I will get?',
            timestamp: '2025-01-16T14:20:00Z',
            isInternal: false
          },
          {
            id: 'msg3',
            userId: 'admin1',
            userName: 'Support Team',
            userRole: 'System Admin',
            message: 'Hi Sarah! I\'d be happy to help you upgrade. The Professional plan includes 20 active projects, 100GB storage, 15 team members, and advanced project management features. The cost is RM 99.99/month. Would you like me to process the upgrade?',
            timestamp: '2025-01-17T09:15:00Z',
            isInternal: false
          }
        ]
      },
      {
        id: '3',
        title: 'Feature request: Advanced reporting',
        description: 'It would be great to have more detailed reporting features, especially for project timelines and resource allocation. Currently the basic reports are not sufficient for our needs.',
        status: 'open',
        priority: 'low',
        category: 'feature_request',
        companyId: '3',
        companyName: 'Construction Pro Indonesia',
        userId: 'user3',
        userName: 'Budi Santoso',
        userEmail: 'budi@constructionpro.id',
        createdAt: '2025-01-15T16:45:00Z',
        updatedAt: '2025-01-15T16:45:00Z',
        tags: ['feature-request', 'reporting', 'analytics'],
        messages: [
          {
            id: 'msg4',
            userId: 'user3',
            userName: 'Budi Santoso',
            userRole: 'Admin',
            message: 'It would be great to have more detailed reporting features, especially for project timelines and resource allocation. Currently the basic reports are not sufficient for our needs.',
            timestamp: '2025-01-15T16:45:00Z',
            isInternal: false
          }
        ]
      }
    ];

    setTickets(mockTickets);
    
    // Calculate stats
    const total = mockTickets.length;
    const open = mockTickets.filter(t => t.status === 'open').length;
    const inProgress = mockTickets.filter(t => t.status === 'in_progress').length;
    const resolved = mockTickets.filter(t => t.status === 'resolved').length;
    const closed = mockTickets.filter(t => t.status === 'closed').length;
    const criticalTickets = mockTickets.filter(t => t.priority === 'critical').length;
    
    setStats({
      total,
      open,
      inProgress,
      resolved,
      closed,
      avgResponseTime: 4.2,
      satisfactionScore: 4.6,
      criticalTickets,
      overdueTickets: 2
    });
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'bg-red-50 text-red-700 border-red-200',
      in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      resolved: 'bg-green-50 text-green-700 border-green-200',
      closed: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return variants[status as keyof typeof variants] || variants.open;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-50 text-gray-700 border-gray-200',
      medium: 'bg-blue-50 text-blue-700 border-blue-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-red-50 text-red-700 border-red-200'
    };
    return variants[priority as keyof typeof variants] || variants.low;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'closed': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return <Tag className="h-4 w-4 text-gray-600" />;
      case 'medium': return <Tag className="h-4 w-4 text-blue-600" />;
      case 'high': return <Flag className="h-4 w-4 text-orange-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Tag className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      setIsLoading(true);
      // In production, this would call the backend API
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status: newStatus as any, updatedAt: new Date().toISOString() } : t
      ));
      toast.success('Ticket status updated successfully');
    } catch (error) {
      toast.error('Failed to update ticket status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTicket = async (ticketId: string, assignedTo: string) => {
    try {
      setIsLoading(true);
      // In production, this would call the backend API
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, assignedTo, assignedToName: 'Support Team', updatedAt: new Date().toISOString() } : t
      ));
      toast.success('Ticket assigned successfully');
    } catch (error) {
      toast.error('Failed to assign ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setIsLoading(true);
      const newMessage: TicketMessage = {
        id: `msg${Date.now()}`,
        userId: 'admin1',
        userName: 'Support Team',
        userRole: 'System Admin',
        message: replyMessage,
        timestamp: new Date().toISOString(),
        isInternal: false
      };

      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id 
          ? { 
              ...t, 
              messages: [...t.messages, newMessage],
              status: 'in_progress' as any,
              updatedAt: new Date().toISOString()
            } 
          : t
      ));

      setReplyMessage('');
      setShowReplyDialog(false);
      toast.success('Reply sent successfully');
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setIsLoading(false);
    }
  };

  const exportTickets = () => {
    const csvContent = [
      ['Ticket ID', 'Title', 'Status', 'Priority', 'Category', 'Company', 'User', 'Created', 'Updated'],
      ...filteredTickets.map(t => [
        t.id,
        t.title,
        t.status,
        t.priority,
        t.category,
        t.companyName,
        t.userName,
        t.createdAt,
        t.updatedAt
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'support-tickets-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Tickets exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Support</h1>
          <p className="text-muted-foreground">
            Manage support tickets and provide user assistance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportTickets}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.open / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.inProgress / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalTickets}</div>
            <p className="text-xs text-muted-foreground">
              High priority tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}h</div>
            <p className="text-xs text-muted-foreground">
              Response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Tickets</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="bug_report">Bug Report</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            Manage and respond to user support requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium">{ticket.title}</h3>
                    <Badge variant="outline" className={getStatusBadge(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                    </Badge>
                    <Badge variant="outline" className={getPriorityBadge(ticket.priority)}>
                      {getPriorityIcon(ticket.priority)}
                      <span className="ml-1">{ticket.priority}</span>
                    </Badge>
                    <Badge variant="secondary">{ticket.category.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Building2 className="h-3 w-3 mr-1" />
                      {ticket.companyName}
                    </span>
                    <span className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {ticket.userName} ({ticket.userEmail})
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    {ticket.assignedTo && (
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        Assigned to {ticket.assignedToName}
                      </span>
                    )}
                  </div>
                  {ticket.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ticket.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowTicketDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowReplyDialog(true);
                    }}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => handleStatusChange(ticket.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>
              View ticket information and conversation history
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <p className="text-sm font-medium">{selectedTicket.title}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant="outline" className={getStatusBadge(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge variant="outline" className={getPriorityBadge(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
                <div>
                  <Label>Category</Label>
                  <Badge variant="secondary">{selectedTicket.category.replace('_', ' ')}</Badge>
                </div>
                <div>
                  <Label>Company</Label>
                  <p className="text-sm">{selectedTicket.companyName}</p>
                </div>
                <div>
                  <Label>User</Label>
                  <p className="text-sm">{selectedTicket.userName} ({selectedTicket.userEmail})</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Updated</Label>
                  <p className="text-sm">{new Date(selectedTicket.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm">{selectedTicket.description}</p>
              </div>
              {selectedTicket.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTicket.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label>Conversation History</Label>
                <div className="space-y-3 mt-2 max-h-60 overflow-y-auto">
                  {selectedTicket.messages.map((message) => (
                    <div key={message.id} className={`p-3 rounded-lg ${
                      message.isInternal ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{message.userName}</span>
                        <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                      {message.isInternal && (
                        <Badge variant="secondary" className="text-xs mt-1">Internal Note</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTicketDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowTicketDialog(false);
              setShowReplyDialog(true);
            }}>
              Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Ticket</DialogTitle>
            <DialogDescription>
              Send a response to {selectedTicket?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reply">Your Response</Label>
              <Textarea
                id="reply"
                placeholder="Type your response here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReply} disabled={isLoading || !replyMessage.trim()}>
              {isLoading ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
