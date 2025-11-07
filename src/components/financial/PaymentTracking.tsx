import { useState } from 'react';
import { useFinancialStore, Payment } from '@/store/financialStore';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus,
  Search,
  Filter,
  CreditCard,
  DollarSign,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface PaymentFormData {
  invoiceId: string;
  amount: number;
  date: string;
  method: 'bank_transfer' | 'fpx' | 'credit_card' | 'cash' | 'cheque';
  reference: string;
  notes?: string;
}

export default function PaymentTracking() {
  const { payments, invoices, addPayment } = useFinancialStore();
  const { projects } = useProjectStore();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [invoiceFilter, setInvoiceFilter] = useState<string>('all');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormData>();

  const filteredPayments = payments.filter(payment => {
    const invoice = invoices.find(inv => inv.id === payment.invoiceId);
    const matchesSearch = 
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (invoice?.invoiceNumber.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    const matchesInvoice = invoiceFilter === 'all' || payment.invoiceId === invoiceFilter;
    
    return matchesSearch && matchesMethod && matchesInvoice;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      bank_transfer: { variant: 'default' as const, label: 'Bank Transfer' },
      fpx: { variant: 'secondary' as const, label: 'FPX' },
      credit_card: { variant: 'outline' as const, label: 'Credit Card' },
      cash: { variant: 'success' as const, label: 'Cash' },
      cheque: { variant: 'warning' as const, label: 'Cheque' }
    };
    
    const config = methodConfig[method as keyof typeof methodConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const onSubmit = (data: PaymentFormData) => {
    const newPayment: Payment = {
      id: `payment-${Date.now()}`,
      invoiceId: data.invoiceId,
      amount: data.amount,
      date: new Date(data.date),
      method: data.method,
      reference: data.reference,
      notes: data.notes,
      createdBy: 'current-user', // In a real app, this would be from auth context
      createdAt: new Date()
    };

    addPayment(newPayment);
    toast.success('Payment recorded successfully');
    setShowPaymentForm(false);
    reset();
  };

  const getInvoiceNumber = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    return invoice?.invoiceNumber || 'Unknown Invoice';
  };

  const getProjectName = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return 'Unknown Project';
    const project = projects.find(p => p.id === invoice.projectId);
    return project?.name || 'Unknown Project';
  };

  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 min-w-[300px]"
            />
          </div>
          
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="fpx">FPX</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by invoice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Invoices</SelectItem>
              {invoices.map(invoice => (
                <SelectItem key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setShowPaymentForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {getInvoiceNumber(payment.invoiceId)}
                    </div>
                  </TableCell>
                  <TableCell>{getProjectName(payment.invoiceId)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{getMethodBadge(payment.method)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {payment.reference}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {payment.notes || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
            <DialogDescription>
              Record a payment received for an invoice.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoiceId" className="text-right">
                Invoice
              </Label>
              <Select>
                <SelectTrigger className="col-span-3" {...register('invoiceId', { required: true })}>
                  <SelectValue placeholder="Select an invoice" />
                </SelectTrigger>
                <SelectContent>
                  {unpaidInvoices.map(invoice => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {formatCurrency(invoice.amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="col-span-3"
                {...register('amount', { required: true, min: 0.01 })}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Payment Date
              </Label>
              <Input
                id="date"
                type="date"
                className="col-span-3"
                {...register('date', { required: true })}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="method" className="text-right">
                Method
              </Label>
              <Select>
                <SelectTrigger className="col-span-3" {...register('method', { required: true })}>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="fpx">FPX</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reference" className="text-right">
                Reference
              </Label>
              <Input
                id="reference"
                placeholder="Transaction reference"
                className="col-span-3"
                {...register('reference', { required: true })}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Optional notes"
                className="col-span-3"
                {...register('notes')}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}