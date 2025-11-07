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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sun, 
  Wind, 
  Droplets, 
  Thermometer,
  Eye,
  Zap,
  Leaf,
  CloudRain,
  Mountain,
  Waves,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ClimateDesignFeatures } from '@/types';

interface ClimateDesignModuleProps {
  projectLocation: {
    state: string;
    city: string;
  };
  onClimateChange: (climate: ClimateDesignFeatures) => void;
}

// Malaysian climate data by region
const climateData = {
  'Kuala Lumpur': {
    zone: 'tropical_urban',
    avgTemp: { min: 24, max: 33 },
    humidity: { avg: 80, range: [70, 90] },
    rainfall: 2400,
    windSpeed: { avg: 8, max: 15 },
    sunHours: 6.5,
    challenges: ['Urban heat island', 'Flash floods', 'Air pollution', 'High humidity'],
    priorities: ['Cooling strategies', 'Flood protection', 'Air filtration', 'Energy efficiency']
  },
  'Penang': {
    zone: 'coastal_tropical',
    avgTemp: { min: 25, max: 32 },
    humidity: { avg: 75, range: [65, 85] },
    rainfall: 2800,
    windSpeed: { avg: 12, max: 25 },
    sunHours: 7,
    challenges: ['Salt air corrosion', 'Typhoons', 'Sea breeze patterns', 'Heritage constraints'],
    priorities: ['Corrosion resistance', 'Wind load design', 'Natural ventilation', 'Heritage compliance']
  },
  'Johor Bahru': {
    zone: 'equatorial',
    avgTemp: { min: 24, max: 32 },
    humidity: { avg: 82, range: [75, 90] },
    rainfall: 2500,
    windSpeed: { avg: 7, max: 12 },
    sunHours: 6,
    challenges: ['Extreme humidity', 'Heavy downpours', 'Limited wind', 'Mold growth'],
    priorities: ['Dehumidification', 'Rapid drainage', 'Mold prevention', 'Ventilation enhancement']
  },
  'Cameron Highlands': {
    zone: 'highland_tropical',
    avgTemp: { min: 15, max: 25 },
    humidity: { avg: 85, range: [80, 95] },
    rainfall: 3500,
    windSpeed: { avg: 10, max: 20 },
    sunHours: 4,
    challenges: ['Cool temperatures', 'Constant moisture', 'Limited solar gain', 'Landslide risk'],
    priorities: ['Thermal comfort', 'Moisture control', 'Natural lighting', 'Slope stability']
  },
  'Kota Kinabalu': {
    zone: 'coastal_equatorial',
    avgTemp: { min: 23, max: 31 },
    humidity: { avg: 78, range: [70, 85] },
    rainfall: 2800,
    windSpeed: { avg: 9, max: 18 },
    sunHours: 6.5,
    challenges: ['Earthquakes', 'Monsoons', 'Salt exposure', 'Indigenous materials'],
    priorities: ['Seismic design', 'Storm resistance', 'Corrosion protection', 'Local resources']
  }
};

// Climate design strategies
const ventilationStrategies = [
  {
    id: 'cross_ventilation',
    name: 'Cross Ventilation',
    description: 'Natural air flow through opposite openings',
    effectiveness: 85,
    cost: 'Low',
    requirements: ['Opposite wall openings', 'Minimal internal obstructions'],
    bestFor: ['Living areas', 'Bedrooms', 'Offices']
  },
  {
    id: 'stack_effect',
    name: 'Stack Effect Ventilation',
    description: 'Vertical air movement through thermal buoyancy',
    effectiveness: 75,
    cost: 'Medium',
    requirements: ['High ceilings', 'Top vents/clerestory', 'Heat source below'],
    bestFor: ['Atriums', 'Double-height spaces', 'Stairwells']
  },
  {
    id: 'wind_tower',
    name: 'Wind Tower/Catcher',
    description: 'Traditional passive cooling system',
    effectiveness: 70,
    cost: 'Medium',
    requirements: ['Consistent wind direction', 'Tower structure', 'Internal channeling'],
    bestFor: ['Courtyards', 'Central spaces', 'Heritage designs']
  },
  {
    id: 'mechanical_assist',
    name: 'Mechanically Assisted',
    description: 'Fans to enhance natural ventilation',
    effectiveness: 90,
    cost: 'Medium',
    requirements: ['Power supply', 'Fan placement', 'Smart controls'],
    bestFor: ['All spaces', 'Variable conditions', 'Backup cooling']
  }
];

const shadingOptions = [
  {
    id: 'deep_overhangs',
    name: 'Deep Roof Overhangs',
    description: 'Extended roof projection (1.5-2m)',
    effectiveness: 80,
    coverage: ['South/West walls', 'Windows', 'Outdoor spaces'],
    benefits: ['Rain protection', 'Reduced cooling load', 'Extended living space']
  },
  {
    id: 'vertical_fins',
    name: 'Vertical Sun Fins',
    description: 'Vertical shading elements on facade',
    effectiveness: 70,
    coverage: ['East/West windows', 'Corner exposures'],
    benefits: ['Morning/evening sun control', 'Privacy', 'Architectural feature']
  },
  {
    id: 'horizontal_louvers',
    name: 'Horizontal Louvers',
    description: 'Adjustable horizontal shading slats',
    effectiveness: 85,
    coverage: ['South windows', 'Skylights'],
    benefits: ['Adjustable control', 'Light filtering', 'Ventilation when open']
  },
  {
    id: 'green_screen',
    name: 'Green Screen/Living Wall',
    description: 'Vegetation-based shading system',
    effectiveness: 75,
    coverage: ['Any orientation', 'Full walls'],
    benefits: ['Cooling effect', 'Air purification', 'Aesthetics', 'Biodiversity']
  }
];

const drainageOptions = [
  {
    id: 'elevated_design',
    name: 'Elevated Building Design',
    description: 'Raised structure above flood level',
    protection: 'High',
    requirements: ['Stilts/columns', 'Flood-resistant materials below', 'Access ramps']
  },
  {
    id: 'rain_gardens',
    name: 'Rain Gardens & Bioswales',
    description: 'Natural water retention and filtration',
    protection: 'Medium',
    requirements: ['Landscaped areas', 'Proper grading', 'Plant selection']
  },
  {
    id: 'permeable_surfaces',
    name: 'Permeable Paving',
    description: 'Water-absorbing surface materials',
    protection: 'Medium',
    requirements: ['Proper substrate', 'Maintenance access', 'Overflow systems']
  },
  {
    id: 'integrated_channels',
    name: 'Integrated Drainage Channels',
    description: 'Built-in water management system',
    protection: 'High',
    requirements: ['Proper slopes', 'Adequate sizing', 'Maintenance access']
  }
];

export function ClimateDesignModule({ projectLocation, onClimateChange }: ClimateDesignModuleProps) {
  const [selectedVentilation, setSelectedVentilation] = useState<string>('cross_ventilation');
  const [selectedShading, setSelectedShading] = useState<string[]>(['deep_overhangs']);
  const [selectedDrainage, setSelectedDrainage] = useState<string>('elevated_design');
  const [prioritizeNaturalLighting, setPrioritizeNaturalLighting] = useState(true);
  const [outdoorIntegration, setOutdoorIntegration] = useState(true);
  const [sustainabilityLevel, setSustainabilityLevel] = useState([7]);
  
  const locationClimate = climateData[projectLocation.city] || climateData['Kuala Lumpur'];
  
  useEffect(() => {
    const climateFeatures: ClimateDesignFeatures = {
      ventilation_strategy: selectedVentilation as any,
      sun_shading_required: selectedShading.length > 0,
      rain_protection: selectedDrainage as any,
      humidity_control: locationClimate.humidity.avg > 75 ? 'dehumidification' : 'natural_materials' as any,
      thermal_comfort: locationClimate.avgTemp.max > 30 ? 'high_ceilings' : 'thermal_mass' as any,
      natural_lighting: prioritizeNaturalLighting,
      outdoor_integration: outdoorIntegration,
      climate_zone: locationClimate.zone,
      sustainability_priority: sustainabilityLevel[0] > 7 ? 'high' : sustainabilityLevel[0] > 4 ? 'medium' : 'low',
      selected_shading_methods: selectedShading,
      effectiveness_score: calculateEffectivenessScore()
    };
    
    onClimateChange(climateFeatures);
  }, [selectedVentilation, selectedShading, selectedDrainage, prioritizeNaturalLighting, outdoorIntegration, sustainabilityLevel]);

  const calculateEffectivenessScore = () => {
    let score = 0;
    const ventStrategy = ventilationStrategies.find(v => v.id === selectedVentilation);
    if (ventStrategy) score += ventStrategy.effectiveness * 0.4;
    
    const shadingScore = selectedShading.reduce((acc, shadingId) => {
      const shading = shadingOptions.find(s => s.id === shadingId);
      return acc + (shading?.effectiveness || 0);
    }, 0);
    score += (shadingScore / selectedShading.length) * 0.3;
    
    score += sustainabilityLevel[0] * 3; // 0-30 points for sustainability
    
    return Math.round(score);
  };

  const getClimateRecommendations = () => {
    const challenges = locationClimate.challenges;
    const priorities = locationClimate.priorities;
    
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div>
              <strong>Climate Zone:</strong> {locationClimate.zone.replace('_', ' ')}
            </div>
            <div>
              <strong>Key Challenges:</strong> {challenges.join(', ')}
            </div>
            <div>
              <strong>Design Priorities:</strong> {priorities.join(', ')}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Climate Analysis for {projectLocation.city}
          </CardTitle>
          <CardDescription>
            Tailored climate design strategies for your location
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getClimateRecommendations()}
          
          {/* Climate Data Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <div className="text-lg font-bold text-blue-700">
                {locationClimate.avgTemp.min}°C - {locationClimate.avgTemp.max}°C
              </div>
            </div>
            
            <div className="bg-cyan-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-medium">Humidity</span>
              </div>
              <div className="text-lg font-bold text-cyan-700">
                {locationClimate.humidity.avg}% avg
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Rainfall</span>
              </div>
              <div className="text-lg font-bold text-green-700">
                {locationClimate.rainfall}mm/year
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Sun Hours</span>
              </div>
              <div className="text-lg font-bold text-yellow-700">
                {locationClimate.sunHours}h/day avg
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ventilation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ventilation">
            <Wind className="h-4 w-4 mr-2" />
            Ventilation
          </TabsTrigger>
          <TabsTrigger value="shading">
            <Sun className="h-4 w-4 mr-2" />
            Shading
          </TabsTrigger>
          <TabsTrigger value="drainage">
            <Droplets className="h-4 w-4 mr-2" />
            Drainage
          </TabsTrigger>
          <TabsTrigger value="comfort">
            <Eye className="h-4 w-4 mr-2" />
            Comfort
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ventilation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventilation Strategy</CardTitle>
              <CardDescription>
                Choose the primary ventilation approach for natural cooling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedVentilation} onValueChange={setSelectedVentilation}>
                {ventilationStrategies.map((strategy) => (
                  <div key={strategy.id} className="flex items-start space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value={strategy.id} id={strategy.id} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={strategy.id} className="font-medium cursor-pointer">
                        {strategy.name}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Effectiveness:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={strategy.effectiveness} className="w-16 h-2" />
                            <span className="text-xs font-medium">{strategy.effectiveness}%</span>
                          </div>
                        </div>
                        <Badge variant="outline">{strategy.cost} Cost</Badge>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Best for:</span>
                        <span className="text-xs ml-1">{strategy.bestFor.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sun Shading Solutions</CardTitle>
              <CardDescription>
                Select multiple shading strategies (recommended for tropical climate)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shadingOptions.map((option) => (
                  <div key={option.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id={option.id}
                      checked={selectedShading.includes(option.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedShading([...selectedShading, option.id]);
                        } else {
                          setSelectedShading(selectedShading.filter(id => id !== option.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={option.id} className="font-medium cursor-pointer">
                        {option.name}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={option.effectiveness} className="w-20 h-2" />
                        <span className="text-xs font-medium">{option.effectiveness}%</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Coverage:</span>
                        <span className="text-xs ml-1">{option.coverage.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drainage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rain & Flood Protection</CardTitle>
              <CardDescription>
                Primary water management strategy (annual rainfall: {locationClimate.rainfall}mm)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedDrainage} onValueChange={setSelectedDrainage}>
                {drainageOptions.map((option) => (
                  <div key={option.id} className="flex items-start space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={option.id} className="font-medium cursor-pointer">
                        {option.name}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <Badge variant={option.protection === 'High' ? 'default' : 'secondary'}>
                          {option.protection} Protection
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comfort" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Comfort & Sustainability Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Prioritize Natural Lighting</Label>
                    <div className="text-sm text-gray-500">
                      Maximize daylight while controlling glare
                    </div>
                  </div>
                  <Checkbox
                    checked={prioritizeNaturalLighting}
                    onCheckedChange={setPrioritizeNaturalLighting}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Outdoor Living Integration</Label>
                    <div className="text-sm text-gray-500">
                      Seamless indoor-outdoor connections
                    </div>
                  </div>
                  <Checkbox
                    checked={outdoorIntegration}
                    onCheckedChange={setOutdoorIntegration}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base">Sustainability Priority</Label>
                  <div className="px-3">
                    <Slider
                      value={sustainabilityLevel}
                      onValueChange={setSustainabilityLevel}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>Basic</span>
                      <span>Moderate</span>
                      <span>Advanced</span>
                      <span>Zero Carbon</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Current level: <strong>{sustainabilityLevel[0]}/10</strong> - 
                    {sustainabilityLevel[0] <= 3 && ' Basic efficiency measures'}
                    {sustainabilityLevel[0] > 3 && sustainabilityLevel[0] <= 6 && ' Moderate green features'}
                    {sustainabilityLevel[0] > 6 && sustainabilityLevel[0] <= 8 && ' Advanced sustainability'}
                    {sustainabilityLevel[0] > 8 && ' Net-zero carbon target'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Climate Design Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={calculateEffectivenessScore()} className="h-3" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {calculateEffectivenessScore()}/100
                    </div>
                    <div className="text-xs text-gray-500">Effectiveness Score</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {calculateEffectivenessScore() >= 80 && (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Excellent climate adaptation strategy
                    </div>
                  )}
                  {calculateEffectivenessScore() >= 60 && calculateEffectivenessScore() < 80 && (
                    <div className="flex items-center gap-2 text-blue-700">
                      <Info className="h-4 w-4" />
                      Good climate response design
                    </div>
                  )}
                  {calculateEffectivenessScore() < 60 && (
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertTriangle className="h-4 w-4" />
                      Consider additional climate strategies
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}