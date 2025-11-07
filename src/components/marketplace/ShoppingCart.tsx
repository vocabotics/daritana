import React, { useState } from 'react';
import { 
  ShoppingCart as CartIcon, 
  Plus, 
  Minus, 
  X, 
  CreditCard,
  Truck,
  Shield,
  ArrowRight,
  MapPin,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  CheckCircle,
  AlertCircle,
  Package,
  Clock,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { toast } from 'sonner';

interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  icon: React.ReactNode;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  processingTime: string;
}

export function ShoppingCart() {
  const { cart, products, getCartTotal, getCartItems, updateCartQuantity, removeFromCart, clearCart } = useMarketplaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'cart' | 'shipping' | 'payment' | 'confirmation'>('cart');
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Malaysia'
  });
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('bank_transfer');
  const [orderNotes, setOrderNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const cartItems = getCartItems();
  const cartTotal = getCartTotal();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const shippingOptions: ShippingOption[] = [
    {
      id: 'standard',
      name: 'Standard Delivery',
      description: 'Regular delivery to your location',
      price: 15.00,
      estimatedDays: 3,
      icon: <Truck className="h-4 w-4" />
    },
    {
      id: 'express',
      name: 'Express Delivery',
      description: 'Fast delivery within Klang Valley',
      price: 25.00,
      estimatedDays: 1,
      icon: <Clock className="h-4 w-4" />
    },
    {
      id: 'pickup',
      name: 'Self Pickup',
      description: 'Collect from our warehouse',
      price: 0.00,
      estimatedDays: 0,
      icon: <Package className="h-4 w-4" />
    }
  ];

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct transfer to our bank account',
      icon: <Building className="h-4 w-4" />,
      processingTime: '1-2 business days'
    },
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      description: 'Visa, MasterCard, AMEX',
      icon: <CreditCard className="h-4 w-4" />,
      processingTime: 'Instant'
    },
    {
      id: 'fpx',
      name: 'Online Banking (FPX)',
      description: 'Pay via your online banking',
      icon: <Shield className="h-4 w-4" />,
      processingTime: 'Instant'
    }
  ];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getShippingPrice = () => {
    const option = shippingOptions.find(opt => opt.id === selectedShipping);
    return option?.price || 0;
  };

  const getTotalPrice = () => {
    return cartTotal + getShippingPrice();
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateCartQuantity(productId, newQuantity);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'cart') {
      if (cartItems.length === 0) {
        toast.error('Your cart is empty');
        return;
      }
      setCurrentStep('shipping');
    } else if (currentStep === 'shipping') {
      // Validate shipping info
      if (!shippingInfo.fullName || !shippingInfo.email || !shippingInfo.phone || !shippingInfo.address) {
        toast.error('Please fill in all required shipping information');
        return;
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      handlePlaceOrder();
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clear cart and show success
    clearCart();
    setCurrentStep('confirmation');
    setIsProcessing(false);
    
    toast.success('Order placed successfully!', {
      description: `Your order #ORD${Date.now()} has been confirmed`
    });
  };

  const resetCart = () => {
    setCurrentStep('cart');
    setShippingInfo({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postcode: '',
      country: 'Malaysia'
    });
    setOrderNotes('');
  };

  if (cartCount === 0 && currentStep === 'cart') {
    return (
      <>
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(true)}
          className="relative"
        >
          <CartIcon className="h-4 w-4 mr-2" />
          Cart (0)
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Shopping Cart</DialogTitle>
            </DialogHeader>
            <div className="text-center py-12">
              <CartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Your cart is empty</p>
              <Button onClick={() => setIsOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <CartIcon className="h-4 w-4 mr-2" />
        Cart ({cartCount})
        {cartCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
            {cartCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <CartIcon className="h-5 w-5" />
              {currentStep === 'cart' && 'Shopping Cart'}
              {currentStep === 'shipping' && 'Shipping Information'}
              {currentStep === 'payment' && 'Payment Method'}
              {currentStep === 'confirmation' && 'Order Confirmation'}
            </DialogTitle>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {['cart', 'shipping', 'payment', 'confirmation'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === step ? 'bg-blue-500 text-white' : 
                  ['cart', 'shipping', 'payment', 'confirmation'].indexOf(currentStep) > index ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  {['cart', 'shipping', 'payment', 'confirmation'].indexOf(currentStep) > index ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    ['cart', 'shipping', 'payment', 'confirmation'].indexOf(currentStep) > index ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Cart Step */}
          {currentStep === 'cart' && (
            <div className="space-y-6">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.brand}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-sm">{item.rating}</span>
                            <span className="text-sm text-gray-500">({item.reviews})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Subtotal</span>
                    <span className="text-xl font-bold">{formatCurrency(cartTotal)}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  Continue Shopping
                </Button>
                <Button onClick={handleNextStep} className="flex-1">
                  Proceed to Shipping
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Shipping Step */}
          {currentStep === 'shipping' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name *</Label>
                      <Input 
                        value={shippingInfo.fullName}
                        onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input 
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input 
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label>Address *</Label>
                    <Textarea 
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                      placeholder="Enter your full address"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>City *</Label>
                      <Input 
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Select value={shippingInfo.state} onValueChange={(value) => setShippingInfo({...shippingInfo, state: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kuala-lumpur">Kuala Lumpur</SelectItem>
                          <SelectItem value="selangor">Selangor</SelectItem>
                          <SelectItem value="penang">Penang</SelectItem>
                          <SelectItem value="johor">Johor</SelectItem>
                          <SelectItem value="perak">Perak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Postcode *</Label>
                      <Input 
                        value={shippingInfo.postcode}
                        onChange={(e) => setShippingInfo({...shippingInfo, postcode: e.target.value})}
                        placeholder="Postcode"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedShipping} onValueChange={setSelectedShipping}>
                    {shippingOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={option.id} />
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {option.icon}
                            <div>
                              <p className="font-semibold">{option.name}</p>
                              <p className="text-sm text-gray-600">{option.description}</p>
                              {option.estimatedDays > 0 && (
                                <p className="text-xs text-gray-500">{option.estimatedDays} business days</p>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold">
                            {option.price === 0 ? 'FREE' : formatCurrency(option.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <div>
                <Label>Order Notes (Optional)</Label>
                <Textarea 
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any special instructions for this order..."
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep('cart')} className="flex-1">
                  Back to Cart
                </Button>
                <Button onClick={handleNextStep} className="flex-1">
                  Continue to Payment
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={method.id} />
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {method.icon}
                            <div>
                              <p className="font-semibold">{method.name}</p>
                              <p className="text-sm text-gray-600">{method.description}</p>
                              <p className="text-xs text-gray-500">Processing: {method.processingTime}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{getShippingPrice() === 0 ? 'FREE' : formatCurrency(getShippingPrice())}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(getTotalPrice())}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep('shipping')} className="flex-1">
                  Back to Shipping
                </Button>
                <Button 
                  onClick={handleNextStep} 
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order - {formatCurrency(getTotalPrice())}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === 'confirmation' && (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Order Confirmed!</h2>
                <p className="text-gray-600 mb-4">
                  Thank you for your order. We've received your payment and will process your order shortly.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold">Order #ORD{Date.now()}</p>
                  <p className="text-sm text-gray-600">Confirmation sent to {shippingInfo.email}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  setIsOpen(false);
                  resetCart();
                }} className="flex-1">
                  Continue Shopping
                </Button>
                <Button onClick={() => {
                  setIsOpen(false);
                  resetCart();
                }} className="flex-1">
                  Track Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}