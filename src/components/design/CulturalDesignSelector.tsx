import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Home, 
  Palette, 
  Sun, 
  Wind, 
  Droplets, 
  Users, 
  Sparkles,
  AlertCircle,
  MapPin,
  Leaf,
  Star
} from 'lucide-react';
import { CulturalPreferences, ClimateDesignFeatures } from '@/types';

interface CulturalDesignSelectorProps {
  onPreferencesChange: (preferences: CulturalPreferences) => void;
  onClimateChange: (climate: ClimateDesignFeatures) => void;
}

// Malaysian cultural design templates
const culturalTemplates = {
  malay: {
    name: 'Traditional Malay',
    description: 'Rumah Melayu inspired design with raised floors, deep verandahs, and intricate wood carvings',
    colors: ['#8B4513', '#D2691E', '#FFD700', '#228B22', '#F0E68C'],
    elements: ['Serambi (verandah)', 'Rumah Ibu (main house)', 'Carved ventilation panels', 'Pitched roof', 'Timber stilts'],
    materials: ['Cengal wood', 'Meranti', 'Bamboo', 'Nipah thatch', 'Terracotta'],
    religious: 'islam',
    orientation: 'Qibla-oriented prayer space'
  },
  chinese: {
    name: 'Malaysian Chinese',
    description: 'Fusion of Southern Chinese architecture with tropical adaptations',
    colors: ['#DC143C', '#FFD700', '#000000', '#FFFFFF', '#8B0000'],
    elements: ['Central courtyard', 'Altar room', 'Round moon doors', 'Red pillars', 'Feng shui layout'],
    materials: ['Red clay tiles', 'Granite', 'Hardwood', 'Ceramic', 'Jade stone'],
    religious: 'buddhism/taoism',
    orientation: 'South-facing main entrance'
  },
  indian: {
    name: 'Malaysian Indian',
    description: 'South Indian architectural elements adapted for Malaysian climate',
    colors: ['#FF6347', '#FFD700', '#FF4500', '#32CD32', '#9400D3'],
    elements: ['Pooja room', 'Kolam space', 'Brass fixtures', 'Carved doors', 'Jali screens'],
    materials: ['Teak wood', 'Marble', 'Brass', 'Copper', 'Granite'],
    religious: 'hinduism',
    orientation: 'East-facing prayer room'
  },
  peranakan: {
    name: 'Peranakan/Straits Chinese',
    description: 'Ornate shophouse style with vibrant tiles and intricate details',
    colors: ['#40E0D0', '#FF1493', '#FFD700', '#32CD32', '#FF6347'],
    elements: ['Pintu Pagar (swing doors)', 'Peranakan tiles', 'Airwell', 'Ornate facades', 'Mother-of-pearl inlay'],
    materials: ['Peranakan tiles', 'Teakwood', 'Mother-of-pearl', 'Carved wood panels', 'Colorful glass'],
    religious: 'mixed',
    orientation: 'Street-facing with internal courtyard'
  },
  contemporary: {
    name: 'Tropical Modern',
    description: 'Modern design optimized for Malaysian climate with cultural touches',
    colors: ['#FFFFFF', '#808080', '#000000', '#8FBC8F', '#4682B4'],
    elements: ['Glass louvers', 'Green walls', 'Water features', 'Open plan', 'Smart home integration'],
    materials: ['Local timber', 'Recycled materials', 'Solar glass', 'Bamboo composite', 'Natural stone'],
    religious: 'flexible',
    orientation: 'Climate-responsive orientation'
  }
};

// Climate zones in Malaysia
const climateZones = {
  tropical_rainforest: {
    name: 'Tropical Rainforest (Most of Peninsula & East Malaysia)',
    characteristics: ['High humidity (70-90%)', 'Year-round rainfall', 'Temperature 25-35°C', 'Minimal seasonal variation'],
    recommendations: ['Maximum cross-ventilation', 'Deep roof overhangs', 'Raised floors', 'Moisture-resistant materials']
  },
  tropical_monsoon: {
    name: 'Tropical Monsoon (East Coast)',
    characteristics: ['Heavy monsoon rains (Nov-Mar)', 'Dry season (Apr-Oct)', 'Strong winds', 'Flooding risk'],
    recommendations: ['Storm shutters', 'Elevated structures', 'Reinforced roofing', 'Flood-resistant ground floor']
  },
  tropical_highland: {
    name: 'Tropical Highland (Cameron, Genting)',
    characteristics: ['Cooler temperatures (15-25°C)', 'High rainfall', 'Morning mist', 'Occasional strong winds'],
    recommendations: ['Insulation options', 'Fireplace provision', 'Sloped roofs', 'Wind barriers']
  },
  coastal_humid: {
    name: 'Coastal Humid (Coastal areas)',
    characteristics: ['Salt air exposure', 'High humidity', 'Sea breezes', 'Corrosion risk'],
    recommendations: ['Corrosion-resistant materials', 'Wind-oriented design', 'Salt-tolerant landscaping', 'Regular maintenance planning']
  }
};

// Festival and seasonal considerations
const festivalDesigns = {
  hari_raya: {
    name: 'Hari Raya Aidilfitri',
    colors: ['Green', 'Gold', 'White'],
    spaces: ['Large dining area', 'Guest reception', 'Prayer room'],
    elements: ['Pelita displays', 'Ketupat decorations', 'Open house layout']
  },
  chinese_new_year: {
    name: 'Chinese New Year',
    colors: ['Red', 'Gold', 'Orange'],
    spaces: ['Reunion dinner area', 'Ancestor altar', 'Entertainment space'],
    elements: ['Red lanterns', 'Fortune symbols', 'Round dining table']
  },
  deepavali: {
    name: 'Deepavali',
    colors: ['Orange', 'Yellow', 'Purple', 'Pink'],
    spaces: ['Kolam area', 'Prayer room', 'Light displays'],
    elements: ['Oil lamp niches', 'Rangoli space', 'Flower garland hooks']
  },
  christmas: {
    name: 'Christmas',
    colors: ['Red', 'Green', 'Gold', 'White'],
    spaces: ['Christmas tree area', 'Dining space', 'Gift display'],
    elements: ['Tree placement', 'Light fixtures', 'Wreath hangers']
  }
};

export function CulturalDesignSelector({ onPreferencesChange, onClimateChange }: CulturalDesignSelectorProps) {
  const [selectedCulture, setSelectedCulture] = useState<string>('');
  const [selectedClimate, setSelectedClimate] = useState<string>('');
  const [religiousNeeds, setReligiousNeeds] = useState<string[]>([]);
  const [entertainmentStyle, setEntertainmentStyle] = useState<string>('');
  const [selectedFestivals, setSelectedFestivals] = useState<string[]>([]);
  const [tabooElements, setTabooElements] = useState<string[]>([]);

  const handleCultureSelect = (culture: string) => {
    setSelectedCulture(culture);
    const template = culturalTemplates[culture as keyof typeof culturalTemplates];
    
    // Auto-populate preferences based on cultural template
    const preferences: Partial<CulturalPreferences> = {
      primaryCulture: culture as any,
      religiousConsiderations: template.religious as any,
      culturalColorPreferences: {
        primary: template.colors.slice(0, 2),
        secondary: template.colors.slice(2, 4),
        accent: template.colors.slice(4),
        culturalMeaning: {},
        festivalColors: {},
        avoidColors: []
      }
    };
    
    onPreferencesChange(preferences as CulturalPreferences);
  };

  const handleClimateSelect = (zone: string) => {
    setSelectedClimate(zone);
    const climate = climateZones[zone as keyof typeof climateZones];
    
    // Generate climate design features based on zone
    const features: ClimateDesignFeatures = {
      ventilationStrategy: zone === 'tropical_highland' ? 'mechanical' : 'cross_ventilation',
      sunShadingRequired: true,
      rainProtection: zone === 'tropical_monsoon' ? 'deep_eaves' : 'covered_walkways',
      humidityControl: zone === 'coastal_humid' ? 'moisture_barriers' : 'natural_materials',
      thermalComfort: zone === 'tropical_highland' ? 'insulation' : 'high_ceilings',
      outdoorLiving: true,
      naturalLightOptimization: true,
      monsoonAdaptations: zone === 'tropical_monsoon' ? ['Storm shutters', 'Reinforced roofing'] : []
    };
    
    onClimateChange(features);
  };

  return (
    <div className="space-y-6">
      <Card className="architect-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Cultural Design Intelligence
          </CardTitle>
          <CardDescription>
            Tailored design recommendations based on Malaysian cultural preferences and climate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="culture" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="culture">Cultural Style</TabsTrigger>
              <TabsTrigger value="climate">Climate Design</TabsTrigger>
              <TabsTrigger value="spiritual">Spiritual Spaces</TabsTrigger>
              <TabsTrigger value="entertainment">Entertainment</TabsTrigger>
            </TabsList>

            {/* Cultural Style Tab */}
            <TabsContent value="culture" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(culturalTemplates).map(([key, template]) => (
                  <Card 
                    key={key}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedCulture === key ? 'ring-2 ring-black' : 'architect-border'
                    }`}
                    onClick={() => handleCultureSelect(key)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">{template.description}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {template.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Key Elements:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.elements.slice(0, 3).map((element, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {element}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedCulture && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Design Template Applied:</strong> {culturalTemplates[selectedCulture as keyof typeof culturalTemplates].name}
                    <br />
                    Orientation: {culturalTemplates[selectedCulture as keyof typeof culturalTemplates].orientation}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Label>Cultural Taboos to Avoid</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    'Number 4 (Chinese)',
                    'Shoes inside prayer areas',
                    'Black/white only (funeral colors)',
                    'Pointing with feet',
                    'Left hand for giving',
                    'Dog imagery (Muslim homes)'
                  ].map((taboo) => (
                    <div key={taboo} className="flex items-center space-x-2">
                      <Checkbox
                        id={taboo}
                        checked={tabooElements.includes(taboo)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTabooElements([...tabooElements, taboo]);
                          } else {
                            setTabooElements(tabooElements.filter(t => t !== taboo));
                          }
                        }}
                      />
                      <Label htmlFor={taboo} className="text-sm cursor-pointer">
                        {taboo}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Climate Design Tab */}
            <TabsContent value="climate" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Select Your Climate Zone</Label>
                  <RadioGroup value={selectedClimate} onValueChange={handleClimateSelect}>
                    {Object.entries(climateZones).map(([key, zone]) => (
                      <Card key={key} className="mb-3">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value={key} id={key} />
                            <div className="flex-1">
                              <Label htmlFor={key} className="cursor-pointer">
                                <div className="font-medium">{zone.name}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {zone.characteristics.join(' • ')}
                                </div>
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {zone.recommendations.map((rec, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {rec}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Wind className="h-4 w-4" />
                        Ventilation Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select defaultValue="cross_ventilation">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cross_ventilation">Cross Ventilation</SelectItem>
                          <SelectItem value="stack_effect">Stack Effect</SelectItem>
                          <SelectItem value="wind_tower">Wind Tower</SelectItem>
                          <SelectItem value="hybrid">Hybrid System</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Humidity Control
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select defaultValue="natural_materials">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="natural_materials">Natural Materials</SelectItem>
                          <SelectItem value="dehumidification">Active Dehumidification</SelectItem>
                          <SelectItem value="moisture_barriers">Moisture Barriers</SelectItem>
                          <SelectItem value="elevated_floors">Elevated Floors</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Sun Protection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select defaultValue="deep_eaves">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deep_eaves">Deep Roof Eaves</SelectItem>
                          <SelectItem value="covered_walkways">Covered Walkways</SelectItem>
                          <SelectItem value="rain_chains">Rain Chains</SelectItem>
                          <SelectItem value="integrated_drainage">Integrated Drainage</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Thermal Comfort
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select defaultValue="high_ceilings">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high_ceilings">High Ceilings</SelectItem>
                          <SelectItem value="thermal_mass">Thermal Mass</SelectItem>
                          <SelectItem value="insulation">Insulation</SelectItem>
                          <SelectItem value="reflective_roofing">Reflective Roofing</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Spiritual Spaces Tab */}
            <TabsContent value="spiritual" className="space-y-4">
              <div className="space-y-4">
                <Label>Religious/Spiritual Requirements</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'prayer_room', name: 'Muslim Prayer Room (Surau)', requirements: 'Qibla direction, Ablution area, Storage for prayer mats' },
                    { id: 'altar', name: 'Buddhist/Taoist Altar', requirements: 'Elevated position, Incense ventilation, Display shelves' },
                    { id: 'pooja', name: 'Hindu Prayer Room', requirements: 'East-facing, Water feature, Bell and lamp provisions' },
                    { id: 'meditation', name: 'Meditation Space', requirements: 'Quiet zone, Natural light, Minimal design' }
                  ].map((space) => (
                    <Card key={space.id} className="architect-border">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id={space.id}
                            checked={religiousNeeds.includes(space.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setReligiousNeeds([...religiousNeeds, space.id]);
                              } else {
                                setReligiousNeeds(religiousNeeds.filter(r => r !== space.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <Label htmlFor={space.id} className="cursor-pointer">
                              <div className="font-medium">{space.name}</div>
                              <div className="text-sm text-gray-600 mt-1">{space.requirements}</div>
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {religiousNeeds.length > 0 && (
                  <Alert>
                    <Star className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Spiritual spaces selected:</strong> We'll ensure proper orientation, privacy, and cultural requirements are met for each space.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            {/* Entertainment Tab */}
            <TabsContent value="entertainment" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Entertainment Style</Label>
                  <RadioGroup value={entertainmentStyle} onValueChange={setEntertainmentStyle}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { value: 'formal_hosting', label: 'Formal Hosting', desc: 'Separate dining, formal living areas' },
                        { value: 'casual_gathering', label: 'Casual Gathering', desc: 'Open concept, flexible spaces' },
                        { value: 'open_house', label: 'Open House Style', desc: 'Large entertaining areas, festival-ready' },
                        { value: 'private', label: 'Private/Family Only', desc: 'Intimate spaces, minimal guest areas' }
                      ].map((style) => (
                        <Card key={style.value} className="architect-border">
                          <CardContent className="p-3">
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value={style.value} id={style.value} />
                              <Label htmlFor={style.value} className="cursor-pointer">
                                <div className="font-medium">{style.label}</div>
                                <div className="text-sm text-gray-600">{style.desc}</div>
                              </Label>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Festival Celebrations</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(festivalDesigns).map(([key, festival]) => (
                      <Card key={key} className="architect-border">
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id={key}
                              checked={selectedFestivals.includes(key)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedFestivals([...selectedFestivals, key]);
                                } else {
                                  setSelectedFestivals(selectedFestivals.filter(f => f !== key));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <Label htmlFor={key} className="cursor-pointer">
                                <div className="font-medium">{festival.name}</div>
                                <div className="flex gap-1 mt-1">
                                  {festival.colors.map((color, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {color}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {festival.spaces.join(', ')}
                                </div>
                              </Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Special Entertainment Features</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'Kenduri area (100+ guests)',
                      'Outdoor BBQ/Satay area',
                      'Karaoke room',
                      'Mahjong/Card room',
                      'Children play area',
                      'Extended dining capacity'
                    ].map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox id={feature} />
                        <Label htmlFor={feature} className="text-sm cursor-pointer">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}