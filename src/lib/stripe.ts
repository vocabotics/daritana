import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
);

export interface StripeConfig {
  publishableKey: string;
  successUrl: string;
  cancelUrl: string;
  currency: string;
}

export const stripeConfig: StripeConfig = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
  successUrl: `${window.location.origin}/payment/success`,
  cancelUrl: `${window.location.origin}/payment/cancelled`,
  currency: 'myr'
};

// Subscription plans configuration
export const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49.99,
    currency: 'RM',
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_BASIC_PRICE_ID || '',
    features: [
      '5 Team Members',
      '10 Active Projects',
      '5GB Storage',
      'Basic Support',
      'Core Features'
    ],
    limits: {
      users: 5,
      projects: 10,
      storage: 5120 // MB
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99.99,
    currency: 'RM',
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || '',
    features: [
      '20 Team Members',
      '50 Active Projects',
      '50GB Storage',
      'Priority Support',
      'All Core Features',
      'Advanced Analytics',
      'API Access',
      'Custom Branding'
    ],
    limits: {
      users: 20,
      projects: 50,
      storage: 51200 // MB
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299.99,
    currency: 'RM',
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || '',
    features: [
      'Unlimited Team Members',
      'Unlimited Projects',
      '500GB Storage',
      '24/7 Priority Support',
      'All Features',
      'Advanced Security',
      'Custom Integrations',
      'Dedicated Account Manager',
      'SLA Guarantee',
      'On-premise Option'
    ],
    limits: {
      users: -1, // Unlimited
      projects: -1, // Unlimited
      storage: 512000 // MB
    }
  }
];

// Helper functions
export const formatPrice = (amount: number, currency = 'RM'): string => {
  return `${currency} ${amount.toFixed(2)}`;
};

export const getStripePriceId = (planId: string): string | null => {
  const plan = subscriptionPlans.find(p => p.id === planId);
  return plan?.stripePriceId || null;
};

export const getPlanByPriceId = (priceId: string) => {
  return subscriptionPlans.find(p => p.stripePriceId === priceId);
};