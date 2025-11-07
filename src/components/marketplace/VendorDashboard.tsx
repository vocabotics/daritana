import React, { useState } from 'react';
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Star, 
  Plus, 
  Edit, 
  Eye, 
  ShoppingCart,
  BarChart3,
  MessageSquare,
  Calendar,
  FileText,
  Settings,
  Upload,
  Download,
  Search,
  Filter,
  SortAsc,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock,
  Truck,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Camera,
  Zap,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface VendorProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sold: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  views: number;
  rating: number;
  reviews: number;
  images: string[];
  description: string;
  specifications: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

interface VendorOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: Date;
  shippingAddress: string;
  paymentMethod: string;
  trackingNumber?: string;
}

interface VendorAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  avgRating: number;
  revenueGrowth: number;
  orderGrowth: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

export function VendorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);
  
  // Mock vendor data
  const [vendorInfo] = useState({
    id: 'v1',
    name: 'Premium Building Materials Sdn Bhd',
    email: 'info@premiumbm.com.my',
    phone: '+60 3-2234 5678',
    address: 'No. 123, Jalan Industri 4/2, Taman Perindustrian Pusat Bandar, 40000 Shah Alam, Selangor',
    established: '2015',
    employees: '25-50',
    businessType: 'Manufacturer & Distributor',
    certifications: ['ISO 9001', 'SIRIM', 'MS 1064'],
    verified: true,
    rating: 4.7,
    totalReviews: 342,
    responseTime: '< 2 hours',
    logo: '/api/placeholder/100/100'
  });

  const [products, setProducts] = useState<VendorProduct[]>([
    {
      id: 'p1',
      name: 'Premium Portland Cement 50kg',
      category: 'Building Materials',
      price: 23.50,
      originalPrice: 25.00,
      stock: 5000,
      sold: 1250,
      status: 'active',
      views: 8420,
      rating: 4.6,
      reviews: 89,
      images: ['/api/placeholder/300/300'],
      description: 'High-grade Portland cement suitable for all construction applications. MS 522:2003 compliant.',
      specifications: {
        'Weight': '50kg',
        'Type': 'Ordinary Portland Cement',
        'Strength': '42.5N',
        'Compliance': 'MS 522:2003'
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: 'p2',
      name: 'Steel Rebar Grade 500 - 12mm',
      category: 'Steel & Metal',
      price: 3.20,
      stock: 15000,
      sold: 8500,
      status: 'active',
      views: 12340,
      rating: 4.8,
      reviews: 156,
      images: ['/api/placeholder/300/300'],
      description: 'High tensile steel reinforcement bars for concrete structures.',
      specifications: {
        'Diameter': '12mm',
        'Grade': '500',
        'Length': '12m',
        'Standard': 'MS 146'
      },
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18')
    }
  ]);

  const [orders] = useState<VendorOrder[]>([
    {
      id: 'o1',
      customerName: 'Ahmad Construction Sdn Bhd',
      customerEmail: 'ahmad@construction.com',
      items: [
        { productId: 'p1', productName: 'Premium Portland Cement 50kg', quantity: 100, price: 23.50 }
      ],
      totalAmount: 2350,
      status: 'confirmed',
      orderDate: new Date('2024-01-20'),
      shippingAddress: 'Project Site A, Jalan Bukit Bintang, KL',
      paymentMethod: 'Bank Transfer',
      trackingNumber: 'TRK001234567'
    },
    {
      id: 'o2',
      customerName: 'Modern Builders',
      customerEmail: 'orders@modernbuilders.my',
      items: [
        { productId: 'p2', productName: 'Steel Rebar Grade 500 - 12mm', quantity: 500, price: 3.20 }
      ],
      totalAmount: 1600,
      status: 'pending',
      orderDate: new Date('2024-01-21'),
      shippingAddress: 'Warehouse B, Shah Alam Industrial Area',
      paymentMethod: 'Credit Terms (30 days)'
    }
  ]);

  const [analytics] = useState<VendorAnalytics>({
    totalRevenue: 125450,
    totalOrders: 89,
    totalProducts: 25,
    avgRating: 4.7,
    revenueGrowth: 23.5,
    orderGrowth: 18.2,
    topSellingProducts: [
      { id: 'p1', name: 'Premium Portland Cement', sales: 1250, revenue: 29375 },
      { id: 'p2', name: 'Steel Rebar Grade 500', sales: 8500, revenue: 27200 }
    ],
    monthlyRevenue: [
      { month: 'Jan', revenue: 125450 },
      { month: 'Dec', revenue: 101200 },
      { month: 'Nov', revenue: 95600 }
    ]
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={vendorInfo.logo} alt={vendorInfo.name} />
            <AvatarFallback>{vendorInfo.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{vendorInfo.name}</h1>
              {vendorInfo.verified && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-gray-600">{vendorInfo.businessType} • Since {vendorInfo.established}</p>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                {vendorInfo.rating} ({vendorInfo.totalReviews} reviews)
              </span>
              <span>Response: {vendorInfo.responseTime}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+{analytics.revenueGrowth}% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+{analytics.orderGrowth}% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Products</p>
                    <p className="text-2xl font-bold">{analytics.totalProducts}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-600">{products.filter(p => p.status === 'active').length} active listings</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold">{analytics.avgRating}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Star className="h-6 w-6 text-yellow-600 fill-current" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-600">Based on {vendorInfo.totalReviews} reviews</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{order.customerName}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(order.totalAmount)}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.orderDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topSellingProducts.map((product, idx) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.sales} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Product Management</h2>
              <p className="text-gray-600">Manage your product listings and inventory</p>
            </div>
            <Button onClick={() => setShowAddProduct(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Product</th>
                      <th className="text-left p-4 font-semibold">Category</th>
                      <th className="text-left p-4 font-semibold">Price</th>
                      <th className="text-left p-4 font-semibold">Stock</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Performance</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-t">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="text-sm text-gray-600">ID: {product.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{product.category}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold">{formatCurrency(product.price)}</p>
                            {product.originalPrice && (
                              <p className="text-sm text-gray-500 line-through">
                                {formatCurrency(product.originalPrice)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold">{product.stock.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{product.sold} sold</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(product.status)}>
                            {product.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{product.views.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm">{product.rating} ({product.reviews})</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Order Management</h2>
            <p className="text-gray-600">Track and manage customer orders</p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Order ID</th>
                      <th className="text-left p-4 font-semibold">Customer</th>
                      <th className="text-left p-4 font-semibold">Items</th>
                      <th className="text-left p-4 font-semibold">Amount</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Date</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t">
                        <td className="p-4 font-mono">{order.id}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold">{order.customerName}</p>
                            <p className="text-sm text-gray-600">{order.customerEmail}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            {order.items.map((item, idx) => (
                              <p key={idx} className="text-sm">
                                {item.quantity}x {item.productName}
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">
                          {order.orderDate.toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Analytics & Insights</h2>
            <p className="text-gray-600">Track your business performance and growth</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {analytics.monthlyRevenue.map((data, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div 
                        className="bg-blue-500 rounded-t-md w-full"
                        style={{ 
                          height: `${(data.revenue / Math.max(...analytics.monthlyRevenue.map(d => d.revenue))) * 200}px` 
                        }}
                      />
                      <div className="text-center mt-2">
                        <p className="text-xs text-gray-600">{data.month}</p>
                        <p className="text-xs font-semibold">{formatCurrency(data.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Customer Satisfaction</span>
                      <span className="text-sm font-semibold">94%</span>
                    </div>
                    <Progress value={94} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Product Quality</span>
                      <span className="text-sm font-semibold">91%</span>
                    </div>
                    <Progress value={91} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Order Fulfillment</span>
                      <span className="text-sm font-semibold">96%</span>
                    </div>
                    <Progress value={96} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Response Time</span>
                      <span className="text-sm font-semibold">89%</span>
                    </div>
                    <Progress value={89} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Customer Messages</h2>
            <p className="text-gray-600">Manage customer inquiries and support</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No new messages</p>
                <Button className="mt-4" variant="outline">
                  Check Message History
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Vendor Profile</h2>
            <p className="text-gray-600">Manage your business information and settings</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input value={vendorInfo.name} readOnly />
                </div>
                <div>
                  <Label>Business Type</Label>
                  <Input value={vendorInfo.businessType} readOnly />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input value={vendorInfo.email} readOnly />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={vendorInfo.phone} readOnly />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Textarea value={vendorInfo.address} readOnly />
              </div>
              <Button>Update Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Product Modal */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input placeholder="Enter product name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="building-materials">Building Materials</SelectItem>
                    <SelectItem value="tools">Tools & Equipment</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price (RM)</Label>
                <Input type="number" placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Product description" />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowAddProduct(false)}>
                Add Product
              </Button>
              <Button variant="outline" onClick={() => setShowAddProduct(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}