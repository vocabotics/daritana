import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarketplaceLive from '@/components/marketplace/MarketplaceLive';
import { ProductCatalog } from '@/components/marketplace/ProductCatalog';
import { VendorDashboard } from '@/components/marketplace/VendorDashboard';
import { QuoteManagement } from '@/components/marketplace/QuoteManagement';
import { ShoppingCart } from '@/components/marketplace/ShoppingCart';
import { 
  ShoppingBag, 
  Package, 
  Store, 
  FileText, 
  BarChart3,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useMarketplaceStore } from '@/store/marketplaceStore';

export function Marketplace() {
  const [activeTab, setActiveTab] = useState('catalog');
  const { user } = useAuthStore();
  const { products, projects, transactions } = useMarketplaceStore();
  
  // Check if user is a vendor (for demo purposes, check if they have certain roles)
  const isVendor = user?.role === 'contractor' || user?.role === 'project_lead';

  // Calculate marketplace stats
  const totalProducts = products.length;
  const activeProjects = projects.filter(p => p.status === 'open').length;
  const totalTransactions = transactions.length;
  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Layout contextualInfo={false}>
      <div className="space-y-6">
        {/* Header with Cart */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Construction Marketplace</h1>
            <p className="text-gray-600">Connect with suppliers, browse products, and manage procurement</p>
          </div>
          <div className="flex items-center gap-3">
            <ShoppingCart />
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Request Quote
            </Button>
          </div>
        </div>

        {/* Marketplace Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{totalProducts.toLocaleString()}</span>
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">From verified suppliers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{activeProjects}</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Open for bidding</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">342</span>
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Verified vendors</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">RM 2.4M</span>
                <DollarSign className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isVendor ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Catalog
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Live Marketplace
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quotes
            </TabsTrigger>
            {isVendor && (
              <TabsTrigger value="vendor" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Vendor Portal
              </TabsTrigger>
            )}
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-6">
            <ProductCatalog />
          </TabsContent>

          <TabsContent value="live" className="mt-6">
            <MarketplaceLive />
          </TabsContent>

          <TabsContent value="quotes" className="mt-6">
            <QuoteManagement />
          </TabsContent>

          {isVendor && (
            <TabsContent value="vendor" className="mt-6">
              <VendorDashboard />
            </TabsContent>
          )}

          <TabsContent value="analytics" className="mt-6">
            <MarketplaceAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Marketplace Analytics Component
function MarketplaceAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Marketplace Analytics</h2>
        <p className="text-gray-600">Track market trends and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Popular Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Building Materials', value: 45, color: 'bg-blue-500' },
                { name: 'Tools & Equipment', value: 30, color: 'bg-green-500' },
                { name: 'Electrical', value: 15, color: 'bg-yellow-500' },
                { name: 'Plumbing', value: 10, color: 'bg-purple-500' }
              ].map((category) => (
                <div key={category.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-gray-600">{category.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${category.color} h-2 rounded-full`}
                      style={{ width: `${category.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { item: 'Portland Cement', trend: 'up', change: '+5.2%' },
                { item: 'Steel Rebar', trend: 'down', change: '-2.1%' },
                { item: 'Timber', trend: 'up', change: '+8.7%' },
                { item: 'Concrete Blocks', trend: 'stable', change: '+0.3%' }
              ].map((item) => (
                <div key={item.item} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{item.item}</span>
                  <div className="flex items-center gap-2">
                    {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {item.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                    {item.trend === 'stable' && <div className="h-4 w-4 border-t-2 border-gray-400" />}
                    <span className={`text-sm font-semibold ${
                      item.trend === 'up' ? 'text-green-600' : 
                      item.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {item.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'BuildMart Solutions', rating: 4.8, orders: 234 },
                { name: 'Heritage Wood', rating: 4.9, orders: 189 },
                { name: 'ProTools Malaysia', rating: 4.7, orders: 156 },
                { name: 'Elite Materials', rating: 4.6, orders: 143 }
              ].map((supplier, idx) => (
                <div key={supplier.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>⭐ {supplier.rating}</span>
                        <span>• {supplier.orders} orders</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">Verified</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'New Quote Request', from: 'Ahmad Construction', time: '2 min ago' },
                { action: 'Order Completed', from: 'Modern Builders', time: '15 min ago' },
                { action: 'Product Added', from: 'BuildMart', time: '1 hour ago' },
                { action: 'Bid Accepted', from: 'Heritage Project', time: '2 hours ago' }
              ].map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-gray-600">{activity.from}</p>
                  </div>
                  <span className="text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Marketplace;