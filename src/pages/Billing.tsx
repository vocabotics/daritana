import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, Check, X, AlertCircle, Loader2, 
  TrendingUp, Users, HardDrive, Zap, Shield, HeadphonesIcon
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { stripePromise, subscriptionPlans, formatPrice } from '@/lib/stripe';
import { toast } from 'sonner';
import api from '@/services/api';

export default function Billing() {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch current subscription
      const subscriptionRes = await api.get('/api/payments/subscription');
      if (subscriptionRes.data.success) {
        setCurrentPlan(subscriptionRes.data.subscription);
        setUsage(subscriptionRes.data.usage);
      }
      
      // Fetch payment history
      const paymentsRes = await api.get('/api/stripe/payments');
      if (paymentsRes.data.success) {
        setPaymentHistory(paymentsRes.data.payments);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(true);
      
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan || !plan.stripePriceId) {
        toast.error('Invalid plan selected');
        return;
      }

      // Create checkout session
      const response = await api.post('/api/stripe/checkout/session', {
        priceId: plan.stripePriceId,
        mode: 'subscription',
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing?cancelled=true`
      });

      if (response.data.success && response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.response?.data?.message || 'Failed to start subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setLoading(true);
      
      // Create billing portal session
      const response = await api.post('/api/stripe/billing-portal', {
        returnUrl: window.location.href
      });

      if (response.data.success && response.data.url) {
        // Redirect to Stripe Billing Portal
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to open billing portal');
      }
    } catch (error: any) {
      console.error('Billing portal error:', error);
      toast.error(error.response?.data?.message || 'Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.delete(`/api/stripe/subscriptions/${currentPlan.stripeSubscriptionId}`);
      
      if (response.data.success) {
        toast.success('Subscription cancelled successfully');
        fetchBillingData();
      } else {
        toast.error('Failed to cancel subscription');
      }
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('Support')) return <HeadphonesIcon className="h-4 w-4" />;
    if (feature.includes('Storage')) return <HardDrive className="h-4 w-4" />;
    if (feature.includes('Team') || feature.includes('Members')) return <Users className="h-4 w-4" />;
    if (feature.includes('Security')) return <Shield className="h-4 w-4" />;
    if (feature.includes('API') || feature.includes('Integration')) return <Zap className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and payment methods</p>
        </div>

        {/* Current Plan */}
        {currentPlan && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your active subscription details</CardDescription>
                </div>
                <Badge variant={currentPlan.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {currentPlan.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="text-lg font-semibold">{currentPlan.plan?.name || 'Free'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Billing Cycle</p>
                  <p className="text-lg font-semibold">
                    {formatPrice(currentPlan.plan?.price || 0)} / month
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next Billing Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(currentPlan.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Usage Stats */}
              {usage && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-medium">Usage</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Team Members</span>
                      <span className="text-sm font-medium">
                        {usage.users} / {currentPlan.plan?.maxUsers || '∞'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(usage.users / (currentPlan.plan?.maxUsers || 100)) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Projects</span>
                      <span className="text-sm font-medium">
                        {usage.projects} / {currentPlan.plan?.maxProjects || '∞'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(usage.projects / (currentPlan.plan?.maxProjects || 100)) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Storage</span>
                      <span className="text-sm font-medium">
                        {(usage.storage / 1024).toFixed(1)} GB / {(currentPlan.plan?.maxStorage / 1024).toFixed(0)} GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(usage.storage / currentPlan.plan?.maxStorage) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleManageBilling} disabled={loading}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
              <Button variant="destructive" onClick={handleCancelSubscription} disabled={loading}>
                Cancel Subscription
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Subscription Plans */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={plan.popular ? 'border-blue-500 shadow-lg' : ''}
              >
                {plan.popular && (
                  <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.currency} {plan.price}</span>
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="mt-0.5 text-green-500">
                          {getFeatureIcon(feature)}
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading || currentPlan?.plan?.id === plan.id}
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {currentPlan?.plan?.id === plan.id ? 'Current Plan' : 'Subscribe'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your recent transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentHistory.length > 0 ? (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(payment.amount, payment.currency)}</p>
                      <Badge 
                        variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No payment history available</p>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your payment information is securely processed by Stripe. We never store your credit card details.
            All transactions are encrypted and PCI DSS compliant.
          </AlertDescription>
        </Alert>
      </div>
    </Layout>
  );
}