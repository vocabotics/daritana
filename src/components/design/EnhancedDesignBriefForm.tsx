import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Image,
  MapPin,
  Home,
  Users,
  Calendar,
  DollarSign,
  Sparkles,
  Package,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Save,
  Send
} from 'lucide-react';
import { CulturalDesignSelector } from './CulturalDesignSelector';
import { LocalMaterialsSelector } from './LocalMaterialsSelector';
import { ClimateDesignModule } from './ClimateDesignModule';
import { MaterialPreferencesSelector } from './MaterialPreferencesSelector';
import { BudgetCalculator } from './BudgetCalculator';
import { 
  DesignBrief, 
  FurnitureItem, 
  Room, 
  CulturalPreferences, 
  ClimateDesignFeatures,
  LocalMaterial,
  ArtisanInfo
} from '@/types';

const designBriefSchema = z.object({
  requirements: z.string().min(50, 'Requirements must be at least 50 characters'),
  budget: z.number().min(1000, 'Budget must be at least RM 1,000'),
  pinterestBoard: z.string().url('Please enter a valid Pinterest URL').optional().or(z.literal('')),
  projectType: z.string(),
  projectLocation: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string()
  })
});

type DesignBriefFormData = z.infer<typeof designBriefSchema>;

// Malaysian states for location selection
const malaysianStates = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 
  'Pahang', 'Penang', 'Perak', 'Perlis', 'Selangor', 
  'Terengganu', 'Sabah', 'Sarawak', 'Kuala Lumpur', 'Putrajaya', 'Labuan'
];

// Project types common in Malaysia
const projectTypes = [
  { value: 'terrace_house', label: 'Terrace House' },
  { value: 'semi_detached', label: 'Semi-Detached House' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'condominium', label: 'Condominium' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'shophouse', label: 'Shophouse' },
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail Space' },
  { value: 'restaurant', label: 'Restaurant/Cafe' },
  { value: 'hotel', label: 'Hotel/Hospitality' }
];

// Room types with Malaysian context
const roomTypes = [
  // Common areas
  { value: 'living_room', label: 'Living Room', icon: '🛋️' },
  { value: 'dining_room', label: 'Dining Room', icon: '🍽️' },
  { value: 'dry_kitchen', label: 'Dry Kitchen', icon: '🍳' },
  { value: 'wet_kitchen', label: 'Wet Kitchen', icon: '🥘' },
  
  // Bedrooms
  { value: 'master_bedroom', label: 'Master Bedroom', icon: '🛏️' },
  { value: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { value: 'guest_room', label: 'Guest Room', icon: '🏨' },
  
  // Cultural/Religious
  { value: 'prayer_room', label: 'Prayer Room/Surau', icon: '🕌' },
  { value: 'altar_room', label: 'Altar Room', icon: '🏛️' },
  { value: 'pooja_room', label: 'Pooja Room', icon: '🕉️' },
  
  // Entertainment
  { value: 'family_hall', label: 'Family Hall', icon: '👨‍👩‍👧‍👦' },
  { value: 'entertainment_room', label: 'Entertainment Room', icon: '🎬' },
  { value: 'study_room', label: 'Study/Home Office', icon: '📚' },
  
  // Outdoor
  { value: 'car_porch', label: 'Car Porch', icon: '🚗' },
  { value: 'garden', label: 'Garden', icon: '🌳' },
  { value: 'balcony', label: 'Balcony/Terrace', icon: '🌅' },
  
  // Utility
  { value: 'store_room', label: 'Store Room', icon: '📦' },
  { value: 'maid_room', label: "Maid's Room", icon: '🏠' },
  { value: 'laundry_area', label: 'Laundry/Yard', icon: '🧺' }
];

export function EnhancedDesignBriefForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [culturalPreferences, setCulturalPreferences] = useState<CulturalPreferences | null>(null);
  const [climateFeatures, setClimateFeatures] = useState<ClimateDesignFeatures | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<LocalMaterial[]>([]);
  const [selectedArtisans, setSelectedArtisans] = useState<ArtisanInfo[]>([]);
  const [formProgress, setFormProgress] = useState(20);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues
  } = useForm<DesignBriefFormData>({
    resolver: zodResolver(designBriefSchema),
    defaultValues: {
      projectType: '',
      projectLocation: {
        address: '',
        city: '',
        state: '',
        postcode: ''
      }
    }
  });

  const watchProjectType = watch('projectType');
  const watchBudget = watch('budget');

  const totalSteps = 7;
  
  const updateProgress = (step: number) => {
    setFormProgress((step / totalSteps) * 100);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      updateProgress(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      updateProgress(currentStep - 1);
    }
  };

  const onSubmit = (data: DesignBriefFormData) => {
    const fullBrief = {
      ...data,
      furnitureItems,
      rooms,
      culturalPreferences,
      climateFeatures,
      selectedMaterials,
      selectedArtisans,
      totalFurnitureBudget: furnitureItems.reduce((sum, item) => sum + item.budget, 0),
      submittedAt: new Date(),
      status: 'submitted'
    };
    
    console.log('Enhanced Design Brief Submitted:', fullBrief);
    
    // Show success message
    alert('Design brief submitted successfully! Our team will review your requirements and create a culturally-tailored design proposal.');
  };

  const addRoom = (roomType: string) => {
    const roomTemplate = roomTypes.find(r => r.value === roomType);
    if (roomTemplate) {
      const newRoom: Room = {
        id: Date.now().toString(),
        name: roomTemplate.label,
        dimensions: '',
        requirements: '',
        images: [],
        culturalFunction: roomType.includes('prayer') || roomType.includes('altar') || roomType.includes('pooja') 
          ? roomType as any 
          : 'standard'
      };
      setRooms([...rooms, newRoom]);
    }
  };

  const removeRoom = (id: string) => {
    setRooms(rooms.filter(room => room.id !== id));
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(rooms.map(room => 
      room.id === id ? { ...room, ...updates } : room
    ));
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Project Info' },
      { num: 2, label: 'Cultural Design' },
      { num: 3, label: 'Spaces & Rooms' },
      { num: 4, label: 'Materials & Artisans' },
      { num: 5, label: 'Review & Submit' }
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                ${currentStep >= step.num 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-400 border-gray-300'}`}
              >
                {currentStep > step.num ? <CheckCircle className="h-5 w-5" /> : step.num}
              </div>
              <div className="ml-2">
                <p className={`text-sm ${currentStep >= step.num ? 'text-black font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 mx-4 h-0.5 ${currentStep > step.num ? 'bg-black' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={formProgress} className="h-2" />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {renderStepIndicator()}

      <Card className="architect-border">
        <CardHeader>
          <CardTitle className="architect-heading flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Culturally-Intelligent Design Brief
          </CardTitle>
          <CardDescription>
            Create a design that celebrates Malaysian heritage while embracing modern living
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Project Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4">Project Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="projectType">Project Type</Label>
                    <Select 
                      value={watchProjectType}
                      onValueChange={(value) => setValue('projectType', value)}
                    >
                      <SelectTrigger className="architect-border">
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="budget">Total Budget (RM)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="500000"
                      className="architect-border"
                      {...register('budget', { valueAsNumber: true })}
                    />
                    {errors.budget && (
                      <p className="text-sm text-red-600 mt-1">{errors.budget.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Project Location</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder="123, Jalan Merdeka"
                        className="architect-border"
                        {...register('projectLocation.address')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Kuala Lumpur"
                        className="architect-border"
                        {...register('projectLocation.city')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Select
                        onValueChange={(value) => setValue('projectLocation.state', value)}
                      >
                        <SelectTrigger className="architect-border">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {malaysianStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        placeholder="50450"
                        className="architect-border"
                        {...register('projectLocation.postcode')}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="requirements">Design Vision & Requirements</Label>
                  <Textarea
                    id="requirements"
                    placeholder="Describe your vision for the space, lifestyle needs, and any specific requirements..."
                    className="min-h-32 architect-border"
                    {...register('requirements')}
                  />
                  {errors.requirements && (
                    <p className="text-sm text-red-600 mt-1">{errors.requirements.message}</p>
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
                    <p className="text-sm text-red-600 mt-1">{errors.pinterestBoard.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Cultural Design Preferences */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4">Cultural Design Preferences</h3>
                <CulturalDesignSelector
                  onPreferencesChange={setCulturalPreferences}
                  onClimateChange={setClimateFeatures}
                />
              </div>
            )}

            {/* Step 3: Spaces & Rooms */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4">Spaces & Rooms</h3>
                
                <div>
                  <Label>Select Rooms to Include</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                    {roomTypes.map((roomType) => {
                      const isAdded = rooms.some(r => r.name === roomType.label);
                      return (
                        <Button
                          key={roomType.value}
                          type="button"
                          variant={isAdded ? "default" : "outline"}
                          className="justify-start"
                          onClick={() => !isAdded && addRoom(roomType.value)}
                          disabled={isAdded}
                        >
                          <span className="mr-2">{roomType.icon}</span>
                          {roomType.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {rooms.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Room Details</h4>
                    {rooms.map((room) => (
                      <Card key={room.id} className="architect-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h5 className="font-medium">{room.name}</h5>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRoom(room.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Dimensions</Label>
                              <Input
                                placeholder="e.g., 4m x 5m"
                                value={room.dimensions}
                                onChange={(e) => updateRoom(room.id, { dimensions: e.target.value })}
                                className="architect-border"
                              />
                            </div>
                            
                            {room.culturalFunction && room.culturalFunction !== 'standard' && (
                              <div>
                                <Label>Orientation</Label>
                                <Select
                                  value={room.orientation}
                                  onValueChange={(value) => updateRoom(room.id, { orientation: value as any })}
                                >
                                  <SelectTrigger className="architect-border">
                                    <SelectValue placeholder="Select orientation" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="north">North</SelectItem>
                                    <SelectItem value="south">South</SelectItem>
                                    <SelectItem value="east">East</SelectItem>
                                    <SelectItem value="west">West</SelectItem>
                                    <SelectItem value="northeast">Northeast (Qibla)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            <div className="md:col-span-2">
                              <Label>Special Requirements</Label>
                              <Textarea
                                placeholder="Any specific requirements for this room..."
                                value={room.requirements}
                                onChange={(e) => updateRoom(room.id, { requirements: e.target.value })}
                                className="architect-border"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Climate Design Strategy */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4">Climate Design Strategy</h3>
                <ClimateDesignModule
                  projectLocation={{
                    state: watch('projectLocation.state') || '',
                    city: watch('projectLocation.city') || ''
                  }}
                  onClimateChange={setClimateFeatures}
                />
              </div>
            )}

            {/* Step 5: Material Preferences */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4">Material Selection & Preferences</h3>
                <MaterialPreferencesSelector
                  budget={watchBudget || 0}
                  culturalPreferences={culturalPreferences}
                  climateZone="tropical"
                  onPreferencesChange={(prefs) => {
                    console.log('Material preferences updated:', prefs);
                  }}
                />
              </div>
            )}

            {/* Step 6: Budget Analysis */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4">Budget Analysis & Timeline</h3>
                <BudgetCalculator
                  projectType={watchProjectType || 'condominium'}
                  totalBudget={watchBudget || 0}
                  floorArea={2000}
                  roomCount={rooms.length}
                  culturalComplexity={culturalPreferences?.primaryCulture ? 'moderate' : 'basic'}
                  sustainabilityLevel={7}
                  onBudgetBreakdown={(breakdown) => {
                    console.log('Budget breakdown:', breakdown);
                  }}
                />
              </div>
            )}
            
            {/* Step 7: Review & Submit */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4">Review Your Design Brief</h3>
                
                <div className="space-y-4">
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-base">Project Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project Type:</span>
                        <span className="font-medium">
                          {projectTypes.find(t => t.value === watchProjectType)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">
                          {getValues('projectLocation.city')}, {getValues('projectLocation.state')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">RM {watchBudget?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rooms:</span>
                        <span className="font-medium">{rooms.length} spaces</span>
                      </div>
                    </CardContent>
                  </Card>

                  {culturalPreferences && (
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-base">Cultural Preferences</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Primary Culture:</span>
                            <Badge>{culturalPreferences.primaryCulture}</Badge>
                          </div>
                          {culturalPreferences.religiousConsiderations && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Religious Considerations:</span>
                              <Badge variant="outline">{culturalPreferences.religiousConsiderations}</Badge>
                            </div>
                          )}
                          {culturalPreferences.entertainmentStyle && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Entertainment Style:</span>
                              <Badge variant="outline">{culturalPreferences.entertainmentStyle}</Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedMaterials.length > 0 && (
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-base">Selected Materials</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedMaterials.map((material, idx) => (
                            <Badge key={idx} variant="secondary">
                              {material.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedArtisans.length > 0 && (
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-base">Selected Artisans</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedArtisans.map((artisan, idx) => (
                            <Badge key={idx} variant="secondary">
                              {artisan.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Ready to submit!</strong> Our design team will review your culturally-tailored brief and create a personalized proposal within 3-5 business days.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Save as draft logic
                    alert('Draft saved successfully!');
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" className="bg-black hover:bg-gray-800">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Design Brief
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}