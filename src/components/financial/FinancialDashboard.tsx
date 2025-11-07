import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useFinancialStore } from '@/store/financialStore';
import { useMemo } from 'react';
import { format } from 'date-fns';

export default function FinancialDashboard() {
  const { invoices, quotations, payments } = useFinancialStore();

  const stats = useMemo(() => {
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'overdue' || (inv.status === 'sent' && new Date(inv.dueDate) < new Date())
    );
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent');
    
    const totalQuotationAmount = quotations.reduce((sum, q) => sum + q.amount, 0);
    const approvedQuotations = quotations.filter(q => q.status === 'approved');
    const pendingQuotations = quotations.filter(q => q.status === 'submitted');
    
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const recentPayments = payments.filter(p => {
      const paymentDate = new Date(p.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return paymentDate >= thirtyDaysAgo;
    });

    return {
      totalRevenue: totalInvoiceAmount,
      totalPaid: paidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      totalOverdue: overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      totalPending: pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      invoiceCount: invoices.length,
      paidCount: paidInvoices.length,
      overdueCount: overdueInvoices.length,
      pendingCount: pendingInvoices.length,
      quotationTotal: totalQuotationAmount,
      quotationCount: quotations.length,
      approvedQuotationCount: approvedQuotations.length,
      pendingQuotationCount: pendingQuotations.length,
      paymentTotal: totalPayments,
      recentPaymentTotal: recentPayments.reduce((sum, p) => sum + p.amount, 0),
      recentPaymentCount: recentPayments.length,
      collectionRate: totalInvoiceAmount > 0 
        ? Math.round((paidInvoices.reduce((sum, inv) => sum + inv.amount, 0) / totalInvoiceAmount) * 100)
        : 0
    };
  }, [invoices, quotations, payments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.invoiceCount} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.paidCount} invoices paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalOverdue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueCount} overdue invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collectionRate}%</div>
            <Progress value={stats.collectionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Count</span>
                <span className="font-medium">{stats.pendingCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-medium">{formatCurrency(stats.totalPending)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-medium">{stats.quotationCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Approved</span>
                <span className="font-medium text-green-600">{stats.approvedQuotationCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-medium text-yellow-600">{stats.pendingQuotationCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last 30 days</span>
                <span className="font-medium">{stats.recentPaymentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-medium">{formatCurrency(stats.recentPaymentTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Financial Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(invoice.amount)}</p>
                  <p className={`text-xs ${
                    invoice.status === 'paid' ? 'text-green-600' :
                    invoice.status === 'overdue' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}