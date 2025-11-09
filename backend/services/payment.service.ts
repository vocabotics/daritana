import Stripe from 'stripe';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  maxUsers: number;
  maxProjects: number;
  maxStorageGB: number;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 49.99,
    priceYearly: 499.99,
    currency: 'MYR',
    features: [
      '1-5 users',
      '10 projects',
      '10GB storage',
      'Basic project management',
      'Document management',
      'Email support',
    ],
    maxUsers: 5,
    maxProjects: 10,
    maxStorageGB: 10,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 99.99,
    priceYearly: 999.99,
    currency: 'MYR',
    features: [
      '5-15 users',
      '50 projects',
      '50GB storage',
      'Advanced PM features',
      'CAD file viewing',
      'RFI management',
      'Change orders',
      'Priority support',
    ],
    maxUsers: 15,
    maxProjects: 50,
    maxStorageGB: 50,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 199.99,
    priceYearly: 1999.99,
    currency: 'MYR',
    features: [
      'Unlimited users',
      'Unlimited projects',
      '500GB storage',
      'All features',
      'Construction admin',
      'PAM contracts',
      'Dedicated support',
      'Custom integrations',
    ],
    maxUsers: 999,
    maxProjects: 999,
    maxStorageGB: 500,
  },
};

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  organizationId: string,
  planId: string,
  billingCycle: 'monthly' | 'yearly',
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Invalid plan ID');
  }

  const amount = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card', 'fpx'], // Support Malaysian FPX
    line_items: [
      {
        price_data: {
          currency: 'myr',
          product_data: {
            name: `${plan.name} Plan - ${billingCycle}`,
            description: plan.features.join(', '),
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
          recurring: {
            interval: billingCycle === 'monthly' ? 'month' : 'year',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      organizationId,
      planId,
      billingCycle,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        organizationId,
        planId,
      },
    },
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(
  event: Stripe.Event
): Promise<{ success: boolean; message: string }> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      const planId = session.metadata?.planId;

      if (organizationId && planId) {
        await updateOrganizationSubscription(organizationId, planId, 'active');
        return { success: true, message: 'Subscription activated' };
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata?.organizationId;
      const status = subscription.status;

      if (organizationId) {
        await updateOrganizationSubscription(organizationId, '', status);
        return { success: true, message: 'Subscription updated' };
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata?.organizationId;

      if (organizationId) {
        await updateOrganizationSubscription(organizationId, 'starter', 'canceled');
        return { success: true, message: 'Subscription canceled' };
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await recordPayment(invoice);
      return { success: true, message: 'Payment recorded' };
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailure(invoice);
      return { success: true, message: 'Payment failure handled' };
    }
  }

  return { success: true, message: 'Event processed' };
}

/**
 * Update organization subscription
 */
async function updateOrganizationSubscription(
  organizationId: string,
  planId: string,
  status: string
): Promise<void> {
  const plan = SUBSCRIPTION_PLANS[planId];

  await pool.query(
    `UPDATE organizations
     SET plan = $1,
         subscription_status = $2,
         max_users = $3,
         max_projects = $4,
         max_storage_gb = $5,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6`,
    [
      planId,
      status,
      plan?.maxUsers || 5,
      plan?.maxProjects || 10,
      plan?.maxStorageGB || 10,
      organizationId,
    ]
  );
}

/**
 * Record payment
 */
async function recordPayment(invoice: Stripe.Invoice): Promise<void> {
  // Record in payments table
  await pool.query(
    `INSERT INTO payments (
      invoice_id, organization_id, amount, currency, status, paid_at, invoice_pdf
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (invoice_id) DO UPDATE
    SET status = $4, paid_at = $6`,
    [
      invoice.id,
      invoice.metadata?.organizationId,
      invoice.amount_paid / 100,
      invoice.currency.toUpperCase(),
      'paid',
      new Date(invoice.created * 1000),
      invoice.invoice_pdf,
    ]
  );
}

/**
 * Handle payment failure
 */
async function handlePaymentFailure(invoice: Stripe.Invoice): Promise<void> {
  await pool.query(
    `INSERT INTO payments (
      invoice_id, organization_id, amount, currency, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (invoice_id) DO UPDATE
    SET status = $4`,
    [
      invoice.id,
      invoice.metadata?.organizationId,
      invoice.amount_due / 100,
      invoice.currency.toUpperCase(),
      'failed',
      new Date(invoice.created * 1000),
    ]
  );

  // Notify organization admin of payment failure
  // TODO: Send email notification
}

/**
 * FPX Payment Gateway integration (Malaysian)
 */
export async function createFPXPayment(
  organizationId: string,
  amount: number,
  description: string
): Promise<{ paymentId: string; redirectUrl: string }> {
  // FPX is integrated through Stripe
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['fpx'],
    line_items: [
      {
        price_data: {
          currency: 'myr',
          product_data: {
            name: description,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      organizationId,
      paymentType: 'fpx',
    },
    success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/canceled`,
  });

  return {
    paymentId: session.id,
    redirectUrl: session.url || '',
  };
}

/**
 * Get organization billing history
 */
export async function getBillingHistory(organizationId: string): Promise<any[]> {
  const result = await pool.query(
    `SELECT * FROM payments
     WHERE organization_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [organizationId]
  );

  return result.rows;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(organizationId: string): Promise<boolean> {
  try {
    // Get Stripe subscription ID from database
    const result = await pool.query(
      `SELECT stripe_subscription_id FROM organizations WHERE id = $1`,
      [organizationId]
    );

    const subscriptionId = result.rows[0]?.stripe_subscription_id;

    if (subscriptionId) {
      await stripe.subscriptions.cancel(subscriptionId);
    }

    await updateOrganizationSubscription(organizationId, 'starter', 'canceled');
    return true;
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return false;
  }
}

export default {
  SUBSCRIPTION_PLANS,
  createCheckoutSession,
  handleWebhookEvent,
  createFPXPayment,
  getBillingHistory,
  cancelSubscription,
};
