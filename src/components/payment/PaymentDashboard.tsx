// ==================== PAYMENT DASHBOARD COMPONENT ====================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Building2,
  Smartphone,
  FileText,
  Download,
  RefreshCw,
  Filter,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Wallet
} from 'lucide-react';
import { usePaymentStore } from '@/store/paymentStore';
import { PaymentTransaction, PaymentMethod, PaymentStatus } from '@/types/payment';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

export const PaymentDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
  
  const {
    transactions,
    invoices,
    settlements,
    analytics,
    isLoadingTransactions,
    loadAnalytics,
    generatePaymentReport,
    formatCurrency
  } = usePaymentStore();

  // Load analytics on mount and when date range changes
  useEffect(() => {
    const endDate = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case '7days':
        startDate = subDays(endDate, 7);
        break;
      case '30days':
        startDate = subDays(endDate, 30);
        break;
      case 'month':
        startDate = startOfMonth(endDate);
        break;
      default:
        startDate = subDays(endDate, 30);
    }
    
    loadAnalytics(startDate, endDate);
  }, [dateRange]);

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filterMethod !== 'all' && t.method !== filterMethod) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  // Calculate metrics
  const metrics = {
    totalRevenue: analytics?.totalRevenue || 0,
    totalTransactions: analytics?.totalTransactions || 0,
    successRate: analytics?.successRate || 0,
    averageValue: analytics?.averageTransactionValue || 0,
    pendingAmount: transactions
      .filter(t => t.status === 'pending' || t.status === 'processing')
      .reduce((sum, t) => sum + t.amount, 0),
    failedAmount: transactions
      .filter(t => t.status === 'failed')
      .reduce((sum, t) => sum + t.amount, 0)
  };

  // Payment method icons
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'fpx':
      case 'fpx_b2b':
      case 'bank_transfer':
      case 'duitnow':
        return <Building2 className="w-4 h-4" />;
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="w-4 h-4" />;
      case 'ewallet_grab':
      case 'ewallet_tng':
      case 'ewallet_boost':
      case 'ewallet_shopee':
        return <Smartphone className="w-4 h-4" />;
      case 'jompay':
        return <Receipt className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  // Status badge
  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, { variant: any; icon: any; label: string }> = {
      'pending': { variant: 'secondary', icon: Clock, label: 'Pending' },
      'processing': { variant: 'secondary', icon: Clock, label: 'Processing' },
      'authorized': { variant: 'outline', icon: CheckCircle, label: 'Authorized' },
      'captured': { variant: 'default', icon: CheckCircle, label: 'Captured' },
      'settled': { variant: 'default', icon: CheckCircle, label: 'Settled' },
      'cancelled': { variant: 'outline', icon: XCircle, label: 'Cancelled' },
      'failed': { variant: 'destructive', icon: XCircle, label: 'Failed' },
      'refunded': { variant: 'secondary', icon: ArrowDownRight, label: 'Refunded' },
      'partially_refunded': { variant: 'secondary', icon: ArrowDownRight, label: 'Partial Refund' },
      'expired': { variant: 'outline', icon: Clock, label: 'Expired' },
      'disputed': { variant: 'destructive', icon: AlertCircle, label: 'Disputed' }
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage all payment transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => generatePaymentReport('summary', new Date(), new Date())}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => loadAnalytics(new Date(), new Date())}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 inline-flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5%
              </span>
              {' '}from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Success rate: {metrics.successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Transaction volume by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.byMethod || {}).map(([method, data]) => {
                const percentage = (data.count / metrics.totalTransactions) * 100;
                return (
                  <div key={method} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(method as PaymentMethod)}
                        <span className="font-medium">
                          {method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{data.count}</span>
                        <span className="text-muted-foreground ml-2">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filterMethod} onValueChange={(v) => setFilterMethod(v as any)}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All methods</SelectItem>
                      <SelectItem value="fpx">FPX</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="ewallet_grab">GrabPay</SelectItem>
                      <SelectItem value="ewallet_tng">Touch'n Go</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="captured">Captured</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading transactions...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.slice(0, 10).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.referenceNo}
                        </TableCell>
                        <TableCell>
                          {format(new Date(transaction.createdAt), 'dd MMM yyyy, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(transaction.method)}
                            <span className="text-sm">
                              {transaction.method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage and track invoice payments</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invoices found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.slice(0, 10).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">
                          {invoice.invoiceNo}
                        </TableCell>
                        <TableCell>{invoice.clientId}</TableCell>
                        <TableCell>
                          {format(new Date(invoice.issueDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === 'paid' ? 'default' :
                              invoice.status === 'overdue' ? 'destructive' :
                              invoice.status === 'sent' ? 'secondary' :
                              'outline'
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <FileText className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settlements Tab */}
        <TabsContent value="settlements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Settlements</CardTitle>
              <CardDescription>Bank settlements and reconciliation</CardDescription>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No settlements found
                </div>
              ) : (
                <div className="space-y-4">
                  {settlements.map((settlement) => (
                    <div key={settlement.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Batch #{settlement.batchNo}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(settlement.settlementDate), 'dd MMM yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(settlement.netAmount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {settlement.totalTransactions} transactions
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds" className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Refund processing typically takes 5-7 business days depending on the payment method.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Refund Requests</CardTitle>
              <CardDescription>Manage refund requests and processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No refund requests found
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};