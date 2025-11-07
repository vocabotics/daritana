import { api } from '@/lib/api';

export interface Product {
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

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: Date;
}

export interface SupplierMessage {
  productId: string;
  message: string;
  quantity?: number;
  expectedDelivery?: string;
}

class MarketplaceService {
  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await api.get<Product[]>('/marketplace/products');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product> {
    try {
      const response = await api.get<Product>(`/marketplace/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch product ${id}:`, error);
      throw error;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await api.get<Product[]>(`/marketplace/products/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search products:', error);
      throw error;
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const response = await api.get<Product[]>(`/marketplace/products/category/${encodeURIComponent(category)}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch products by category ${category}:`, error);
      throw error;
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const response = await api.get<Product[]>('/marketplace/products/featured');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      throw error;
    }
  }

  async getTrendingProducts(): Promise<Product[]> {
    try {
      const response = await api.get<Product[]>('/marketplace/products/trending');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trending products:', error);
      throw error;
    }
  }

  async getProductsBySupplier(supplierId: string): Promise<Product[]> {
    try {
      const response = await api.get<Product[]>(`/marketplace/products/supplier/${supplierId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch products by supplier ${supplierId}:`, error);
      throw error;
    }
  }

  // Cart operations
  async getCart(): Promise<CartItem[]> {
    try {
      const response = await api.get<CartItem[]>('/marketplace/cart');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      throw error;
    }
  }

  async addToCart(productId: string, quantity: number): Promise<CartItem> {
    try {
      const response = await api.post<CartItem>('/marketplace/cart', { productId, quantity });
      return response.data;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  }

  async updateCartItem(itemId: string, quantity: number): Promise<CartItem> {
    try {
      const response = await api.put<CartItem>(`/marketplace/cart/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    }
  }

  async removeFromCart(itemId: string): Promise<void> {
    try {
      await api.delete(`/marketplace/cart/${itemId}`);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  }

  async clearCart(): Promise<void> {
    try {
      await api.delete('/marketplace/cart');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  }

  // Wishlist operations
  async getWishlist(): Promise<WishlistItem[]> {
    try {
      const response = await api.get<WishlistItem[]>('/marketplace/wishlist');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      throw error;
    }
  }

  async addToWishlist(productId: string): Promise<WishlistItem> {
    try {
      const response = await api.post<WishlistItem>('/marketplace/wishlist', { productId });
      return response.data;
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      throw error;
    }
  }

  async removeFromWishlist(productId: string): Promise<void> {
    try {
      await api.delete(`/marketplace/wishlist/${productId}`);
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      throw error;
    }
  }

  // Supplier communication
  async contactSupplier(supplierId: string, message: SupplierMessage): Promise<any> {
    try {
      const response = await api.post<any>(`/marketplace/suppliers/${supplierId}/contact`, message);
      return response.data;
    } catch (error) {
      console.error('Failed to contact supplier:', error);
      throw error;
    }
  }

  async getSupplierDetails(supplierId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/marketplace/suppliers/${supplierId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch supplier details ${supplierId}:`, error);
      throw error;
    }
  }

  async getSuppliers(): Promise<any[]> {
    try {
      const response = await api.get<any[]>('/marketplace/suppliers');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      throw error;
    }
  }

  // Product reviews and ratings
  async getProductReviews(productId: string): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`/marketplace/products/${productId}/reviews`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch product reviews ${productId}:`, error);
      throw error;
    }
  }

  async addProductReview(productId: string, review: any): Promise<any> {
    try {
      const response = await api.post<any>(`/marketplace/products/${productId}/reviews`, review);
      return response.data;
    } catch (error) {
      console.error('Failed to add product review:', error);
      throw error;
    }
  }

  // Product comparison
  async compareProducts(productIds: string[]): Promise<any[]> {
    try {
      const response = await api.post<any[]>('/marketplace/products/compare', { productIds });
      return response.data;
    } catch (error) {
      console.error('Failed to compare products:', error);
      throw error;
    }
  }

  // Export products
  async exportProducts(format: 'csv' | 'excel' = 'csv', filters?: any): Promise<Blob> {
    try {
      const response = await api.post(`/marketplace/products/export?format=${format}`, filters, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export products:', error);
      throw error;
    }
  }
}

export const marketplaceService = new MarketplaceService();