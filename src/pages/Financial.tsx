import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialEmptyState, InvoicesEmptyState, ExpensesEmptyState } from '@/components/ui/empty-state';
import { useDemoStore } from '@/store/demoStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  CreditCard, 
  Plus, 
  Download, 
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Wallet,
  PiggyBank,
  Receipt,
  Calculator,
  BarChart3,
  LineChart,
  PieChart,
  Building2,
  Filter,
  Search,
  ChevronRight,
  ExternalLink,
  Send,
  Archive,
  RefreshCw,
  Settings,
  Briefcase,
  CircleDollarSign,
  Banknote,
  HandCoins,
  ReceiptText,
  FileSpreadsheet,
  WalletCards,
  Coins,
  BadgeDollarSign
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { useFinancialStore } from '@/store/financialStore';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Treemap,
  Sankey
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, parseISO, isAfter, isBefore, differenceInDays } from 'date-fns';

// Financial Dashboard Component
const FinancialDashboard = () => {
  const { projects } = useProjectStore();
  const { invoices, quotations, expenses, budgets } = useFinancialStore();
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [selectedCurrency, setSelectedCurrency] = useState('MYR');

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    
    const totalBudget = projects.reduce((sum, proj) => sum + (proj.budget || 0), 0);
    
    const cashFlow = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    
    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'pending' && 
      inv.dueDate && 
      isAfter(new Date(), new Date(inv.dueDate))
    );
    
    return {
      totalRevenue,
      pendingRevenue,
      totalExpenses,
      totalBudget,
      cashFlow,
      profitMargin,
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      overdueCount: overdueInvoices.length
    };
  }, [invoices, expenses, projects]);

  // Cash flow data for the last 6 months
  const cashFlowData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.createdAt);
          return inv.status === 'paid' && 
                 isAfter(invDate, monthStart) && 
                 isBefore(invDate, monthEnd);
        })
        .reduce((sum, inv) => sum + inv.amount, 0);
      
      const monthExpenses = expenses
        ?.filter(exp => {
          const expDate = new Date(exp.date);
          return isAfter(expDate, monthStart) && isBefore(expDate, monthEnd);
        })
        .reduce((sum, exp) => sum + exp.amount, 0) || 0;
      
      data.push({
        month: format(date, 'MMM'),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses
      });
    }
    return data;
  }, [invoices, expenses]);

  // Project budget utilization
  const budgetUtilization = useMemo(() => {
    return projects.slice(0, 5).map(project => ({
      name: project.name,
      budget: project.budget || 0,
      spent: project.actualCost || 0,
      utilization: project.budget ? ((project.actualCost || 0) / project.budget) * 100 : 0
    }));
  }, [projects]);

  // Revenue by category
  const revenueByCategory = useMemo(() => {
    const categories = {
      'Design': 0,
      'Construction': 0,
      'Consultation': 0,
      'Renovation': 0,
      'Other': 0
    };
    
    invoices.forEach(inv => {
      const category = inv.category || 'Other';
      if (categories[category] !== undefined) {
        categories[category] += inv.amount;
      } else {
        categories['Other'] += inv.amount;
      }
    });
    
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      percentage: metrics.totalRevenue > 0 ? (value / metrics.totalRevenue) * 100 : 0
    }));
  }, [invoices, metrics.totalRevenue]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Overview</h2>
          <p className="text-muted-foreground">
            Monitor your firm's financial health and performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <CircleDollarSign className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedCurrency} {metrics.totalRevenue.toLocaleString()}
              </div>
              <div className="flex items-center mt-2 text-xs">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">+12.5%</span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Revenue
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedCurrency} {metrics.pendingRevenue.toLocaleString()}
              </div>
              <div className="flex items-center mt-2 text-xs">
                <FileText className="h-3 w-3 text-blue-500 mr-1" />
                <span>{invoices.filter(i => i.status === 'pending').length} invoices pending</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
                <Receipt className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedCurrency} {metrics.totalExpenses.toLocaleString()}
              </div>
              <div className="flex items-center mt-2 text-xs">
                <TrendingDown className="h-3 w-3 text-orange-500 mr-1" />
                <span className="text-orange-500">-8.2%</span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Cash Flow
                </CardTitle>
                <Wallet className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                metrics.cashFlow >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {selectedCurrency} {Math.abs(metrics.cashFlow).toLocaleString()}
              </div>
              <div className="flex items-center mt-2 text-xs">
                <Target className="h-3 w-3 text-purple-500 mr-1" />
                <span>Profit margin: {metrics.profitMargin.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alert Banner for Overdue Invoices */}
      {metrics.overdueCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">
                    {metrics.overdueCount} Overdue Invoices
                  </p>
                  <p className="text-sm text-red-700">
                    Total overdue amount: {selectedCurrency} {metrics.overdueAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Analysis</CardTitle>
            <CardDescription>Revenue vs Expenses over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Distribution of income sources</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={revenueByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${selectedCurrency} ${value.toLocaleString()}`}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Project Budget Utilization</CardTitle>
          <CardDescription>Track spending against allocated budgets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetUtilization.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{project.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {selectedCurrency} {project.spent.toLocaleString()} / {project.budget.toLocaleString()}
                    </span>
                    <Badge 
                      variant={project.utilization > 90 ? "destructive" : project.utilization > 70 ? "warning" : "success"}
                    >
                      {project.utilization.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={project.utilization} 
                  className={cn(
                    "h-2",
                    project.utilization > 90 && "bg-red-100",
                    project.utilization > 70 && project.utilization <= 90 && "bg-orange-100"
                  )}
                />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your financial operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto flex-col py-4">
              <FileText className="h-5 w-5 mb-2" />
              <span className="text-xs">Create Invoice</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4">
              <Receipt className="h-5 w-5 mb-2" />
              <span className="text-xs">Record Expense</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4">
              <CreditCard className="h-5 w-5 mb-2" />
              <span className="text-xs">Process Payment</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4">
              <FileSpreadsheet className="h-5 w-5 mb-2" />
              <span className="text-xs">Generate Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Advanced Invoice Management
const InvoiceManagement = () => {
  const { invoices, createInvoice, updateInvoice } = useFinancialStore();
  const { projects } = useProjectStore();
  const { isEnabled: isDemoMode } = useDemoStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.client?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, filterStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'draft': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const shouldShowEmptyState = invoices.length === 0 && !isDemoMode;

  if (shouldShowEmptyState) {
    return (
      <div className="flex items-center justify-center py-20">
        <InvoicesEmptyState onCreateInvoice={() => {}} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedInvoices.length} invoices selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send Reminders
                </Button>
                <Button variant="ghost" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(filteredInvoices.map(i => i.id));
                        } else {
                          setSelectedInvoices([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-4 text-left font-medium">Invoice #</th>
                  <th className="p-4 text-left font-medium">Client</th>
                  <th className="p-4 text-left font-medium">Project</th>
                  <th className="p-4 text-left font-medium">Amount</th>
                  <th className="p-4 text-left font-medium">Issue Date</th>
                  <th className="p-4 text-left font-medium">Due Date</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice, index) => {
                  const project = projects.find(p => p.id === invoice.projectId);
                  const daysUntilDue = invoice.dueDate ? differenceInDays(new Date(invoice.dueDate), new Date()) : null;
                  
                  return (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices([...selectedInvoices, invoice.id]);
                            } else {
                              setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-4 font-medium">{invoice.number}</td>
                      <td className="p-4">{invoice.client || 'N/A'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{project?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold">
                        RM {invoice.amount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        {invoice.createdAt ? format(new Date(invoice.createdAt), 'dd MMM yyyy') : 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div>{invoice.dueDate ? format(new Date(invoice.dueDate), 'dd MMM yyyy') : 'N/A'}</div>
                          {daysUntilDue !== null && daysUntilDue < 7 && daysUntilDue > 0 && (
                            <span className="text-xs text-orange-600">Due in {daysUntilDue} days</span>
                          )}
                          {daysUntilDue !== null && daysUntilDue < 0 && (
                            <span className="text-xs text-red-600">Overdue by {Math.abs(daysUntilDue)} days</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={cn("border", getStatusColor(invoice.status))}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Expense Tracking Component
const ExpenseTracking = () => {
  const { expenses = [], addExpense } = useFinancialStore();
  const { projects } = useProjectStore();
  const { isEnabled: isDemoMode } = useDemoStore();
  const [showAddExpense, setShowAddExpense] = useState(false);

  const expenseCategories = [
    { name: 'Materials', icon: Briefcase, color: 'bg-blue-500' },
    { name: 'Labor', icon: HandCoins, color: 'bg-green-500' },
    { name: 'Equipment', icon: Settings, color: 'bg-orange-500' },
    { name: 'Transportation', icon: Calendar, color: 'bg-purple-500' },
    { name: 'Other', icon: Receipt, color: 'bg-gray-500' }
  ];

  const categorizedExpenses = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      categories[category] = (categories[category] || 0) + expense.amount;
    });
    return categories;
  }, [expenses]);

  const shouldShowEmptyState = expenses.length === 0 && !isDemoMode;

  if (shouldShowEmptyState) {
    return (
      <div className="flex items-center justify-center py-20">
        <ExpensesEmptyState onAddExpense={() => setShowAddExpense(true)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Expense Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {expenseCategories.map((category, index) => {
          const Icon = category.icon;
          const amount = categorizedExpenses[category.name] || 0;
          
          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn("p-2 rounded-lg", category.color)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.name}</p>
                  <p className="text-xl font-bold">
                    RM {amount.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Track and manage all project expenses</CardDescription>
            </div>
            <Button onClick={() => setShowAddExpense(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.slice(0, 10).map((expense, index) => {
              const project = projects.find(p => p.id === expense.projectId);
              const categoryConfig = expenseCategories.find(c => c.name === expense.category);
              const Icon = categoryConfig?.icon || Receipt;
              
              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", categoryConfig?.color || 'bg-gray-500')}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{project?.name || 'General'}</span>
                        <span>•</span>
                        <span>{expense.date ? format(new Date(expense.date), 'dd MMM yyyy') : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">RM {expense.amount.toLocaleString()}</p>
                    <Badge variant="outline" className="text-xs">
                      {expense.status || 'Approved'}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Budget Planning Component
const BudgetPlanning = () => {
  const { projects } = useProjectStore();
  const { budgets = [], createBudget, updateBudget } = useFinancialStore();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [budgetAllocation, setBudgetAllocation] = useState({
    design: 20,
    materials: 35,
    labor: 25,
    equipment: 10,
    contingency: 10
  });

  const totalPercentage = Object.values(budgetAllocation).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6">
      {/* Budget Allocation Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Allocation Planner</CardTitle>
          <CardDescription>
            Plan and allocate budgets for your projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Total Budget:</span>
              <Input
                type="number"
                placeholder="0"
                className="w-32"
                defaultValue={selectedProject ? projects.find(p => p.id === selectedProject)?.budget : 0}
              />
            </div>
          </div>

          {selectedProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(budgetAllocation).map(([category, percentage]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e) => setBudgetAllocation({
                          ...budgetAllocation,
                          [category]: parseInt(e.target.value)
                        })}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={percentage}
                        onChange={(e) => setBudgetAllocation({
                          ...budgetAllocation,
                          [category]: parseInt(e.target.value) || 0
                        })}
                        className="w-16"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Allocation Visualization */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Allocation</span>
                  <Badge variant={totalPercentage === 100 ? "success" : "warning"}>
                    {totalPercentage}%
                  </Badge>
                </div>
                <div className="flex h-8 rounded-lg overflow-hidden">
                  <div className="bg-blue-500" style={{ width: `${budgetAllocation.design}%` }} />
                  <div className="bg-green-500" style={{ width: `${budgetAllocation.materials}%` }} />
                  <div className="bg-orange-500" style={{ width: `${budgetAllocation.labor}%` }} />
                  <div className="bg-purple-500" style={{ width: `${budgetAllocation.equipment}%` }} />
                  <div className="bg-gray-500" style={{ width: `${budgetAllocation.contingency}%` }} />
                </div>
                <div className="flex justify-between mt-2">
                  <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      <span>Design</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span>Materials</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-500 rounded" />
                      <span>Labor</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-500 rounded" />
                      <span>Equipment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-500 rounded" />
                      <span>Contingency</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Save as Template</Button>
                <Button>Apply Budget</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget vs Actual Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual Analysis</CardTitle>
          <CardDescription>Compare planned budgets with actual spending</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={projects.slice(0, 5).map(project => ({
                name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
                budget: project.budget || 0,
                actual: project.actualCost || 0,
                variance: (project.budget || 0) - (project.actualCost || 0)
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="budget" fill="#3b82f6" />
              <Bar dataKey="actual" fill="#10b981" />
              <Bar dataKey="variance" fill={props => props.payload.variance >= 0 ? "#22c55e" : "#ef4444"} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Financial Page Component
export default function Financial() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useAuthStore();

  const canCreateFinancial = user?.role === 'project_lead' || user?.role === 'staff' || user?.role === 'admin';

  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9 bg-transparent border-0 p-0">
          <TabsTrigger 
            value="dashboard" 
            className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('financial.dashboard')}
          </TabsTrigger>
          <TabsTrigger 
            value="invoices" 
            className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
          >
            <FileText className="h-4 w-4 mr-2" />
            {t('financial.invoices')}
          </TabsTrigger>
          <TabsTrigger 
            value="expenses" 
            className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
          >
            <Receipt className="h-4 w-4 mr-2" />
            {t('financial.expenses')}
          </TabsTrigger>
          <TabsTrigger 
            value="budgets" 
            className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {t('financial.budgets')}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.refresh')}
        </Button>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          {t('common.settings')}
        </Button>
      </div>
    </div>
  );

  return (
    <Layout contextualInfo={false} toolbar={toolbar}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && <FinancialDashboard />}
          {activeTab === 'invoices' && <InvoiceManagement />}
          {activeTab === 'expenses' && <ExpenseTracking />}
          {activeTab === 'budgets' && <BudgetPlanning />}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}