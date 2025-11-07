// Design System Showcase - Daritana Architecture Platform
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  Heart, 
  Eye, 
  Download, 
  Play,
  MapPin,
  Calendar,
  User,
  Building2,
  Loader2,
  Award,
  TrendingUp,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { designShowcaseService } from '@/services/designShowcase.service';

interface Design {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  style: string;
  location: string;
  area: number;
  unit: string;
  budget: number;
  currency: string;
  completionDate: string;
  architect: {
    id: string;
    name: string;
    company: string;
    avatar: string;
    rating: number;
    verified: boolean;
  };
  images: string[];
  videos?: string[];
  documents?: Array<{ name: string; type: string; url: string }>;
  tags: string[];
  featured: boolean;
  trending: boolean;
  sustainable: boolean;
  awards: string[];
  likes: number;
  views: number;
  downloads: number;
  isLiked: boolean;
  isSaved: boolean;
}

interface DesignFilters {
  category: string;
  subcategory: string;
  style: string;
  location: string;
  budgetRange: string;
  areaRange: string;
  sustainable: boolean;
  featured: boolean;
}

export const DesignShowcase: React.FC = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [filteredDesigns, setFilteredDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DesignFilters>({
    category: 'all',
    subcategory: 'all',
    style: 'all',
    location: 'all',
    budgetRange: 'all',
    areaRange: 'all',
    sustainable: false,
    featured: false
  });
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [designs, filters, searchQuery]);

  const fetchDesigns = async () => {
    try {
      setIsLoadingData(true);
      const data = await designShowcaseService.getAllDesigns();
      setDesigns(data || []);
    } catch (error) {
      console.error('Failed to fetch designs:', error);
      toast.error('Failed to fetch designs');
    } finally {
      setIsLoadingData(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...designs];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(design =>
        design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.architect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(design => design.category === filters.category);
    }

    // Subcategory filter
    if (filters.subcategory !== 'all') {
      filtered = filtered.filter(design => design.subcategory === filters.subcategory);
    }

    // Style filter
    if (filters.style !== 'all') {
      filtered = filtered.filter(design => design.style === filters.style);
    }

    // Location filter
    if (filters.location !== 'all') {
      filtered = filtered.filter(design => design.location === filters.location);
    }

    // Budget range filter
    if (filters.budgetRange !== 'all') {
      const [min, max] = filters.budgetRange.split('-').map(Number);
      filtered = filtered.filter(design => {
        const budget = design.budget;
        if (filters.budgetRange === '1000000+') return budget >= 1000000;
        return budget >= min && budget <= max;
      });
    }

    // Area range filter
    if (filters.areaRange !== 'all') {
      const [min, max] = filters.areaRange.split('-').map(Number);
      filtered = filtered.filter(design => {
        const area = design.area;
        if (filters.areaRange === '10000+') return area >= 10000;
        return area >= min && area <= max;
      });
    }

    // Sustainable filter
    if (filters.sustainable) {
      filtered = filtered.filter(design => design.sustainable);
    }

    // Featured filter
    if (filters.featured) {
      filtered = filtered.filter(design => design.featured);
    }

    setFilteredDesigns(filtered);
  };

  const handleLikeDesign = async (design: Design) => {
    try {
      setIsLoading(true);
      if (design.isLiked) {
        await designShowcaseService.unlikeDesign(design.id);
        toast.success('Design unliked');
      } else {
        await designShowcaseService.likeDesign(design.id);
        toast.success('Design liked');
      }
      // Refresh designs to update like status
      fetchDesigns();
    } catch (error) {
      console.error('Failed to update like status:', error);
      toast.error('Failed to update like status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDesign = async (design: Design) => {
    try {
      setIsLoading(true);
      if (design.isSaved) {
        await designShowcaseService.unsaveDesign(design.id);
        toast.success('Design removed from saved');
      } else {
        await designShowcaseService.saveDesign(design.id);
        toast.success('Design saved');
      }
      // Refresh designs to update save status
      fetchDesigns();
    } catch (error) {
      console.error('Failed to update save status:', error);
      toast.error('Failed to update save status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadDesign = async (design: Design) => {
    try {
      setIsLoading(true);
      await designShowcaseService.downloadDesign(design.id);
      toast.success('Design download started');
    } catch (error) {
      console.error('Failed to download design:', error);
      toast.error('Failed to download design');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactArchitect = async (design: Design) => {
    try {
      setIsLoading(true);
      await designShowcaseService.contactArchitect(design.architect.id, {
        designId: design.id,
        message: `I'm interested in your design: ${design.title}`
      });
      toast.success('Message sent to architect');
    } catch (error) {
      console.error('Failed to contact architect:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading design showcase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Design Showcase</h1>
          <p className="text-gray-600">Discover inspiring architectural and design projects</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Designs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title, description, or architect..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end space-x-2">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" onClick={() => {
                setFilters({
                  category: 'all',
                  subcategory: 'all',
                  style: 'all',
                  location: 'all',
                  budgetRange: 'all',
                  areaRange: 'all',
                  sustainable: false,
                  featured: false
                });
                setSearchQuery('');
              }}>
                Clear All
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="style">Style</Label>
                <Select value={filters.style} onValueChange={(value) => setFilters({...filters, style: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Styles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Styles</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="traditional">Traditional</SelectItem>
                    <SelectItem value="contemporary">Contemporary</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="budgetRange">Budget Range</Label>
                <Select value={filters.budgetRange} onValueChange={(value) => setFilters({...filters, budgetRange: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Budgets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Budgets</SelectItem>
                    <SelectItem value="0-100000">RM 0 - 100,000</SelectItem>
                    <SelectItem value="100000-500000">RM 100,000 - 500,000</SelectItem>
                    <SelectItem value="500000-1000000">RM 500,000 - 1,000,000</SelectItem>
                    <SelectItem value="1000000+">RM 1,000,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="areaRange">Area Range</Label>
                <Select value={filters.areaRange} onValueChange={(value) => setFilters({...filters, areaRange: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    <SelectItem value="0-1000">0 - 1,000 sqft</SelectItem>
                    <SelectItem value="1000-5000">1,000 - 5,000 sqft</SelectItem>
                    <SelectItem value="5000-10000">5,000 - 10,000 sqft</SelectItem>
                    <SelectItem value="10000+">10,000+ sqft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sustainable"
                    checked={filters.sustainable}
                    onChange={(e) => setFilters({...filters, sustainable: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="sustainable" className="text-sm">Sustainable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={filters.featured}
                    onChange={(e) => setFilters({...filters, featured: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="featured" className="text-sm">Featured</Label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredDesigns.length} of {designs.length} designs
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <Select defaultValue="featured">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Designs Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDesigns.map((design) => (
            <Card key={design.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="p-4 pb-2">
                <div className="relative">
                  <img
                    src={design.images[0] || '/placeholder-design.jpg'}
                    alt={design.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {design.featured && (
                    <Badge className="absolute top-2 left-2 bg-blue-600">Featured</Badge>
                  )}
                  {design.trending && (
                    <Badge className="absolute top-2 right-2 bg-orange-600">Trending</Badge>
                  )}
                  {design.sustainable && (
                    <Badge className="absolute bottom-2 left-2 bg-green-600">Sustainable</Badge>
                  )}
                  {design.awards.length > 0 && (
                    <Badge className="absolute bottom-2 right-2 bg-yellow-600">
                      <Award className="w-3 h-3 mr-1" />
                      {design.awards.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm line-clamp-2">{design.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveDesign(design);
                      }}
                    >
                      <Heart className={`w-4 h-4 ${design.isSaved ? 'text-red-500 fill-current' : ''}`} />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-600 line-clamp-2">{design.description}</p>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span>{design.category}</span>
                    <span>•</span>
                    <span>{design.style}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span>{design.location}</span>
                    <span>•</span>
                    <span>{design.area} {design.unit}</span>
                  </div>

                  <div className="text-sm font-medium">
                    {design.currency} {design.budget.toLocaleString()}
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <User className="w-3 h-3" />
                    <span>{design.architect.name}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      {getRatingStars(design.architect.rating)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span>{design.likes} likes</span>
                      <span>{design.views} views</span>
                    </div>
                    <span>{design.downloads} downloads</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeDesign(design);
                      }}
                      disabled={isLoading}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${design.isLiked ? 'text-red-500 fill-current' : ''}`} />
                      {design.isLiked ? 'Liked' : 'Like'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDesign(design);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDesigns.map((design) => (
            <Card key={design.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <img
                    src={design.images[0] || '/placeholder-design.jpg'}
                    alt={design.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{design.title}</h3>
                        <p className="text-sm text-gray-600">{design.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveDesign(design)}
                        >
                          <Heart className={`w-4 h-4 ${design.isSaved ? 'text-red-500 fill-current' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDesign(design)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span><strong>Category:</strong> {design.category}</span>
                      <span><strong>Style:</strong> {design.style}</span>
                      <span><strong>Location:</strong> {design.location}</span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span><strong>Area:</strong> {design.area} {design.unit}</span>
                      <span><strong>Budget:</strong> {design.currency} {design.budget.toLocaleString()}</span>
                      <span><strong>Architect:</strong> {design.architect.name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{design.likes} likes</span>
                        <span>{design.views} views</span>
                        <span>{design.downloads} downloads</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleLikeDesign(design)}
                        disabled={isLoading}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${design.isLiked ? 'text-red-500 fill-current' : ''}`} />
                        {design.isLiked ? 'Liked' : 'Like'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Design Detail Dialog */}
      {selectedDesign && (
        <Dialog open={!!selectedDesign} onOpenChange={() => setSelectedDesign(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedDesign.title}</DialogTitle>
              <DialogDescription>{selectedDesign.description}</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Design Images */}
              <div className="space-y-4">
                <img
                  src={selectedDesign.images[0] || '/placeholder-design.jpg'}
                  alt={selectedDesign.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {selectedDesign.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedDesign.images.slice(1).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${selectedDesign.title} ${index + 2}`}
                        className="w-full h-20 object-cover rounded cursor-pointer"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Design Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Category:</span>
                    <Badge variant="secondary">{selectedDesign.category}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Style:</span>
                    <Badge variant="secondary">{selectedDesign.style}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm">{selectedDesign.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Area:</span>
                    <span className="text-sm">{selectedDesign.area} {selectedDesign.unit}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Budget:</span>
                    <span className="text-sm font-bold">{selectedDesign.currency} {selectedDesign.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Completion:</span>
                    <span className="text-sm">{new Date(selectedDesign.completionDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDesign.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedDesign.awards.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Awards & Recognition</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDesign.awards.map((award) => (
                        <Badge key={award} variant="secondary" className="text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          {award}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium">Architect Information</h4>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={selectedDesign.architect.avatar || '/placeholder-avatar.jpg'}
                      alt={selectedDesign.architect.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{selectedDesign.architect.name}</span>
                        {selectedDesign.architect.verified && (
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{selectedDesign.architect.company}</div>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(selectedDesign.architect.rating)}
                        <span className="text-sm text-gray-600 ml-1">
                          ({selectedDesign.architect.rating})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleLikeDesign(selectedDesign)}
                    disabled={isLoading}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${selectedDesign.isLiked ? 'text-red-500 fill-current' : ''}`} />
                    {selectedDesign.isLiked ? 'Liked' : 'Like'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadDesign(selectedDesign)}
                    disabled={isLoading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleContactArchitect(selectedDesign)}
                    disabled={isLoading}
                  >
                    Contact Architect
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Empty State */}
      {filteredDesigns.length === 0 && !isLoadingData && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No designs found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setFilters({
                category: 'all',
                subcategory: 'all',
                style: 'all',
                location: 'all',
                budgetRange: 'all',
                areaRange: 'all',
                sustainable: false,
                featured: false
              });
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesignShowcase;