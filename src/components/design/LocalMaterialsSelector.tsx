import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Leaf, 
  MapPin, 
  DollarSign, 
  Clock, 
  Shield, 
  Droplets,
  Sun,
  Wind,
  Package,
  User,
  Phone,
  Info
} from 'lucide-react';
import { LocalMaterial, ArtisanInfo } from '@/types';

// Malaysian local materials database
const localMaterialsDatabase = {
  timber: [
    {
      name: 'Cengal',
      origin: 'Pahang, Terengganu',
      properties: 'Extremely durable, termite resistant',
      sustainability: 'Controlled harvesting',
      cost: 'Premium',
      climate: 'Excellent - naturally weather resistant',
      uses: 'Structural, outdoor decking, traditional houses',
      suppliers: ['Pahang Timber Co.', 'East Coast Wood Industries']
    },
    {
      name: 'Meranti',
      origin: 'Sarawak, Sabah',
      properties: 'Moderately durable, easy to work',
      sustainability: 'FSC certified available',
      cost: 'Moderate',
      climate: 'Good - requires treatment',
      uses: 'Interior paneling, furniture, doors',
      suppliers: ['Sarawak Timber Association', 'Borneo Wood Export']
    },
    {
      name: 'Bamboo',
      origin: 'Throughout Malaysia',
      properties: 'Rapid growth, flexible, sustainable',
      sustainability: 'Highly renewable',
      cost: 'Budget',
      climate: 'Good - requires proper treatment',
      uses: 'Screens, ceiling, decorative elements',
      suppliers: ['Malaysian Bamboo Society', 'Green Building Materials Sdn Bhd']
    },
    {
      name: 'Rubberwood',
      origin: 'Perak, Kedah, Johor',
      properties: 'Plantation timber, stable',
      sustainability: 'Plantation grown',
      cost: 'Budget-Moderate',
      climate: 'Moderate - indoor use preferred',
      uses: 'Furniture, interior applications',
      suppliers: ['Malaysian Rubber Board', 'Hevea Furniture Industries']
    },
    {
      name: 'Nyatoh',
      origin: 'Peninsula Malaysia',
      properties: 'Fine grain, takes stain well',
      sustainability: 'Managed forests',
      cost: 'Moderate',
      climate: 'Good - interior use',
      uses: 'Veneer, plywood, furniture',
      suppliers: ['Peninsula Timber Products', 'Malaysian Wood Industries']
    }
  ],
  stone: [
    {
      name: 'Ipoh Marble',
      origin: 'Ipoh, Perak',
      properties: 'High quality, various colors',
      sustainability: 'Quarried',
      cost: 'Premium',
      climate: 'Excellent',
      uses: 'Flooring, countertops, facades',
      suppliers: ['Ipoh Marble Quarries', 'Perak Stone Industries']
    },
    {
      name: 'Langkawi Black Granite',
      origin: 'Langkawi, Kedah',
      properties: 'Extremely hard, polished finish',
      sustainability: 'Limited quarrying',
      cost: 'Premium',
      climate: 'Excellent',
      uses: 'Outdoor paving, monuments, countertops',
      suppliers: ['Langkawi Granite Co.', 'Northern Stone Works']
    },
    {
      name: 'Sarawak River Stone',
      origin: 'Sarawak rivers',
      properties: 'Natural rounded, various sizes',
      sustainability: 'River collected',
      cost: 'Budget',
      climate: 'Excellent',
      uses: 'Landscaping, gabion walls, drainage',
      suppliers: ['Sarawak Aggregates', 'Borneo Natural Stone']
    },
    {
      name: 'Laterite Stone',
      origin: 'Various locations',
      properties: 'Porous, red color, traditional',
      sustainability: 'Abundant',
      cost: 'Budget',
      climate: 'Good - porous nature',
      uses: 'Traditional walls, landscaping',
      suppliers: ['Traditional Building Materials', 'Heritage Stone Supply']
    }
  ],
  ceramic: [
    {
      name: 'Peranakan Tiles',
      origin: 'Penang, Melaka',
      properties: 'Colorful patterns, heritage design',
      sustainability: 'Handmade available',
      cost: 'Moderate-Premium',
      climate: 'Excellent',
      uses: 'Feature walls, floors, facades',
      suppliers: ['Straits Tile Company', 'Heritage Tiles Malaysia']
    },
    {
      name: 'Labu Sayong Pottery',
      origin: 'Kuala Kangsar, Perak',
      properties: 'Traditional black pottery',
      sustainability: 'Artisanal',
      cost: 'Moderate',
      climate: 'Good',
      uses: 'Decorative, water features',
      suppliers: ['Labu Sayong Craft Center', 'Perak Traditional Crafts']
    },
    {
      name: 'Malaysian Terracotta',
      origin: 'Selangor, Perak',
      properties: 'Natural clay, breathable',
      sustainability: 'Local clay',
      cost: 'Budget',
      climate: 'Good - breathable',
      uses: 'Roof tiles, floor tiles, planters',
      suppliers: ['Clay Works Malaysia', 'Terracotta Industries Sdn Bhd']
    }
  ],
  textiles: [
    {
      name: 'Songket',
      origin: 'Terengganu, Kelantan',
      properties: 'Gold thread weaving, ceremonial',
      sustainability: 'Handwoven',
      cost: 'Premium',
      climate: 'Indoor use only',
      uses: 'Wall hangings, upholstery accents',
      suppliers: ['Songket Sutera Terengganu', 'East Coast Weavers']
    },
    {
      name: 'Batik',
      origin: 'Kelantan, Terengganu, Penang',
      properties: 'Hand-drawn or printed patterns',
      sustainability: 'Artisanal',
      cost: 'Moderate',
      climate: 'Indoor use',
      uses: 'Soft furnishings, wall art, screens',
      suppliers: ['Malaysian Batik Center', 'Crafted Batik Industries']
    },
    {
      name: 'Pua Kumbu',
      origin: 'Sarawak',
      properties: 'Iban traditional weaving',
      sustainability: 'Handwoven',
      cost: 'Premium',
      climate: 'Indoor use',
      uses: 'Wall tapestries, ceremonial decor',
      suppliers: ['Sarawak Craft Council', 'Iban Heritage Weavers']
    },
    {
      name: 'Rattan Weaving',
      origin: 'Sabah, Sarawak',
      properties: 'Natural fiber, flexible',
      sustainability: 'Renewable',
      cost: 'Budget-Moderate',
      climate: 'Good - requires maintenance',
      uses: 'Furniture, screens, lighting',
      suppliers: ['Borneo Rattan Works', 'Malaysian Rattan Industries']
    }
  ],
  modern: [
    {
      name: 'Palm Oil Fiber Composite',
      origin: 'Malaysia (various)',
      properties: 'Eco-friendly, lightweight',
      sustainability: 'Waste product utilization',
      cost: 'Moderate',
      climate: 'Good',
      uses: 'Panels, insulation, furniture',
      suppliers: ['Green Tech Materials', 'Palm Fiber Industries']
    },
    {
      name: 'Recycled Plastic Timber',
      origin: 'Selangor, Penang',
      properties: 'Weather resistant, maintenance free',
      sustainability: 'Recycled content',
      cost: 'Moderate',
      climate: 'Excellent',
      uses: 'Outdoor decking, furniture',
      suppliers: ['Eco Wood Malaysia', 'Recycled Materials Sdn Bhd']
    },
    {
      name: 'Solar Glass',
      origin: 'Imported/Local assembly',
      properties: 'Energy generating, UV protection',
      sustainability: 'Energy positive',
      cost: 'Premium',
      climate: 'Excellent',
      uses: 'Skylights, facades, canopies',
      suppliers: ['Solar Tech Malaysia', 'Green Energy Solutions']
    }
  ]
};

// Malaysian artisans and craftspeople database
const artisansDatabase = [
  {
    name: 'Master Rashid Wood Carving',
    specialty: 'Traditional Malay wood carving',
    location: 'Kelantan',
    expertise: ['Rumah Melayu elements', 'Islamic geometric patterns', 'Custom panels'],
    leadTime: '4-8 weeks',
    priceRange: 'Premium'
  },
  {
    name: 'Peranakan Restoration Works',
    specialty: 'Peranakan tile and woodwork',
    location: 'Penang',
    expertise: ['Tile restoration', 'Pintu Pagar', 'Heritage conservation'],
    leadTime: '6-12 weeks',
    priceRange: 'Premium'
  },
  {
    name: 'Orang Asli Bamboo Crafts',
    specialty: 'Traditional bamboo construction',
    location: 'Pahang',
    expertise: ['Bamboo structures', 'Woven panels', 'Traditional techniques'],
    leadTime: '2-4 weeks',
    priceRange: 'Budget-Moderate'
  },
  {
    name: 'Chennai Brass Works',
    specialty: 'South Indian metalwork',
    location: 'Kuala Lumpur',
    expertise: ['Temple bells', 'Brass fixtures', 'Traditional lamps'],
    leadTime: '3-6 weeks',
    priceRange: 'Moderate-Premium'
  },
  {
    name: 'Sarawak Longhouse Builders',
    specialty: 'Traditional longhouse construction',
    location: 'Sarawak',
    expertise: ['Ironwood structures', 'Raised floors', 'Community spaces'],
    leadTime: '8-16 weeks',
    priceRange: 'Premium'
  },
  {
    name: 'Feng Shui Design Consultancy',
    specialty: 'Chinese geomancy and design',
    location: 'Kuala Lumpur',
    expertise: ['Space planning', 'Element balance', 'Auspicious orientations'],
    leadTime: '1-2 weeks',
    priceRange: 'Moderate'
  }
];

interface LocalMaterialsSelectorProps {
  onMaterialsSelected: (materials: LocalMaterial[]) => void;
  onArtisansSelected: (artisans: ArtisanInfo[]) => void;
  budget?: number;
  projectLocation?: string;
}

export function LocalMaterialsSelector({ 
  onMaterialsSelected, 
  onArtisansSelected,
  budget,
  projectLocation 
}: LocalMaterialsSelectorProps) {
  const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]);
  const [selectedArtisans, setSelectedArtisans] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSustainability, setFilterSustainability] = useState<string>('all');
  const [filterCost, setFilterCost] = useState<string>('all');

  const handleMaterialSelect = (material: any, category: string) => {
    const materialWithCategory = { ...material, category };
    const isSelected = selectedMaterials.some(m => m.name === material.name);
    
    if (isSelected) {
      setSelectedMaterials(selectedMaterials.filter(m => m.name !== material.name));
    } else {
      setSelectedMaterials([...selectedMaterials, materialWithCategory]);
    }
  };

  const handleArtisanSelect = (artisan: any) => {
    const isSelected = selectedArtisans.some(a => a.name === artisan.name);
    
    if (isSelected) {
      setSelectedArtisans(selectedArtisans.filter(a => a.name !== artisan.name));
    } else {
      setSelectedArtisans([...selectedArtisans, artisan]);
    }
  };

  const getCostBadgeVariant = (cost: string) => {
    switch(cost.toLowerCase()) {
      case 'budget': return 'secondary';
      case 'moderate': return 'outline';
      case 'premium': return 'default';
      default: return 'outline';
    }
  };

  const getSustainabilityIcon = (sustainability: string) => {
    if (sustainability.toLowerCase().includes('renewable') || 
        sustainability.toLowerCase().includes('recycled') ||
        sustainability.toLowerCase().includes('sustainable')) {
      return <Leaf className="h-3 w-3 text-green-600" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="architect-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Local Materials & Artisans
          </CardTitle>
          <CardDescription>
            Discover Malaysian materials and connect with local craftspeople
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="materials">Local Materials</TabsTrigger>
              <TabsTrigger value="artisans">Artisans & Craftspeople</TabsTrigger>
            </TabsList>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 flex-wrap">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="timber">Timber</SelectItem>
                    <SelectItem value="stone">Stone</SelectItem>
                    <SelectItem value="ceramic">Ceramic</SelectItem>
                    <SelectItem value="textiles">Textiles</SelectItem>
                    <SelectItem value="modern">Modern/Eco</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCost} onValueChange={setFilterCost}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSustainability} onValueChange={setFilterSustainability}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sustainability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="renewable">Renewable</SelectItem>
                    <SelectItem value="recycled">Recycled</SelectItem>
                    <SelectItem value="certified">Certified</SelectItem>
                    <SelectItem value="artisanal">Artisanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Material Categories */}
              {Object.entries(localMaterialsDatabase).map(([category, materials]) => {
                if (filterCategory !== 'all' && filterCategory !== category) return null;

                return (
                  <div key={category} className="space-y-3">
                    <h3 className="text-lg font-medium capitalize flex items-center gap-2">
                      {category === 'timber' && <Leaf className="h-4 w-4" />}
                      {category === 'stone' && <Shield className="h-4 w-4" />}
                      {category === 'ceramic' && <Droplets className="h-4 w-4" />}
                      {category === 'textiles' && <Wind className="h-4 w-4" />}
                      {category === 'modern' && <Sun className="h-4 w-4" />}
                      {category}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {materials
                        .filter(m => filterCost === 'all' || m.cost.toLowerCase().includes(filterCost))
                        .map((material, idx) => {
                          const isSelected = selectedMaterials.some(m => m.name === material.name);
                          
                          return (
                            <Card 
                              key={idx}
                              className={`cursor-pointer transition-all ${
                                isSelected ? 'ring-2 ring-black' : 'architect-border hover:shadow-md'
                              }`}
                              onClick={() => handleMaterialSelect(material, category)}
                            >
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-medium flex items-center gap-2">
                                        {material.name}
                                        {getSustainabilityIcon(material.sustainability)}
                                      </h4>
                                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                        <MapPin className="h-3 w-3" />
                                        {material.origin}
                                      </div>
                                    </div>
                                    <Badge variant={getCostBadgeVariant(material.cost)}>
                                      {material.cost}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-sm text-gray-700">{material.properties}</p>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs">
                                      <Sun className="h-3 w-3" />
                                      <span>Climate: {material.climate}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Leaf className="h-3 w-3" />
                                      <span>{material.sustainability}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="pt-2 border-t">
                                    <p className="text-xs text-gray-600">
                                      <strong>Uses:</strong> {material.uses}
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-1">
                                    {material.suppliers.slice(0, 2).map((supplier, sIdx) => (
                                      <Badge key={sIdx} variant="outline" className="text-xs">
                                        {supplier}
                                      </Badge>
                                    ))}
                                    {material.suppliers.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{material.suppliers.length - 2} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                );
              })}

              {selectedMaterials.length > 0 && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{selectedMaterials.length} materials selected.</strong> These will be incorporated into your design brief with supplier recommendations.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Artisans Tab */}
            <TabsContent value="artisans" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artisansDatabase.map((artisan, idx) => {
                  const isSelected = selectedArtisans.some(a => a.name === artisan.name);
                  
                  return (
                    <Card 
                      key={idx}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-black' : 'architect-border hover:shadow-md'
                      }`}
                      onClick={() => handleArtisanSelect(artisan)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {artisan.name}
                          </span>
                          <Badge variant={getCostBadgeVariant(artisan.priceRange)}>
                            {artisan.priceRange}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{artisan.specialty}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <MapPin className="h-3 w-3" />
                            {artisan.location}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Expertise:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {artisan.expertise.map((skill, sIdx) => (
                                <Badge key={sIdx} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {artisan.leadTime}
                            </span>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Phone className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            Portfolio
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {selectedArtisans.length > 0 && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{selectedArtisans.length} artisans selected.</strong> We'll facilitate introductions and coordinate their involvement in your project.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-base">Heritage Craft Preservation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    By working with local artisans, you're helping preserve Malaysia's rich craft heritage. 
                    Our platform connects you directly with master craftspeople, ensuring authentic traditional 
                    techniques while supporting local communities.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Badge variant="secondary">UNESCO Craft Support</Badge>
                    <Badge variant="secondary">Malaysian Handicraft Board</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}