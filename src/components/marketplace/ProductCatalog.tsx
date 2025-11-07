import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  ShoppingCart, 
  Heart, 
  Eye, 
  MapPin,
  Clock,
  Package,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { marketplaceService } from '@/services/marketplace.service';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  supplier: {
    id: string;
    name: string;
    verified: boolean;
    rating: number;
    location: string;
    responseTime: string;
    minOrder: number;
  };
  pricing: {
    price: number;
    unit: string;
    currency: string;
    discount?: number;
    bulkPricing?: Array<{ quantity: number; price: number }>;
    negotiable: boolean;
  };
  specifications: Record<string, string>;
  certifications: string[];
  availability: {
    inStock: boolean;
    quantity: number;
    locations: string[];
  };
  images: string[];
  videos?: string[];
  documents?: Array<{ name: string; type: string; url: string }>;
  ratings: {
    overall: number;
    quality: number;
    value: number;
    delivery: number;
    reviews: number;
  };
  tags: string[];
  featured: boolean;
  trending: boolean;
  sustainable: boolean;
  madeInMalaysia: boolean;
}

interface ProductFilters {
  category: string;
  subcategory: string;
  priceRange: string;
  location: string;
  certification: string;
  availability: string;
  madeInMalaysia: boolean;
  sustainable: boolean;
}

export const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    category: 'all',
    subcategory: 'all',
    priceRange: 'all',
    location: 'all',
    certification: 'all',
    availability: 'all',
    madeInMalaysia: false,
    sustainable: false
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters, searchQuery]);

  const fetchProducts = async () => {
    try {
      setIsLoadingData(true);
      const data = await marketplaceService.getAllProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setIsLoadingData(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Subcategory filter
    if (filters.subcategory !== 'all') {
      filtered = filtered.filter(product => product.subcategory === filters.subcategory);
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        const price = product.pricing.price;
        if (filters.priceRange === '1000+') return price >= 1000;
        return price >= min && price <= max;
      });
    }

    // Location filter
    if (filters.location !== 'all') {
      filtered = filtered.filter(product => 
        product.availability.locations.includes(filters.location)
      );
    }

    // Certification filter
    if (filters.certification !== 'all') {
      filtered = filtered.filter(product => 
        product.certifications.includes(filters.certification)
      );
    }

    // Availability filter
    if (filters.availability !== 'all') {
      if (filters.availability === 'inStock') {
        filtered = filtered.filter(product => product.availability.inStock);
      } else if (filters.availability === 'outOfStock') {
        filtered = filtered.filter(product => !product.availability.inStock);
      }
    }

    // Made in Malaysia filter
    if (filters.madeInMalaysia) {
      filtered = filtered.filter(product => product.madeInMalaysia);
    }

    // Sustainable filter
    if (filters.sustainable) {
      filtered = filtered.filter(product => product.sustainable);
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      setIsLoading(true);
      await marketplaceService.addToCart(product.id, 1);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWishlist = async (product: Product) => {
    try {
      setIsLoading(true);
      await marketplaceService.addToWishlist(product.id);
      toast.success(`${product.name} added to wishlist`);
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      toast.error('Failed to add to wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupplier = async (product: Product) => {
    try {
      setIsLoading(true);
      await marketplaceService.contactSupplier(product.supplier.id, {
        productId: product.id,
        message: `I'm interested in ${product.name}`
      });
      toast.success('Message sent to supplier');
    } catch (error) {
      console.error('Failed to contact supplier:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceDisplay = (product: Product) => {
    const { price, discount, currency } = product.pricing;
    if (discount) {
      const discountedPrice = price * (1 - discount / 100);
      return (
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-green-600">
            {currency} {discountedPrice.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500 line-through">
            {currency} {price.toFixed(2)}
          </span>
          <Badge variant="secondary" className="text-xs">
            -{discount}%
          </Badge>
        </div>
      );
    }
    return (
      <span className="text-lg font-bold">
        {currency} {price.toFixed(2)}
      </span>
    );
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
          <p className="text-gray-600">Loading product catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Catalog</h1>
          <p className="text-gray-600">Discover quality building materials and supplies</p>
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
              <Label htmlFor="search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, brand, or specifications..."
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
                  priceRange: 'all',
                  location: 'all',
                  certification: 'all',
                  availability: 'all',
                  madeInMalaysia: false,
                  sustainable: false
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
                    <SelectItem value="materials">Building Materials</SelectItem>
                    <SelectItem value="tools">Tools & Equipment</SelectItem>
                    <SelectItem value="finishes">Finishes & Coatings</SelectItem>
                    <SelectItem value="furniture">Furniture & Fixtures</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priceRange">Price Range</Label>
                <Select value={filters.priceRange} onValueChange={(value) => setFilters({...filters, priceRange: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Prices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="0-100">RM 0 - 100</SelectItem>
                    <SelectItem value="100-500">RM 100 - 500</SelectItem>
                    <SelectItem value="500-1000">RM 500 - 1000</SelectItem>
                    <SelectItem value="1000+">RM 1000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Select value={filters.location} onValueChange={(value) => setFilters({...filters, location: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Kuala Lumpur">Kuala Lumpur</SelectItem>
                    <SelectItem value="Selangor">Selangor</SelectItem>
                    <SelectItem value="Penang">Penang</SelectItem>
                    <SelectItem value="Johor">Johor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="madeInMalaysia"
                    checked={filters.madeInMalaysia}
                    onChange={(e) => setFilters({...filters, madeInMalaysia: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="madeInMalaysia" className="text-sm">Made in Malaysia</Label>
                </div>
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <Select defaultValue="featured">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="p-4 pb-2">
                <div className="relative">
                  <img
                    src={product.images[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {product.featured && (
                    <Badge className="absolute top-2 left-2 bg-blue-600">Featured</Badge>
                  )}
                  {product.trending && (
                    <Badge className="absolute top-2 right-2 bg-orange-600">Trending</Badge>
                  )}
                  {product.madeInMalaysia && (
                    <Badge className="absolute bottom-2 left-2 bg-green-600">🇲🇾 Made in Malaysia</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToWishlist(product);
                      }}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center space-x-1">
                    {getRatingStars(product.ratings.overall)}
                    <span className="text-xs text-gray-600 ml-1">
                      ({product.ratings.reviews})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span>{product.brand}</span>
                    <span>•</span>
                    <span>{product.category}</span>
                  </div>

                  {getPriceDisplay(product)}

                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span>{product.supplier.location}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{product.supplier.responseTime}</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={isLoading}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
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
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <img
                    src={product.images[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddToWishlist(product)}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {getRatingStars(product.ratings.overall)}
                      <span className="text-sm text-gray-600 ml-1">
                        ({product.ratings.reviews} reviews)
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span><strong>Brand:</strong> {product.brand}</span>
                      <span><strong>Category:</strong> {product.category}</span>
                      <span><strong>Location:</strong> {product.supplier.location}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      {getPriceDisplay(product)}
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={isLoading}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Detail Dialog */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
              <DialogDescription>{selectedProduct.description}</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Images */}
              <div className="space-y-4">
                <img
                  src={selectedProduct.images[0] || '/placeholder-product.jpg'}
                  alt={selectedProduct.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {selectedProduct.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedProduct.images.slice(1).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${selectedProduct.name} ${index + 2}`}
                        className="w-full h-20 object-cover rounded cursor-pointer"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {getRatingStars(selectedProduct.ratings.overall)}
                  <span className="text-sm text-gray-600">
                    {selectedProduct.ratings.overall} ({selectedProduct.ratings.reviews} reviews)
                  </span>
                </div>

                {getPriceDisplay(selectedProduct)}

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Brand:</span>
                    <span className="text-sm">{selectedProduct.brand}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Category:</span>
                    <span className="text-sm">{selectedProduct.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Unit:</span>
                    <span className="text-sm">{selectedProduct.pricing.unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Specifications</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.certifications.map((cert) => (
                      <Badge key={cert} variant="secondary" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Supplier Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{selectedProduct.supplier.name}</span>
                      {selectedProduct.supplier.verified && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{selectedProduct.supplier.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Response time: {selectedProduct.supplier.responseTime}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span>Min order: {selectedProduct.supplier.minOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleAddToCart(selectedProduct)}
                    disabled={isLoading}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleContactSupplier(selectedProduct)}
                    disabled={isLoading}
                  >
                    Contact Supplier
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && !isLoadingData && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setFilters({
                category: 'all',
                subcategory: 'all',
                priceRange: 'all',
                location: 'all',
                certification: 'all',
                availability: 'all',
                madeInMalaysia: false,
                sustainable: false
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