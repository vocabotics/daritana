import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Package,
  Leaf,
  DollarSign,
  Star,
  Truck,
  Shield,
  Palette,
  Home,
  TreePine,
  Waves,
  Mountain,
  Zap,
  RecycleIcon,
  Award,
  MapPin,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Heart,
  X
} from 'lucide-react';

interface MaterialPreference {
  category: string;
  selected_materials: string[];
  budget_allocation: number;
  sustainability_priority: 'low' | 'medium' | 'high';
  local_preference: boolean;
  performance_requirements: string[];
}

interface MaterialPreferencesSelectorProps {
  budget: number;
  culturalPreferences?: {
    primary_culture: string;
    traditional_materials?: string[];
  };
  climateZone: string;
  onPreferencesChange: (preferences: {
    preferred_materials: string[];
    avoid_materials: string[];
    sustainability_priority: 'low' | 'medium' | 'high';
    local_materials_preferred: boolean;
    budget_allocation: Record<string, number>;
    material_categories: MaterialPreference[];
  }) => void;
}

// Malaysian material database
const materialDatabase = {
  timber: {
    local: [
      {
        name: 'Chengal',
        description: 'Premium Malaysian hardwood, naturally termite resistant',
        sustainability: 4,
        cost: 4,
        durability: 5,
        cultural: ['malay', 'traditional'],
        climate: ['humid', 'tropical'],
        applications: ['flooring', 'structure', 'decking'],
        origin: 'Peninsular Malaysia',
        lead_time: 14,
        maintenance: 'Low'
      },
      {
        name: 'Meranti',
        description: 'Versatile Malaysian timber, good for indoor applications',
        sustainability: 4,
        cost: 3,
        durability: 3,
        cultural: ['malay', 'contemporary'],
        climate: ['humid', 'tropical'],
        applications: ['doors', 'windows', 'paneling'],
        origin: 'Sarawak, Sabah',
        lead_time: 10,
        maintenance: 'Medium'
      },
      {
        name: 'Kapur',
        description: 'Strong construction timber with good weather resistance',
        sustainability: 3,
        cost: 3,
        durability: 4,
        cultural: ['traditional'],
        climate: ['humid', 'coastal'],
        applications: ['structure', 'outdoor'],
        origin: 'East Malaysia',
        lead_time: 21,
        maintenance: 'Low'
      }
    ],
    engineered: [
      {
        name: 'Bamboo Composite',
        description: 'Sustainable engineered bamboo panels',
        sustainability: 5,
        cost: 3,
        durability: 4,
        cultural: ['contemporary', 'eco'],
        climate: ['humid', 'tropical'],
        applications: ['flooring', 'paneling', 'furniture'],
        origin: 'Local manufacturing',
        lead_time: 7,
        maintenance: 'Medium'
      },
      {
        name: 'Cross-Laminated Timber (CLT)',
        description: 'Sustainable engineered structural panels',
        sustainability: 4,
        cost: 4,
        durability: 4,
        cultural: ['contemporary'],
        climate: ['variable'],
        applications: ['structure', 'walls', 'floors'],
        origin: 'Imported/Local assembly',
        lead_time: 30,
        maintenance: 'Low'
      }
    ]
  },
  stone: {
    local: [
      {
        name: 'Malaysian Granite',
        description: 'Locally quarried granite in various colors',
        sustainability: 3,
        cost: 3,
        durability: 5,
        cultural: ['chinese', 'contemporary'],
        climate: ['all'],
        applications: ['flooring', 'countertops', 'cladding'],
        origin: 'Perak, Johor',
        lead_time: 14,
        maintenance: 'Low'
      },
      {
        name: 'Batu Belah',
        description: 'Traditional Malaysian split stone',
        sustainability: 4,
        cost: 2,
        durability: 4,
        cultural: ['malay', 'traditional'],
        climate: ['tropical', 'humid'],
        applications: ['walls', 'landscaping', 'features'],
        origin: 'Various states',
        lead_time: 7,
        maintenance: 'Low'
      }
    ],
    imported: [
      {
        name: 'Travertine',
        description: 'Natural limestone with unique patterns',
        sustainability: 2,
        cost: 4,
        durability: 3,
        cultural: ['contemporary', 'luxury'],
        climate: ['dry', 'indoor'],
        applications: ['flooring', 'walls', 'features'],
        origin: 'Turkey, Italy',
        lead_time: 45,
        maintenance: 'High'
      }
    ]
  },
  ceramics: {
    local: [
      {
        name: 'Peranakan Tiles',
        description: 'Traditional colorful cement tiles',
        sustainability: 3,
        cost: 4,
        durability: 4,
        cultural: ['peranakan', 'heritage'],
        climate: ['tropical', 'humid'],
        applications: ['flooring', 'walls', 'features'],
        origin: 'Penang, Melaka',
        lead_time: 21,
        maintenance: 'Medium'
      },
      {
        name: 'Terracotta Roof Tiles',
        description: 'Traditional clay roofing material',
        sustainability: 4,
        cost: 2,
        durability: 4,
        cultural: ['malay', 'colonial'],
        climate: ['tropical', 'monsoon'],
        applications: ['roofing', 'cladding'],
        origin: 'Local kilns',
        lead_time: 14,
        maintenance: 'Medium'
      }
    ]
  },
  metals: {
    local: [
      {
        name: 'Aluminum Composite',
        description: 'Lightweight, corrosion-resistant panels',
        sustainability: 3,
        cost: 3,
        durability: 4,
        cultural: ['contemporary'],
        climate: ['coastal', 'humid'],
        applications: ['cladding', 'roofing', 'facades'],
        origin: 'Local manufacturing',
        lead_time: 14,
        maintenance: 'Low'
      }
    ]
  },
  natural_fibers: {
    local: [
      {
        name: 'Mengkuang Weaving',
        description: 'Traditional pandan leaf weaving',
        sustainability: 5,
        cost: 2,
        durability: 2,
        cultural: ['malay', 'dayak', 'traditional'],
        climate: ['humid', 'ventilated'],
        applications: ['partitions', 'decorative', 'ceiling'],
        origin: 'Sarawak, Terengganu',
        lead_time: 30,
        maintenance: 'High'
      },
      {
        name: 'Rattan',
        description: 'Flexible climbing palm material',
        sustainability: 5,
        cost: 2,
        durability: 3,
        cultural: ['traditional', 'contemporary'],
        climate: ['humid', 'indoor'],
        applications: ['furniture', 'partitions', 'decorative'],
        origin: 'Sarawak, Sabah',
        lead_time: 21,
        maintenance: 'Medium'
      }
    ]
  }
};

// Budget allocation categories
const budgetCategories = [
  { key: 'flooring', name: 'Flooring', default: 25, icon: Package },
  { key: 'walls', name: 'Walls & Finishes', default: 20, icon: Home },
  { key: 'ceiling', name: 'Ceiling', default: 15, icon: Mountain },
  { key: 'furniture', name: 'Built-in Furniture', default: 25, icon: Package },
  { key: 'lighting', name: 'Lighting Systems', default: 10, icon: Zap },
  { key: 'accessories', name: 'Decorative Elements', default: 5, icon: Star }
];

export function MaterialPreferencesSelector({
  budget,
  culturalPreferences,
  climateZone,
  onPreferencesChange
}: MaterialPreferencesSelectorProps) {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [avoidMaterials, setAvoidMaterials] = useState<string[]>([]);
  const [sustainabilityPriority, setSustainabilityPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [localPreference, setLocalPreference] = useState(true);
  const [budgetAllocation, setBudgetAllocation] = useState<Record<string, number>>(
    budgetCategories.reduce((acc, cat) => ({ ...acc, [cat.key]: cat.default }), {})
  );
  const [showSustainabilityFilter, setShowSustainabilityFilter] = useState(false);
  const [priceRange, setPriceRange] = useState([1, 5]);
  const [activeCategory, setActiveCategory] = useState('all');

  // Flatten materials for easier access
  const allMaterials = Object.entries(materialDatabase).reduce((acc, [category, subcats]) => {
    Object.entries(subcats).forEach(([subcat, materials]) => {
      materials.forEach(material => {
        acc.push({ 
          ...material, 
          category, 
          subcategory: subcat,
          id: `${category}-${subcat}-${material.name.toLowerCase().replace(/\s+/g, '-')}`
        });
      });
    });
    return acc;
  }, [] as any[]);

  // Filter materials based on criteria
  const getFilteredMaterials = () => {
    let filtered = allMaterials;

    // Cultural filter
    if (culturalPreferences?.primary_culture) {
      filtered = filtered.filter(material => 
        material.cultural.includes(culturalPreferences.primary_culture) ||
        material.cultural.includes('contemporary') ||
        material.cultural.includes('traditional')
      );
    }

    // Climate filter
    filtered = filtered.filter(material =>
      material.climate.includes(climateZone) || 
      material.climate.includes('all') ||
      material.climate.includes('variable')
    );

    // Sustainability filter
    if (showSustainabilityFilter) {
      const minSustainability = sustainabilityPriority === 'high' ? 4 : sustainabilityPriority === 'medium' ? 3 : 1;
      filtered = filtered.filter(material => material.sustainability >= minSustainability);
    }

    // Local preference
    if (localPreference) {
      filtered = filtered.sort((a, b) => {
        const aLocal = a.origin.includes('Malaysia') || a.origin.includes('Local') ? 1 : 0;
        const bLocal = b.origin.includes('Malaysia') || b.origin.includes('Local') ? 1 : 0;
        return bLocal - aLocal;
      });
    }

    // Price range
    filtered = filtered.filter(material => 
      material.cost >= priceRange[0] && material.cost <= priceRange[1]
    );

    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(material => material.category === activeCategory);
    }

    return filtered;
  };

  const calculateTotalAllocation = () => {
    return Object.values(budgetAllocation).reduce((sum, val) => sum + val, 0);
  };

  const getMaterialScore = (material: any) => {
    let score = 0;
    
    // Sustainability bonus
    score += material.sustainability * 2;
    
    // Durability bonus
    score += material.durability * 1.5;
    
    // Local preference bonus
    if (localPreference && (material.origin.includes('Malaysia') || material.origin.includes('Local'))) {
      score += 5;
    }
    
    // Cultural alignment bonus
    if (culturalPreferences?.primary_culture && material.cultural.includes(culturalPreferences.primary_culture)) {
      score += 3;
    }
    
    // Climate suitability bonus
    if (material.climate.includes(climateZone)) {
      score += 3;
    }
    
    return Math.round(score);
  };

  const toggleMaterial = (materialId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedMaterials([...selectedMaterials, materialId]);
      setAvoidMaterials(avoidMaterials.filter(id => id !== materialId));
    } else {
      setSelectedMaterials(selectedMaterials.filter(id => id !== materialId));
    }
  };

  const toggleAvoidMaterial = (materialId: string, isAvoided: boolean) => {
    if (isAvoided) {
      setAvoidMaterials([...avoidMaterials, materialId]);
      setSelectedMaterials(selectedMaterials.filter(id => id !== materialId));
    } else {
      setAvoidMaterials(avoidMaterials.filter(id => id !== materialId));
    }
  };

  const updateBudgetAllocation = (category: string, value: number) => {
    setBudgetAllocation(prev => ({
      ...prev,
      [category]: value
    }));
  };

  useEffect(() => {
    const materialCategories = budgetCategories.map(cat => ({
      category: cat.key,
      selected_materials: selectedMaterials.filter(id => {
        const material = allMaterials.find(m => m.id === id);
        return material?.applications.some((app: string) => 
          app.includes(cat.key) || cat.key.includes(app)
        );
      }),
      budget_allocation: budgetAllocation[cat.key],
      sustainability_priority: sustainabilityPriority,
      local_preference: localPreference,
      performance_requirements: []
    }));

    onPreferencesChange({
      preferred_materials: selectedMaterials,
      avoid_materials: avoidMaterials,
      sustainability_priority: sustainabilityPriority,
      local_materials_preferred: localPreference,
      budget_allocation: budgetAllocation,
      material_categories: materialCategories
    });
  }, [selectedMaterials, avoidMaterials, sustainabilityPriority, localPreference, budgetAllocation]);

  const filteredMaterials = getFilteredMaterials();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold">{selectedMaterials.length}</div>
                <div className="text-sm text-gray-600">Materials Selected</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold capitalize">{sustainabilityPriority}</div>
                <div className="text-sm text-gray-600">Sustainability Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-semibold">RM {budget.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Material Budget</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="selection">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="selection">Material Selection</TabsTrigger>
          <TabsTrigger value="budget">Budget Allocation</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="selection" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={activeCategory} onValueChange={setActiveCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="timber">Timber</SelectItem>
                      <SelectItem value="stone">Stone</SelectItem>
                      <SelectItem value="ceramics">Ceramics</SelectItem>
                      <SelectItem value="metals">Metals</SelectItem>
                      <SelectItem value="natural_fibers">Natural Fibers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Price Range</Label>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={5}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Budget</span>
                      <span>Premium</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox 
                    id="local-pref"
                    checked={localPreference}
                    onCheckedChange={setLocalPreference}
                  />
                  <Label htmlFor="local-pref">Prefer Local Materials</Label>
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox 
                    id="sustainability"
                    checked={showSustainabilityFilter}
                    onCheckedChange={setShowSustainabilityFilter}
                  />
                  <Label htmlFor="sustainability">Sustainability Filter</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{material.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {material.category} • {material.subcategory}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">Score: {getMaterialScore(material)}</div>
                      <div className="flex gap-1">
                        {localPreference && (material.origin.includes('Malaysia') || material.origin.includes('Local')) && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            Local
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">{material.description}</p>
                  
                  {/* Properties */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="flex justify-center mb-1">
                        <Leaf className="h-4 w-4 text-green-600" />
                      </div>
                      <Progress value={material.sustainability * 20} className="h-2" />
                      <div className="text-xs mt-1">Sustainable</div>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-1">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <Progress value={material.durability * 20} className="h-2" />
                      <div className="text-xs mt-1">Durable</div>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-1">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                      </div>
                      <Progress value={material.cost * 20} className="h-2" />
                      <div className="text-xs mt-1">Cost</div>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div><strong>Origin:</strong> {material.origin}</div>
                    <div><strong>Lead Time:</strong> {material.lead_time} days</div>
                    <div><strong>Applications:</strong> {material.applications.join(', ')}</div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant={selectedMaterials.includes(material.id) ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleMaterial(material.id, !selectedMaterials.includes(material.id))}
                    >
                      {selectedMaterials.includes(material.id) ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Selected
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-1" />
                          Select
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant={avoidMaterials.includes(material.id) ? "destructive" : "ghost"}
                      size="sm"
                      onClick={() => toggleAvoidMaterial(material.id, !avoidMaterials.includes(material.id))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredMaterials.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No materials match your current filters. Try adjusting your criteria or expanding your price range.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocation by Category</CardTitle>
              <CardDescription>
                Distribute your RM {budget.toLocaleString()} material budget across different categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {budgetCategories.map((category) => {
                const Icon = category.icon;
                const amount = (budgetAllocation[category.key] / 100) * budget;
                
                return (
                  <div key={category.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <Label>{category.name}</Label>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">RM {amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{budgetAllocation[category.key]}%</div>
                      </div>
                    </div>
                    <Slider
                      value={[budgetAllocation[category.key]]}
                      onValueChange={([value]) => updateBudgetAllocation(category.key, value)}
                      max={50}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                );
              })}
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Allocation:</span>
                  <span className={`font-bold ${calculateTotalAllocation() !== 100 ? 'text-red-600' : 'text-green-600'}`}>
                    {calculateTotalAllocation()}%
                  </span>
                </div>
                {calculateTotalAllocation() !== 100 && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Budget allocation should total 100%. Current total: {calculateTotalAllocation()}%
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sustainability Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={sustainabilityPriority} onValueChange={setSustainabilityPriority}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      High Priority - Focus on eco-friendly, recycled, and locally-sourced materials
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="flex items-center gap-2">
                      <RecycleIcon className="h-4 w-4 text-blue-600" />
                      Medium Priority - Balance sustainability with other factors
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      Low Priority - Focus on cost and performance over sustainability
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selected Materials Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMaterials.length > 0 ? (
                  <div className="space-y-2">
                    {selectedMaterials.map(materialId => {
                      const material = allMaterials.find(m => m.id === materialId);
                      return material ? (
                        <div key={materialId} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{material.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({material.category})</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleMaterial(materialId, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No materials selected yet. Browse the material selection tab to choose materials.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}