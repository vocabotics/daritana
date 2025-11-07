import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save } from 'lucide-react';
import { projectService } from '@/services/project.service';
import { clientService } from '@/services/client.service';
import { itemLibraryService } from '@/services/itemLibrary.service';
import { quotationService } from '@/services/quotation.service';

interface QuotationFormData {
  projectId: string;
  clientId: string;
  title: string;
  description: string;
  validUntil: string;
  items: QuotationItem[];
  terms: string;
  notes: string;
}

interface QuotationItem {
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Project {
  id: string;
  name: string;
  projectCode: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface ItemLibraryItem {
  id: string;
  item_code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  base_price: number;
  sst_rate: number;
  is_active: boolean;
}

const QuotationForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [itemLibrary, setItemLibrary] = useState<ItemLibraryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<QuotationFormData>({
    defaultValues: {
      items: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, total: 0 }],
      terms: 'Standard terms and conditions apply',
      notes: ''
    }
  });

  const watchItems = watch('items');
  const watchDiscountPercentage = watch('discountPercentage');
  const watchDiscountAmount = watch('discountAmount');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [watchItems, watchDiscountPercentage, watchDiscountAmount]);

  const fetchInitialData = async () => {
    try {
      setIsLoadingData(true);
      
      // Fetch real data from backend services
      const [projectsData, clientsData, itemsData] = await Promise.all([
        projectService.getAllProjects(),
        clientService.getAllClients(),
        itemLibraryService.getAllItems()
      ]);

      setProjects(projectsData || []);
      setClients(clientsData || []);
      setItemLibrary(itemsData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch required data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = watchItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const discountAmount = (watchDiscountPercentage || 0) * subtotal / 100;
    const total = subtotal - discountAmount;
    
    setValue('subtotal', subtotal);
    setValue('total', total);
  };

  const addItem = () => {
    const currentItems = watch('items');
    setValue('items', [...currentItems, { itemId: '', description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    const currentItems = watch('items');
    if (currentItems.length > 1) {
      setValue('items', currentItems.filter((_, i) => i !== index));
    }
  };

  const updateItemTotal = (index: number) => {
    const items = watch('items');
    const item = items[index];
    if (item.quantity && item.unitPrice) {
      const total = item.quantity * item.unitPrice;
      setValue(`items.${index}.total`, total);
    }
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    setValue(`items.${index}.${field}`, value);
    if (field === 'quantity' || field === 'unitPrice') {
      updateItemTotal(index);
    }
  };

  const onSubmit = async (data: QuotationFormData) => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!data.projectId || !data.clientId || !data.title) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (data.items.length === 0 || data.items.some(item => !item.description || !item.quantity || !item.unitPrice)) {
        toast.error('Please add at least one item with complete details');
        return;
      }

      // Submit quotation via service
      const response = await quotationService.createQuotation(data);
      
      toast.success('Quotation created successfully!');
      navigate('/quotations');
    } catch (error) {
      console.error('Failed to create quotation:', error);
      toast.error('Failed to create quotation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quotation form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create New Quotation</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate('/quotations')}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectId">Project *</Label>
              <Select onValueChange={(value) => setValue('projectId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.projectCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="text-red-500 text-sm mt-1">Project is required</p>}
            </div>

            <div>
              <Label htmlFor="clientId">Client *</Label>
              <Select onValueChange={(value) => setValue('clientId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-red-500 text-sm mt-1">Client is required</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="title">Quotation Title *</Label>
              <Input
                {...register('title', { required: 'Title is required' })}
                placeholder="Enter quotation title"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                {...register('description')}
                placeholder="Enter quotation description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="validUntil">Valid Until *</Label>
              <Input
                {...register('validUntil', { required: 'Valid until date is required' })}
                type="date"
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.validUntil && <p className="text-red-500 text-sm mt-1">{errors.validUntil.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {watchItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end border p-4 rounded-lg">
                <div className="col-span-3">
                  <Label>Item</Label>
                  <Select onValueChange={(value) => {
                    const selectedItem = itemLibrary.find(i => i.id === value);
                    if (selectedItem) {
                      setValue(`items.${index}.itemId`, value);
                      setValue(`items.${index}.description`, selectedItem.name);
                      setValue(`items.${index}.unitPrice`, selectedItem.base_price);
                      updateItemTotal(index);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemLibrary.map((libItem) => (
                        <SelectItem key={libItem.id} value={libItem.id}>
                          {libItem.name} - RM{libItem.base_price}/{libItem.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-4">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Item description"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Unit Price (RM)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                  />
                </div>

                <div className="col-span-1">
                  <Label>Total (RM)</Label>
                  <Input
                    value={item.total || 0}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="col-span-1"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addItem} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>

        {/* Terms and Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="terms">Terms and Conditions</Label>
              <Textarea
                {...register('terms')}
                placeholder="Enter terms and conditions"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                {...register('notes')}
                placeholder="Enter additional notes"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Quotation'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;