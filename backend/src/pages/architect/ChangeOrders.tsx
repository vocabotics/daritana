import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChangeOrderStore } from '@/store/architect/changeOrderStore';
import { useProjectStore } from '@/store/projectStore';
import { ChangeOrder } from '@/types/architect';
import { toast } from 'sonner';

const ChangeOrders: React.FC = () => {
  const {
    changeOrders,
    currentChangeOrder,
    costSummary,
    loading,
    error,
    fetchChangeOrders,
    fetchChangeOrder,
    createChangeOrder,
    approveChangeOrder,
    fetchCostSummary,
    clearError,
  } = useChangeOrderStore();

  const { projects } = useProjectStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ChangeOrder | null>(null);
  const [activeProject, setActiveProject] = useState<string>('');
  const [approvalComment, setApprovalComment] = useState('');

  // Form state for creating change order
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    reason: 'design_change' as ChangeOrder['reason'],
    originalCost: 0,
    revisedCost: 0,
    originalSchedule: '',
    revisedSchedule: '',
    requestedBy: { id: '', name: '', company: '' },
  });

  useEffect(() => {
    fetchChangeOrders(activeProject);
    if (activeProject) {
      fetchCostSummary(activeProject);
    }
  }, [activeProject]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  const handleCreateChangeOrder = async () => {
    try {
      const costImpact = formData.revisedCost - formData.originalCost;
      const scheduleImpact = Math.ceil(
        (new Date(formData.revisedSchedule).getTime() - new Date(formData.originalSchedule).getTime()) /
        (1000 * 60 * 60 * 24)
      );

      const newOrder = await createChangeOrder({
        ...formData,
        projectName: projects.find(p => p.id === formData.projectId)?.name || '',
        costImpact,
        scheduleImpact,
        status: 'pending_review',
        approvals: [],
        documents: [],
      });

      toast.success('Change order created successfully');
      setShowCreateDialog(false);
      setFormData({
        projectId: '',
        title: '',
        description: '',
        reason: 'design_change',
        originalCost: 0,
        revisedCost: 0,
        originalSchedule: '',
        revisedSchedule: '',
        requestedBy: { id: '', name: '', company: '' },
      });
    } catch (err) {
      toast.error('Failed to create change order');
    }
  };

  const handleViewDetails = (order: ChangeOrder) => {
    setSelectedOrder(order);
    fetchChangeOrder(order.id);
    setShowDetailDialog(true);
  };

  const handleApprove = async (orderId: string, approved: boolean) => {
    try {
      await approveChangeOrder(orderId, {
        approverId: 'current-user',
        approverName: 'Current User',
        approverRole: 'Project Manager',
        status: approved ? 'approved' : 'rejected',
        comments: approvalComment,
        date: new Date().toISOString(),
        signature: 'CU',
      });

      toast.success(`Change order ${approved ? 'approved' : 'rejected'}`);
      setApprovalComment('');
      setShowDetailDialog(false);
    } catch (err) {
      toast.error('Failed to process approval');
    }
  };

  const getStatusColor = (status: ChangeOrder['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'pending_review': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getReasonIcon = (reason: ChangeOrder['reason']) => {
    switch (reason) {
      case 'design_change': return '📐';
      case 'site_condition': return '🏗️';
      case 'client_request': return '👤';
      case 'error_omission': return '⚠️';
      case 'regulatory': return '📋';
      default: return '📄';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && changeOrders.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Change Orders</h1>
          <p className="text-muted-foreground">Manage project change orders and variations</p>
        </div>
        <div className="flex gap-2">
          <Select value={activeProject} onValueChange={setActiveProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select project" />
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
            New Change Order
          </Button>
        </div>
      </div>

      {/* Cost Summary Cards */}
      {costSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Original Contract
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(costSummary.original)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Approved Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{formatCurrency(costSummary.approved)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                +{formatCurrency(costSummary.pending)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Revised Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(costSummary.total)}</div>
              <Progress
                value={(costSummary.approved / costSummary.original) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Change Orders</CardTitle>
          <CardDescription>Track all project modifications and their impact</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CO Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Cost Impact</TableHead>
                <TableHead>Schedule Impact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changeOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.changeOrderNumber}</TableCell>
                  <TableCell>{order.title}</TableCell>
                  <TableCell>{order.projectName}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <span>{getReasonIcon(order.reason)}</span>
                      <span className="text-sm">{order.reason.replace('_', ' ')}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={order.costImpact > 0 ? 'text-red-600' : 'text-green-600'}>
                      {order.costImpact > 0 ? '+' : ''}{formatCurrency(order.costImpact)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {order.scheduleImpact > 0 ? (
                      <span className="text-orange-600">+{order.scheduleImpact} days</span>
                    ) : (
                      <span className="text-gray-500">No impact</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(order)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Change Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Change Order</DialogTitle>
            <DialogDescription>
              Document a change to the project scope, cost, or schedule
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
                <Label htmlFor="reason">Reason</Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => setFormData({ ...formData, reason: value as ChangeOrder['reason'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="design_change">Design Change</SelectItem>
                    <SelectItem value="site_condition">Site Condition</SelectItem>
                    <SelectItem value="client_request">Client Request</SelectItem>
                    <SelectItem value="error_omission">Error/Omission</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the change"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed description of the change and its justification"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalCost">Original Cost (RM)</Label>
                <Input
                  id="originalCost"
                  type="number"
                  value={formData.originalCost}
                  onChange={(e) => setFormData({ ...formData, originalCost: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revisedCost">Revised Cost (RM)</Label>
                <Input
                  id="revisedCost"
                  type="number"
                  value={formData.revisedCost}
                  onChange={(e) => setFormData({ ...formData, revisedCost: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {formData.originalCost > 0 && formData.revisedCost > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Cost Impact: {formatCurrency(formData.revisedCost - formData.originalCost)}
                  ({((formData.revisedCost - formData.originalCost) / formData.originalCost * 100).toFixed(1)}%)
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalSchedule">Original Completion</Label>
                <Input
                  id="originalSchedule"
                  type="date"
                  value={formData.originalSchedule}
                  onChange={(e) => setFormData({ ...formData, originalSchedule: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revisedSchedule">Revised Completion</Label>
                <Input
                  id="revisedSchedule"
                  type="date"
                  value={formData.revisedSchedule}
                  onChange={(e) => setFormData({ ...formData, revisedSchedule: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChangeOrder}>Create Change Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedOrder.changeOrderNumber} - {selectedOrder.title}</span>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedOrder.projectName} | Created on {format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Reason</h4>
                    <p className="text-sm flex items-center gap-1">
                      <span>{getReasonIcon(selectedOrder.reason)}</span>
                      <span>{selectedOrder.reason.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Requested By</h4>
                    <p className="text-sm">{selectedOrder.requestedBy.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedOrder.requestedBy.company}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Cost Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Original:</span>
                          <span>{formatCurrency(selectedOrder.originalCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revised:</span>
                          <span>{formatCurrency(selectedOrder.revisedCost)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Impact:</span>
                          <span className={selectedOrder.costImpact > 0 ? 'text-red-600' : 'text-green-600'}>
                            {selectedOrder.costImpact > 0 ? '+' : ''}{formatCurrency(selectedOrder.costImpact)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Schedule Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Original:</span>
                          <span>{format(new Date(selectedOrder.originalSchedule), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revised:</span>
                          <span>{format(new Date(selectedOrder.revisedSchedule), 'MMM dd, yyyy')}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Impact:</span>
                          <span className={selectedOrder.scheduleImpact > 0 ? 'text-orange-600' : 'text-gray-500'}>
                            {selectedOrder.scheduleImpact > 0 ? `+${selectedOrder.scheduleImpact} days` : 'No impact'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Approval Status</h3>
                  <div className="space-y-2">
                    {selectedOrder.approvals.map((approval) => (
                      <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{approval.approverName}</p>
                          <p className="text-sm text-muted-foreground">{approval.approverRole}</p>
                          {approval.comments && (
                            <p className="text-sm mt-1">{approval.comments}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {approval.status === 'approved' && (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {approval.status === 'rejected' && (
                            <Badge className="bg-red-500">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                          {approval.status === 'pending' && (
                            <Badge className="bg-yellow-500">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {approval.date && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(approval.date), 'MMM dd')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.status === 'pending_review' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Approval Comments</Label>
                      <Textarea
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        placeholder="Add comments for this approval"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleApprove(selectedOrder.id, false)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleApprove(selectedOrder.id, true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChangeOrders;