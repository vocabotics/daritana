import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { marketplaceAPI, MarketplaceProduct, MarketplaceVendor, ShoppingCart, MarketplaceOrder, MarketplaceQuote, CartItem as APICartItem } from '@/services/marketplaceAPI';
import { useDemoStore } from './demoStore';

export interface Bid {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  amount: number;
  message: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Project {
  id: string;
  title: string;
  description: string;
  client: string;
  budget: string;
  timeline: string;
  category: string;
  skills: string[];
  proposals: number;
  averageBid: number;
  status: 'open' | 'in_progress' | 'completed';
  postedDate: Date;
  bids: Bid[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  supplier: {
    id: string;
    name: string;
    verified: boolean;
  };
  specifications?: Record<string, string>;
  description?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'bid' | 'purchase' | 'hire';
  userId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  details: any;
}

interface MarketplaceStore {
  // Legacy marketplace data
  projects: Project[];
  userBids: Bid[];
  transactions: Transaction[];
  
  // New marketplace API data
  vendors: MarketplaceVendor[];
  products: MarketplaceProduct[];
  cart: ShoppingCart | null;
  orders: MarketplaceOrder[];
  quotes: MarketplaceQuote[];
  compareList: string[];
  
  // Loading states
  isLoading: boolean;
  isLoadingProducts: boolean;
  isLoadingVendors: boolean;
  isLoadingCart: boolean;
  isLoadingOrders: boolean;
  error: string | null;
  
  // Project/Bidding actions
  placeBid: (projectId: string, bid: Omit<Bid, 'id' | 'timestamp' | 'status'>) => void;
  updateBidStatus: (bidId: string, status: Bid['status']) => void;
  instantHire: (projectId: string, userId: string) => void;
  
  // API methods - Vendors
  fetchVendors: (params?: { search?: string; category?: string; isVerified?: boolean }) => Promise<void>;
  searchVendors: (query: string, filters?: { category?: string; location?: string; rating?: number }) => Promise<void>;
  
  // API methods - Products
  fetchProducts: (params?: { search?: string; category?: string; vendorId?: string }) => Promise<void>;
  searchProducts: (query: string, filters?: { category?: string; priceRange?: [number, number] }) => Promise<void>;
  getProductById: (id: string) => Promise<MarketplaceProduct | null>;
  
  // API methods - Cart
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number, notes?: string) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number, notes?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: (checkoutData: any) => Promise<void>;
  
  // API methods - Orders
  fetchOrders: (params?: { status?: string; vendorId?: string }) => Promise<void>;
  getOrderById: (id: string) => Promise<MarketplaceOrder | null>;
  updateOrder: (id: string, updates: Partial<MarketplaceOrder>) => Promise<void>;
  cancelOrder: (id: string, reason: string) => Promise<void>;
  
  // API methods - Quotes
  fetchQuotes: (params?: { status?: string; vendorId?: string }) => Promise<void>;
  createQuote: (quote: Omit<MarketplaceQuote, 'id' | 'createdAt' | 'updatedAt' | 'vendor'>) => Promise<void>;
  updateQuote: (id: string, updates: Partial<MarketplaceQuote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  sendQuote: (id: string, recipients: string[]) => Promise<void>;
  acceptQuote: (id: string, notes?: string) => Promise<void>;
  rejectQuote: (id: string, reason: string) => Promise<void>;
  
  // Analytics
  fetchMarketplaceAnalytics: (timeframe?: string) => Promise<any>;
  
  // Legacy cart methods (for backward compatibility)
  addToCartLegacy: (productId: string, quantity?: number) => void;
  removeFromCartLegacy: (productId: string) => void;
  updateCartQuantityLegacy: (productId: string, quantity: number) => void;
  clearCartLegacy: () => void;
  
  // Comparison actions
  addToCompare: (productId: string) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  
  // Transaction actions
  createTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => string;
  updateTransactionStatus: (transactionId: string, status: Transaction['status']) => void;
  
  // Supplier actions
  contactSupplier: (supplierId: string, message: string) => void;
  
  // Getters
  getCartTotal: () => number;
  getCartItems: () => (Product & { quantity: number })[];
  getCompareProducts: () => MarketplaceProduct[];
  getVendorById: (id: string) => MarketplaceVendor | undefined;
  getProductsByVendor: (vendorId: string) => MarketplaceProduct[];
  getOrdersByStatus: (status: string) => MarketplaceOrder[];
  getQuotesByStatus: (status: string) => MarketplaceQuote[];
  
  // Utility methods
  clearError: () => void;
  reset: () => void;
}

// Default empty data for initial state
const defaultProjects: Project[] = [];

const defaultProducts: Product[] = [];

export const useMarketplaceStore = create<MarketplaceStore>()(
  persist(
    (set, get) => ({
      // Legacy data
      projects: defaultProjects,
      userBids: [],
      transactions: [],
      
      // New API data
      vendors: [],
      products: [],
      cart: null,
      orders: [],
      quotes: [],
      compareList: [],
      
      // Loading states
      isLoading: false,
      isLoadingProducts: false,
      isLoadingVendors: false,
      isLoadingCart: false,
      isLoadingOrders: false,
      error: null,
      
      // Project/Bidding actions
      placeBid: (projectId, bid) => {
        const newBid: Bid = {
          ...bid,
          id: Date.now().toString(),
          timestamp: new Date(),
          status: 'pending',
        };
        
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                bids: [...project.bids, newBid],
                proposals: project.proposals + 1,
                averageBid: 
                  (project.averageBid * project.proposals + bid.amount) / 
                  (project.proposals + 1),
              };
            }
            return project;
          }),
          userBids: [...state.userBids, newBid],
        }));
        
        // Create transaction
        get().createTransaction({
          type: 'bid',
          userId: bid.userId,
          amount: bid.amount,
          status: 'pending',
          details: { projectId, bidId: newBid.id },
        });
      },
      
      updateBidStatus: (bidId, status) => {
        set((state) => ({
          userBids: state.userBids.map((bid) =>
            bid.id === bidId ? { ...bid, status } : bid
          ),
          projects: state.projects.map((project) => ({
            ...project,
            bids: project.bids.map((bid) =>
              bid.id === bidId ? { ...bid, status } : bid
            ),
          })),
        }));
      },
      
      instantHire: (projectId, userId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (project) {
          const transactionId = get().createTransaction({
            type: 'hire',
            userId,
            amount: project.averageBid,
            status: 'processing',
            details: { projectId },
          });
          
          // Update project status
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, status: 'in_progress' } : p
            ),
          }));
        }
      },
      
      // API methods - Vendors
      fetchVendors: async (params) => {
        set({ isLoadingVendors: true, error: null });
        const isDemoMode = useDemoStore.getState().isEnabled;
        
        if (isDemoMode) {
          // Return mock vendors in demo mode (would create if needed)
          set({ 
            vendors: [],
            isLoadingVendors: false 
          });
          return;
        }
        
        try {
          const response = await marketplaceAPI.vendors.getAll(params);
          set({ 
            vendors: response.vendors || [],
            isLoadingVendors: false 
          });
        } catch (error) {
          console.error('Failed to fetch vendors:', error);
          set({ 
            vendors: [],
            error: 'Failed to fetch vendors',
            isLoadingVendors: false 
          });
        }
      },
      
      searchVendors: async (query, filters) => {
        set({ isLoadingVendors: true, error: null });
        try {
          const response = await marketplaceAPI.vendors.search(query, filters);
          set({ 
            vendors: response.vendors || [],
            isLoadingVendors: false 
          });
        } catch (error) {
          console.error('Failed to search vendors:', error);
          set({ 
            vendors: [],
            error: 'Failed to search vendors',
            isLoadingVendors: false 
          });
        }
      },
      
      // API methods - Products
      fetchProducts: async (params) => {
        set({ isLoadingProducts: true, error: null });
        const isDemoMode = useDemoStore.getState().isEnabled;
        
        if (isDemoMode) {
          // Return sample data in demo mode
          const sampleProducts: MarketplaceProduct[] = [
            {
              id: 'demo-1',
              vendorId: 'demo-vendor-1',
              name: 'Sample Premium Marble Tiles',
              description: 'Sample product for demonstration purposes',
              category: 'Flooring',
              subcategory: undefined,
              price: 250,
              currency: 'MYR',
              unit: 'piece',
              minQuantity: 1,
              maxQuantity: undefined,
              images: ['https://images.unsplash.com/photo-1615971677499-5467cbab01c0'],
              specifications: {
                Size: '60x60 cm',
                Thickness: '10mm',
                Finish: 'Polished'
              },
              tags: ['premium', 'marble', 'tiles'],
              isActive: true,
              isAvailable: true,
              leadTime: 7,
              warranty: undefined,
              certifications: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              vendor: {
                id: 'demo-vendor-1',
                name: 'Demo Building Materials',
                rating: 4.5,
                isVerified: true
              }
            }
          ];
          
          set({ 
            products: sampleProducts,
            isLoadingProducts: false 
          });
          return;
        }
        
        try {
          const response = await marketplaceAPI.products.getAll(params);
          set({ 
            products: response.products || [],
            isLoadingProducts: false 
          });
        } catch (error) {
          console.error('Failed to fetch products:', error);
          set({ 
            products: [],
            error: 'Failed to fetch products',
            isLoadingProducts: false 
          });
        }
      },
      
      searchProducts: async (query, filters) => {
        set({ isLoadingProducts: true, error: null });
        const isDemoMode = useDemoStore.getState().isEnabled;
        
        if (isDemoMode) {
          // Return sample search results in demo mode
          const sampleSearchResults: MarketplaceProduct[] = [
            {
              id: 'demo-search-1',
              vendorId: 'demo-vendor-1',
              name: `Sample ${query} Product`,
              description: `Sample search result for "${query}" in demo mode`,
              category: 'Sample Category',
              subcategory: undefined,
              price: 100,
              currency: 'MYR',
              unit: 'piece',
              minQuantity: 1,
              maxQuantity: undefined,
              images: ['https://images.unsplash.com/photo-1615971677499-5467cbab01c0'],
              specifications: {},
              tags: ['sample', 'demo', query.toLowerCase()],
              isActive: true,
              isAvailable: true,
              leadTime: 7,
              warranty: undefined,
              certifications: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              vendor: {
                id: 'demo-vendor-1',
                name: 'Demo Vendor',
                rating: 4.0,
                isVerified: true
              }
            }
          ];
          
          set({ 
            products: sampleSearchResults,
            isLoadingProducts: false 
          });
          return;
        }
        
        try {
          const response = await marketplaceAPI.products.search(query, filters);
          set({ 
            products: response.products || [],
            isLoadingProducts: false 
          });
        } catch (error) {
          console.error('Failed to search products:', error);
          set({ 
            products: [],
            error: 'Failed to search products',
            isLoadingProducts: false 
          });
        }
      },
      
      getProductById: async (id) => {
        try {
          const response = await marketplaceAPI.products.getById(id);
          return response.product || null;
        } catch (error) {
          console.error('Failed to get product:', error);
          // Fallback to finding in current products list
          return get().products.find(p => p.id === id) || null;
        }
      },
      
      // API methods - Cart
      fetchCart: async () => {
        set({ isLoadingCart: true, error: null });
        try {
          const response = await marketplaceAPI.cart.get();
          set({ 
            cart: response.cart || null,
            isLoadingCart: false 
          });
        } catch (error) {
          console.error('Failed to fetch cart:', error);
          set({ 
            cart: null,
            error: 'Failed to fetch cart',
            isLoadingCart: false 
          });
        }
      },
      
      addToCart: async (productId, quantity = 1, notes) => {
        set({ isLoading: true, error: null });
        try {
          await marketplaceAPI.cart.addItem({ productId, quantity, notes });
          // Refresh cart data
          await get().fetchCart();
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to add to cart:', error);
          // Fallback to legacy method
          get().addToCartLegacy(productId, quantity);
          set({ 
            error: 'Added to cart locally - sync pending',
            isLoading: false 
          });
        }
      },
      
      updateCartItem: async (itemId, quantity, notes) => {
        set({ isLoading: true, error: null });
        try {
          await marketplaceAPI.cart.updateItem(itemId, { quantity, notes });
          // Refresh cart data
          await get().fetchCart();
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to update cart item:', error);
          set({ 
            error: 'Failed to update cart item',
            isLoading: false 
          });
        }
      },
      
      removeFromCart: async (itemId) => {
        set({ isLoading: true, error: null });
        try {
          await marketplaceAPI.cart.removeItem(itemId);
          // Refresh cart data
          await get().fetchCart();
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to remove from cart:', error);
          set({ 
            error: 'Failed to remove from cart',
            isLoading: false 
          });
        }
      },
      
      clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
          await marketplaceAPI.cart.clear();
          set({ 
            cart: null,
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to clear cart:', error);
          // Fallback to legacy method
          get().clearCartLegacy();
          set({ 
            error: 'Cleared cart locally - sync pending',
            isLoading: false 
          });
        }
      },
      
      checkout: async (checkoutData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await marketplaceAPI.cart.checkout(checkoutData);
          // Add new order to orders list
          if (response.order) {
            set((state) => ({
              orders: [...state.orders, response.order],
              cart: null, // Clear cart after successful checkout
              isLoading: false
            }));
          }
        } catch (error) {
          console.error('Failed to checkout:', error);
          set({ 
            error: 'Failed to process checkout',
            isLoading: false 
          });
        }
      },
      
      // API methods - Orders
      fetchOrders: async (params) => {
        set({ isLoadingOrders: true, error: null });
        try {
          const response = await marketplaceAPI.orders.getAll(params);
          set({ 
            orders: response.orders || [],
            isLoadingOrders: false 
          });
        } catch (error) {
          console.error('Failed to fetch orders:', error);
          set({ 
            orders: [],
            error: 'Failed to fetch orders',
            isLoadingOrders: false 
          });
        }
      },
      
      getOrderById: async (id) => {
        try {
          const response = await marketplaceAPI.orders.getById(id);
          return response.order || null;
        } catch (error) {
          console.error('Failed to get order:', error);
          return get().orders.find(o => o.id === id) || null;
        }
      },
      
      updateOrder: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const response = await marketplaceAPI.orders.update(id, updates);
          set((state) => ({
            orders: state.orders.map(order => 
              order.id === id ? response.order : order
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to update order:', error);
          set({ 
            error: 'Failed to update order',
            isLoading: false 
          });
        }
      },
      
      cancelOrder: async (id, reason) => {
        set({ isLoading: true, error: null });
        try {
          await marketplaceAPI.orders.cancel(id, reason);
          set((state) => ({
            orders: state.orders.map(order => 
              order.id === id ? { ...order, status: 'cancelled' } : order
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to cancel order:', error);
          set({ 
            error: 'Failed to cancel order',
            isLoading: false 
          });
        }
      },
      
      // API methods - Quotes
      fetchQuotes: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const response = await marketplaceAPI.quotes.getAll(params);
          set({ 
            quotes: response.quotes || [],
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to fetch quotes:', error);
          set({ 
            quotes: [],
            error: 'Failed to fetch quotes',
            isLoading: false 
          });
        }
      },
      
      createQuote: async (quote) => {
        set({ isLoading: true, error: null });
        try {
          const response = await marketplaceAPI.quotes.create(quote);
          set((state) => ({
            quotes: [...state.quotes, response.quote],
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to create quote:', error);
          set({ 
            error: 'Failed to create quote',
            isLoading: false 
          });
        }
      },
      
      updateQuote: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const response = await marketplaceAPI.quotes.update(id, updates);
          set((state) => ({
            quotes: state.quotes.map(quote => 
              quote.id === id ? response.quote : quote
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to update quote:', error);
          set({ 
            error: 'Failed to update quote',
            isLoading: false 
          });
        }
      },
      
      deleteQuote: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await marketplaceAPI.quotes.delete(id);
          set((state) => ({
            quotes: state.quotes.filter(quote => quote.id !== id),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to delete quote:', error);
          set({ 
            error: 'Failed to delete quote',
            isLoading: false 
          });
        }
      },
      
      sendQuote: async (id, recipients) => {
        set({ isLoading: true, error: null });
        try {
          await marketplaceAPI.quotes.send(id, recipients);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to send quote:', error);
          set({ 
            error: 'Failed to send quote',
            isLoading: false 
          });
        }
      },
      
      acceptQuote: async (id, notes) => {
        set({ isLoading: true, error: null });
        try {
          await marketplaceAPI.quotes.accept(id, notes);
          set((state) => ({
            quotes: state.quotes.map(quote => 
              quote.id === id ? { ...quote, status: 'accepted' } : quote
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to accept quote:', error);
          set({ 
            error: 'Failed to accept quote',
            isLoading: false 
          });
        }
      },
      
      rejectQuote: async (id, reason) => {
        set({ isLoading: true, error: null });
        try {
          await marketplaceAPI.quotes.reject(id, reason);
          set((state) => ({
            quotes: state.quotes.map(quote => 
              quote.id === id ? { ...quote, status: 'rejected' } : quote
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to reject quote:', error);
          set({ 
            error: 'Failed to reject quote',
            isLoading: false 
          });
        }
      },
      
      // Analytics
      fetchMarketplaceAnalytics: async (timeframe) => {
        set({ isLoading: true, error: null });
        try {
          const analytics = await marketplaceAPI.getMarketplaceAnalytics(timeframe);
          set({ isLoading: false });
          return analytics;
        } catch (error) {
          console.error('Failed to fetch marketplace analytics:', error);
          set({ 
            error: 'Failed to fetch analytics',
            isLoading: false 
          });
          return null;
        }
      },
      
      // Legacy cart methods (for backward compatibility)
      addToCartLegacy: (productId, quantity = 1) => {
        // Implementation moved from original addToCart method
        set((state) => {
          const legacyCartItem = {
            productId,
            quantity,
            addedAt: new Date(),
          };
          
          // Create a mock cart structure for legacy support
          const mockCart: ShoppingCart = {
            id: 'legacy-cart',
            userId: 'current-user',
            organizationId: 'current-org',
            items: [{
              id: Date.now().toString(),
              productId,
              quantity,
              unitPrice: 0, // Would need to lookup from products
              totalPrice: 0,
              product: state.products.find(p => p.id === productId) as any
            }],
            totalItems: quantity,
            totalAmount: 0,
            currency: 'MYR',
            updatedAt: new Date()
          };
          
          return { cart: mockCart };
        });
      },
      
      removeFromCartLegacy: (productId) => {
        set((state) => {
          if (!state.cart) return state;
          return {
            cart: {
              ...state.cart,
              items: state.cart.items.filter((item) => item.productId !== productId)
            }
          };
        });
      },
      
      updateCartQuantityLegacy: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCartLegacy(productId);
          return;
        }
        
        set((state) => {
          if (!state.cart) return state;
          return {
            cart: {
              ...state.cart,
              items: state.cart.items.map((item) =>
                item.productId === productId ? { ...item, quantity } : item
              )
            }
          };
        });
      },
      
      clearCartLegacy: () => {
        set({ cart: null });
      },
      
      // Comparison actions
      addToCompare: (productId) => {
        set((state) => {
          if (state.compareList.length >= 4) {
            return state; // Max 4 items for comparison
          }
          if (state.compareList.includes(productId)) {
            return state;
          }
          return { compareList: [...state.compareList, productId] };
        });
      },
      
      removeFromCompare: (productId) => {
        set((state) => ({
          compareList: state.compareList.filter((id) => id !== productId),
        }));
      },
      
      clearCompare: () => {
        set({ compareList: [] });
      },
      
      // Transaction actions
      createTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: Date.now().toString(),
          timestamp: new Date(),
        };
        
        set((state) => ({
          transactions: [...state.transactions, newTransaction],
        }));
        
        return newTransaction.id;
      },
      
      updateTransactionStatus: (transactionId, status) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === transactionId ? { ...t, status } : t
          ),
        }));
      },
      
      // Supplier actions
      contactSupplier: (supplierId, message) => {
        // In production, this would send an email or notification
        console.log(`Contacting supplier ${supplierId}: ${message}`);
      },
      
      // Getters
      getCartTotal: () => {
        const state = get();
        if (state.cart) {
          return state.cart.totalAmount;
        }
        // Legacy fallback
        return 0;
      },
      
      getCartItems: () => {
        const state = get();
        if (state.cart && state.cart.items) {
          return state.cart.items.map(item => ({
            ...item.product,
            quantity: item.quantity
          })) as (Product & { quantity: number })[];
        }
        // Legacy fallback
        return [];
      },
      
      getCompareProducts: () => {
        const state = get();
        return state.compareList
          .map((id) => state.products.find((p) => p.id === id))
          .filter(Boolean) as MarketplaceProduct[];
      },
      
      getVendorById: (id) => {
        return get().vendors.find(v => v.id === id);
      },
      
      getProductsByVendor: (vendorId) => {
        return get().products.filter(p => p.vendorId === vendorId);
      },
      
      getOrdersByStatus: (status) => {
        return get().orders.filter(o => o.status === status);
      },
      
      getQuotesByStatus: (status) => {
        return get().quotes.filter(q => q.status === status);
      },
      
      // Utility methods
      clearError: () => set({ error: null }),
      
      reset: () => set({
        vendors: [],
        products: [],
        cart: null,
        orders: [],
        quotes: [],
        compareList: [],
        isLoading: false,
        isLoadingProducts: false,
        isLoadingVendors: false,
        isLoadingCart: false,
        isLoadingOrders: false,
        error: null
      }),
    }),
    {
      name: 'marketplace-store',
      partialize: (state) => ({
        compareList: state.compareList,
        // Don't persist API data, only user preferences
      }),
    }
  )
);