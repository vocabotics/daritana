import { useState } from 'react';
import { useFinancialStore } from '@/store/financialStore';
import { Project, Invoice, InvoiceItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceFormProps {
  onClose: () => void;
  projects: Project[];
  invoice?: Invoice;
}

interface InvoiceFormData {
  projectId: string;
  contractorId: string;
  quotationId?: string;
  amount: number;
  currency: string;
  dueDate: string;
  items: InvoiceItem[];
}

export default function InvoiceForm({ onClose, projects, invoice }: InvoiceFormProps) {
  const { addInvoice, updateInvoice, quotations } = useFinancialStore();
  const [formData, setFormData] = useState<InvoiceFormData>({
    projectId: invoice?.projectId || '',
    contractorId: invoice?.contractorId || '',
    quotationId: invoice?.quotationId,
    amount: invoice?.amount || 0,
    currency: invoice?.currency || 'MYR',
    dueDate: invoice ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
    items: invoice?.items || [
      {
        id: '1',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
    ]
  });

  const availableQuotations = quotations.filter(q => 
    q.projectId === formData.projectId && q.status === 'approved'
  );

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
    calculateTotal();
  };

  const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      });
      
      const total = updatedItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items: updatedItems,
        amount: total
      };
    });
  };

  const calculateTotal = () => {
    const total = formData.items.reduce((sum, item) => sum + item.total, 0);
    setFormData(prev => ({ ...prev, amount: total }));
  };

  const handleQuotationSelect = (quotationId: string) => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (quotation) {
      setFormData(prev => ({
        ...prev,
        quotationId,
        contractorId: quotation.contractorId,
        amount: quotation.amount,
        items: quotation.items.map(item => ({
          ...item,
          id: `inv-${item.id}`
        }))
      }));
    }
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = Math.floor(Math.random() * 1000) + 1;
    return `INV-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.contractorId || formData.items.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const invoiceData: Invoice = {
      id: invoice?.id || `invoice-${Date.now()}`,
      projectId: formData.projectId,
      contractorId: formData.contractorId,
      quotationId: formData.quotationId,
      invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
      amount: formData.amount,
      currency: formData.currency,
      dueDate: new Date(formData.dueDate),
      status: invoice?.status || 'draft',
      items: formData.items,
      attachments: invoice?.attachments || [],
      createdAt: invoice?.createdAt || new Date()
    };

    if (invoice) {
      updateInvoice(invoice.id, invoiceData);
      toast.success('Invoice updated successfully');
    } else {
      addInvoice(invoiceData);
      toast.success('Invoice created successfully');
    }

    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
          <DialogDescription>
            {invoice ? 'Update the invoice details below.' : 'Fill in the details to create a new invoice.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project *</Label>
              <Select 
                value={formData.projectId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="quotationId">Link to Quotation (Optional)</Label>
              <Select 
                value={formData.quotationId || ''} 
                onValueChange={handleQuotationSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select approved quotation" />
                </SelectTrigger>
                <SelectContent>
                  {availableQuotations.map(quotation => (
                    <SelectItem key={quotation.id} value={quotation.id}>
                      {quotation.title} - {formatCurrency(quotation.amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractorId">Contractor ID *</Label>
              <Input
                id="contractorId"
                value={formData.contractorId}
                onChange={(e) => setFormData(prev => ({ ...prev, contractorId: e.target.value }))}
                placeholder="Enter contractor ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoice Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Description</TableHead>
                    <TableHead className="w-[15%]">Quantity</TableHead>
                    <TableHead className="w-[20%]">Unit Price</TableHead>
                    <TableHead className="w-[20%]">Total</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Textarea
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                          className="min-h-[60px]"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(item.total)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-lg font-bold">
                  <Calculator className="h-5 w-5" />
                  Total: {formatCurrency(formData.amount)}
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}