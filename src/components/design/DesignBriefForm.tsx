import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ExternalLink, Image } from 'lucide-react';

const designBriefSchema = z.object({
  requirements: z.string().min(50, 'Requirements must be at least 50 characters'),
  budget: z.number().min(1000, 'Budget must be at least RM 1,000'),
  pinterestBoard: z.string().url('Please enter a valid Pinterest URL').optional().or(z.literal('')),
});

type DesignBriefFormData = z.infer<typeof designBriefSchema>;

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  budget: number;
  description: string;
  image?: string;
}

interface Room {
  id: string;
  name: string;
  dimensions: string;
  requirements: string;
}

const furnitureCategories = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Dining Room',
  'Bathroom',
  'Office',
  'Storage',
  'Lighting',
  'Decor'
];

export function DesignBriefForm() {
  const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newFurnitureItem, setNewFurnitureItem] = useState({
    name: '',
    category: '',
    budget: 0,
    description: ''
  });
  const [newRoom, setNewRoom] = useState({
    name: '',
    dimensions: '',
    requirements: ''
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<DesignBriefFormData>({
    resolver: zodResolver(designBriefSchema),
  });
  
  const onSubmit = (data: DesignBriefFormData) => {
    console.log('Design Brief Submitted:', {
      ...data,
      furnitureItems,
      rooms,
      totalFurnitureBudget: furnitureItems.reduce((sum, item) => sum + item.budget, 0)
    });
    
    // Here you would typically send the data to your backend
    alert('Design brief submitted successfully! Our designers will review it and create your personalized design plan.');
  };
  
  const addFurnitureItem = () => {
    if (newFurnitureItem.name && newFurnitureItem.category) {
      setFurnitureItems([...furnitureItems, {
        id: Date.now().toString(),
        ...newFurnitureItem
      }]);
      setNewFurnitureItem({ name: '', category: '', budget: 0, description: '' });
    }
  };
  
  const removeFurnitureItem = (id: string) => {
    setFurnitureItems(furnitureItems.filter(item => item.id !== id));
  };
  
  const addRoom = () => {
    if (newRoom.name && newRoom.dimensions) {
      setRooms([...rooms, {
        id: Date.now().toString(),
        ...newRoom
      }]);
      setNewRoom({ name: '', dimensions: '', requirements: '' });
    }
  };
  
  const removeRoom = (id: string) => {
    setRooms(rooms.filter(room => room.id !== id));
  };
  
  const totalFurnitureBudget = furnitureItems.reduce((sum, item) => sum + item.budget, 0);
  
  return (
    <div className="space-y-6">
      <Card className="architect-border">
        <CardHeader>
          <CardTitle className="architect-heading">Design Brief</CardTitle>
          <p className="text-sm text-gray-600">
            Tell us about your vision, preferences, and requirements. This information will help our designers create a personalized design plan for your space.
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Requirements */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="requirements">Design Requirements & Vision</Label>
                <Textarea
                  id="requirements"
                  placeholder="Describe your vision for the space, preferred colors, style preferences, functional requirements, and any specific needs..."
                  className="min-h-32 architect-border"
                  {...register('requirements')}
                />
                {errors.requirements && (
                  <p className="text-sm text-red-600">{errors.requirements.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="budget">Total Budget (RM)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="150000"
                  className="architect-border"
                  {...register('budget', { valueAsNumber: true })}
                />
                {errors.budget && (
                  <p className="text-sm text-red-600">{errors.budget.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="pinterestBoard">Pinterest Board (Optional)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="pinterestBoard"
                    type="url"
                    placeholder="https://pinterest.com/yourboard"
                    className="architect-border"
                    {...register('pinterestBoard')}
                  />
                  <Button type="button" variant="outline" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                {errors.pinterestBoard && (
                  <p className="text-sm text-red-600">{errors.pinterestBoard.message}</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Rooms */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium architect-heading">Rooms to be Designed</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                <Input
                  placeholder="Room name (e.g., Living Room)"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  className="architect-border"
                />
                <Input
                  placeholder="Dimensions (e.g., 4m x 5m)"
                  value={newRoom.dimensions}
                  onChange={(e) => setNewRoom({ ...newRoom, dimensions: e.target.value })}
                  className="architect-border"
                />
                <div className="flex space-x-2">
                  <Input
                    placeholder="Special requirements"
                    value={newRoom.requirements}
                    onChange={(e) => setNewRoom({ ...newRoom, requirements: e.target.value })}
                    className="architect-border"
                  />
                  <Button type="button" onClick={addRoom} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {rooms.length > 0 && (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <span className="font-medium">{room.name}</span>
                        <span className="text-gray-500 ml-2">({room.dimensions})</span>
                        {room.requirements && (
                          <p className="text-sm text-gray-600">{room.requirements}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRoom(room.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Furniture List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium architect-heading">Furniture Wishlist</h3>
                {totalFurnitureBudget > 0 && (
                  <Badge variant="outline">
                    Total: RM {totalFurnitureBudget.toLocaleString()}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                <Input
                  placeholder="Item name"
                  value={newFurnitureItem.name}
                  onChange={(e) => setNewFurnitureItem({ ...newFurnitureItem, name: e.target.value })}
                  className="architect-border"
                />
                <Select
                  value={newFurnitureItem.category}
                  onValueChange={(value) => setNewFurnitureItem({ ...newFurnitureItem, category: value })}
                >
                  <SelectTrigger className="architect-border">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {furnitureCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Budget (RM)"
                  value={newFurnitureItem.budget || ''}
                  onChange={(e) => setNewFurnitureItem({ ...newFurnitureItem, budget: Number(e.target.value) })}
                  className="architect-border"
                />
                <div className="flex space-x-2">
                  <Input
                    placeholder="Description"
                    value={newFurnitureItem.description}
                    onChange={(e) => setNewFurnitureItem({ ...newFurnitureItem, description: e.target.value })}
                    className="architect-border"
                  />
                  <Button type="button" onClick={addFurnitureItem} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {furnitureItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {furnitureItems.map((item) => (
                    <Card key={item.id} className="architect-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <Badge variant="outline" className="text-xs mt-1">
                              {item.category}
                            </Badge>
                            <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                            <p className="text-sm font-medium mt-2">RM {item.budget.toLocaleString()}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFurnitureItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
              <Button type="submit" className="bg-black hover:bg-gray-800">
                Submit Design Brief
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}