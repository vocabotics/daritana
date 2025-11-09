import Stripe from 'stripe';
import { prisma } from '../server';


// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
  typescript: true
});

export interface CreateCustomerParams {
  email: string;
  name: string;
  organizationId: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

class StripeService {
  /**
   * Create or retrieve a Stripe customer
   */
  async createOrRetrieveCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      // Check if customer already exists
      const existingCustomer = await prisma.organization.findUnique({
        where: { id: params.organizationId }
      });

      if (existingCustomer?.stripeCustomerId) {
        // Retrieve existing customer from Stripe
        const customer = await stripe.customers.retrieve(existingCustomer.stripeCustomerId);
        if (!customer.deleted) {
          return customer as Stripe.Customer;
        }
      }

      // Create new customer in Stripe
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          organizationId: params.organizationId,
          ...params.metadata
        }
      });

      // Save Stripe customer ID to database
      await prisma.organization.update({
        where: { id: params.organizationId },
        data: { 
          stripeCustomerId: customer.id,
          billingEmail: params.email 
        }
      });

      return customer;
    } catch (error) {
      console.error('Error creating/retrieving Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: params.customerId,
        items: [{ price: params.priceId }],
        trial_period_days: params.trialDays || 14,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: params.metadata
      });

      // Update database with subscription info
      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: params.customerId }
      });

      if (org) {
        await prisma.subscription.create({
          data: {
            organizationId: org.id,
            stripeSubscriptionId: subscription.id,
            stripePriceId: params.priceId,
            status: subscription.status.toUpperCase() as any,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            planId: await this.getPlanIdFromPriceId(params.priceId)
          }
        });
      }

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    try {
      const subscription = immediately
        ? await stripe.subscriptions.cancel(subscriptionId)
        : await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
          });

      // Update database
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: immediately ? 'CANCELLED' : 'PENDING_CANCELLATION',
          cancelledAt: immediately ? new Date() : null,
          cancelAtPeriodEnd: !immediately
        }
      });

      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency || 'myr',
        customer: params.customerId,
        description: params.description,
        metadata: params.metadata,
        automatic_payment_methods: {
          enabled: true
        }
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Create a checkout session for subscription or one-time payment
   */
  async createCheckoutSession(params: {
    customerId?: string;
    priceId?: string;
    mode: 'subscription' | 'payment';
    successUrl: string;
    cancelUrl: string;
    lineItems?: Array<{ price: string; quantity: number }>;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        mode: params.mode,
        metadata: params.metadata,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer: params.customerId
      };

      if (params.mode === 'subscription') {
        sessionParams.line_items = [{
          price: params.priceId!,
          quantity: 1
        }];
        sessionParams.subscription_data = {
          trial_period_days: 14,
          metadata: params.metadata
        };
      } else {
        sessionParams.line_items = params.lineItems || [{
          price: params.priceId!,
          quantity: 1
        }];
        sessionParams.invoice_creation = {
          enabled: true
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create a customer portal session for billing management
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });
      return session;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  /**
   * Handle webhook events from Stripe
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  /**
   * Create Stripe products and prices for subscription plans
   */
  async syncSubscriptionPlans(): Promise<void> {
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true }
      });

      for (const plan of plans) {
        // Create or update product
        let product: Stripe.Product;
        
        if (plan.stripeProductId) {
          product = await stripe.products.update(plan.stripeProductId, {
            name: plan.name,
            description: plan.description || undefined,
            metadata: {
              planId: plan.id,
              tier: plan.tier
            }
          });
        } else {
          product = await stripe.products.create({
            name: plan.name,
            description: plan.description || undefined,
            metadata: {
              planId: plan.id,
              tier: plan.tier
            }
          });

          await prisma.subscriptionPlan.update({
            where: { id: plan.id },
            data: { stripeProductId: product.id }
          });
        }

        // Create or update price
        if (!plan.stripePriceId) {
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(plan.price * 100), // Convert to cents
            currency: 'myr',
            recurring: {
              interval: plan.billingCycle === 'YEARLY' ? 'year' : 'month'
            },
            metadata: {
              planId: plan.id
            }
          });

          await prisma.subscriptionPlan.update({
            where: { id: plan.id },
            data: { stripePriceId: price.id }
          });
        }
      }
    } catch (error) {
      console.error('Error syncing subscription plans:', error);
      throw error;
    }
  }

  // Private helper methods
  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const org = await prisma.organization.findFirst({
      where: { stripeCustomerId: subscription.customer as string }
    });

    if (!org) return;

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        organizationId: org.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        planId: await this.getPlanIdFromPriceId(subscription.items.data[0].price.id)
      },
      update: {
        status: subscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
      }
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const org = await prisma.organization.findFirst({
      where: { stripeCustomerId: invoice.customer as string }
    });

    if (!org) return;

    await prisma.payment.create({
      data: {
        organizationId: org.id,
        stripePaymentIntentId: invoice.payment_intent as string,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status: 'COMPLETED',
        description: `Invoice ${invoice.number}`,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          subscriptionId: invoice.subscription
        }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        organizationId: org.id,
        title: 'Payment Successful',
        message: `Payment of RM ${(invoice.amount_paid / 100).toFixed(2)} has been processed successfully.`,
        type: 'PAYMENT',
        priority: 'LOW'
      }
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const org = await prisma.organization.findFirst({
      where: { stripeCustomerId: invoice.customer as string }
    });

    if (!org) return;

    await prisma.notification.create({
      data: {
        organizationId: org.id,
        title: 'Payment Failed',
        message: `Payment of RM ${(invoice.amount_due / 100).toFixed(2)} failed. Please update your payment method.`,
        type: 'PAYMENT',
        priority: 'HIGH'
      }
    });
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (session.mode === 'subscription') {
      // Subscription already handled by subscription webhook
      return;
    }

    // Handle one-time payment
    const org = await prisma.organization.findFirst({
      where: { stripeCustomerId: session.customer as string }
    });

    if (!org) return;

    await prisma.payment.create({
      data: {
        organizationId: org.id,
        stripePaymentIntentId: session.payment_intent as string,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency?.toUpperCase() || 'MYR',
        status: 'COMPLETED',
        description: 'One-time payment via checkout',
        metadata: {
          sessionId: session.id
        }
      }
    });
  }

  private async getPlanIdFromPriceId(stripePriceId: string): Promise<string> {
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { stripePriceId }
    });
    return plan?.id || '';
  }

  /**
   * Get Stripe instance for direct API calls
   */
  getStripeInstance(): Stripe {
    return stripe;
  }
}

export default new StripeService();