import { apiClient } from './api';

// Types for marketplace entities
export interface MarketplaceVendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  logo?: string;
  website?: string;
  category: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
  specialties: string[];
  certifications: string[];
  serviceAreas: string[];
  businessLicense?: string;
  taxId?: string;
  joinedAt: Date;
  lastActiveAt?: Date;
}

export interface MarketplaceProduct {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  currency: string;
  unit: string;
  minQuantity: number;
  maxQuantity?: number;
  images: string[];
  specifications: Record<string, any>;
  tags: string[];
  isActive: boolean;
  isAvailable: boolean;
  leadTime: number; // days
  warranty?: string;
  certifications: string[];
  createdAt: Date;
  updatedAt: Date;
  vendor: {
    id: string;
    name: string;
    rating: number;
    isVerified: boolean;
  };
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  product: MarketplaceProduct;
}

export interface ShoppingCart {
  id: string;
  userId: string;
  organizationId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  currency: string;
  updatedAt: Date;
}

export interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  userId: string;
  organizationId: string;
  vendorId: string;
  projectId?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      name: string;
      images: string[];
    };
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  totalAmount: number;
  currency: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  vendor: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface MarketplaceQuote {
  id: string;
  requestId: string;
  vendorId: string;
  projectId?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specifications?: Record<string, any>;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  totalAmount: number;
  currency: string;
  validUntil: Date;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired';
  terms?: string;
  notes?: string;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  vendor: {
    id: string;
    name: string;
    rating: number;
    isVerified: boolean;
  };
}

export interface MarketplaceAnalytics {
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  topCategories: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  topVendors: Array<{
    vendor: MarketplaceVendor;
    orderCount: number;
    revenue: number;
  }>;
  orderTrends: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  averageOrderValue: number;
  conversionRate: number;
}

// ==================== VENDOR API ====================

export const vendorAPI = {
  async getAll(params?: {
    search?: string;
    category?: string;
    isVerified?: boolean;
    isActive?: boolean;
    location?: string;
    rating?: number;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/marketplace/vendors', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/marketplace/vendors/${id}`);
    return response.data;
  },

  async search(query: string, filters?: {
    category?: string;
    location?: string;
    rating?: number;
  }) {
    const response = await apiClient.get('/marketplace/vendors/search', {
      params: { query, ...filters }
    });
    return response.data;
  },

  async create(vendor: Omit<MarketplaceVendor, 'id' | 'rating' | 'reviewCount' | 'joinedAt'>) {
    const response = await apiClient.post('/marketplace/vendors', vendor);
    return response.data;
  },

  async update(id: string, updates: Partial<MarketplaceVendor>) {
    const response = await apiClient.put(`/marketplace/vendors/${id}`, updates);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/marketplace/vendors/${id}`);
    return response.data;
  },

  async verify(id: string, verificationData: {
    businessLicense: string;
    taxId: string;
    certifications: string[];
  }) {
    const response = await apiClient.patch(`/marketplace/vendors/${id}/verify`, verificationData);
    return response.data;
  },

  async getAnalytics(id: string, params?: { timeframe?: string }) {
    const response = await apiClient.get(`/marketplace/vendors/${id}/analytics`, { params });
    return response.data;
  }
};

// ==================== PRODUCT API ====================

export const productAPI = {
  async getAll(params?: {
    search?: string;
    category?: string;
    subcategory?: string;
    vendorId?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    isAvailable?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'price' | 'rating' | 'name' | 'created';
    sortOrder?: 'asc' | 'desc';
  }) {
    const response = await apiClient.get('/marketplace/products', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/marketplace/products/${id}`);
    return response.data;
  },

  async search(query: string, filters?: {
    category?: string;
    priceRange?: [number, number];
    vendorId?: string;
  }) {
    const response = await apiClient.get('/marketplace/products/search', {
      params: { query, ...filters }
    });
    return response.data;
  },

  async getCategories() {
    const response = await apiClient.get('/marketplace/products/categories');
    return response.data;
  },

  async compare(productIds: string[]) {
    const response = await apiClient.post('/marketplace/products/compare', { productIds });
    return response.data;
  },

  async getRecommendations(productId: string, limit?: number) {
    const response = await apiClient.get(`/marketplace/products/${productId}/recommendations`, {
      params: { limit }
    });
    return response.data;
  }
};

// ==================== CART API ====================

export const cartAPI = {
  async get() {
    const response = await apiClient.get('/marketplace/cart');
    return response.data;
  },

  async getSummary() {
    const response = await apiClient.get('/marketplace/cart/summary');
    return response.data;
  },

  async addItem(item: {
    productId: string;
    quantity: number;
    notes?: string;
  }) {
    const response = await apiClient.post('/marketplace/cart/items', item);
    return response.data;
  },

  async updateItem(itemId: string, updates: {
    quantity?: number;
    notes?: string;
  }) {
    const response = await apiClient.put(`/marketplace/cart/items/${itemId}`, updates);
    return response.data;
  },

  async removeItem(itemId: string) {
    const response = await apiClient.delete(`/marketplace/cart/items/${itemId}`);
    return response.data;
  },

  async clear() {
    const response = await apiClient.delete('/marketplace/cart');
    return response.data;
  },

  async validate() {
    const response = await apiClient.post('/marketplace/cart/validate');
    return response.data;
  },

  async checkout(checkoutData: {
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    billingAddress?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    paymentMethod: string;
    notes?: string;
  }) {
    const response = await apiClient.post('/marketplace/cart/checkout', checkoutData);
    return response.data;
  }
};

// ==================== ORDER API ====================

export const orderAPI = {
  async getAll(params?: {
    status?: string;
    vendorId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/marketplace/orders', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/marketplace/orders/${id}`);
    return response.data;
  },

  async update(id: string, updates: Partial<MarketplaceOrder>) {
    const response = await apiClient.put(`/marketplace/orders/${id}`, updates);
    return response.data;
  },

  async cancel(id: string, reason: string) {
    const response = await apiClient.patch(`/marketplace/orders/${id}/cancel`, { reason });
    return response.data;
  },

  async getTracking(id: string) {
    const response = await apiClient.get(`/marketplace/orders/${id}/tracking`);
    return response.data;
  },

  async updateOrderItem(orderId: string, itemId: string, updates: {
    quantity?: number;
    unitPrice?: number;
  }) {
    const response = await apiClient.put(`/marketplace/orders/${orderId}/items/${itemId}`, updates);
    return response.data;
  },

  async bulkUpdate(updates: Array<{
    orderId: string;
    status?: string;
    trackingNumber?: string;
  }>) {
    const response = await apiClient.patch('/marketplace/orders/bulk-update', { updates });
    return response.data;
  },

  async getAnalytics(params?: { timeframe?: string; vendorId?: string }) {
    const response = await apiClient.get('/marketplace/orders/analytics', { params });
    return response.data;
  }
};

// ==================== QUOTE API ====================

export const quoteAPI = {
  async getAll(params?: {
    status?: string;
    vendorId?: string;
    projectId?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/marketplace/quotes', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/marketplace/quotes/${id}`);
    return response.data;
  },

  async create(quote: Omit<MarketplaceQuote, 'id' | 'createdAt' | 'updatedAt' | 'vendor'>) {
    const response = await apiClient.post('/marketplace/quotes', quote);
    return response.data;
  },

  async update(id: string, updates: Partial<MarketplaceQuote>) {
    const response = await apiClient.put(`/marketplace/quotes/${id}`, updates);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/marketplace/quotes/${id}`);
    return response.data;
  },

  async send(id: string, recipients: string[]) {
    const response = await apiClient.post(`/marketplace/quotes/${id}/send`, { recipients });
    return response.data;
  },

  async accept(id: string, notes?: string) {
    const response = await apiClient.post(`/marketplace/quotes/${id}/accept`, { notes });
    return response.data;
  },

  async reject(id: string, reason: string) {
    const response = await apiClient.post(`/marketplace/quotes/${id}/reject`, { reason });
    return response.data;
  },

  async getAnalytics(params?: { timeframe?: string; vendorId?: string }) {
    const response = await apiClient.get('/marketplace/quotes/analytics', { params });
    return response.data;
  }
};

// ==================== COMBINED MARKETPLACE API ====================

export const marketplaceAPI = {
  vendors: vendorAPI,
  products: productAPI,
  cart: cartAPI,
  orders: orderAPI,
  quotes: quoteAPI,

  // Convenience methods
  async getMarketplaceOverview() {
    const [vendors, products, orders] = await Promise.all([
      vendorAPI.getAll({ limit: 10, isActive: true }),
      productAPI.getAll({ limit: 20, isAvailable: true }),
      orderAPI.getAll({ limit: 10 })
    ]);

    return {
      vendors: vendors.vendors || [],
      products: products.products || [],
      orders: orders.orders || []
    };
  },

  async getMarketplaceAnalytics(timeframe?: string) {
    const response = await apiClient.get('/marketplace/analytics', {
      params: { timeframe }
    });
    return response.data as MarketplaceAnalytics;
  },

  async searchMarketplace(query: string, type: 'vendors' | 'products' = 'products') {
    if (type === 'vendors') {
      return vendorAPI.search(query);
    } else {
      return productAPI.search(query);
    }
  },

  async getFeaturedProducts(limit: number = 10) {
    const response = await productAPI.getAll({
      sortBy: 'rating',
      sortOrder: 'desc',
      limit,
      isAvailable: true
    });
    return response.products || [];
  },

  async getTopVendors(limit: number = 10) {
    const response = await vendorAPI.getAll({
      sortBy: 'rating',
      sortOrder: 'desc',
      limit,
      isVerified: true,
      isActive: true
    });
    return response.vendors || [];
  },

  async getOrderHistory(userId?: string) {
    const response = await orderAPI.getAll({
      page: 1,
      limit: 50
    });
    return response.orders || [];
  },

  async getActiveQuotes() {
    const response = await quoteAPI.getAll({
      status: 'submitted',
      limit: 20
    });
    return response.quotes || [];
  }
};

export default marketplaceAPI;