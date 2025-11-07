import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Home,
  Palette,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Star,
  Sun,
  Moon,
  Wind,
  Droplets,
  Compass,
  Calendar
} from 'lucide-react';

// Comprehensive Malaysian cultural design guidelines
const culturalGuidelines = {
  malay: {
    spatial: [
      {
        guideline: 'Main entrance should not directly face the stairs',
        importance: 'recommended',
        explanation: 'Direct alignment is believed to let prosperity flow out of the house'
      },
      {
        guideline: 'Include a serambi (verandah) or transition space',
        importance: 'recommended',
        explanation: 'Traditional buffer zone between public and private spaces'
      },
      {
        guideline: 'Prayer room (surau) orientation towards Qibla (Northeast in Malaysia)',
        importance: 'mandatory',
        explanation: 'Essential for daily prayers, typically 292.5° from North in Peninsula Malaysia'
      },
      {
        guideline: 'Separate wet and dry kitchen areas',
        importance: 'recommended',
        explanation: 'Wet kitchen for heavy cooking, dry kitchen for light preparation'
      },
      {
        guideline: 'Avoid bedroom doors facing each other directly',
        importance: 'optional',
        explanation: 'Traditional belief to maintain privacy and harmony'
      }
    ],
    colors: [
      {
        color: 'Green',
        meaning: 'Islamic identity, nature, prosperity',
        usage: 'Feature walls, textiles, prayer room'
      },
      {
        color: 'Gold/Yellow',
        meaning: 'Royalty, celebration, warmth',
        usage: 'Accents, ceremonial spaces'
      },
      {
        color: 'White',
        meaning: 'Purity, cleanliness, peace',
        usage: 'Base color, prayer areas'
      },
      {
        color: 'Earth tones',
        meaning: 'Connection to nature, traditional materials',
        usage: 'Wood finishes, natural materials'
      }
    ],
    materials: [
      'Cengal or Meranti wood for structure',
      'Bamboo for screens and decorative elements',
      'Rattan for furniture and crafts',
      'Natural fibers for textiles',
      'Clay tiles for roofing'
    ],
    taboos: [
      'Dog imagery or sculptures',
      'Alcohol-related decorations',
      'Pork-related kitchen equipment in shared spaces',
      'Shoes inside prayer areas',
      'Non-halal certifications displayed prominently'
    ]
  },
  chinese: {
    spatial: [
      {
        guideline: 'Main door should not face sharp corners or T-junctions',
        importance: 'recommended',
        explanation: 'Feng shui principle to avoid "sha chi" (negative energy)'
      },
      {
        guideline: 'Include space for ancestor altar',
        importance: 'recommended',
        explanation: 'Usually placed in living room or dedicated room, facing main entrance'
      },
      {
        guideline: 'Kitchen should not be directly opposite or adjacent to bathroom',
        importance: 'recommended',
        explanation: 'Fire and water elements should not clash'
      },
      {
        guideline: 'Avoid number 4 in floor plans, unit numbers',
        importance: 'mandatory',
        explanation: 'Number 4 sounds like "death" in Chinese languages'
      },
      {
        guideline: 'Master bedroom in command position',
        importance: 'optional',
        explanation: 'Diagonal from door, with clear view of entrance'
      }
    ],
    colors: [
      {
        color: 'Red',
        meaning: 'Luck, prosperity, joy',
        usage: 'Main door, feature elements, festival decorations'
      },
      {
        color: 'Gold',
        meaning: 'Wealth, nobility, prestige',
        usage: 'Accents, business areas, altar decorations'
      },
      {
        color: 'Black',
        meaning: 'Water element, career, depth',
        usage: 'Limited use, usually with other colors'
      },
      {
        color: 'White',
        meaning: 'Metal element, mourning (use carefully)',
        usage: 'Balanced with other colors, avoid pure white rooms'
      }
    ],
    materials: [
      'Hardwood with visible grain',
      'Natural stone (granite, marble)',
      'Ceramic with traditional patterns',
      'Brass and copper fixtures',
      'Bamboo for prosperity symbolism'
    ],
    taboos: [
      'Number 4 in addresses or unit numbers',
      'Clocks as gifts or prominent displays',
      'White flowers (associated with funerals)',
      'Mirrors facing the bed',
      'Open scissors or knife displays'
    ]
  },
  indian: {
    spatial: [
      {
        guideline: 'Pooja room in northeast corner',
        importance: 'mandatory',
        explanation: 'Vastu Shastra principle for divine energy'
      },
      {
        guideline: 'Kitchen in southeast corner',
        importance: 'recommended',
        explanation: 'Fire element placement according to Vastu'
      },
      {
        guideline: 'Main entrance facing east or north',
        importance: 'recommended',
        explanation: 'Auspicious directions for prosperity'
      },
      {
        guideline: 'Include kolam/rangoli space at entrance',
        importance: 'optional',
        explanation: 'Traditional welcome and prosperity symbol'
      },
      {
        guideline: 'Water features in northeast',
        importance: 'optional',
        explanation: 'Enhances positive energy flow'
      }
    ],
    colors: [
      {
        color: 'Orange/Saffron',
        meaning: 'Spirituality, purity, auspiciousness',
        usage: 'Pooja room, festival decorations'
      },
      {
        color: 'Yellow',
        meaning: 'Knowledge, learning, spring',
        usage: 'Study areas, children rooms'
      },
      {
        color: 'Red',
        meaning: 'Strength, prosperity, fertility',
        usage: 'Bridal rooms, celebration spaces'
      },
      {
        color: 'Green',
        meaning: 'New beginnings, harmony, nature',
        usage: 'Living areas, healing spaces'
      }
    ],
    materials: [
      'Teak wood for durability',
      'Marble for pooja room',
      'Brass for religious items',
      'Cotton and silk textiles',
      'Natural stone flooring'
    ],
    taboos: [
      'Leather in pooja rooms',
      'Beef-related items for Hindu homes',
      'Black color for auspicious areas',
      'Broken idols or images',
      'Cactus or thorny plants indoors'
    ]
  },
  peranakan: {
    spatial: [
      {
        guideline: 'Central airwell for ventilation',
        importance: 'recommended',
        explanation: 'Traditional shophouse feature for natural cooling'
      },
      {
        guideline: 'Pintu pagar (half doors) at entrance',
        importance: 'optional',
        explanation: 'Allows airflow while maintaining privacy'
      },
      {
        guideline: 'Long narrow layout with courtyards',
        importance: 'optional',
        explanation: 'Traditional shophouse configuration'
      },
      {
        guideline: 'Ornate facade facing street',
        importance: 'recommended',
        explanation: 'Shows prosperity and cultural identity'
      }
    ],
    colors: [
      {
        color: 'Turquoise/Teal',
        meaning: 'Peranakan identity, cooling effect',
        usage: 'Walls, tiles, facades'
      },
      {
        color: 'Pink/Magenta',
        meaning: 'Femininity, Nyonya culture',
        usage: 'Accent walls, textiles'
      },
      {
        color: 'Lime Green',
        meaning: 'Nature, tropical vibrancy',
        usage: 'Decorative tiles, furniture'
      },
      {
        color: 'Gold',
        meaning: 'Prosperity, Chinese influence',
        usage: 'Detailed work, frames, accents'
      }
    ],
    materials: [
      'Peranakan tiles (hand-painted)',
      'Carved teakwood panels',
      'Mother-of-pearl inlay',
      'Colorful glass (stained/painted)',
      'Intricate plasterwork'
    ],
    taboos: [
      'Plain, undecorated facades',
      'Modern minimalist approach (traditionally)',
      'Removal of original tiles/features',
      'Blocking airwells or courtyards'
    ]
  }
};

// Climate-specific design guidelines
const climateGuidelines = {
  ventilation: {
    title: 'Tropical Ventilation Strategies',
    icon: Wind,
    guidelines: [
      'Position windows for cross-ventilation (opposite walls)',
      'Install ceiling fans in all living spaces (3-5 blade for efficiency)',
      'Use louver windows for 24/7 ventilation',
      'Create stack effect with high ceilings and clerestory windows',
      'Include operable transom windows above doors',
      'Design for 5-10% window-to-floor ratio minimum'
    ]
  },
  sunProtection: {
    title: 'Sun & Heat Protection',
    icon: Sun,
    guidelines: [
      'Deep roof overhangs (minimum 600mm, ideally 900mm)',
      'External shading devices on east/west facades',
      'Light-colored roof materials (reflectance >0.65)',
      'Double-roof construction for heat dissipation',
      'Plant deciduous trees on west side',
      'Use of pergolas and covered walkways'
    ]
  },
  moisture: {
    title: 'Humidity & Moisture Control',
    icon: Droplets,
    guidelines: [
      'Elevate ground floor 450-600mm minimum',
      'Install vapor barriers in walls',
      'Use moisture-resistant materials (avoid MDF)',
      'Ensure bathroom/kitchen exhaust fans',
      'Design for quick-drying surfaces',
      'Include drying areas with good ventilation'
    ]
  },
  monsoon: {
    title: 'Monsoon Adaptations',
    icon: Droplets,
    guidelines: [
      'Wide roof gutters (150mm minimum)',
      'Storm chains or rain chains for controlled drainage',
      'Covered car porch and entrances',
      'Window awnings or protective shutters',
      'Proper site grading away from building',
      'French drains or monsoon drains around perimeter'
    ]
  }
};

// Festival-specific design considerations
const festivalConsiderations = {
  hari_raya: {
    name: 'Hari Raya Aidilfitri',
    icon: Moon,
    period: 'Syawal (varies yearly)',
    spaceNeeds: [
      'Large dining area for kenduri',
      'Guest reception area (ruang tamu)',
      'Extended food preparation area',
      'Storage for extra dining ware',
      'Outdoor tent connection points'
    ],
    designFeatures: [
      'Flexible furniture arrangement',
      'Extra electrical points for lighting',
      'Carpet-friendly flooring',
      'Easy-clean surfaces',
      'Temporary partition options'
    ]
  },
  chinese_new_year: {
    name: 'Chinese New Year',
    icon: Star,
    period: 'January/February',
    spaceNeeds: [
      'Round dining table space',
      'Altar for prayers',
      'Display area for decorations',
      'Storage for festive items',
      'Gathering space for lion dance'
    ],
    designFeatures: [
      'Red accent capabilities',
      'Lantern hanging points',
      'Wide entrance for lion dance',
      'Display niches for oranges/prosperity symbols',
      'Easy decoration mounting'
    ]
  },
  deepavali: {
    name: 'Deepavali',
    icon: Star,
    period: 'October/November',
    spaceNeeds: [
      'Kolam drawing space at entrance',
      'Oil lamp placement areas',
      'Prayer room access',
      'Sweet preparation area',
      'Guest entertainment space'
    ],
    designFeatures: [
      'Floor suitable for kolam',
      'Built-in lamp niches',
      'Adequate ventilation for oil lamps',
      'Flower garland hooks',
      'Bright lighting options'
    ]
  }
};

export function CulturalDesignGuidelines() {
  const [selectedCulture, setSelectedCulture] = useState('malay');

  return (
    <div className="space-y-6">
      <Card className="architect-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Malaysian Cultural Design Guidelines
          </CardTitle>
          <CardDescription>
            Comprehensive guidelines for culturally-sensitive and climate-appropriate design in Malaysia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cultural" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cultural">Cultural Guidelines</TabsTrigger>
              <TabsTrigger value="climate">Climate Design</TabsTrigger>
              <TabsTrigger value="festivals">Festival Planning</TabsTrigger>
            </TabsList>

            {/* Cultural Guidelines Tab */}
            <TabsContent value="cultural" className="space-y-4">
              <div className="flex gap-2 mb-4">
                {Object.keys(culturalGuidelines).map((culture) => (
                  <Button
                    key={culture}
                    variant={selectedCulture === culture ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCulture(culture)}
                    className="capitalize"
                  >
                    {culture === 'peranakan' ? 'Peranakan' : culture}
                  </Button>
                ))}
              </div>

              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {/* Spatial Guidelines */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Spatial Planning Guidelines
                    </h3>
                    <div className="space-y-3">
                      {culturalGuidelines[selectedCulture as keyof typeof culturalGuidelines].spatial.map((item, idx) => (
                        <Card key={idx} className="architect-border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{item.guideline}</p>
                                <p className="text-sm text-gray-600 mt-1">{item.explanation}</p>
                              </div>
                              <Badge 
                                variant={
                                  item.importance === 'mandatory' ? 'destructive' :
                                  item.importance === 'recommended' ? 'default' : 'secondary'
                                }
                              >
                                {item.importance}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Color Guidelines */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Color Significance & Usage
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {culturalGuidelines[selectedCulture as keyof typeof culturalGuidelines].colors.map((color, idx) => (
                        <Card key={idx} className="architect-border">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div 
                                className="w-12 h-12 rounded border-2 border-gray-300"
                                style={{ 
                                  backgroundColor: color.color.toLowerCase().includes('gold') ? '#FFD700' :
                                    color.color.toLowerCase().includes('red') ? '#DC143C' :
                                    color.color.toLowerCase().includes('green') ? '#228B22' :
                                    color.color.toLowerCase().includes('white') ? '#FFFFFF' :
                                    color.color.toLowerCase().includes('black') ? '#000000' :
                                    color.color.toLowerCase().includes('orange') ? '#FF6347' :
                                    color.color.toLowerCase().includes('yellow') ? '#FFD700' :
                                    color.color.toLowerCase().includes('turquoise') ? '#40E0D0' :
                                    color.color.toLowerCase().includes('pink') ? '#FF1493' :
                                    '#808080'
                                }}
                              />
                              <div className="flex-1">
                                <h4 className="font-medium">{color.color}</h4>
                                <p className="text-sm text-gray-600">{color.meaning}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  <strong>Use in:</strong> {color.usage}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Recommended Materials</h3>
                    <div className="flex flex-wrap gap-2">
                      {culturalGuidelines[selectedCulture as keyof typeof culturalGuidelines].materials.map((material, idx) => (
                        <Badge key={idx} variant="outline" className="py-1">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Taboos */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cultural Sensitivities to Avoid:</strong>
                      <ul className="mt-2 space-y-1">
                        {culturalGuidelines[selectedCulture as keyof typeof culturalGuidelines].taboos.map((taboo, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <XCircle className="h-3 w-3 text-red-500" />
                            <span className="text-sm">{taboo}</span>
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Climate Design Tab */}
            <TabsContent value="climate" className="space-y-4">
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Malaysia's tropical climate requires specific design adaptations for comfort and durability.
                  Average temperature: 25-35°C | Humidity: 70-90% | Annual rainfall: 2000-2500mm
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(climateGuidelines).map(([key, section]) => {
                  const Icon = section.icon;
                  return (
                    <Card key={key} className="architect-border">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {section.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {section.guidelines.map((guideline, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{guideline}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base">Regional Climate Variations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <strong className="text-sm">East Coast (Kelantan, Terengganu, Pahang):</strong>
                      <p className="text-sm text-gray-600">Heavy monsoon Nov-Mar. Design for flooding and strong winds.</p>
                    </div>
                    <div>
                      <strong className="text-sm">Highlands (Cameron, Genting):</strong>
                      <p className="text-sm text-gray-600">Cooler climate (15-25°C). Consider insulation and heating options.</p>
                    </div>
                    <div>
                      <strong className="text-sm">Coastal Areas:</strong>
                      <p className="text-sm text-gray-600">High salt exposure. Use corrosion-resistant materials.</p>
                    </div>
                    <div>
                      <strong className="text-sm">Urban Centers (KL, Penang):</strong>
                      <p className="text-sm text-gray-600">Heat island effect. Maximize green spaces and shading.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Festival Planning Tab */}
            <TabsContent value="festivals" className="space-y-4">
              <Alert className="mb-4">
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  Malaysian homes often host large gatherings during festivals. Design flexible spaces that can accommodate these cultural celebrations.
                </AlertDescription>
              </Alert>

              <Accordion type="single" collapsible className="w-full">
                {Object.entries(festivalConsiderations).map(([key, festival]) => {
                  const Icon = festival.icon;
                  return (
                    <AccordionItem key={key} value={key}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {festival.name}
                          <Badge variant="outline" className="ml-2">
                            {festival.period}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <div>
                            <h4 className="font-medium mb-2">Space Requirements</h4>
                            <ul className="space-y-1">
                              {festival.spaceNeeds.map((need, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  {need}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Design Features to Include</h4>
                            <ul className="space-y-1">
                              {festival.designFeatures.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <Star className="h-3 w-3 text-yellow-600" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-base">Multi-Cultural Celebration Spaces</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-3">
                    For multi-cultural families or commercial spaces, consider these universal features:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                      Neutral base colors with changeable accent decorations
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                      Flexible furniture arrangements with modular pieces
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                      Multiple storage areas for different festival decorations
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                      Adaptable lighting systems for various moods
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                      Easy-maintenance surfaces for frequent entertaining
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}